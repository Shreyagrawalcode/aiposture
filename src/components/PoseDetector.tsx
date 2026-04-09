import { useEffect, useRef, useCallback } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';
import { type ExerciseType, type Landmark, type PostureFeedback } from '../types';
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

// ─── Rep counter config ───────────────────────────────────────────────────────
type RepPhase = 'WAITING_BOTTOM' | 'AT_BOTTOM';

interface RepThresholds {
  primaryAngleIndex: number;
  bottomThreshold: number;
  topThreshold: number;
}

const REP_CONFIG: Record<ExerciseType, RepThresholds> = {
  squat:    { primaryAngleIndex: 0, bottomThreshold: 100, topThreshold: 140 },
  pushup:   { primaryAngleIndex: 0, bottomThreshold: 90,  topThreshold: 140 },
  deadlift: { primaryAngleIndex: 0, bottomThreshold: 140, topThreshold: 160 },
  ohpress:  { primaryAngleIndex: 0, bottomThreshold: 120, topThreshold: 155 },
};

export default function PoseDetector({
  exercise,
  onFeedback,
  onLoadingChange,
  onRepCount,
  onIssueDetected,
}: Props) {
  const videoRef        = useRef<HTMLVideoElement>(null);
  const canvasRef       = useRef<HTMLCanvasElement>(null);
  const landmarkerRef   = useRef<PoseLandmarker | null>(null);
  const animFrameRef    = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);
  const modelReadyRef   = useRef(false);

  // Rep counter refs — no state to avoid stale closures
  const repPhaseRef  = useRef<RepPhase>('WAITING_BOTTOM');
  const repCountRef  = useRef<number>(0);

  // ── Reset counter when exercise changes ──────────────────────────────────
  useEffect(() => {
    repPhaseRef.current  = 'WAITING_BOTTOM';
    repCountRef.current  = 0;
    onRepCount(0);
  }, [exercise, onRepCount]);

  // ── Load MediaPipe model ─────────────────────────────────────────────────
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
          modelReadyRef.current = true;
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

  // ── Start webcam ─────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // Error handled by cam-error div below if video never loads
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

      try {
        const result = landmarker.detectForVideo(video, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0] as Landmark[];
          const feedback  = analyzeExercise(exercise, landmarks);

          // ── Rep counting ──
          const cfg          = REP_CONFIG[exercise];
          const primaryAngle = feedback.angles[cfg.primaryAngleIndex]?.value;

          if (primaryAngle !== null && primaryAngle !== undefined) {
            if (repPhaseRef.current === 'WAITING_BOTTOM' && primaryAngle < cfg.bottomThreshold) {
              repPhaseRef.current = 'AT_BOTTOM';
            } else if (repPhaseRef.current === 'AT_BOTTOM' && primaryAngle > cfg.topThreshold) {
              repCountRef.current += 1;
              repPhaseRef.current = 'WAITING_BOTTOM';
              onRepCount(repCountRef.current);
            }
          }

          // ── Issue accumulation ──
          if (feedback.issues.length > 0) onIssueDetected(feedback.issues);

          // ── Draw ──
          drawPose(ctx, landmarks, canvas.width, canvas.height, feedback.status);
          drawHUD(ctx, repCountRef.current, feedback, canvas.width, canvas.height);

          onFeedback(feedback);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const idle: PostureFeedback = {
            status: 'idle', angles: [], issues: [], tips: [],
          };
          drawHUD(ctx, repCountRef.current, idle, canvas.width, canvas.height);
        }
      } catch (e) {
        console.warn('Detection error:', e);
      }
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
