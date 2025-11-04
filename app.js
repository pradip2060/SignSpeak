// Gesture detection and hand tracking logic
let cvReady = false;
let currentGesture = null;
let currentLeftGesture = null;
let currentRightGesture = null;
let isDebug = false;
const SEND_INTERVAL = 2000;
let lastSentTime = 0;

let currentMode = 'local';

if (typeof cv !== 'undefined') {
  cv['onRuntimeInitialized'] = () => { cvReady = true; };
}

document.addEventListener('DOMContentLoaded', function () {
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect) {
    modeSelect.addEventListener('change', (e) => {
      currentMode = e.target.value;
      addToHistory(`Mode changed to: ${currentMode}`);
    });
  }

  document.getElementById('start-btn').onclick = startCamera;

  const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.7, // Increased for better accuracy
    minTrackingConfidence: 0.7,  // Increased for better accuracy
  });

  hands.onResults(onResults);

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

function getFingerStates(landmarks) {
  const fingerTips = [4, 8, 12, 16, 20];
  const fingerPips = [2, 6, 10, 14, 18];
  const fingerMCPs = [1, 5, 9, 13, 17]; // Knuckles for better thumb detection
  const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
  
  let states = {};
  
  // Improved thumb detection
  const thumbIP = landmarks[3];
  const thumbTip = landmarks[4];
  states['Thumb'] = thumbTip.x < thumbIP.x ? 'Up' : 'Down';
  
  // Improved finger detection with better thresholds
  for (let i = 1; i < 5; i++) {
    const tip = landmarks[fingerTips[i]];
    const pip = landmarks[fingerPips[i]];
    const mcp = landmarks[fingerMCPs[i]];
    
    // More accurate finger state detection
    const tipToPip = Math.abs(tip.y - pip.y);
    const pipToMcp = Math.abs(pip.y - mcp.y);
    
    // Use relative position with adaptive threshold
    if (tip.y < pip.y - (pipToMcp * 0.1)) {
      states[fingerNames[i]] = 'Up';
    } else {
      states[fingerNames[i]] = 'Down';
    }
  }
  
  return states;
}

function onResults(results) {
  const textElem = document.getElementById("translated-text");
  const canvasElem = document.getElementById("cv-canvas");
  const ctx = canvasElem.getContext("2d");
  
  // Clear canvas properly
  ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
  
  // Set canvas dimensions to match video
  if (results.image) {
    canvasElem.width = results.image.width;
    canvasElem.height = results.image.height;
  }

  currentLeftGesture = null;
  currentRightGesture = null;
  
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const hands = results.multiHandLandmarks.length;
    const handedness = results.multiHandedness;
    
    let leftHandLandmarks = null;
    let rightHandLandmarks = null;
    
    for (let i = 0; i < hands; i++) {
      if (handedness[i].label === 'Left') {
        leftHandLandmarks = results.multiHandLandmarks[i];
      } else if (handedness[i].label === 'Right') {
        rightHandLandmarks = results.multiHandLandmarks[i];
      }
    }
    
    if (currentMode === 'local') {
      let combinedGesture = null;
      
      if (leftHandLandmarks) {
        const leftFingerStates = getFingerStates(leftHandLandmarks);
        currentLeftGesture = recognizeGesture(leftHandLandmarks, leftFingerStates, 'left');
        drawHand(ctx, leftHandLandmarks, canvasElem.width, canvasElem.height, leftFingerStates);
      }
      
      if (rightHandLandmarks) {
        const rightFingerStates = getFingerStates(rightHandLandmarks);
        currentRightGesture = recognizeGesture(rightHandLandmarks, rightFingerStates, 'right');
        drawHand(ctx, rightHandLandmarks, canvasElem.width, canvasElem.height, rightFingerStates);
      }
      
      if (leftHandLandmarks && rightHandLandmarks) {
        combinedGesture = recognizeTwoHandGesture(leftHandLandmarks, rightHandLandmarks);
      }
      
      const finalGesture = combinedGesture || currentLeftGesture || currentRightGesture;
      handleRecognizedGesture(finalGesture, ctx, canvasElem);
      
    } else if (currentMode === 'server') {
      const now = Date.now();
      if (now - lastSentTime > SEND_INTERVAL) {
        lastSentTime = now;
        sendFrameToServer(canvasElem)
          .then(gesture => handleRecognizedGesture(gesture, ctx, canvasElem))
          .catch(err => {
            console.error('Server recognition failed:', err);
            textElem.innerHTML = "<em>Server recognition error...</em>";
          });
      } else {
        if (leftHandLandmarks) {
          const leftFingerStates = getFingerStates(leftHandLandmarks);
          drawHand(ctx, leftHandLandmarks, canvasElem.width, canvasElem.height, leftFingerStates);
        }
        if (rightHandLandmarks) {
          const rightFingerStates = getFingerStates(rightHandLandmarks);
          drawHand(ctx, rightHandLandmarks, canvasElem.width, canvasElem.height, rightFingerStates);
        }
      }
    }
  } else {
    currentGesture = null;
    textElem.innerHTML = "<em>Looking for hands...</em>";
  }
}

