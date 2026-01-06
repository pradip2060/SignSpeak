// 指の状態を取得
function getFingerStates(landmarks) {
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerPips = [2, 6, 10, 14, 18];
  const fingerMCPs = [1, 5, 9, 13, 17];
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  
  let states = {};
  const thumbIP = landmarks[3];
  const thumbTip = landmarks[4];
  states['Thumb'] = thumbTip.x < thumbIP.x ? 'Up' : 'Down';
  
  for (let i = 1; i < 5; i++) {
    const tip = landmarks[fingerTips[i]];
    const pip = landmarks[fingerPips[i]];
    const mcp = landmarks[fingerMCPs[i]];
    const pipToMcp = Math.abs(pip.y - mcp.y);
    
    if (tip.y < pip.y - (pipToMcp * 0.1)) {
      states[fingerNames[i]] = 'Up';
    } else {
      states[fingerNames[i]] = 'Down';
    }
  }
  return states;
}

// 片手ジェスチャー認識
function recognizeGesture(landmarks, fingerStates, handType) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const wrist = landmarks[0];

  const distThumbIndex = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
  const handSize = Math.hypot(wrist.x - middleTip.x, wrist.y - middleTip.y);
  const veryCloseThreshold = handSize * 0.08;

  if (distThumbIndex < veryCloseThreshold && fingerStates.Middle === "Up" && fingerStates.Ring === "Up" && fingerStates.Pinky === "Up") return "OK";
  if (fingerStates.Thumb === "Up" && fingerStates.Index === "Up" && fingerStates.Pinky === "Up" && fingerStates.Middle === "Down" && fingerStates.Ring === "Down") return "I Love You";
  if (fingerStates.Index === "Down" && fingerStates.Middle === "Down" && fingerStates.Ring === "Down" && fingerStates.Pinky === "Down") return "Fist (No/Stop)";
  if (fingerStates.Thumb === "Up" && fingerStates.Index === "Up" && fingerStates.Middle === "Up" && fingerStates.Ring === "Up" && fingerStates.Pinky === "Up") return "Hello/Hi";
  if (fingerStates.Thumb === "Up" && fingerStates.Index === "Down" && fingerStates.Middle === "Down" && fingerStates.Ring === "Down" && fingerStates.Pinky === "Down") return "Yes/Good";
  if (fingerStates.Index === "Up" && fingerStates.Middle === "Up" && fingerStates.Ring === "Down" && fingerStates.Pinky === "Down") return "Peace/Victory";

  return null;
}

// 両手ジェスチャー認識
function recognizeTwoHandGesture(leftLandmarks, rightLandmarks) {
  const leftWrist = leftLandmarks[0];
  const rightWrist = rightLandmarks[0];
  const distBetweenHands = Math.hypot(leftWrist.x - rightWrist.x, leftWrist.y - rightWrist.y);

  if (distBetweenHands < 0.2) {
    const leftFS = getFingerStates(leftLandmarks);
    const rightFS = getFingerStates(rightLandmarks);
    if (leftFS.Index === "Up" && rightFS.Index === "Up") return "Pray/Heart";
  }
  return null;
}

// 手の描画
function drawHand(ctx, landmarks, w, h, fingerStates) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17]
  ];
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#FF0000";
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  });
  for (let i = 0; i < landmarks.length; i++) {
    ctx.beginPath();
    ctx.arc(landmarks[i].x * w, landmarks[i].y * h, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
  }
}

// グローバルに公開
window.GestureLogic = { getFingerStates, recognizeGesture, recognizeTwoHandGesture, drawHand };