let cvReady = false;
let currentGesture = null;
let currentMode = 'basic'; // 'basic' or 'asl'
let aslModel = null;
let camera = null;

if (typeof cv !== 'undefined') {
  cv['onRuntimeInitialized'] = () => { cvReady = true; };
}



document.addEventListener('DOMContentLoaded', function () {
  const videoElem = document.getElementById('webcam');
  const textElem = document.getElementById('translated-text');
  const sendBtn = document.getElementById('send-image-btn');
  const aslDisplay = document.getElementById('asl-display');
  const aslLetterElem = document.getElementById('asl-letter');
  const confidenceValueElem = document.getElementById('confidence-value');
  const confidenceFillElem = document.getElementById('confidence-fill');

  document.getElementById("start-btn").addEventListener("click", async () => {
    const video = document.getElementById("webcam");

    try {
      // カメラを起動
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      console.log("✅ カメラ起動成功");
    } catch (err) {
      console.error("❌ カメラ起動エラー:", err);
      alert("カメラを起動できません。ブラウザの設定を確認してください。");
    }
  });

  // ✅ 「画像送信」ボタンが押されたときの処理
  sendBtn.addEventListener('click', async () => {
    if (!videoElem || videoElem.readyState !== 4) {
      alert('⚠️ カメラが起動していません');
      return;
    }

    textElem.innerHTML = "<em>画像をサーバーに送信中...</em>";

    // 現在のフレームを取得
    const canvas = document.createElement('canvas');
    canvas.width = videoElem.videoWidth;
    canvas.height = videoElem.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElem, 0, 0, canvas.width, canvas.height);

    // 画像をblobに変換
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');

    try {
      // ✅ Pythonサーバーに送信
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        textElem.innerHTML = `<span class="error">サーバーエラー: ${response.statusText}</span>`;
        return;
      }

      const data = await response.json();
      console.log("サーバーからの応答:", data);

      // ✅ 結果を表示
      aslDisplay.style.display = 'block';
      aslLetterElem.textContent = data.label || '―';
      confidenceValueElem.textContent = `${(data.confidence * 100).toFixed(1)}%`;
      confidenceFillElem.style.width = `${(data.confidence * 100).toFixed(1)}%`;

      textElem.innerHTML = `🖐️ 検出結果: <b>${data.label}</b>`;
      addToHistory(`Image→ ${data.label} (${(data.confidence * 100).toFixed(1)}%)`);

    } catch (error) {
      console.error("通信エラー:", error);
      textElem.innerHTML = `<span class="error">通信に失敗しました</span>`;
    }
  });
});



function switchMode(mode) {
  currentMode = mode;
  document.getElementById('basic-mode-btn').classList.toggle('active', mode === 'basic');
  document.getElementById('asl-mode-btn').classList.toggle('active', mode === 'asl');
  document.getElementById('asl-display').style.display = mode === 'asl' ? 'block' : 'none';

  const textElem = document.getElementById("translated-text");
  if (mode === 'asl') {
    textElem.innerHTML = "<em>ASLモード: アルファベットを表示してください...</em>";
    if (window.initializeASLModel) {
      window.initializeASLModel();
    }
  } else {
    textElem.innerHTML = "<em>基本ジェスターモード...</em>";
  }
}

function startCamera() {
  const webcamElem = document.getElementById('webcam');
  const cvCanvas = document.getElementById('cv-canvas');
  if (!webcamElem) {
    alert('Webcam element not found!');
    return;
  }

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);

  camera = new Camera(webcamElem, {
    onFrame: async () => {
      await hands.send({ image: webcamElem });
      if (cvReady) processWithOpenCV(webcamElem, cvCanvas);
    },
    width: 640,
    height: 480
  });
  camera.start();
}

function getFingerStates(landmarks) {
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerPips = [2, 6, 10, 14, 18];
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  let states = {};
  states['Thumb'] = landmarks[4].x > landmarks[3].x ? 'Up' : 'Down';
  for (let i = 1; i < 5; i++) {
    states[fingerNames[i]] = landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y ? 'Up' : 'Down';
  }
  return states;
}

