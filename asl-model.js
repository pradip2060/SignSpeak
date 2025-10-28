// ASL Model Integration - Compatible with Index.html
class ASLRecognizer {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.aslAlphabet = {
            // Focus on most common and distinct ASL letters
            'A': this.detectA,
            'B': this.detectB,
            'C': this.detectC,
            'D': this.detectD,
            'E': this.detectE,
            'F': this.detectF,
            'G': this.detectG,
            'H': this.detectH,
            'I': this.detectI,
            'K': this.detectK,
            'L': this.detectL,
            'O': this.detectO,
            'V': this.detectV,
            'W': this.detectW,
            'Y': this.detectY
        };
        this.lastDetection = null;
        this.detectionCooldown = false;
    }

    // Initialize the model
    async initialize() {
        try {
            console.log('Loading ASL recognition...');
            this.isModelLoaded = true;
            return true;
        } catch (error) {
            console.error('ASL Model initialization failed:', error);
            return false;
        }
    }

    // Main detection function
    detectASL(landmarks) {
        if (!this.isModelLoaded || this.detectionCooldown) return null;

        const fingerStates = this.getFingerStates(landmarks);
        let bestMatch = null;
        let highestConfidence = 0;

        // Check each ASL letter
        for (const [letter, detector] of Object.entries(this.aslAlphabet)) {
            const confidence = detector.call(this, fingerStates, landmarks);
            if (confidence > highestConfidence && confidence > 0.6) {
                highestConfidence = confidence;
                bestMatch = letter;
            }
        }

        // Apply cooldown to prevent rapid changes
        if (bestMatch && bestMatch !== this.lastDetection) {
            this.detectionCooldown = true;
            setTimeout(() => {
                this.detectionCooldown = false;
            }, 800);
            this.lastDetection = bestMatch;
        }

        return bestMatch ? { letter: bestMatch, confidence: highestConfidence } : null;
    }

    // Use SAME finger state detection as index.html
    getFingerStates(landmarks) {
        const fingerTips = [4, 8, 12, 16, 20];
        const fingerPips = [2, 6, 10, 14, 18];
        const fingerNames = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
        
        let states = {};
        
        // Use EXACTLY the same logic as index.html
        states['Thumb'] = landmarks[4].x > landmarks[3].x ? 'Up' : 'Down';
        for (let i = 1; i < 5; i++) {
            states[fingerNames[i]] = landmarks[fingerTips[i]].y < landmarks[fingerPips[i]].y ? 'Up' : 'Down';
        }
        
        return states;
    }

    // Simplified ASL Letter Detection Functions

    detectA(states, landmarks) {
        // A: Thumb out, other fingers folded
        if (states.Thumb === 'Up' && 
            states.Index === 'Down' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            return 0.9;
        }
        return 0;
    }

    detectB(states, landmarks) {
        // B: All fingers extended, thumb folded
        if (states.Thumb === 'Down' && 
            states.Index === 'Up' && 
            states.Middle === 'Up' && 
            states.Ring === 'Up' && 
            states.Pinky === 'Up') {
            return 0.9;
        }
        return 0;
    }

    detectC(states, landmarks) {
        // C: Curved hand shape
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        if (distance > 0.08 && distance < 0.15 && 
            states.Thumb === 'Up' && 
            states.Index === 'Up') {
            return 0.8;
        }
        return 0;
    }

    detectD(states, landmarks) {
        // D: Index finger up, others folded
        if (states.Index === 'Up' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            return 0.85;
        }
        return 0;
    }

    detectE(states, landmarks) {
        // E: All fingers folded (fist)
        if (states.Thumb === 'Down' && 
            states.Index === 'Down' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            return 0.8;
        }
        return 0;
    }

    detectF(states, landmarks) {
        // F: Thumb and index touching (OK sign)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        if (distance < 0.05 && 
            states.Index === 'Up' && 
            states.Middle === 'Up') {
            return 0.8;
        }
        return 0;
    }

    detectG(states, landmarks) {
        // G: Index pointing
        if (states.Index === 'Up' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            return 0.85;
        }
        return 0;
    }

    detectH(states, landmarks) {
        // H: Index and middle extended together
        if (states.Index === 'Up' && 
            states.Middle === 'Up' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            
            // Check if index and middle are close together
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const dist = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
            
            if (dist < 0.05) {
                return 0.9;
            }
        }
        return 0;
    }

    detectI(states, landmarks) {
        // I: Pinky extended, others folded
        if (states.Pinky === 'Up' && 
            states.Index === 'Down' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down') {
            return 0.9;
        }
        return 0;
    }

    detectK(states, landmarks) {
        // K: Index and middle extended with thumb
        if (states.Index === 'Up' && 
            states.Middle === 'Up' && 
            states.Thumb === 'Up') {
            return 0.8;
        }
        return 0;
    }

    detectL(states, landmarks) {
        // L: Index and thumb extended, forming L
        if (states.Index === 'Up' && 
            states.Thumb === 'Up' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            return 0.9;
        }
        return 0;
    }

    detectO(states, landmarks) {
        // O: All fingers curved to touch thumb
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        if (distance < 0.05 && 
            states.Index === 'Up') {
            return 0.8;
        }
        return 0;
    }

    detectV(states, landmarks) {
        // V: Index and middle extended and spread apart (peace sign)
        if (states.Index === 'Up' && 
            states.Middle === 'Up' && 
            states.Ring === 'Down' && 
            states.Pinky === 'Down') {
            
            const indexTip = landmarks[8];
            const middleTip = landmarks[12];
            const dist = Math.hypot(indexTip.x - middleTip.x, indexTip.y - middleTip.y);
            
            if (dist > 0.08) { // Spread apart
                return 0.9;
            }
        }
        return 0;
    }

    detectW(states, landmarks) {
        // W: Index, middle, and ring fingers extended
        if (states.Index === 'Up' && 
            states.Middle === 'Up' && 
            states.Ring === 'Up' && 
            states.Pinky === 'Down') {
            return 0.85;
        }
        return 0;
    }

    detectY(states, landmarks) {
        // Y: Thumb and pinky extended, other fingers folded
        if (states.Thumb === 'Up' && 
            states.Pinky === 'Up' && 
            states.Index === 'Down' && 
            states.Middle === 'Down' && 
            states.Ring === 'Down') {
            return 0.9;
        }
        return 0;
    }
}

// Global instance
const aslRecognizer = new ASLRecognizer();

// Initialize ASL model
async function initializeASLModel() {
    console.log('Initializing ASL recognition...');
    const success = await aslRecognizer.initialize();
    if (success) {
        console.log('ASL recognition ready!');
    } else {
        console.log('ASL recognition failed to initialize');
    }
    return success;
}

// Detect ASL gesture
function detectASLGesture(landmarks) {
    return aslRecognizer.detectASL(landmarks);
}

// Make available globally
window.initializeASLModel = initializeASLModel;
window.detectASLGesture = detectASLGesture;