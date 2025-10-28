// Gesture detection and hand tracking logic
let cvReady = false;
let currentGesture = null;
let isDebug = false;
const SEND_INTERVAL = 1000; // 1秒ごとに送信
let lastSentTime = 0;

let currentMode = 'local'; // default: local

if (typeof cv !== 'undefined') {
  cv['onRuntimeInitialized'] = () => { cvReady = true; };
}

document.addEventListener('DOMContentLoaded', function () {
  // モード選択：ローカルモード or サーバモード
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      currentMode = e.target.value;
      addToHistory(`Mode changed to: ${currentMode}`);
    });
  }

  // カメラ開始ボタン
  document.getElementById('start-btn').onclick = startCamera;

  // MediaPipe Handsの初期化
  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // 手の検出結果のコールバック
  hands.onResults(onResults);

  // カメラのセットアップ
  let camera;
  function startCamera() {
    const webcamElem = document.getElementById('webcam');
    const cvCanvas = document.getElementById('cv-canvas');
    if (!webcamElem) {
      alert('Webcam element not found!');
      return;
    }
    camera = new Camera(webcamElem, {
      onFrame: async () => {
        await hands.send({ image: webcamElem });
        if (cvReady) {
          processWithOpenCV(webcamElem, cvCanvas);
        }
      },
      width: 640,
      height: 480
    });
    camera.start();
  }

  window.startCamera = startCamera;
});

// ... existing gesture recognition functions (getFingerStates, onResults, drawHand, etc.)
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

    if (currentMode === 'local') {
      // ===== Local mode =====
      const gesture = recognizeGesture(landmarks, fingerStates);
      handleRecognizedGesture(gesture, fingerStates, landmarks, ctx, canvasElem);
    } else if (currentMode === 'server') {
      // ===== Server mode =====
      const now = Date.now();
      if (now - lastSentTime > SEND_INTERVAL) {
        lastSentTime = now;
        sendFrameToServer(canvasElem)
          .then(gesture => handleRecognizedGesture(gesture, fingerStates, landmarks, ctx, canvasElem))
          .catch(err => {
            console.error('Server recognition failed:', err);
            textElem.innerHTML = "<em>Server recognition error...</em>";
          });
      } else {
        // 最新結果を描画だけする
        drawHand(ctx, landmarks, canvasElem.width, canvasElem.height, fingerStates);
      }
    }
  } else {
    currentGesture = null;
    textElem.innerHTML = "<em>Looking for hand...</em>";
  }
}

function handleRecognizedGesture(gesture, fingerStates, landmarks, ctx, canvasElem) {
  const textElem = document.getElementById("translated-text");

  if (gesture) {
    currentGesture = gesture;
    textElem.innerHTML = `🖐️ Gesture: <b>${gesture}</b>`;
    addToHistory(`Gesture: ${gesture}`);

    if (window.saveCurrentGestureToDatabase) {
      window.saveCurrentGestureToDatabase();
    }
  } else {
    currentGesture = null;
    if (isDebug) {
      let stateStr = Object.entries(fingerStates)
        .map(([finger, state]) => `${finger}: <b>${state}</b>`)
        .join(" | ");
      textElem.innerHTML = `<em>No known gesture...</em><br>${stateStr}`;
    }

  }

  drawHand(ctx, landmarks, canvasElem.width, canvasElem.height, fingerStates);
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
  ctx.strokeStyle = "#0078D7";
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
    let color = "#0078D7";
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

function recognizeGesture(landmarks, fingerStates) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const dist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

  if (dist < 0.05 && fingerStates.Middle === "Up" && fingerStates.Ring === "Up" && fingerStates.Pinky === "Up") {
    if (landmarks[0].y < landmarks[9].y) {
      return "OK";
    } else {
      return "NO (upside down)";
    }
  }
  if (fingerStates.Thumb === "Up" &&
    fingerStates.Index === "Up" &&
    fingerStates.Pinky === "Up" &&
    fingerStates.Middle === "Down" &&
    fingerStates.Ring === "Down") {
    return "I Love You 🤟";
  }
  if (fingerStates.Index === "Down" &&
    fingerStates.Middle === "Down" &&
    fingerStates.Ring === "Down" &&
    fingerStates.Pinky === "Down") {
    return "Fist ✊";
  }
  return null;
}

// Make currentGesture available globally for other modules
window.getCurrentGesture = function () {
  return currentGesture;
};

// Make addToHistory available globally
window.addToHistory = addToHistory;

// ADD THIS: Connect translate button after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  // Wait a bit for translate.js to load, then connect the button
  setTimeout(() => {
    const translateBtn = document.getElementById('translate-btn');
    if (translateBtn && window.translateToJapanese) {
      translateBtn.onclick = window.translateToJapanese;
    } else {
      console.error('Translate button or function not found');
      // Fallback: add basic translation functionality
      translateBtn.onclick = function () {
        const gesture = window.getCurrentGesture();
        if (!gesture) {
          alert("翻訳するジェスチャーが検出されていません。");
          return;
        }
        alert("翻訳機能を読み込んでいます...");
      };
    }
  }, 100);
});


// サーバーモード用：フレームをFastAPIサーバーに送信してジェスチャーを取得
async function sendFrameToServer(canvasElem) {
  const videoElem = document.getElementById('webcam');

  // === 修正点: 実際の映像を描くための一時キャンバスを作成 ===
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = videoElem.videoWidth || 640;
  tempCanvas.height = videoElem.videoHeight || 480;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(videoElem, 0, 0, tempCanvas.width, tempCanvas.height);

  // === この一時キャンバスをJPEG化して送信 ===
  const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.9));
  const formData = new FormData();
  formData.append('file', blob, 'frame.jpg');

  // FastAPI側のURLに合わせる
  const url = "http://127.0.0.1:8000/predict";
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Network error');
  const data = await response.json();

  // FastAPI側の返り値 { "gesture": "Hello" } を想定
  return data.label || null;
}
