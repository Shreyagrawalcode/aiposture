import { useEffect, useRef, useCallback } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { type ExerciseType, type Landmark, type PostureFeedback, type PostureStatus } from '../types';
import { analyzeExercise } from '../utils/exerciseAnalysis';
import { drawPose, drawHUD } from '../utils/poseDrawing';
import './PoseDetector.css';

interface Props {
  exercise: ExerciseType;
  onFeedback: (feedback: PostureFeedback) => void;
  onLoadingChange: (loading: boolean) => void;
  onRepCount: (n: number) => void;
  onIssueDetected: (issues: string[]) => void;
}

// ─── Rep counter — robust 4-phase state machine ────────────────────────────
//
// Phases: IDLE → DESCENDING → AT_BOTTOM → ASCENDING (→ rep counted → IDLE)
//
// Guards against ghost reps:
// 1. IDLE gate — never count when analysis says idle
// 2. Must reach a DEEP angle (well below threshold) and HOLD for minHoldMs
// 3. Must return to a HIGH angle (well above threshold) to complete the rep
// 4. Cooldown period between reps prevents double-counts
// 5. Angle smoothing — rolling average over last N frames to filter noise
//
type RepPhase = 'IDLE' | 'DESCENDING' | 'AT_BOTTOM' | 'ASCENDING';

interface RepConfig {
  primaryAngleIndex: number;
  /** Angle must go BELOW this to enter bottom (e.g. squat knee < 110) */
  enterBottomAngle: number;
  /** Angle must go ABOVE this to complete rep (e.g. squat knee > 150) */
  exitTopAngle: number;
  /** Minimum ms spent at bottom before it counts */
  minHoldMs: number;
  /** Cooldown ms between reps */
  cooldownMs: number;
  /** Whether lower angle = deeper (true for squat/pushup) or higher = deeper (false for deadlift back angle) */
  lowerIsDeeper: boolean;
}

const REP_CONFIGS: Record<ExerciseType, RepConfig> = {
  squat: {
    primaryAngleIndex: 0,
    enterBottomAngle: 110,   // knee must bend below 110° to start counting
    exitTopAngle: 150,       // knee must extend above 150° to complete
    minHoldMs: 150,
    cooldownMs: 400,
    lowerIsDeeper: true,
  },
  pushup: {
    primaryAngleIndex: 0,
    enterBottomAngle: 100,   // elbow must bend below 100°
    exitTopAngle: 145,       // elbow must extend above 145°
    minHoldMs: 100,
    cooldownMs: 350,
    lowerIsDeeper: true,
  },
  deadlift: {
    primaryAngleIndex: 0,
    enterBottomAngle: 150,   // back angle must go below 150° (bending forward)
    exitTopAngle: 162,       // must return above 162° (standing up)
    minHoldMs: 150,
    cooldownMs: 500,
    lowerIsDeeper: true,
  },
  ohpress: {
    primaryAngleIndex: 0,
    enterBottomAngle: 110,   // elbow must bend below 110° (arms down)
    exitTopAngle: 155,       // elbow must extend above 155° (lockout)
    minHoldMs: 100,
    cooldownMs: 400,
    lowerIsDeeper: true,
  },
};

// Simple rolling average for angle smoothing
const SMOOTH_WINDOW = 4;

