<?php
require_once 'env.php';
$api_url = $API_CONFIG['api_url'];
?>
<!DOCTYPE html>
<html lang="ja">

<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SignSpeak UI Sample</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <script async src="https://docs.opencv.org/4.x/opencv.js" type="text/javascript"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }

    body {
      background-color: #FFFFFF;
      display: flex;
      flex-direction: column;
      height: 100vh;
      color: #000000;
    }

    header {
      background-color: #FFFFFF;
      color: #0078D7;
      padding: 1rem;
      text-align: center;
      font-size: 1.5rem;
      font-weight: bold;
      position: relative;
      border-bottom: 2px solid #F4F4F4;
    }

    main {
      display: flex;
      flex: 1;
    }

    .camera-panel {
      flex: 1;
      background: #fff;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-right: 2px solid #F4F4F4;
    }

    video {
      width: 90%;
      max-width: 600px;
      border: 4px solid #0078D7;
      border-radius: 10px;
    }

    .output-panel {
      flex: 1;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .text-output {
      font-size: 2rem;
      font-weight: bold;
      color: #000000;
      margin-bottom: 2rem;
    }

    #translated-text em {
      color: #666666;
    }

    .controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    button {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      background-color: #F4F4F4;
      color: #0078D7;
      font-weight: bold;
      cursor: pointer;
      transition: background-color 0.3s, color 0.3s;
      border: 2px solid #0078D7;
      flex: 1;
      min-width: 120px;
    }

    .btn {
      text-decoration: none;;
      padding: 0.70rem 1.5rem;
      border: none;
      border-radius: 8px;
      background-color: #0078D7;
      color: #ffffff;
      cursor: pointer;
      flex: 1;
    }

    button:hover {
      background-color: #0078D7;
      color: #fff;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    footer {
      background: #F4F4F4;
      padding: 0.75rem;
      text-align: center;
      font-size: 0.9rem;
      color: #666666;
    }

    .history-box {
      background: #F4F4F4;
      border: 2px solid #0078D7;
      border-radius: 8px;
      padding: 1rem;
      height: 180px;
      overflow-y: auto;
      margin-top: 1rem;
      color: #666666;
    }

    #history-list {
      margin: 0;
      padding-left: 1.2rem;
      color: #666666;
      font-size: 1rem;
      list-style: disc inside;
    }

    #lang-select {
      position: absolute;
      top: 1rem;
      right: 2rem;
      padding: 0.3rem 1rem;
      border-radius: 6px;
      border: 2px solid #0078D7;
      font-size: 1rem;
      background: #F4F4F4;
      color: #0078D7;
      font-weight: bold;
    }

    #lang-select:focus {
      outline: none;
      border-color: #0078D7;
    }

    .translation-result {
      margin-top: 1rem;
      padding: 1rem;
      background-color: #F0F8FF;
      border-radius: 8px;
      border: 1px solid #0078D7;
    }

    .translation-result h3 {
      color: #0078D7;
      margin-bottom: 0.5rem;
    }

    .loading {
      color: #0078D7;
      font-style: italic;
    }

    .error {
      color: #ff4444;
    }
  </style>
</head>

<body>
  <header>
    SignSpeak: ジェスチャー翻訳ツール
    <select id="lang-select">
      <option value="en-US">English</option>
      <option value="ja-JP">日本語</option>
      <option value="zh-CN">中文</option>
    </select>
  </header>
  <main>
    <div class="camera-panel">
      <div style="position:relative; width:90%; max-width:600px;">
        <video id="webcam" autoplay playsinline style="width:100%;"></video>
        <canvas id="cv-canvas" style="position:absolute; left:0; top:0; width:100%; height:100%; pointer-events:none;"></canvas>

        <div id="recording-indicator" style="display: none; position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: white; padding: 5px 10px; border-radius: 5px; z-index: 10;">
          <span id="indicator-text">●</span> <span id="timer">0.0</span>
        </div>
      </div>
    </div>

    <div class="output-panel">
      <div class="text-output" id="translated-text"><em>Looking for hand...</em></div>

      <!-- Translation Result Display -->
      <div class="translation-result" id="translation-result" style="display: none;">
        <h3>日本語翻訳:</h3>
        <div id="gesture-text"></div>
        <div id="translation-text"></div>
      </div>

      <div id="mode-select" class="mode-container">
        <label class="mode-label">
          <input type="radio" name="mode" value="local" checked>
          <span>ローカルプログラムモード</span>
        </label>
        <label class="mode-label">
          <input type="radio" name="mode" value="server">
          <span>機械学習モード</span>
        </label>
      </div>
      <div>
        <a href="asl_recognize.php" class="btn">リアルタイム（学習モデル）</a>
      </div>

      <div class="controls">
        <div class="controls">
          <button id="start-btn">カメラ開始</button>
          <button id="record-btn" disabled style="display: none; background-color: #fff; border-color: #ff4444; color: #ff4444;">
            録画開始
          </button>
          <button id="history-save-btn">履歴保存</button>
        </div>

        <div id="recording-indicator" style="display: none; color: #ff4444; font-weight: bold; margin-top: 5px;">
          ● 録画中... <span id="record-timer">0.0</span>s
        </div>

        <button id="speak-btn">話す</button>
        <button id="translate-btn">翻訳</button>
        <button id="history-save-btn">履歴保存</button>
      </div>
      <div class="history-box">
        <ul id="history-list"></ul>
      </div>
    </div>
  </main>
  <footer>SignSpeak © 2025</footer>

  <!-- JS scripts -->
  <script>
    const API_URL = "<?= $api_url; ?>";
  </script>
  <script src="translate.js" defer></script>
  <script src="speak.js" defer></script>
  <script src="history.js" defer></script>
  <script src="gesture-logic.js"></script>
  <script src="app.js" defer></script>
</body>

</html>