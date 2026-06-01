import { renderPlayerInfo } from './player-info.js';
import { renderEquipmentAndTraits } from './equipment-and-traits.js';
import { setupUIInteractions } from './ui-interactions.js';
import { renderChat } from './chat.js';


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
        renderChat();

    } catch (error) {
        console.error("Failed to setup chat:", error);
    }
}

initializeApp();