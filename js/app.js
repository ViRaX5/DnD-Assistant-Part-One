import { renderPlayerInfo } from './player-info.js';
import { renderEquipmentAndTraits } from './equipment-and-traits.js';
import { setupUIInteractions } from './ui-interactions.js';

// A global variable to hold your state once it loads


// The async function to grab the JSON
async function initializeApp() {
    const currentPath = window.location.pathname;

    if (currentPath.endsWith("playerScreen.html")) {
        let playerState = null;
        let equipmentAndTraitsState = null;

        try {
            // 1. Fetch the file
            const playerInfoJSONresponse = await fetch('./JSONs/playerExample.json');

            // 2. Parse it from text into a JavaScript Object
            playerState = await playerInfoJSONresponse.json();

            console.log("Data loaded successfully!", playerState);

            // 3. Now that we have the data, tell the UI to render it
            renderPlayerInfo(playerState);

        } catch (error) {
            console.error("Failed to load character data:", error);
        }

        try {
            const equipmentAndTraitsResponse = await fetch('./JSONs/equipmentAndTraitsExample.json');

            // 2. Parse it from text into a JavaScript Object
            equipmentAndTraitsState = await equipmentAndTraitsResponse.json();

            console.log("Data loaded successfully!", equipmentAndTraitsState);

            // 3. Now that we have the data, tell the UI to render it
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
}

// Kick off the application
initializeApp();