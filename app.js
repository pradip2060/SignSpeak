// ==============================
// 1. グローバル変数と初期設定
// ==============================
let mediaRecorder;
let recordedChunks = [];
let startTime;
let timerInterval;
let countdownInterval;
let currentGesture = "";
let currentMode = 'local';
const api_url = API_URL;
const RECORD_TIME_LIMIT = 3.0;

const recordBtn = document.getElementById('record-btn');
const modeSelect = document.getElementById('mode-select');
const startBtn = document.getElementById('start-btn');
const indicator = document.getElementById('recording-indicator');
const timerDisplay = document.getElementById('timer');

console.log("API URL:", api_url);

// サポートされているMimeTypeを選択
function getSupportedMimeType() {
  const types = ["video/webm;codecs=vp9", "video/webm", "video/mp4"];
  for (let type of types) { if (MediaRecorder.isTypeSupported(type)) return type; }
  return "";
}

// ==============================
// 2. メイン初期化処理
// ==============================
document.addEventListener('DOMContentLoaded', function () {

  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      currentMode = e.target.value;
      const textElem = document.getElementById("translated-text");

      if (currentMode === 'server') {
        // サーバーモード切替時
        if (recordBtn) recordBtn.style.display = 'inline-block';
      } else {
        // ローカルモード切替時
        if (recordBtn) recordBtn.style.display = 'none';
      }
      textElem.innerHTML = "";
    });
  }

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });
  hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.7, minTrackingConfidence: 0.7 });

  // ここでエラーが起きていた：onResults関数の紐付け
  hands.onResults(onResults);

  async function startCamera() {
    const webcamElem = document.getElementById('webcam');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      webcamElem.srcObject = stream;
      const mimeType = getSupportedMimeType();
      mediaRecorder = new MediaRecorder(stream, { mimeType: mimeType });

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunks, { type: mimeType });
        recordedChunks = [];
        await uploadVideo(blob);
      };

      const camera = new Camera(webcamElem, {
        onFrame: async () => { await hands.send({ image: webcamElem }); },
        width: 640, height: 480
      });
      camera.start();
      startBtn.disabled = true;
      if (recordBtn) recordBtn.disabled = false;
    } catch (err) { alert("初期化失敗: " + err); }
  }

  startBtn.onclick = startCamera;
  if (recordBtn) recordBtn.onclick = startRecordingSequence;
});

// ==============================
// 3. 録画・通信ロジック
// ==============================
function startRecordingSequence() {
  recordBtn.disabled = true;

  // 3秒カウントダウン
  let count = 3;
  indicator.style.display = "block";
  indicator.style.color = "#0078D7";
  timerDisplay.textContent = `準備: ${count}`;

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) { timerDisplay.textContent = `準備: ${count}`; }
    else { clearInterval(countdownInterval); startActualRecording(); }
  }, 1000);
}

function startActualRecording() {
  recordedChunks = [];
  mediaRecorder.start();
  startTime = Date.now();
  indicator.style.color = "#ff4444";
  recordBtn.textContent = "録画中...";
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerDisplay.textContent = `録画: ${elapsed.toFixed(1)}s / ${RECORD_TIME_LIMIT}s`;
    if (elapsed >= RECORD_TIME_LIMIT) stopRecordingSequence();
  }, 100);
}

function stopRecordingSequence() {
  clearInterval(timerInterval);
  mediaRecorder.stop();
  document.getElementById('recording-indicator').style.display = "none";
  recordBtn.disabled = false;
  recordBtn.textContent = "録画開始";
}

async function uploadVideo(blob) {
  const textElem = document.getElementById("translated-text");
  textElem.innerHTML = "解析中...";
  const formData = new FormData();
  formData.append("file", blob, "capture.webm");
  try {
    const url = api_url + "predict";
    console.log("Uploading to: " + url);
    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();
    currentGesture = data.label;

    // 音声合成を呼び出す
    speakCurrentGesture();

    // 結果表示と履歴追加
    textElem.innerHTML = data.label;
    addToHistory(data.label);
  } catch (e) { textElem.innerHTML = "サーバー接続エラー"; }
}

// ==============================
// 4. MediaPipe 結果処理 (onResults)
// ==============================
function onResults(results) {
  const canvasElem = document.getElementById("cv-canvas");
  const textElem = document.getElementById("translated-text");
  const ctx = canvasElem.getContext("2d");
  ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

  if (results.image) {
    canvasElem.width = results.image.width;
    canvasElem.height = results.image.height;
  }

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    let leftHL = null, rightHL = null;
    results.multiHandLandmarks.forEach((lm, i) => {
      const label = results.multiHandedness[i].label;
      const fs = window.GestureLogic.getFingerStates(lm);
      window.GestureLogic.drawHand(ctx, lm, canvasElem.width, canvasElem.height, fs);
      if (label === 'Left') leftHL = lm; else rightHL = lm;
    });

    if (currentMode === 'local') {
      const leftG = leftHL ? window.GestureLogic.recognizeGesture(leftHL, window.GestureLogic.getFingerStates(leftHL), 'left') : null;
      const rightG = rightHL ? window.GestureLogic.recognizeGesture(rightHL, window.GestureLogic.getFingerStates(rightHL), 'right') : null;
      const combined = (leftHL && rightHL) ? window.GestureLogic.recognizeTwoHandGesture(leftHL, rightHL) : null;
      const final = combined || leftG || rightG;
      if (final) {
        currentGesture = final;
        textElem.innerHTML = currentGesture;
      }
    }
  }
}

function addToHistory(t) {
  const list = document.getElementById('history-list');
  if (!list) return;
  const li = document.createElement('li');
  li.textContent = `[${new Date().toLocaleTimeString()}] ${t}`;
  list.prepend(li);
}

window.getCurrentGesture = function () {
  return currentGesture;
};