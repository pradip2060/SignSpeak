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
    
    // Look for American English male voices
    const preferredVoices = [
        'Microsoft David Desktop', // Windows - American male
        'Google US English',       // Chrome - American
        'Alex',                    // Safari - American male
        'Daniel',                  // Edge - Male voice
        'en-us',                   // Generic US English
        'english',                 // Generic English
    ];
    
    for (let voice of voices) {
        // Check if voice matches our preferred list and is American English
        if ((voice.lang.includes('en-US') || voice.lang.includes('en_US')) && 
            !voice.name.includes('Female') && 
            !voice.name.includes('female')) {
            
            // Check if it's one of our preferred voices
            if (preferredVoices.some(pref => voice.name.includes(pref))) {
                preferredVoice = voice;
                break;
            }
            
            // If no preferred voice found yet, take any American male voice
            if (!preferredVoice) {
                preferredVoice = voice;
            }
        }
    }
    
    // If we found a preferred voice, use it
    if (preferredVoice) {
        utter.voice = preferredVoice;
        console.log(`Using voice: ${preferredVoice.name}`);
    } else if (voices.length > 0) {
        // Fallback to first available voice
        utter.voice = voices[0];
        console.log(`Fallback voice: ${voices[0].name}`);
    }
    
    // Speak the cleaned gesture text only once
    window.speechSynthesis.speak(utter);
    
    // Handle voice loading if voices aren't immediately available
    if (speechSynthesis.getVoices().length === 0) {
        speechSynthesis.addEventListener('voiceschanged', function() {
            // Re-run the function when voices are loaded
            const newCurrentGesture = window.getCurrentGesture();
            if (newCurrentGesture) {
                speakCurrentGesture();
            }
        });
    }
}

// Preload voices when page loads
window.speechSynthesis.getVoices();