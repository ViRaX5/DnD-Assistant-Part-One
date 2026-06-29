import { socket } from './socket.js';
import { sessionContext } from './session-context.js';

const chatContainer = document.getElementById("chat-history");

// const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//     ? 'http://localhost:8081'
//     : 'https://dndassistantbackend.onrender.com';

let messages = [];

export function sendMessage({ type, text, targetId = null, targetName = null, meta = {}, senderName }) {
    socket.emit('chat:send', { type, text, targetId, targetName, meta, senderName });
}

export async function loadChatHistory() {
    try {
        const response = await fetchWithAuth(
            `${BASE_URL}/api/chatHistory?campaignId=${sessionContext.campaignId}&isDM=${sessionContext.isDM}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
            messages = data.messages;
            renderChat();
        }
    } catch (err) {
        console.error("Failed to load chat history:", err);
    }
}

export async function fetchCampaignParticipants() {
    try {
        const response = await fetchWithAuth(
            `${BASE_URL}/api/campaignListCampaignAndDM?id=${sessionContext.campaignId}`
        );
        const data = await response.json();

        if (!response.ok || !data.success) return [];

        return data.campaign;
    } catch (err) {
        console.error("Failed to load campaign participants:", err);
        return [];
    }
}

function buildDisplayText(msg) {
    if (msg.type !== 'whisper') {
        return msg.text;
    }

    const isSender = msg.senderId === sessionContext.userId;
    const isTarget = msg.targetId === sessionContext.userId;

    if (isSender) {
        return `To ${msg.targetName}: ${msg.text}`;
    }
    if (isTarget) {
        return `From ${msg.senderName}: ${msg.text}`;
    }

    return `${msg.senderName} whispers to ${msg.targetName}: ${msg.text}`;
}

export function renderChat() {
    chatContainer.innerHTML = '';

    let htmlString = '';
    messages.forEach(msg => {
        const cssClass = `${msg.type}-msg`;
        htmlString += `<div class="chat-message ${cssClass}">${buildDisplayText(msg)}</div>`;
    });

    chatContainer.innerHTML = htmlString;

    chatContainer.scrollTop = chatContainer.scrollHeight;
}

socket.on('chat:newMessage', (message) => {
    messages.push(message);
    renderChat();
});
