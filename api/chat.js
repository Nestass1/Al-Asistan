// chat.js
const OpenAI = require("openai");

// API key (Vercel Environment Variables'dan)
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateReply(message) {
  try {
    if (!message || message.trim() === "") {
      return "Lütfen bir mesaj yazınız 🙂";
    }

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Sen Türkçe konuşan yardımsever bir asistansın. Samimi ama profesyonel şekilde yardımcı ol.",
        },
        { role: "user", content: message },
      ],
      temperature: 0.8,
      max_tokens: 250,
    });

    return completion.choices[0].message.content.trim();
  } catch (error) {
    console.error("❌ OpenAI API hatası:", error.message);
    return "Üzgünüm, şu anda yanıt veremiyorum 😔";
  }
}

module.exports = { generateReply };
