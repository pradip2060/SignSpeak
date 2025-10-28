// Sentence Builder for ASL Communication
class SentenceBuilder {
    constructor() {
        this.currentSentence = '';
        this.sentenceHistory = [];
        this.maxHistoryLength = 10;
    }

    addLetter(letter) {
        this.currentSentence += letter;
        this.updateDisplay();
        return this.currentSentence;
    }

    addSpace() {
        this.currentSentence += ' ';
        this.updateDisplay();
        return this.currentSentence;
    }

    clear() {
        this.saveToHistory();
        this.currentSentence = '';
        this.updateDisplay();
        return '';
    }

    saveToHistory() {
        if (this.currentSentence.trim()) {
            this.sentenceHistory.push({
                sentence: this.currentSentence,
                timestamp: new Date().toLocaleString()
            });
            
            // Keep only recent history
            if (this.sentenceHistory.length > this.maxHistoryLength) {
                this.sentenceHistory.shift();
            }
        }
    }

    updateDisplay() {
        const displayElement = document.getElementById('current-sentence');
        if (displayElement) {
            displayElement.textContent = this.currentSentence || '文章がここに表示されます';
            
            // Add visual feedback
            if (this.currentSentence) {
                displayElement.style.background = '#e8f5e8';
                displayElement.style.borderColor = '#4caf50';
            } else {
                displayElement.style.background = 'white';
                displayElement.style.borderColor = '#ddd';
            }
        }
    }

    getSentence() {
        return this.currentSentence;
    }

    getHistory() {
        return this.sentenceHistory;
    }
}

// Common phrases for non-verbal communication
const commonPhrases = {
    // Basic needs
    'HUNGRY': 'お腹が空きました',
    'THIRSTY': '水をください',
    'BATHROOM': 'トイレに行きたい',
    'PAIN': '痛いです',
    'HELP': '助けてください',
    'SICK': '気分が悪い',
    
    // Basic responses
    'YES': 'はい',
    'NO': 'いいえ',
    'THANK YOU': 'ありがとう',
    'SORRY': 'ごめんなさい',
    
    // Emotions
    'HAPPY': '嬉しい',
    'SAD': '悲しい',
    'ANGRY': '怒っています',
    'SCARED': '怖い',
    
    // Requests
    'CALL FAMILY': '家族に連絡してください',
    'DOCTOR': '医者を呼んでください',
    'HOME': '家に帰りたい',
    'REST': '休みたい'
};

// Initialize sentence builder
const sentenceBuilder = new SentenceBuilder();

// Make functions available globally
window.sentenceBuilder = sentenceBuilder;
window.commonPhrases = commonPhrases;

console.log('Sentence builder loaded');