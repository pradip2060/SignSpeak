<!DOCTYPE html>
<html lang="ja">

<head>
    <meta charset="UTF-8">
    <title>SignSpeak Real-time Web</title>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic"></script>
    <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils"></script>
    <style>
        body {
            font-family: sans-serif;
            text-align: center;
            background: #1a1a1a;
            color: white;
        }

        .video-box {
            position: relative;
            display: inline-block;
            margin-top: 10px;
        }

        h1 {
            font-size: 20px;
            margin-top: 10px;
        }

        /* アスペクト比を16:9 (1280x720相当) に固定 */
        #output_canvas {
            border: 2px solid #444;
            width: 854px;
            height: 480px;
            border-radius: 8px;
        }

        #result {
            font-size: 56px;
            font-weight: bold;
            color: #00ff00;
            margin-top: 15px;
            text-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }

        #status {
            font-size: 14px;
            color: #fff;
            margin-top: 5px;
        }
    </style>
</head>

<body>
    <h1>ASL Real-time Recognition</h1>
    <div id="status">Loading AI Model...</div>
    <div id="result">---</div>
    <div class="video-box">
        <video id="input_video" style="display:none;"></video>
        <canvas id="output_canvas"></canvas>
    </div>

    <div class="controls">
        <select id="lang-select">
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
        </select>
        <button id="speak-btn">🔊 手動で再生</button>
    </div>

    <div id="result">---</div>

    <script src="js/asl_recognize.js" defer></script>
</body>

</html>