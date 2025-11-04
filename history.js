async function addToHistory() {
    console.log("Saving history...");
    try {
        const gesture_text = document.getElementById('gesture-text').innerText || '';
        const translated_text = document.getElementById('translation-text')?.innerText || '';
        const lang_code = '';

        const sendData = {
            gesture_text,
            translated_text,
            lang_code,
        }
        console.log(gesture_text, translated_text, lang_code);
        const response = await fetch('./api/history/save.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sendData)
        });

        const data = await response.json();
        if (!data.success) {
            console.error("Failed to save history:", data.message);
        }
    } catch (err) {
        console.error("Error saving history:", err);
    }
}

async function loadHistory() {
    try {
        const response = await fetch('get_history.php');
        const data = await response.json();

        const list = document.getElementById('history-list');
        list.innerHTML = '';

        if (data.success && data.data.length > 0) {
            data.data.forEach(item => {
                const li = document.createElement('li');
                li.textContent = `${item.action} (${item.created_at})`;
                list.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = "No history yet.";
            list.appendChild(li);
        }
    } catch (err) {
        console.error("Error loading history:", err);
    }
}

// Attach to window
// window.loadHistory = loadHistory;


const historyBtn = document.getElementById('history-save-btn');
if (historyBtn) {
    historyBtn.addEventListener('click', addToHistory);
}