export default function PoseDetector({
  exercise,
  onFeedback,
  onLoadingChange,
  onRepCount,
  onIssueDetected,
}: Props) {
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const landmarkerRef    = useRef<PoseLandmarker | null>(null);
  const animFrameRef     = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  // Rep counter state
  const repPhaseRef     = useRef<RepPhase>('IDLE');
  const repCountRef     = useRef<number>(0);
  const bottomEnteredAt = useRef<number>(0);
  const lastRepAt       = useRef<number>(0);
  const angleBuffer     = useRef<number[]>([]);

  // Frame throttling
  const frameCountRef      = useRef(0);
  const cachedLandmarksRef = useRef<Landmark[] | null>(null);
  const cachedFeedbackRef  = useRef<PostureFeedback | null>(null);
  const DETECT_EVERY       = 2;

  // Reset on exercise change
  useEffect(() => {
    repPhaseRef.current  = 'IDLE';
    repCountRef.current  = 0;
    bottomEnteredAt.current = 0;
    lastRepAt.current = 0;
    angleBuffer.current = [];
    onRepCount(0);
  }, [exercise, onRepCount]);

  // Load model
  useEffect(() => {
    let cancelled = false;
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!cancelled) {
          landmarkerRef.current = landmarker;
          onLoadingChange(false);
        }
      } catch (err) {
        console.error('Model load error:', err);
        if (!cancelled) onLoadingChange(false);
      }
    }
    loadModel();
    return () => { cancelled = true; };
  }, [onLoadingChange]);

  // Start webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // handled by UI
      }
    }
    startCam();
    return () => {
      stream?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── Detection loop ────────────────────────────────────────────────────────
  const detectPose = useCallback(() => {
    const video    = videoRef.current;
    const canvas   = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    if (canvas.width  !== video.videoWidth)  canvas.width  = video.videoWidth  || 1280;
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) { animFrameRef.current = requestAnimationFrame(detectPose); return; }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      frameCountRef.current += 1;

      const shouldDetect = frameCountRef.current % DETECT_EVERY === 0;

      if (shouldDetect) {
        try {
          const result = landmarker.detectForVideo(video, performance.now());

          if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0] as Landmark[];
            const feedback  = analyzeExercise(exercise, landmarks);

            cachedLandmarksRef.current = landmarks;
            cachedFeedbackRef.current  = feedback;

            // ── ROBUST REP COUNTING ──
            const cfg = REP_CONFIGS[exercise];
            const rawAngle = feedback.angles[cfg.primaryAngleIndex]?.value;
            const now = performance.now();

            if (rawAngle != null && feedback.status !== 'idle') {
              // Smooth the angle
              angleBuffer.current.push(rawAngle);
              if (angleBuffer.current.length > SMOOTH_WINDOW) {
                angleBuffer.current.shift();
              }
              const smoothAngle = angleBuffer.current.reduce((a, b) => a + b, 0) / angleBuffer.current.length;

              const isDeep = cfg.lowerIsDeeper
                ? smoothAngle < cfg.enterBottomAngle
                : smoothAngle > cfg.enterBottomAngle;

              const isUp = cfg.lowerIsDeeper
                ? smoothAngle > cfg.exitTopAngle
                : smoothAngle < cfg.exitTopAngle;

              const phase = repPhaseRef.current;

              if (phase === 'IDLE' || phase === 'ASCENDING') {
                if (isDeep) {
                  repPhaseRef.current = 'DESCENDING';
                  bottomEnteredAt.current = now;
                }
              }

              if (phase === 'DESCENDING') {
                // Still deep? Check if held long enough
                if (isDeep && (now - bottomEnteredAt.current) >= cfg.minHoldMs) {
                  repPhaseRef.current = 'AT_BOTTOM';
                } else if (isUp) {
                  // Went up without holding — false dip, reset
                  repPhaseRef.current = 'IDLE';
                }
              }

              if (phase === 'AT_BOTTOM') {
                if (isUp) {
                  // Check cooldown
                  if ((now - lastRepAt.current) >= cfg.cooldownMs) {
                    repCountRef.current += 1;
                    lastRepAt.current = now;
                    onRepCount(repCountRef.current);
                  }
                  repPhaseRef.current = 'ASCENDING';
                }
              }

              if (phase === 'ASCENDING' && isUp) {
                repPhaseRef.current = 'IDLE';
              }
            } else {
              // Status is idle — reset rep phase, don't count anything
              repPhaseRef.current = 'IDLE';
              angleBuffer.current = [];
            }

            // Issue accumulation (only when actively exercising)
            if (feedback.status !== 'idle' && feedback.issues.length > 0) {
              onIssueDetected(feedback.issues);
            }

            onFeedback(feedback);
          } else {
            cachedLandmarksRef.current = null;
            cachedFeedbackRef.current  = {
              status: 'idle' as PostureStatus,
              angles: [], issues: [], tips: [],
              coachMessage: 'Step into frame...',
              formScore: 0,
            };
            repPhaseRef.current = 'IDLE';
            angleBuffer.current = [];
          }
        } catch (e) {
          console.warn('Detection error:', e);
        }
      }

      // Always draw from cache
      const lm = cachedLandmarksRef.current;
      const fb = cachedFeedbackRef.current ?? {
        status: 'idle' as PostureStatus,
        angles: [], issues: [], tips: [],
        coachMessage: '', formScore: 0,
      };
      if (lm) {
        drawPose(ctx, lm, canvas.width, canvas.height, fb.status);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      drawHUD(ctx, repCountRef.current, fb, canvas.width, canvas.height);
    }

    animFrameRef.current = requestAnimationFrame(detectPose);
  }, [exercise, onFeedback, onRepCount, onIssueDetected]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(detectPose);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [detectPose]);

  return (
    <div className="pose-detector">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="webcam-video"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="pose-canvas"
      />
    </div>
  );
}
