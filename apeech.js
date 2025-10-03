function speakText() {
  const text = document.getElementById("translated-text").textContent;
  const utterance = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utterance);
}
