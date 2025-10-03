const videoElement = document.getElementById('webcam');
const translatedText = document.getElementById('translated-text');

const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({ image: videoElement });
  },
  width: 640,
  height: 480,
});
camera.start();

function onResults(results) {
  if (results.multiHandLandmarks.length > 0) {
    // 🔍 Here, you will later check landmarks and classify gestures
    translatedText.textContent = "✋ Hand Detected!";
  } else {
    translatedText.textContent = "...";
  }
}
function onResults(results) {
  if (results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    
    // If thumb and index fingertips are close = "OK" sign
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 0.05) {
      translatedText.textContent = "OK";
    } else {
      translatedText.textContent = "✋ Hand Detected!";
    }
  } else {
    translatedText.textContent = "...";
  }
}
