<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Camera Test</title>
  <style>
    body {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f4f4f4;
      font-family: sans-serif;
    }
    video {
      width: 480px;
      height: 360px;
      border: 2px solid #333;
      border-radius: 10px;
      background: black;
    }
    button {
      margin-top: 20px;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 8px;
      border: none;
      background: #007bff;
      color: white;
      cursor: pointer;
    }
    button:hover {
      background: #0056b3;
    }
  </style>
</head>
<body>
  <h2>カメラ起動テスト</h2>
  <video id="camera" autoplay playsinline></video>
  <button id="startBtn">カメラを起動</button>

  <script>
    const video = document.getElementById('camera');
    const startBtn = document.getElementById('startBtn');

    startBtn.addEventListener('click', async () => {
      try {
        // カメラの映像を取得
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
      } catch (err) {
        alert('カメラを起動できません: ' + err.message);
      }
    });
  </script>
</body>
</html>