function handleRecognizedGesture(gesture, ctx, canvasElem) {
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
      let debugText = "No known gesture...";
      if (currentLeftGesture) debugText += ` Left: ${currentLeftGesture}`;
      if (currentRightGesture) debugText += ` Right: ${currentRightGesture}`;
      textElem.innerHTML = `<em>${debugText}</em>`;
    } else {
      textElem.innerHTML = "<em>No known gesture...</em>";
    }
  }
}

function drawHand(ctx, landmarks, w, h, fingerStates) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],           // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],           // Index
    [0, 9], [9, 10], [10, 11], [11, 12],      // Middle
    [0, 13], [13, 14], [14, 15], [15, 16],    // Ring
    [0, 17], [17, 18], [18, 19], [19, 20],    // Pinky
    [5, 9], [9, 13], [13, 17]                 // Palm
  ];
  
  // Improved drawing with smaller, more precise elements
  ctx.lineWidth = 2; // Thinner lines
  ctx.strokeStyle = "#FF0000";
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Draw connections
  connections.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(landmarks[a].x * w, landmarks[a].y * h);
    ctx.lineTo(landmarks[b].x * w, landmarks[b].y * h);
    ctx.stroke();
  });
  
  // Draw landmarks with different sizes based on importance
  for (let i = 0; i < landmarks.length; i++) {
    const px = landmarks[i].x * w;
    const py = landmarks[i].y * h;
    
    let dotSize = 3; // Much smaller default dots
    
    // Key points get slightly larger dots
    if (i === 0) dotSize = 4; // Palm base
    if (i === 4 || i === 8 || i === 12 || i === 16 || i === 20) dotSize = 4; // Finger tips
    
    ctx.beginPath();
    ctx.arc(px, py, dotSize, 0, 2 * Math.PI);
    
    ctx.fillStyle = "#FF0000";
    ctx.fill();
    
    // Optional: Add subtle white border for better visibility
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
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

function recognizeGesture(landmarks, fingerStates, handType) {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // Calculate more accurate distances
  const distThumbIndex = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) + 
    Math.pow(thumbTip.y - indexTip.y, 2)
  );
  
  const distThumbMiddle = Math.sqrt(
    Math.pow(thumbTip.x - middleTip.x, 2) + 
    Math.pow(thumbTip.y - middleTip.y, 2)
  );
  
  const distIndexMiddle = Math.sqrt(
    Math.pow(indexTip.x - middleTip.x, 2) + 
    Math.pow(indexTip.y - middleTip.y, 2)
  );

  // Improved gesture recognition with better thresholds
  const handSize = Math.sqrt(
    Math.pow(wrist.x - middleTip.x, 2) + 
    Math.pow(wrist.y - middleTip.y, 2)
  );

  // Use relative thresholds based on hand size
  const closeThreshold = handSize * 0.15;
  const veryCloseThreshold = handSize * 0.08;

  // Gesture recognition with improved logic
  if (distThumbIndex < veryCloseThreshold && 
      fingerStates.Middle === "Up" && 
      fingerStates.Ring === "Up" && 
      fingerStates.Pinky === "Up") {
    return "OK";
  }

  if (fingerStates.Thumb === "Up" && 
      fingerStates.Index === "Up" && 
      fingerStates.Pinky === "Up" && 
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down") {
    return "I Love You";
  }

  if (fingerStates.Index === "Down" && 
      fingerStates.Middle === "Down" &&
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down") {
    return "Fist (No/Stop)";
  }

  if (fingerStates.Thumb === "Up" && 
      fingerStates.Index === "Up" &&
      fingerStates.Middle === "Up" && 
      fingerStates.Ring === "Up" && 
      fingerStates.Pinky === "Up") {
    return "Hello/Hi";
  }

  if (fingerStates.Thumb === "Up" && 
      fingerStates.Index === "Down" && 
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down") {
    return "Yes/Good";
  }

  if (fingerStates.Thumb === "Down" && 
      fingerStates.Index === "Down" && 
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down") {
    return "No/Bad";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Middle === "Up" &&
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down" && 
      fingerStates.Thumb === "Down") {
    return "Peace/Victory";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Middle === "Down" &&
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down") {
    return "Point/You";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Middle === "Up" &&
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down" && 
      fingerStates.Thumb === "Up") {
    return "Thank You";
  }

  if (fingerStates.Pinky === "Up" && 
      fingerStates.Thumb === "Up" &&
      fingerStates.Index === "Down" && 
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down") {
    return "Call Me";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Pinky === "Up" &&
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down" && 
      fingerStates.Thumb === "Up") {
    return "Rock On";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Middle === "Up" && 
      fingerStates.Ring === "Up" && 
      fingerStates.Thumb === "Down" && 
      fingerStates.Pinky === "Down") {
    return "Three";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Middle === "Up" && 
      fingerStates.Ring === "Up" && 
      fingerStates.Pinky === "Up" && 
      fingerStates.Thumb === "Down") {
    return "Four";
  }

  if (distThumbMiddle < closeThreshold && 
      fingerStates.Index === "Up" && 
      fingerStates.Middle === "Up" && 
      fingerStates.Ring === "Up") {
    return "Spider-man";
  }

  if (fingerStates.Index === "Up" && 
      fingerStates.Thumb === "Up" &&
      fingerStates.Middle === "Down" && 
      fingerStates.Ring === "Down" && 
      fingerStates.Pinky === "Down") {
    return "Gun";
  }

  return null;
}

