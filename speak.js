// speak.js - Handles text-to-speech functionality with American male voice

document.addEventListener('DOMContentLoaded', function() {
    // Attach event to 話す button
    document.getElementById("speak-btn").addEventListener("click", speakCurrentGesture);
});

function speakCurrentGesture() {
    // Cancel any ongoing speech immediately to prevent repetition
    window.speechSynthesis.cancel();
    
    const currentGesture = window.getCurrentGesture();
    
    if (!currentGesture) {
        alert("⚠️ No gesture detected to speak.");
        return;
    }
    
    const lang = document.getElementById("lang-select").value;
    
    // Clean the gesture text - remove emoji and "Gesture:" text if present
    let cleanText = currentGesture
        .replace(/^Gesture:\s*/i, '') // Remove "Gesture:" from beginning
        .replace(/\s*🖐️\s*/, '')     // Remove hand emoji
        .replace(/\s*✊\s*/, '')      // Remove fist emoji
        .replace(/\s*🤟\s*/, '')     // Remove love you emoji
        .trim();
    
    // If clean text is empty after removing everything, use the original
    if (!cleanText) {
        cleanText = currentGesture;
    }
    
    // Create speech utterance
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = lang;
    utter.pitch = 1;
    utter.rate = 1;
    
    // Try to find an American male voice
    const voices = window.speechSynthesis.getVoices(2);
    let preferredVoice = null;
    
    const preferredVoices = [
        'Microsoft David Desktop',
        'Google US English',
        'Alex',
        'Daniel',
        'en-us',
        'english',
    ];
    
    for (let voice of voices) {
        if ((voice.lang.includes('en-US') || voice.lang.includes('en_US')) && 
            !voice.name.includes('Female') && 
            !voice.name.includes('female')) {
            
            if (preferredVoices.some(pref => voice.name.includes(pref))) {
                preferredVoice = voice;
                break;
            }
            if (!preferredVoice) {
                preferredVoice = voice;
            }
        }
    }
    
    if (preferredVoice) {
        utter.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name}`);
    } else if (voices.length > 0) {
        utter.voice = voices[0];
        console.log(`Fallback voice: ${voices[0].name}`);
    }
    
    // Speak the cleaned gesture text
    window.speechSynthesis.speak(utter);
    
    // ✅ Save to history after speaking
    saveHistory(cleanText, cleanText, lang);
    
    // Handle voice loading if voices aren't immediately available
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', function() {
            const newCurrentGesture = window.getCurrentGesture();
            if (newCurrentGesture) {
                speakCurrentGesture();
            }
        });
    }
}

// Preload voices when page loads
window.speechSynthesis.getVoices();
