// speak.js

// グローバルに発話オブジェクトを保持（ガベージコレクション対策）
let msg = null;

document.addEventListener('DOMContentLoaded', function () {
    const speakBtn = document.getElementById("speak-btn");
    if (speakBtn) {
        speakBtn.addEventListener("click", speakCurrentGesture);
    }
    // 初回ロードを促す
    window.speechSynthesis.getVoices();
});

async function speakCurrentGesture() {
    // 1. エンジンの状態をリセット（フリーズ対策）
    window.speechSynthesis.pause();
    window.speechSynthesis.resume();
    window.speechSynthesis.cancel();

    // 2. 音声リストの準備ができるまで最大1秒待機する関数
    const getVoicesSafe = () => {
        return new Promise((resolve) => {
            let voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                resolve(voices);
                return;
            }
            // リストが空なら、準備ができるまで待つ
            window.speechSynthesis.onvoiceschanged = () => {
                resolve(window.speechSynthesis.getVoices());
            };
            // 1秒経ってもダメなら空で返す（タイムアウト）
            setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
        });
    };

    const voices = await getVoicesSafe();
    if (voices.length === 0) {
        console.error("音声リストがロードできませんでした。");
        return;
    }

    const currentGesture = window.getCurrentGesture();
    if (!currentGesture) {
        alert("⚠️ ジェスチャーが検知されていません。");
        return;
    }

    const lang = document.getElementById("lang-select").value;
    let cleanText = currentGesture.trim();
    if (!cleanText) cleanText = currentGesture;

    // 3. 発話オブジェクトの作成
    msg = new SpeechSynthesisUtterance(cleanText + " .");
    msg.lang = lang;
    msg.rate = 0.9;
    msg.pitch = 1.0;

    // 4. 音声の選択（言語と性別）
    const preferredNames = ['Microsoft David', 'Google US English', 'Alex', 'Daniel'];
    let voice = voices.find(v =>
        v.lang.startsWith(lang.split('-')[0]) &&
        preferredNames.some(name => v.name.includes(name))
    ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));

    if (voice) msg.voice = voice;

    // 5. 実行
    setTimeout(() => {
        window.speechSynthesis.speak(msg);
        console.log("Speaking:", cleanText, "with voice:", voice ? voice.name : "default");
    }, 50);

    if (window.addToHistory) {
        window.addToHistory(`Said: ${cleanText}`);
    }
}