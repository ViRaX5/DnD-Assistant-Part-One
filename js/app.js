import { renderPlayerInfo } from './player-info.js';
import { renderEquipmentAndTraits } from './equipment-and-traits.js';
import { setupUIInteractions, loadActiveEffects, loadShopStatus } from './ui-interactions.js';
import { loadChatHistory } from './chat.js';
import { socket } from './socket.js';
import { sessionContext } from './session-context.js';

// const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
//     ? 'http://localhost:8081'
//     : 'https://dndassistantbackend.onrender.com';

window.broadcastTokenMove = (data) => {
    // Emit the custom event to the Node.js backend
    socket.emit('map:moveToken', data);
};

window.broadcastTokenSpawn = (data) => {
    socket.emit('map:spawnToken', data);
};

socket.on('map:updateToken', (data) => {
    const mapIframe = document.getElementById('main-map');

    // Safety check: ensure the iframe exists and has fully loaded its content
    if (mapIframe && mapIframe.contentWindow && mapIframe.contentWindow.updateRemoteToken) {
        // Pass the data down through the iframe boundary
        mapIframe.contentWindow.updateRemoteToken(data.tokenId, data.newX, data.newY);
    }
});

socket.on('map:spawnToken', (data) => {
    const mapIframe = document.getElementById('main-map');

    if (mapIframe && mapIframe.contentWindow && mapIframe.contentWindow.addRemoteToken) {
        mapIframe.contentWindow.addRemoteToken(data);
    }
});

socket.on('map:reset', () => {
    const mapIframe = document.getElementById('main-map');

    if (mapIframe && mapIframe.contentWindow && mapIframe.contentWindow.resetMap) {
        mapIframe.contentWindow.resetMap();
    }
});

async function loadMapState() {
    const mapIframe = document.getElementById('main-map');
    if (!mapIframe) return;

    try {
        const response = await fetchWithAuth(
            `${BASE_URL}/api/getMapState?campaignId=${sessionContext.campaignId}`
        );
        const data = await response.json();

        if (response.ok && data.success) {
            const iframeWindow = mapIframe.contentWindow;

            if (data.backgroundUrl && iframeWindow.setMapImage) {
                iframeWindow.setMapImage(data.backgroundUrl);
            }
            if (iframeWindow.setInitialTokens) {
                iframeWindow.setInitialTokens(data.tokens);
            }
        }
    } catch (error) {
        console.error("Failed to load map state:", error);
    }
}

async function initializeApp() {
    const currentPath = window.location.pathname;

    if (currentPath.endsWith("playerScreen.html")) {
        try {
            const response = await fetchWithAuth(
                `${BASE_URL}/api/getCharacter?campaignId=${sessionContext.campaignId}`
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

    try {
        loadActiveEffects();

    } catch (error) {
        console.error("Failed to load active effects:", error);
    }

    try {
        loadShopStatus();

    } catch (error) {
        console.error("Failed to load shop status:", error);
    }

    try {
        const mapIframe = document.getElementById('main-map');
        if (mapIframe) {
            if (mapIframe.contentDocument && mapIframe.contentDocument.readyState === 'complete') {
                loadMapState();
            } else {
                mapIframe.addEventListener('load', loadMapState);
            }
        }

    } catch (error) {
        console.error("Failed to set up map state load:", error);
    }
}

const playerAudio = new Audio();
let audioUnlocked = false;

// 1. The Mobile Unlock Trick (Requires them to tap a UI button, not the map)
function unlockAudio() {
    if (audioUnlocked) return;
    
    playerAudio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    playerAudio.load();

    // Play a silent blip to force the phone to unlock the audio engine
    playerAudio.play().then(() => {
        playerAudio.pause();
        audioUnlocked = true;
        console.log("Mobile audio engine unlocked!");
    }).catch(err => {
        // Will throw an error if they haven't interacted yet, which is fine!
    });

    // Clean up listeners after successful unlock
    document.body.removeEventListener('click', unlockAudio);
    document.body.removeEventListener('touchstart', unlockAudio);
}

// Listen for the very first tap anywhere on the main document body
document.body.addEventListener('click', unlockAudio);
document.body.addEventListener('touchstart', unlockAudio);

// 2. Listen to the DM's commands
socket.on('audio:syncPlay', (data) => {
    if (!playerAudio.src.includes(data.url)) {
        playerAudio.src = data.url;
    }
    if (data.time !== undefined) {
        playerAudio.currentTime = data.time;
    }
    playerAudio.play().catch(err => {
        console.warn("Browser blocked autoplay. User must tap a UI element to unlock audio.");
    });
});

socket.on('audio:syncPause', () => {
    playerAudio.pause();
});

socket.on('audio:syncResume', () => {
    playerAudio.play();
});

socket.on('audio:syncStop', () => {
    playerAudio.pause();
    playerAudio.src = "";
});

socket.on('audio:syncSeek', (data) => {
    playerAudio.currentTime = data.time;
});

// 3. The DM's Party Volume Dashboard control
socket.on('audio:syncTargetVolume', (data) => {
    // Make sure we only change the volume if the DM targeted THIS specific player
    if (sessionContext.userId === data.targetUserId) {
        playerAudio.volume = data.volume;
    }
});

initializeApp();