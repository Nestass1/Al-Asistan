const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// FastAPI backend endpoint
const API_URL = "http://127.0.0.1:8000/chat";

// Event listeners
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Mesaj gönderme
function sendMessage() {
  const msg = userInput.value.trim();
  if (!msg) return;

  appendMessage("user", msg);
  userInput.value = "";

  // Backend’e gönder
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: msg }),
  })
    .then((res) => res.json())
    .then((data) => {
      appendMessage("bot", data.reply);
    })
    .catch(() => {
      appendMessage("bot", "⚠️ Bağlantı hatası: FastAPI sunucusu aktif mi?");
    });
}

// Mesaj ekleme
function appendMessage(sender, text) {
  const messageEl = document.createElement("div");
  messageEl.classList.add("message", sender);
  messageEl.innerText = text;
  chatBox.appendChild(messageEl);
  chatBox.scrollTop = chatBox.scrollHeight;
}
