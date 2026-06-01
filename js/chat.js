let chatHistory = JSON.parse(localStorage.getItem('dnd-chat-history')) || [];

const chatContainer = document.getElementById("chat-history");

export function addChatMessage(messageText, type = "system-msg") {
    const messageObject = {
        text: messageText,
        type: type
    };

    chatHistory.push(messageObject);

    localStorage.setItem('dnd-chat-history', JSON.stringify(chatHistory));

    renderChat();
}

export function renderChat() {
    chatContainer.innerHTML = '';

    let htmlString = '';
    chatHistory.forEach(msg => {
        htmlString += `<div class="chat-message ${msg.type}">${msg.text}</div>`;
    });

    chatContainer.innerHTML = htmlString;

    chatContainer.scrollTop = chatContainer.scrollHeight;
}