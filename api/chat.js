// chat.js

const OpenAI = require("openai");

// API key Vercel Environment Variable'dan gelir
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(message) {
  try {
    if (!message || message.trim() === "") {
      return "Lütfen bir mesaj yazın 🙂";
    }

    console.log("🔗 OpenAI API isteği gönderiliyor...");

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Sen kullanıcıya Türkçe konuşan, doğal bir kişisel yapay zekâ asistanısın. Konuşmalarında yardımsever, sıcak ama profesyonel bir ton kullan.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    return completion.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ OpenAI API hatası:", err.message);
    return fallbackReply(message);
  }
}

// Yedek mod (API hatasında geri dönüş)
function fallbackReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes("merhaba")) return "Merhaba! 👋 Nasılsın?";
  if (lower.includes("hava")) return "Bugün güneşli bir gün gibi görünüyor ☀️";
  if (lower.includes("görüşürüz")) return "Hoşça kal! 👋";
  return "Bağlantı şu anda kısıtlı, ama en kısa zamanda dönerim 💡";
}

module.exports = { generateReply };
