// api/chat.js - Kütüphanesiz, Saf ve Kesin Bağlantı

export default async function handler(req, res) {
    // 1. CORS İzinleri (Tarayıcı erişimi için)
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { message, file, history } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) throw new Error("API Anahtarı Vercel ayarlarında bulunamadı.");

        // --- MANUEL İÇERİK HAZIRLAMA ---
        // SDK kullanmadan, doğrudan Google'ın anladığı JSON'u elle yapıyoruz.
        
        let contents = [];

        // 1. Geçmişi Ekle
        if (history && Array.isArray(history)) {
            history.forEach(msg => {
                contents.push({
                    role: (msg.role === 'user') ? 'user' : 'model',
                    parts: msg.parts 
                });
            });
        }

        // 2. Yeni Mesaj ve Dosyayı Ekle
        let currentParts = [];

        // Dosya varsa
        if (file && file.data) {
            currentParts.push({
                inline_data: {
                    mime_type: file.mimeType || 'application/pdf',
                    data: file.data
                }
            });
        }

        // Metin varsa
        if (message) {
            currentParts.push({ text: message });
        }

        // Güncel isteği pakete ekle
        contents.push({
            role: 'user',
            parts: currentParts
        });

        // 3. Sistem Talimatı (System Instruction)
        // Modelin nasıl davranacağını belirler.
        const systemInstruction = {
            role: "user", 
            parts: [{ text: "SYSTEM: Sen yardımsever, kod yazabilen ve dosya okuyabilen profesyonel bir AI asistanısın. Cevapları Türkçe ver. Kod yazarken mutlaka Markdown formatı (```dil...```) kullan. Dosya içeriğini okuyabilirsin, asla 'metni yapıştır' deme." }]
        };
        // Hile: Sistem talimatını sohbetin en başına 'user' mesajı gibi ekliyoruz, bu her zaman çalışır.
        contents.unshift(systemInstruction);


        // --- DOĞRUDAN API ÇAĞRISI ---
        // İşte sihir burada: v1beta adresini elle yazıyoruz. Hata şansı yok.
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: contents })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }
        
        // Cevabı temizle ve gönder
        let replyText = "";
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
            replyText = data.candidates[0].content.parts.map(p => p.text).join('');
        } else {
            replyText = "Boş yanıt alındı.";
        }

        res.status(200).json({ response: replyText });

    } catch (error) {
        console.error("SERVER HATASI:", error);
        res.status(500).json({ 
            // Hatayı gizlemiyoruz, direkt gösteriyoruz
            message: `BAĞLANTI HATASI: ${error.message}` 
        });
    }
}