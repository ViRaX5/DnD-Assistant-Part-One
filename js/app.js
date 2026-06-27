import { renderPlayerInfo } from './player-info.js';
import { renderEquipmentAndTraits } from './equipment-and-traits.js';
import { setupUIInteractions } from './ui-interactions.js';
import { loadChatHistory } from './chat.js';
import { socket } from './socket.js';
import { sessionContext } from './session-context.js';

const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8081'
    : 'https://dndassistantbackend.onrender.com';

window.broadcastTokenMove = (data) => {
    // Emit the custom event to the Node.js backend
    socket.emit('map:moveToken', data);
};

socket.on('map:updateToken', (data) => {
    const mapIframe = document.getElementById('main-map');

    // Safety check: ensure the iframe exists and has fully loaded its content
    if (mapIframe && mapIframe.contentWindow && mapIframe.contentWindow.updateRemoteToken) {
        // Pass the data down through the iframe boundary
        mapIframe.contentWindow.updateRemoteToken(data.tokenId, data.newX, data.newY);
    }
});

async function initializeApp() {
    const currentPath = window.location.pathname;

    if (currentPath.endsWith("playerScreen.html")) {
        try {
            const response = await fetch(
                `${BASE_URL}/api/getCharacter?campaignId=${sessionContext.campaignId}&userId=${sessionContext.userId}`
            );
            const data = await response.json();

            if (response.ok && data.success) {
                console.log("Character data loaded successfully!", data.character);

                renderPlayerInfo(data.character);
                renderEquipmentAndTraits(data.character);

            } else {
                console.error("Failed to load character data:", data.error);
            }

        } catch (error) {
            console.error("Failed to load character data:", error);
        }
    }

    try {
        setupUIInteractions();

    } catch (error) {
        console.error("Failed to setup UI interactions:", error);
    }

    try {
        loadChatHistory();

    } catch (error) {
        console.error("Failed to setup chat:", error);
    }
}

initializeApp();