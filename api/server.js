// api/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { generateReply } = require("../chat"); // chat.js kök dizinde

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await generateReply(message);
    res.json({ reply });
  } catch (err) {
    console.error("❌ API Hatası:", err);
    res
      .status(500)
      .json({ reply: "Sunucuda bir sorun oluştu. Lütfen tekrar deneyin." });
  }
});

// Vercel otomatik çalıştırdığı için burada export yapıyoruz
module.exports = app;

// Lokal geliştirme için isteğe bağlı
if (require.main === module) {
  const PORT = 8000;
  app.listen(PORT, () =>
    console.log(`🚀 Local geliştirme sunucusu: http://localhost:${PORT}`)
  );
}
