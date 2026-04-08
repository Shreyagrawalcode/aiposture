import { useEffect, useRef, useState, useCallback } from 'react';
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import { type ExerciseType, type Landmark, type PostureFeedback } from '../types';
import { analyzeExercise } from '../utils/exerciseAnalysis';
import { drawPose } from '../utils/poseDrawing';
import './PoseDetector.css';

interface Props {
  exercise: ExerciseType;
  onFeedback: (feedback: PostureFeedback) => void;
  onLoadingChange: (loading: boolean) => void;
}

export default function PoseDetector({ exercise, onFeedback, onLoadingChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  const [camError, setCamError] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(true);

  // ── Load MediaPipe model ────────────────────────────────────────────────────
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
          setModelLoading(false);
          onLoadingChange(false);
        }
      } catch (err) {
        console.error('Model load error:', err);
        if (!cancelled) {
          setCamError('Failed to load pose model. Check your internet connection.');
          setModelLoading(false);
          onLoadingChange(false);
        }
      }
    }

    loadModel();
    return () => { cancelled = true; };
  }, []);

  // ── Start webcam ────────────────────────────────────────────────────────────
  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setCamError('Camera access denied. Please allow camera permissions and refresh.');
      }
    }

    startCam();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // ── Detection loop ──────────────────────────────────────────────────────────
  const detectPose = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    // Sync canvas size to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(detectPose);
      return;
    }

    const now = performance.now();

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;

      try {
        const result = landmarker.detectForVideo(video, now);

        if (result.landmarks && result.landmarks.length > 0) {
          const landmarks = result.landmarks[0] as Landmark[];
          const feedback = analyzeExercise(exercise, landmarks);
          onFeedback(feedback);
          drawPose(ctx, landmarks, canvas.width, canvas.height, feedback.status);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onFeedback({
            status: 'idle',
            angles: [],
            issues: ['No pose detected — step back so your full body is visible.'],
            tips: [
              'Ensure your whole body fits in the frame.',
              'Try improving lighting in your space.',
              'Stand 2–3 metres from the camera.',
            ],
          });
        }
      } catch (e) {
        console.warn('Detection error:', e);
      }
    }

    animFrameRef.current = requestAnimationFrame(detectPose);
  }, [exercise, onFeedback]);

  useEffect(() => {
    if (modelLoading) return;
    animFrameRef.current = requestAnimationFrame(detectPose);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [detectPose, modelLoading]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (camError) {
    return (
      <div className="cam-error">
        <div className="cam-error-icon">⚠</div>
        <div className="cam-error-msg">{camError}</div>
      </div>
    );
  }

  return (
    <div className="pose-detector">
      {modelLoading && (
        <div className="model-loading">
          <div className="spinner" />
          <span>Loading AI model…</span>
        </div>
      )}
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
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
