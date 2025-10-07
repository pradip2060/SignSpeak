// Translation functionality for SignSpeak
const translationDictionary = {
    "OK": "OK (了解)",
    "NO (upside down)": "いいえ (逆さま)",
    "I Love You 🤟": "愛してる 🤟",
    "Fist ✊": "拳 ✊"
};

// Main translation function
async function translateToJapanese() {
    const currentGesture = window.getCurrentGesture();
    
    if (!currentGesture) {
        alert("翻訳するジェスチャーが検出されていません。");
        return;
    }
    
    const translateBtn = document.getElementById('translate-btn');
    const translationResult = document.getElementById('translation-result');
    const translationText = document.getElementById('translation-text');
    
    // Show loading state
    translateBtn.disabled = true;
    translateBtn.textContent = '翻訳中...';
    translationText.innerHTML = '<span class="loading">翻訳中...</span>';
    translationResult.style.display = 'block';
    
    try {
        let translatedText;
        
        // Check if we have a predefined translation
        if (translationDictionary[currentGesture]) {
            translatedText = translationDictionary[currentGesture];
        } else {
            // Use API for unknown gestures
            translatedText = await translateText(currentGesture, 'en', 'ja');
        }
        
        translationText.innerHTML = `<strong>${translatedText}</strong>`;
        
        // Add to history
        if (window.addToHistory) {
            window.addToHistory(`翻訳: ${currentGesture} → ${translatedText}`);
        }
        
    } catch (error) {
        console.error('Translation error:', error);
        translationText.innerHTML = '<span class="error">翻訳に失敗しました。後でもう一度お試しください。</span>';
    } finally {
        // Reset button state
        translateBtn.disabled = false;
        translateBtn.textContent = '日本語に翻訳';
    }
}

// Google Translate API function
async function translateText(text, sourceLang, targetLang) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('Translation API error');
    }
    
    const data = await response.json();
    
    // Extract translated text from the response
    let translatedText = '';
    if (data && data[0]) {
        data[0].forEach(item => {
            if (item[0]) {
                translatedText += item[0];
            }
        });
    }
    
    return translatedText || text;
}

// Make functions available globally
window.translateToJapanese = translateToJapanese;
window.translateText = translateText;

console.log('translate.js loaded successfully');