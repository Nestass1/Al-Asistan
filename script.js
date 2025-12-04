// public/script.js

// ✅ API endpoint — Vercel deploy uyumlu
const API_URL = "/api/chat";

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

// Gönderme olayları
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";
  appendMessage("bot", "✳️ Düşünüyorum...");

  // API’ye istek at
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  })
    .then((res) => res.json())
    .then((data) => {
      // Eski "Düşünüyorum..." mesajını kaldır
      document.querySelectorAll(".message.bot:last-child")[0].remove();
      appendMessage("bot", data.reply);
    })
    .catch(() => {
      document.querySelectorAll(".message.bot:last-child")[0].remove();
      appendMessage(
        "bot",
        "⚠️ Sunucuya ulaşılamıyor. Lütfen daha sonra tekrar deneyin."
      );
    });
}

// Sohbet kutusuna yeni mesaj ekler
function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}