function recognizeTwoHandGesture(leftLandmarks, rightLandmarks) {
  const leftFingerStates = getFingerStates(leftLandmarks);
  const rightFingerStates = getFingerStates(rightLandmarks);
  
  const leftIndexTip = leftLandmarks[8];
  const rightIndexTip = rightLandmarks[8];
  const leftWrist = leftLandmarks[0];
  const rightWrist = rightLandmarks[0];
  
  const distBetweenHands = Math.sqrt(
    Math.pow(leftWrist.x - rightWrist.x, 2) + 
    Math.pow(leftWrist.y - rightWrist.y, 2)
  );
  
  const distLeftRightIndex = Math.sqrt(
    Math.pow(leftIndexTip.x - rightIndexTip.x, 2) + 
    Math.pow(leftIndexTip.y - rightIndexTip.y, 2)
  );

  // Two hand gestures with improved thresholds
  if (distBetweenHands < 0.2 && 
      leftFingerStates.Index === "Up" && 
      rightFingerStates.Index === "Up" &&
      leftFingerStates.Middle === "Up" && 
      rightFingerStates.Middle === "Up") {
    return "Pray/Thank You";
  }

  if (distLeftRightIndex < 0.08 && 
      leftFingerStates.Index === "Up" && 
      rightFingerStates.Index === "Up" &&
      leftFingerStates.Thumb === "Up" && 
      rightFingerStates.Thumb === "Up") {
    return "Heart/Love";
  }

  if (distBetweenHands < 0.15 && 
      leftFingerStates.Index === "Up" && 
      rightFingerStates.Index === "Up" &&
      leftFingerStates.Middle === "Up" && 
      rightFingerStates.Middle === "Up") {
    return "Clap/Applaud";
  }

  if (distBetweenHands < 0.1 && 
      leftFingerStates.Index === "Up" && 
      rightFingerStates.Index === "Up") {
    return "Handshake/Agree";
  }

  if (leftFingerStates.Index === "Up" && 
      leftFingerStates.Middle === "Up" &&
      leftFingerStates.Ring === "Up" && 
      leftFingerStates.Pinky === "Up" &&
      rightFingerStates.Index === "Up" && 
      rightFingerStates.Middle === "Up" &&
      rightFingerStates.Ring === "Up" && 
      rightFingerStates.Pinky === "Up" &&
      distBetweenHands < 0.3) {
    return "Welcome/Open";
  }

  if (leftFingerStates.Thumb === "Up" && 
      rightFingerStates.Thumb === "Down" &&
      leftFingerStates.Index === "Down" && 
      rightFingerStates.Index === "Down") {
    return "Mixed/Unsure";
  }

  return null;
}

// Make functions available globally
window.getCurrentGesture = function () {
  return currentGesture;
};

window.getLeftGesture = function () {
  return currentLeftGesture;
};

window.getRightGesture = function () {
  return currentRightGesture;
};

window.addToHistory = addToHistory;

// Connect translate button
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    const translateBtn = document.getElementById('translate-btn');
    if (translateBtn && window.translateToJapanese) {
      translateBtn.onclick = window.translateToJapanese;
    } else {
      translateBtn.onclick = function () {
        const gesture = window.getCurrentGesture();
        if (!gesture) {
          alert("No gesture detected for translation.");
          return;
        }
        alert("Loading translation function...");
      };
    }
  }, 100);
});

// Server mode function
async function sendFrameToServer(canvasElem) {
  const videoElem = document.getElementById('webcam');

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = videoElem.videoWidth || 640;
  tempCanvas.height = videoElem.videoHeight || 480;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(videoElem, 0, 0, tempCanvas.width, tempCanvas.height);

  const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg', 0.9));
  const formData = new FormData();
  formData.append('file', blob, 'frame.jpg');

  const url = "http://127.0.0.1:8000/predict";
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) throw new Error('Network error');
  const data = await response.json();

  return data.label || null;
}