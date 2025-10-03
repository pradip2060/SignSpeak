// history.js - Handles database operations

document.addEventListener('DOMContentLoaded', function() {
    // Attach event to 履歴 button
    document.getElementById("history-btn").addEventListener("click", handleHistory);
});

// Handle history button click
async function handleHistory() {
    try {
        console.log('Loading history from database...');
        
        const response = await fetch('get_history.php');
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const result = await response.text();
        console.log('Raw response:', result);
        
        // Check if response is valid JSON
        let history;
        try {
            history = JSON.parse(result);
        } catch (e) {
            throw new Error('Invalid JSON response from server');
        }
        
        // Check if it's an error response
        if (history.error) {
            throw new Error(history.error);
        }
        
        displayDatabaseHistory(history);
        
    } catch (error) {
        console.error('Error loading history:', error);
        alert("エラー: " + error.message);
    }
}

// Display history from database
function displayDatabaseHistory(history) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (!Array.isArray(history)) {
        historyList.innerHTML = '<li>データベース応答が不正です</li>';
        return;
    }
    
    if (history.length === 0) {
        historyList.innerHTML = '<li>データベースに履歴がありません</li>';
        return;
    }
    
    history.forEach(item => {
        const li = document.createElement('li');
        const date = new Date(item.timestamp).toLocaleString('ja-JP');
        li.textContent = `${date}: ${item.text}`;
        historyList.appendChild(li);
    });
}

// Function to save current gesture to database
async function saveCurrentGestureToDatabase() {
    const currentGesture = window.getCurrentGesture();
    
    if (!currentGesture) {
        return;
    }
    
    try {
        const response = await fetch('save_history.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: `Gesture: ${currentGesture}`,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.text();
        console.log('Save result:', result);
        
    } catch (error) {
        console.error('Error saving to database:', error);
    }
}

// Make save function available globally
window.saveCurrentGestureToDatabase = saveCurrentGestureToDatabase;