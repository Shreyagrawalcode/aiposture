# PostureAI

Real-time exercise form analysis using your webcam and AI — runs 100% in the browser, nothing is uploaded.

## Setup

### Prerequisites
- Node.js 18+ and npm

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Camera note:** The browser will ask for camera permission. Click **Allow**. Camera access requires HTTPS or localhost.

---

## How It Works

### 1. Pose Detection — MediaPipe Pose Landmarker

PostureAI uses [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker) to detect 33 body landmarks in real time from your webcam.

- The **lite model** (`pose_landmarker_lite.task`) is loaded once from Google's CDN on first launch (~5 MB)
- It runs in `VIDEO` mode at the browser's native framerate using `requestAnimationFrame`
- Each frame, `detectForVideo()` returns an array of 33 `(x, y, z, visibility)` normalised landmarks

### 2. Joint Angle Calculation

Joint angles are calculated using the **atan2 method**:

```
angle = |atan2(C.y - B.y, C.x - B.x) - atan2(A.y - B.y, A.x - B.x)| × (180 / π)
```

Where **B** is the joint vertex (e.g. the knee), and **A**, **C** are the adjacent joints (hip and ankle). This gives the interior angle at B in degrees.

### 3. Exercise Analysis

Each exercise maps specific landmark triplets to angles and applies thresholds:

| Exercise | Key Angle | Good | Warning | Fix |
|---|---|---|---|---|
| Squat | Knee (hip–knee–ankle) | < 95° | 95–130° | > 130° |
| Push-up | Elbow (shoulder–elbow–wrist) | < 110° | 110–150° | > 150° |
| Deadlift | Back (shoulder–hip–knee) | ≥ 150° | 130–150° | < 130° |
| Overhead Press | Elbow lockout | > 160° | 130–160° | < 130° |

Additional checks include:
- **Squat:** knee valgus (knees caving in) by comparing knee width vs ankle width
- **Plank:** hip sag by checking if hip Y deviates from the shoulder–ankle midpoint
- **Deadlift:** excessive forward lean via relative shoulder/hip position
- **OHP:** wrist drift and back lean

### 4. Skeleton Overlay

Landmarks are drawn on a `<canvas>` element absolutely positioned over the `<video>` element. Connection lines and joint dots are colour-coded:

- **Green** `#00ff88` — Good form
- **Amber** `#ffaa00` — Warning
- **Red** `#ff3b3b` — Fix now
- **Blue** `#4488ff` — Idle / no pose

### 5. Component Structure

```
src/
├── types.ts                    # Shared TypeScript interfaces & exercise config
├── App.tsx                     # Root layout, state management
├── components/
│   ├── ExerciseSelector.tsx    # Tab UI for selecting exercise
│   ├── FeedbackPanel.tsx       # Status badge, angles, issues, tips
│   └── PoseDetector.tsx        # Webcam + MediaPipe + canvas overlay
└── utils/
    ├── angleUtils.ts           # calculateAngle(), midpoint(), isVisible()
    ├── exerciseAnalysis.ts     # Per-exercise analysis logic & tip generation
    └── poseDrawing.ts          # Canvas skeleton drawing
```

---

## Tips for Best Results

- Stand **2–3 metres** from your camera
- Ensure your **full body** is visible in the frame
- Use **good lighting** (avoid backlighting)
- Wear **fitted clothing** for more accurate landmark detection
- For squats/deadlift, stand **sideways** to the camera

---

## Privacy

All processing happens locally in your browser using WebAssembly and WebGL. No video or pose data is ever sent to a server.
