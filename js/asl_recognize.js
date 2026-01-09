/**
 * sign_recognition.js
 * * Pythonの学習データ作成ロジックを完全に再現した解析スクリプト
 */

// --- 1. 定数・設定 (asl_config.py と完全一致させる) ---
const ASL_CONFIG = {
    // クラスの順番は LabelEncoder の結果と一致させること
    CLASSES: [
        "Hello",
        "I_Love_You",
        "Nothing",
        "Thank_You",
        "YES",
        "NO",
        "SORRY",
        "HELP",
        "PEACE"
    ],
    LABELS: [
        "Hello",
        "I Love You",
        "Nothing",
        "Thank You",
        "Yes",
        "No",
        "Sorry",
        "Help",
        "Peace"
    ],
    T: 40,               // 固定フレーム長
    Z_SCALE: 0.3,        // Z座標の比重
    HAND_BASE_WEIGHT: 1.3, 
    // 重要ポイントの重み (IMPORTANT_LM_WEIGHTS)
    WEIGHTS: { 
        4: 1.5,  // 親指
        8: 1.3,  // 人差し指
        20: 1.5, // 小指
        12: 1.2  // 中指
    },
    PROB_THRESH: 0.85,    // 予測確率の閾値
    WIDTH: 1280,         // Pythonキャプチャ時の幅
    HEIGHT: 720          // Pythonキャプチャ時の高さ
};

// --- 2. グローバル変数 ---
let model;
let landmarkBuffer = []; 
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');

// キャンバスのサイズを 16:9 に設定
canvasElement.width = ASL_CONFIG.WIDTH;
canvasElement.height = ASL_CONFIG.HEIGHT;

/**
 * モデルの読み込み
 */
async function init() {
    try {
        statusDiv.innerText = "⏳ 読み込み中: model.json";
        // モデルのパスを環境に合わせて適宜修正してください
        model = await tf.loadLayersModel('./tfjs_model/model.json');
        statusDiv.innerText = "✅ AI Ready (1280x720)";
        startCamera();
    } catch (e) {
        statusDiv.innerText = "❌ モデル読み込み失敗: サーバー経由で起動してください";
        console.error(e);
    }
}

/**
 * 前処理 (225次元ベクトル)
 * Pythonのキャプチャコードと一言一句合わせるロジック
 */
function preprocess(results) {
    let vec = [];

    // --- 1. Pose (33点 * 3 = 99次元) ---
    if (results.poseLandmarks) {
        for (let i = 0; i < 33; i++) {
            const lm = results.poseLandmarks[i];
            // x, y はそのまま、zにZ_SCALEを適用
            vec.push(lm.x, lm.y, lm.z * ASL_CONFIG.Z_SCALE);
        }
    } else {
        vec = new Array(99).fill(0);
    }

    // --- 2. Hands (21点 * 2手 * 3 = 126次元) ---
    let handsPart = new Array(126).fill(0);
    
    // 【重要】Pythonは「左/右」ではなく「検出された順」に配列に詰めていた
    let detectedHands = [];
    if (results.leftHandLandmarks) detectedHands.push(results.leftHandLandmarks);
    if (results.rightHandLandmarks) detectedHands.push(results.rightHandLandmarks);

    // 検出された順に最大2手分を格納
    detectedHands.forEach((hand, handIdx) => {
        if (handIdx >= 2) return; // 3つ目以降の手は無視
        
        for (let i = 0; i < 21; i++) {
            const lm = hand[i];
            const weight = ASL_CONFIG.HAND_BASE_WEIGHT * (ASL_CONFIG.WEIGHTS[i] || 1.0);
            const startIdx = (handIdx * 63) + (i * 3);
            
            handsPart[startIdx]     = lm.x * weight;
            handsPart[startIdx + 1] = lm.y * weight;
            handsPart[startIdx + 2] = lm.z * ASL_CONFIG.Z_SCALE * weight;
        }
    });

    return vec.concat(handsPart);
}

/**
 * 毎フレームの処理
 */
async function onResults(results) {
    // 描画
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.restore();

    // 解析用ベクトルの作成
    const frameVec = preprocess(results);
    landmarkBuffer.push(frameVec);
    
    // Tフレーム（40）に保つ
    if (landmarkBuffer.length > ASL_CONFIG.T) {
        landmarkBuffer.shift();
    }

    // 40フレーム貯まったら推論
    if (landmarkBuffer.length === ASL_CONFIG.T) {
        // [1, 40, 225] のテンソルを作成
        const inputTensor = tf.tensor3d([landmarkBuffer]);
        
        // 推論実行
        const prediction = model.predict(inputTensor);
        const scores = await prediction.data();

        // 最大確率のクラスを特定
        const maxScoreIdx = scores.indexOf(Math.max(...scores));
        const prob = scores[maxScoreIdx];

        if (prob > ASL_CONFIG.PROB_THRESH) {
            const resultLabel = ASL_CONFIG.LABELS[maxScoreIdx];
            // Nothingクラスは非表示にする
            if (resultLabel === "Nothing") {
                resultDiv.innerText = "---";
                resultDiv.style.color = "#888";
            } else {
                resultDiv.innerText = resultLabel;
                resultDiv.style.color = "#00ff00";
            }
        }

        // メモリ解放（ブラウザ落ち対策）
        inputTensor.dispose();
        prediction.dispose();
    }
}

/**
 * カメラとMediaPipeの起動
 */
function startCamera() {
    const holistic = new Holistic({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`
    });

    holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    holistic.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await holistic.send({ image: videoElement });
        },
        width: ASL_CONFIG.WIDTH,
        height: ASL_CONFIG.HEIGHT
    });
    camera.start();
}

// 初期化実行
init();