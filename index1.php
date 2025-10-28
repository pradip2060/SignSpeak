<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8" />
  <title>ASL Predictor with Skeleton</title>

  <!-- ✅ TensorFlow.js + Hand Pose Detection -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl"></script>

  <!-- ✅ Embedded CSS (Tailwind-style equivalent) -->
  <style>
    body {
      margin: 0;
      font-family: 'Segoe UI', sans-serif;
      background-color: #f3f4f6;
    }

    nav {
      width: 100%;
      max-width: 1100px;
      margin: 1.5rem auto;
    }

    nav ul {
      display: flex;
      padding: 16px;
      border-bottom: 1px solid #ddd;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      list-style: none;
      margin: 0;
    }

    nav li {
      margin-right: 1rem;
    }

    nav a {
      color: #2563eb;
      text-decoration: none;
      font-weight: 500;
    }

    nav a:hover {
      text-decoration: underline;
    }

    main {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: #f3f4f6;
      padding: 1rem;
      gap: 1.5rem;
    }

    video {
      display: block;
      width: 960px;
      height: 680px;
      background-color: black;
      border-radius: 8px;
    }

    .relative {
      position: relative;
      display: inline-block;
    }

    canvas {
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: none;
    }

    #inference {
      position: absolute;
      top: 0;
      right: 0;
      margin: 16px;
      padding: 16px;
      background-color: rgba(255, 255, 255, 0.75);
      border-radius: 10px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 50;
    }

    #result {
      font-family: monospace;
      color: #1f2937;
      text-align: center;
    }

    #res-class {
      font-size: 3rem;
      font-weight: bold;
    }

    #res-image {
      margin-top: 16px;
      border-radius: 8px;
      border: 1px solid #ccc;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
      width: 100px;
      display: none;
    }

    #sendBtn {
      width: 300px;
      padding: 12px 16px;
      background-color: #6b7280;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    #sendBtn.bg-blue-500 {
      background-color: #3b82f6;
    }

    #sendBtn:hover:not(:disabled) {
      background-color: #2563eb;
    }

    #sendBtn:disabled {
      background-color: #9ca3af;
      cursor: not-allowed;
    }
  </style>
</head>

<body>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/app">Camera App</a></li>
      <li><a href="/test">Image Upload Test</a></li>
    </ul>
  </nav>

  <main>
    <div class="relative">
      <video id="webcam" autoplay playsinline muted></video>
      <canvas id="outputCanvas"></canvas>

      <div id="inference">
        <div id="result">
          <p><span id="res-class"></span></p>
          <img id="res-image" src="" alt="Uploaded hand">
        </div>
      </div>
    </div>

    <button id="sendBtn">📤 Send Hand to Server</button>
  </main>

  <!-- ✅ External JavaScript -->
  <script src="js/config.js"></script>
  <script type="module" src="js/app.js"></script>
</body>

</html>