function onResults(results) {
  const textElem = document.getElementById("translated-text");
  const canvasElem = document.getElementById("cv-canvas");
  const ctx = canvasElem.getContext("2d");
  ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const fingerStates = getFingerStates(landmarks);
    let gesture = null;
    let confidence = 0;

    if (currentMode === 'asl' && window.detectASLGesture) {
      const aslResult = window.detectASLGesture(landmarks);
      if (aslResult) {
        gesture = aslResult.letter;
        confidence = aslResult.confidence;

        document.getElementById('asl-letter').textContent = gesture;
        document.getElementById('confidence-value').textContent = Math.round(confidence * 100) + '%';
        document.getElementById('confidence-fill').style.width = (confidence * 100) + '%';

        if (confidence > 0.8)
          document.getElementById('confidence-fill').style.background = '#00C853';
        else if (confidence > 0.6)
          document.getElementById('confidence-fill').style.background = '#FF9800';
        else
          document.getElementById('confidence-fill').style.background = '#FF4444';

        textElem.innerHTML = `ASL検出: <b>${gesture}</b>`;
        addToHistory(`ASL: ${gesture} (信頼度: ${Math.round(confidence * 100)}%)`);
      } else {
        textElem.innerHTML = "<em>ASL文字を検出中...</em>";
      }
    } else {
      gesture = recognizeGesture(landmarks, fingerStates);
      if (gesture) {
        currentGesture = gesture;
        textElem.innerHTML = `🖐️ Gesture: <b>${gesture}</b>`;
        addToHistory(`Gesture: ${gesture}`);
      } else {
        currentGesture = null;
        let stateStr = Object.entries(fingerStates)
          .map(([finger, state]) => `${finger}: <b>${state}</b>`)
          .join(" | ");
        textElem.innerHTML = `<em>認識できません...</em><br>${stateStr}`;
        addToHistory("No known gesture");
      }
    }

    drawHand(ctx, landmarks, canvasElem.width, canvasElem.height, fingerStates);
  } else {
    currentGesture = null;
    textElem.innerHTML = "<em>手を検出中...</em>";
  }
}

function drawHand(ctx, landmarks, w, h, fingerStates) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20]
  ];
  ctx.lineWidth = 3;
  ctx.strokeStyle = currentMode === 'asl' ? "#FF6B00" : "#0078D7";
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  });
  for (let i = 0; i < landmarks.length; i++) {
    const px = landmarks[i].x * w;
    const py = landmarks[i].y * h;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, 2 * Math.PI);
    let color = currentMode === 'asl' ? "#FF6B00" : "#0078D7";
    if (i === 4 && fingerStates.Thumb === "Up") color = "#00C853";
    if (i === 8 && fingerStates.Index === "Up") color = "#00C853";
    if (i === 12 && fingerStates.Middle === "Up") color = "#00C853";
    if (i === 16 && fingerStates.Ring === "Up") color = "#00C853";
    if (i === 20 && fingerStates.Pinky === "Up") color = "#00C853";
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.stroke();
  }
}

function addToHistory(text) {
  const historyList = document.getElementById('history-list');
  const li = document.createElement('li');
  li.textContent = text;
  historyList.appendChild(li);
  if (historyList.children.length > 10) {
    historyList.removeChild(historyList.firstChild);
  }
}

function processWithOpenCV(videoElem, canvasElem) {
  canvasElem.width = videoElem.videoWidth;
  canvasElem.height = videoElem.videoHeight;
  const ctx = canvasElem.getContext('2d');
  ctx.drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);
  let src = cv.imread(canvasElem);
  let dst = new cv.Mat();
  cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
  src.delete();
  dst.delete();
}

async function recognizeGesture() {
  const videoElem = document.getElementById('webcam');
  const canvasElem = document.createElement('canvas');
  canvasElem.width = videoElem.videoWidth;
  canvasElem.height = videoElem.videoHeight;
  const ctx = canvasElem.getContext('2d');
  ctx.drawImage(videoElem, 0, 0, canvasElem.width, canvasElem.height);

  // 現在のフレームを画像として取得
  const blob = await new Promise(resolve => canvasElem.toBlob(resolve, 'image/jpeg'));
  const formData = new FormData();
  formData.append('file', blob, 'frame.jpg');

  try {
    // PythonサーバーにPOST
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      console.error('Server error:', response.statusText);
      document.getElementById("translated-text").innerHTML = `<em>サーバーエラー: ${response.statusText}</em>`;
      return null;
    }

    const data = await response.json();
    console.log('Server Response:', data);

    // 結果の整形表示
    const textElem = document.getElementById("translated-text");
    textElem.innerHTML = `
      🖐️ Gesture: <b>${data.label}</b><br>
      信頼度: ${(data.confidence * 100).toFixed(1)}%<br>
      <small>Model: ${data.predicted_class}</small>
    `;

    addToHistory(`Server: ${data.label} (${(data.confidence * 100).toFixed(1)}%)`);
    currentGesture = data.label;
    return data.label;

  } catch (err) {
    console.error('Error sending to recognition server:', err);
    document.getElementById("translated-text").innerHTML = `<em>サーバー通信エラー</em>`;
    return null;
  }
}


// Export global
window.getCurrentGesture = () => currentGesture;
window.addToHistory = addToHistory;
window.switchMode = switchMode;