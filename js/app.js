import { renderPlayerInfo } from './player-info.js';
import { renderEquipmentAndTraits } from './equipment-and-traits.js';
import { setupUIInteractions } from './ui-interactions.js';
import { loadChatHistory } from './chat.js';
import { socket } from './socket.js';

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
        let playerState = null;
        let equipmentAndTraitsState = null;

        try {
            const playerInfoJSONresponse = await fetch('./JSONs/playerExample.json');

            playerState = await playerInfoJSONresponse.json();

            console.log("Data loaded successfully!", playerState);

            renderPlayerInfo(playerState);

        } catch (error) {
            console.error("Failed to load character data:", error);
        }

        try {
            const equipmentAndTraitsResponse = await fetch('./JSONs/equipmentAndTraitsExample.json');

            equipmentAndTraitsState = await equipmentAndTraitsResponse.json();

            console.log("Data loaded successfully!", equipmentAndTraitsState);

            renderEquipmentAndTraits(equipmentAndTraitsState);

        } catch (error) {
            console.error("Failed to load equipment and traits data:", error);
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