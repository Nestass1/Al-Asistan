document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const fileUploadInput = document.getElementById('file-upload-input');
    let uploadedFileBase64 = null;
    let uploadedFileName = null;
    const CHAT_STORAGE_KEY = 'ai_chat_history';

    // --- YARDIMCI FONKSİYONLAR ---
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const getContextMessages = () => {
        const chatElements = Array.from(chatBox.children);
        const recentElements = chatElements.slice(-10);
        const context = [];
        recentElements.forEach(el => {
            if (el.classList.contains('typing-indicator') || el.id === 'attach-status') return;
            const sender = el.classList.contains('user-message') ? 'user' : 'model';
            context.push({ role: sender, parts: [{ text: el.innerText }] });
        });
        return context;
    };

    const highlightCodeBlocks = (htmlContent) => {
        const regex = /```(\w+)?\n([\s\S]*?)```/g;
        let processed = htmlContent.replace(regex, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'plaintext'}">${code.replace(/</g, '&lt;').trim()}</code></pre>`;
        });
        setTimeout(() => {
            document.querySelectorAll('pre code').forEach((block) => {
                if (typeof hljs !== 'undefined') hljs.highlightElement(block);
            });
        }, 50);
        return processed;
    };

    const copyMessage = (text) => {
        navigator.clipboard.writeText(text).then(() => alert('Kopyalandı!')).catch(err => console.error(err));
    };

    // --- MESAJ GÖRSELLEŞTİRME ---
    const addMessage = (text, sender, isTyping = false) => {
        const div = document.createElement('div');
        div.classList.add('message', `${sender}-message`);
        // CSS Gecikmesini engellemek için anında görünür yapıyoruz
        div.style.opacity = "1"; 
        
        if (!isTyping) {
            div.innerHTML = text.replace(/\n/g, '<br>');
            if (sender === 'ai') {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                copyBtn.onclick = () => copyMessage(div.innerText);
                div.appendChild(copyBtn);
                div.classList.add('has-copy-btn');
            }
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        } else {
            chatBox.appendChild(div);
        }
        return div;
    };

    const typeMessage = (text, element) => {
        let i = 0;
        const speed = 20;
        // Görünürlüğü garanti et
        element.style.opacity = "1";
        
        const interval = setInterval(() => {
            element.textContent += text.charAt(i);
            i++;
            chatBox.scrollTop = chatBox.scrollHeight;
            if (i >= text.length) {
                clearInterval(interval);
                const html = highlightCodeBlocks(element.innerText);
                element.innerHTML = html;
                
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.innerHTML = '<i class="far fa-copy"></i>';
                copyBtn.onclick = () => copyMessage(element.innerText);
                element.appendChild(copyBtn);
                element.classList.add('has-copy-btn');
            }
        }, speed);
    };

    // --- API ÇAĞRISI ---
    const fetchAI = async (msg, file) => {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, file: file, history: getContextMessages() })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Hata oluştu");
            return data.response;
        } catch (err) {
            return `Hata: ${err.message}`;
        }
    };

    // --- İŞLEMLER ---
    const sendMessage = async () => {
        const text = messageInput.value.trim();
        if (!text && !uploadedFileBase64) return;

        let displayText = text;
        if (uploadedFileName) displayText = `[Dosya: ${uploadedFileName}] ${text}`;

        addMessage(displayText, 'user');
        messageInput.value = '';
        
        const loader = addMessage('...', 'ai', true);
        loader.classList.add('typing-indicator');

        let fileData = null;
        if (uploadedFileBase64) {
            // Basit MIME kontrolü
            let mime = 'text/plain';
            if (uploadedFileName.endsWith('pdf')) mime = 'application/pdf';
            else if (uploadedFileName.endsWith('docx')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (uploadedFileName.endsWith('pptx')) mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            else if (uploadedFileName.match(/\.(jpg|jpeg|png)$/i)) mime = 'image/jpeg';
            
            fileData = { data: uploadedFileBase64, mimeType: mime };
        }

        const response = await fetchAI(text, fileData);
        
        chatBox.removeChild(loader);
        const aiMsg = addMessage('', 'ai', true);
        typeMessage(response, aiMsg);

        uploadedFileBase64 = null; uploadedFileName = null;
        const status = document.getElementById('attach-status');
        if (status) status.remove();
        
        saveChat();
    };

    // --- OLAY DINLEYICILERI ---
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

    document.getElementById('attach-file-btn').addEventListener('click', () => fileUploadInput.click());
    fileUploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 4.5 * 1024 * 1024) { alert("Dosya çok büyük (Max 4.5MB)."); return; }
            uploadedFileBase64 = await fileToBase64(file);
            uploadedFileName = file.name;
            let status = document.getElementById('attach-status');
            if (!status) {
                status = document.createElement('div');
                status.id = 'attach-status';
                status.style.color = '#007bff';
                document.querySelector('.chat-main').appendChild(status);
            }
            status.textContent = `Dosya Hazır: ${file.name}`;
        }
    });

    // --- GEÇMİŞ YÖNETİMİ ---
    const saveChat = () => {
        const msgs = Array.from(chatBox.children).map(el => ({ text: el.innerText, sender: el.classList.contains('user-message') ? 'user' : 'ai' }));
        if(msgs.length > 0) localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs));
        renderChatHistory();
    };
    
    const renderChatHistory = () => {
        const historyData = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY));
        // (Basitleştirilmiş geçmiş listesi - Detaylar eklenebilir)
    };

    // Modallar
    const settingsBtn = document.getElementById('settings-btn');
    const helpBtn = document.getElementById('help-btn');
    if(settingsBtn) settingsBtn.onclick = () => document.getElementById('settings-modal').style.display = 'block';
    if(helpBtn) helpBtn.onclick = () => document.getElementById('help-modal').style.display = 'block';
    document.querySelectorAll('.close-button').forEach(btn => btn.onclick = () => {
        document.getElementById('settings-modal').style.display = 'none';
        document.getElementById('help-modal').style.display = 'none';
    });
});