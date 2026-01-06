// speak.js

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("speak-btn").addEventListener("click", speakCurrentGesture);
});

function speakCurrentGesture() {
    window.speechSynthesis.cancel();
    
    const currentGesture = window.getCurrentGesture();
    if (!currentGesture) {
        alert("⚠️ ジェスチャーが検知されていません。");
        return;
    }
    
    const lang = document.getElementById("lang-select").value;
    
    // テキストのクリーニング
    let cleanText = currentGesture
        .replace(/^Gesture:\s*/i, '')
        .replace(/[🖐️✊🤟🤖]/g, '') // 絵文字を除去
        .replace(/Local:|Prediction:/g, '')
        .trim();
    
    if (!cleanText) cleanText = currentGesture;
    
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = lang;
    
    // 音声リストの取得 (引数 2 は不要)
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = null;
    
    // 男性英語音声の優先リスト
    const preferredNames = ['Microsoft David', 'Google US English', 'Alex', 'Daniel'];
    
    // 選択された言語に合う音声を検索
    preferredVoice = voices.find(v => 
        v.lang.startsWith(lang.split('-')[0]) && 
        preferredNames.some(name => v.name.includes(name))
    ) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));

    if (preferredVoice) utter.voice = preferredVoice;

    window.speechSynthesis.speak(utter);
    
    // 修正：app.js の関数名に合わせる
    if (window.addToHistory) {
        window.addToHistory(`Said: ${cleanText}`);
    }
}

// ブラウザの音声リスト読み込み待ち
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};