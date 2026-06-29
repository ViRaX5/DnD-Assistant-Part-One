import { socket } from './socket.js'
import { isShopOpen } from './ui-interactions.js'
import { fetchCampaignParticipants } from './chat.js'

const assetsDB1 = [
    { id: "t1", name: "player1_token" },
    { id: "t2", name: "player2_token" },
    { id: "t3", name: "dog_token" },
    { id: "t4", name: "cat_token" },
    { id: "t5", name: "goblin_token" },
    { id: "t6", name: "" }
];
const assetsDB2 = [];

const mapsDB1 = [
    { id: "m1", name: "Tavern_Map" },
    { id: "m2", name: "Forest_Map" },
    { id: "m3", name: "Cave_Map" }
];
const mapsDB2 = [];

const audioDB1 = [
    { id: "a1", name: "Battle_Music" },
    { id: "a2", name: "Tavern_Ambience" }
];
const audioDB2 = [];

// Canonical asset type per tab, matching the SQL campaign_assets.asset_type convention
const TAB_TO_ASSET_TYPE = {
    tokens: 'token',
    maps: 'map',
    audio: 'audio'
};

// handout/other aren't tabbed in the UI yet, but are valid asset_type values
const ASSET_TYPE_LABELS = {
    token: 'Add Token',
    map: 'Add Map',
    audio: 'Add Audio',
    handout: 'Add Handout',
    other: 'Add Asset'
};

const mockAssetsByType = {
    token: assetsDB1,
    map: mapsDB1,
    audio: audioDB1
};


const audioPlayerContainer = document.getElementById('audio-player-container');
const trackNameDisplay = document.getElementById('audio-track-name');
const closeAudioBtn = document.getElementById('close-audio-btn');
const playPauseBtn = document.getElementById('play-pause-btn');
const seekBar = document.getElementById('seek-bar');
const volumeBar = document.getElementById('volume-bar');
const currentTimeDisplay = document.getElementById('current-time');
const durationDisplay = document.getElementById('duration');
const searchContainer = document.querySelector('.search-container');

// The native browser audio engine
let currentAudio = new Audio()
let isAudioPlaying = false
let currentAudioName = ""

let activeAssetType = 'token';

async function loadAssets(assetType) {
    try {
        const campaignId = sessionStorage.getItem('activeCampaignId');

        const response = await fetchWithAuth(`${BASE_URL}/api/DM/getAsset?campaignID=${campaignId}`)
        const data = await response.json()

        if (response.ok && data.success) {
            return data.assets.filter(asset => asset.asset_type === assetType);
        } else {
            console.error("Failed to fetch assets:", data.error);
            return [];
        }
    }
    catch (error) {
        console.error("Connection error loading assets:", error);
        return [];
    }
}

const combatTracker1 = {
    currentTurn: { id: 2, name: "Player 2", initiative: 10 },
    upcoming: [
        { id: 4, name: "Tharion (Rogue)", initiative: 19 },
        { id: 5, name: "Eldrin (Wizard)", initiative: 18 },
        { id: 6, name: "Young Red Dragon", initiative: 17 },
        { id: 7, name: "Lurking Grick", initiative: 16 },
        { id: 8, name: "Orc Warlord", initiative: 15 },
        { id: 9, name: "Dire Wolf", initiative: 14 },
        { id: 10, name: "Hobgoblin Captain", initiative: 13 },
        { id: 11, name: "Skeletal Archer", initiative: 12 },
        { id: 12, name: "Goblin Shaman", initiative: 11 },
        { id: 13, name: "Kaelen (Paladin)", initiative: 9 },
        { id: 14, name: "Cave Troll", initiative: 6 },
        { id: 15, name: "Gelatinous Cube", initiative: 4 }
    ]
};
const combatTracker2 = {};

let activeCombatTracker = JSON.parse(JSON.stringify(combatTracker1));

const currentPlayerContainer = document.getElementById('current-player-container');
const nextInitiativesContainer = document.getElementById('next-initiatives-container');
const assetsGrid = document.getElementById('assets-grid');

const prevBtn = document.getElementById('prev-turn-btn');
const nextBtn = document.getElementById('next-turn-btn');
const addInitBtn = document.getElementById('add-initiative-btn');
const initModal = document.getElementById('add-initiative-modal');
const closeInitModal = document.getElementById('close-initiative-modal');
const assetTabs = document.querySelectorAll('.assets-tabs button');

const addNewCreatureBtn = document.getElementById('add-new-creature-btn');
const monsterSearchModal = document.getElementById('monster-search-modal');
const closeMonsterSearchModal = document.getElementById('close-monster-search-modal');
const monsterSearchInput = document.getElementById('monster-search-input');
const monsterSearchResults = document.getElementById('monster-search-results');
const monsterLoading = document.getElementById('monster-loading');
const monsterSearchView = document.getElementById('monster-search-view');
const monsterEditView = document.getElementById('monster-edit-view');
const monsterSearchTitle = document.getElementById('monster-search-title');
const monsterEditName = document.getElementById('monster-edit-name');
const monsterEditInitiative = document.getElementById('monster-edit-initiative');
const monsterEditHp = document.getElementById('monster-edit-hp');
const backMonsterSearchBtn = document.getElementById('back-monster-search-btn');
const confirmMonsterAddBtn = document.getElementById('confirm-monster-add-btn');

let allMonstersCache = [];
let selectedMonsterOriginalData = null;

const addEffectBtn = document.getElementsByClassName('add-effect-btn')[0];
const addEffectModal = document.getElementById('add-effect-modal');
const closeAddEffectModal = document.getElementById('close-add-effect-modal');
const addEffectModalBtn = document.getElementById('add-effect-modal-button');
const activeEffectsBtn = document.getElementById("active-effects");
const effectNameInput = document.getElementById('effect-name-input');
const effectDurationInput = document.getElementById('effect-duration-input');

function renderCombatTracker(combatData) {
    if (!combatData || (!combatData.currentTurn && combatData.upcoming.length === 0)) {
        currentPlayerContainer.innerHTML = `<span class="empty-state-text">No active combat</span>`;
        nextInitiativesContainer.innerHTML = '';
        return;
    }

    if (combatData.currentTurn) {
        currentPlayerContainer.innerHTML = `
          <div class="initiative-card">
            <button class="remove-btn" data-id="${combatData.currentTurn.id}">X</button>
            <span>${combatData.currentTurn.name} - initiative ${combatData.currentTurn.initiative}</span>
          </div>
        `;
    } else {
        currentPlayerContainer.innerHTML = `<span class="empty-state-text">No current player</span>`;
    }

    nextInitiativesContainer.innerHTML = '';
    if (combatData.upcoming && combatData.upcoming.length > 0) {
        combatData.upcoming.forEach(entity => {
            const card = document.createElement('div');
            card.className = 'initiative-card';
            card.innerHTML = `
              <span>${entity.name} - initiative ${entity.initiative}</span>
              <button class="remove-btn" data-id="${entity.id}">X</button>
            `;
            nextInitiativesContainer.appendChild(card);
        });
    }

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            handleRemoveEntity(e.target.dataset.id)
            e.target.blur()
        });
    });
}

function renderAssets(assetsData, assetType) {
    const addButtonHtml = `<div id="add-asset-item" class="asset-item">${ASSET_TYPE_LABELS[assetType] || 'Add Asset'}</div>`
    assetsGrid.innerHTML = ''

    if (!assetsData || assetsData.length === 0) {
        assetsGrid.innerHTML += addButtonHtml
        assetsGrid.innerHTML += `<span class="no-assets-message">No assets found</span>`
        return
    }

    assetsData.forEach(asset => {
        // Use original_name to match your MySQL database!
        if (!asset.original_name) return

        const itemDiv = document.createElement('div')
        itemDiv.className = 'asset-item'

        const info = document.createElement('span')
        info.innerText = asset.original_name
        itemDiv.appendChild(info)

        // --- NEW: The Click Listener for Maps ---
        if (assetType === 'map') {
            itemDiv.addEventListener('click', () => {
                // Pass the AWS pre-signed URL to the iframe handler!
                changeMapBackground(asset.imageUrl)
            })
        }
        else if (assetType === 'token') {
            itemDiv.addEventListener('click', () => {
                spawnToken(asset.imageUrl)
            })
        }
        else if (assetType === 'audio') {
            itemDiv.addEventListener('click', () => {
                playAudio(asset.imageUrl, asset.original_name)
            })
        }

        assetsGrid.appendChild(itemDiv)
    });

    assetsGrid.insertAdjacentHTML('beforeend', addButtonHtml)
}

function changeMapBackground(imageUrl) {
    try {
        console.log("Map clicked! Sending URL to canvas:", imageUrl)
        
        const mapIframe = document.getElementById('main-map')   
        const iframeWindow = mapIframe.contentWindow
        
        if (iframeWindow && iframeWindow.setMapImage) {
            iframeWindow.setMapImage(imageUrl)
            socket.emit('map:changeBackground', { imageUrl: imageUrl })
        } 
        else {
            console.error("Could not find the setMapImage function inside the iframe!")
        }

    } catch (err) {
        console.error("Failed to update canvas background.", err)
    }
}

function spawnToken(imageUrl) {
    try {
        const mapIframe = document.getElementById('main-map');       
        const iframeWindow = mapIframe.contentWindow; 
        
        if (iframeWindow && iframeWindow.addToken) {
            iframeWindow.addToken(imageUrl);
            
            // TODO for the future: Broadcast this new token to the players!
            // socket.emit('map:spawnToken', { imageUrl: imageUrl });
        } else {
            console.error("Could not find the addToken function inside the iframe!");
        }
    } catch (err) {
        console.error("Failed to spawn token.", err);
    }
}

function handleNextTurn(clickedBtn) {
    if (activeCombatTracker.upcoming.length === 0) return;
    const oldCurrent = activeCombatTracker.currentTurn;
    activeCombatTracker.currentTurn = activeCombatTracker.upcoming.shift();
    if (oldCurrent) activeCombatTracker.upcoming.push(oldCurrent);
    renderCombatTracker(activeCombatTracker);
    clickedBtn.blur()
}

function handlePrevTurn(clickedBtn) {
    if (activeCombatTracker.upcoming.length === 0) return;
    const oldCurrent = activeCombatTracker.currentTurn;
    activeCombatTracker.currentTurn = activeCombatTracker.upcoming.pop();
    if (oldCurrent) activeCombatTracker.upcoming.unshift(oldCurrent);
    renderCombatTracker(activeCombatTracker);
    clickedBtn.blur()
}

function handleRemoveEntity(idStr) {
    const id = parseInt(idStr) || idStr;

    if (activeCombatTracker.currentTurn && activeCombatTracker.currentTurn.id === id) {
        activeCombatTracker.currentTurn = activeCombatTracker.upcoming.shift() || null;
    }
    else {
        activeCombatTracker.upcoming = activeCombatTracker.upcoming.filter(entity => entity.id !== id);
    }
    renderCombatTracker(activeCombatTracker);
}

nextBtn.addEventListener('click', () => { handleNextTurn(nextBtn) });
prevBtn.addEventListener('click', () => { handlePrevTurn(prevBtn) });

addInitBtn.addEventListener('click', () => {
    initModal.showModal()
    addInitBtn.blur()
});
closeInitModal.addEventListener('click', () => {
    initModal.close()
    closeInitModal.blur()
});

addNewCreatureBtn.addEventListener('click', async () => {
    initModal.close(); // Close the previous menu
    resetMonsterSearchModal();
    monsterSearchModal.showModal();
    addNewCreatureBtn.blur();

    // Only hit the D&D API once per session!
    if (allMonstersCache.length === 0) {
        monsterLoading.classList.remove('hidden-ui');
        try {
            const res = await fetch('https://www.dnd5eapi.co/api/monsters');
            const data = await res.json();
            allMonstersCache = data.results;
            renderMonsterList(allMonstersCache);
        } catch (err) {
            console.error("Failed to fetch monsters:", err);
            monsterSearchResults.innerHTML = '<span class="monster-error-message">Failed to load monsters.</span>';
        } finally {
            monsterLoading.classList.add('hidden-ui');
        }
    } else {
        renderMonsterList(allMonstersCache);
    }
});

closeMonsterSearchModal.addEventListener('click', () => {
    monsterSearchModal.close();
});

backMonsterSearchBtn.addEventListener('click', () => {
    // Go back to the search view without closing the modal
    monsterEditView.classList.add('hidden-ui');
    backMonsterSearchBtn.classList.add('hidden-ui');
    confirmMonsterAddBtn.classList.add('hidden-ui');
    
    monsterSearchView.classList.remove('hidden-ui');
    monsterSearchTitle.innerText = "Search Monster";
});

// Live Search filtering
monsterSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allMonstersCache.filter(m => m.name.toLowerCase().includes(query));
    renderMonsterList(filtered);
});

function renderMonsterList(list) {
    monsterSearchResults.innerHTML = '';
    
    // Display max 50 at a time to prevent UI lag when searching
    const displayList = list.slice(0, 50); 
    
    if (displayList.length === 0) {
        monsterSearchResults.innerHTML = '<div class="monster-empty-message">No monsters found.</div>';
        return;
    }

    displayList.forEach(monster => {
        const div = document.createElement('div');
        div.className = 'monster-list-item';
        div.innerText = monster.name;
        
        div.addEventListener('click', () => selectMonster(monster.index, monster.name));
        
        monsterSearchResults.appendChild(div);
    });
}

async function selectMonster(index, name) {
    monsterSearchView.classList.add('hidden-ui');
    monsterSearchTitle.innerText = "Fetching data...";
    
    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/monsters/${index}`);
        selectedMonsterOriginalData = await res.json();
        
        // Populate the Edit Form!
        monsterSearchTitle.innerText = `Edit: ${selectedMonsterOriginalData.name}`;
        monsterEditName.value = selectedMonsterOriginalData.name;
        monsterEditHp.value = selectedMonsterOriginalData.hit_points;
        
        // Automatically roll a standard 1d20 + DEX modifier for initiative!
        const dex = selectedMonsterOriginalData.dexterity || 10;
        const dexMod = Math.floor((dex - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        monsterEditInitiative.value = roll + dexMod;
        
        monsterEditView.classList.remove('hidden-ui');
        backMonsterSearchBtn.classList.remove('hidden-ui');
        confirmMonsterAddBtn.classList.remove('hidden-ui');
        
    } catch (err) {
        console.error("Failed to fetch monster details:", err);
        monsterSearchTitle.innerText = "Error fetching details";
        monsterSearchView.classList.remove('hidden-ui');
    }
}

function resetMonsterSearchModal() {
    monsterSearchView.classList.remove('hidden-ui');
    monsterEditView.classList.add('hidden-ui');
    backMonsterSearchBtn.classList.add('hidden-ui');
    confirmMonsterAddBtn.classList.add('hidden-ui');
    
    monsterSearchTitle.innerText = "Search Monster";
    monsterSearchInput.value = '';
    if (allMonstersCache.length > 0) renderMonsterList(allMonstersCache);
}

confirmMonsterAddBtn.addEventListener('click', async () => {
    const name = monsterEditName.value || selectedMonsterOriginalData.name;
    const initiative = parseInt(monsterEditInitiative.value) || 0;
    
    const newEntity = {
        id: `monster_${Date.now()}`, 
        name: name,
        initiative: initiative
    };
    
    // 1. Add to active combat tracker
    activeCombatTracker.upcoming.push(newEntity);
    
    // 2. Sort the upcoming tracker automatically so highest initiative goes to the top!
    activeCombatTracker.upcoming.sort((a, b) => b.initiative - a.initiative);
    renderCombatTracker(activeCombatTracker);
    
    // 3. Send the ORIGINAL API data to the backend!
    const campaignId = sessionStorage.getItem('activeCampaignId');
    try {
        await fetchWithAuth(`${BASE_URL}/api/DM/saveMonster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignID: campaignId,
                monsterData: selectedMonsterOriginalData // Contains all original untouched stats!
            })
        });
    } catch (err) {
        console.error("Failed to save monster to backend:", err);
    }
    
    monsterSearchModal.close();
});

assetTabs.forEach(tab => {
    tab.addEventListener('click', async (e) => {
        assetTabs.forEach(t => {
            t.classList.remove('active')
            t.classList.add('not-active')
        });
        e.target.classList.add('active')
        e.target.classList.remove('not-active')
        e.target.blur()

        const tabName = e.target.innerText.toLowerCase()
        const assetType = TAB_TO_ASSET_TYPE[tabName]
        if (!assetType) return

        activeAssetType = assetType
        if (assetType === 'audio' && isAudioPlaying) {
            // If they clicked the Audio tab and a song is already playing, 
            // skip fetching the list and just show them the player UI!
            showAudioPlayer();
        } else {
            // Otherwise, hide the player and render the standard grid
            hideAudioPlayer();
            const assets = await loadAssets(assetType);
            renderAssets(assets, assetType);
        }
    })
})


const addAssetModal = document.getElementById('add-asset-modal');
const addAssetForm = document.getElementById('add-asset-form');
const closeAssetModal = document.getElementById('close-asset-modal');
const uploadErrorMessage = document.getElementById('upload-error-message');
const addAssetTitle = document.getElementById('add-asset-title');
const submitAssetBtn = document.getElementById('submit-asset-button');
const assetFileInput = document.getElementById('asset-file-input');

// #add-asset-item is recreated on every renderAssets() call, so this listener
// is attached once to the grid itself rather than to the button directly.
assetsGrid.addEventListener('click', (e) => {
    const addButton = e.target.closest('#add-asset-item')
    if (addButton) {
        const addButton = e.target.closest('#add-asset-item');
        if (addButton) {
            addAssetTitle.innerText = `Add ${activeAssetType.charAt(0).toUpperCase() + activeAssetType.slice(1)}`
            uploadErrorMessage.innerText = ""
            addAssetForm.reset()

            if(activeAssetType === 'audio') {
                assetFileInput.accept = "audio/mpeg, audio/wav, audio/ogg"
            }
            else {
                assetFileInput.accept = "image/png, image/jpeg, image/webp"
            }

            addAssetModal.showModal()
        }
    } 
    // else {

    //     changeMapBackground()
    // }
})

closeAssetModal.addEventListener('click', () => {
    addAssetModal.close()
    closeAssetModal.blur()
})

addAssetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!assetFileInput.files.length) {
        uploadErrorMessage.innerText = "Please select a file to upload."
        return
    }

    submitAssetBtn.innerText = "Uploading..."
    submitAssetBtn.disabled = true

    const formData = new FormData()

    formData.append('media', assetFileInput.files[0])
    formData.append('campaignID', sessionStorage.getItem('activeCampaignId'))
    formData.append('uploaderID', getUserIdFromToken())
    formData.append('assetType', activeAssetType)

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/DM/uploadAsset`, {
            method: 'POST',
            body: formData
        })

        const data = await response.json()

        if (response.ok && data.success) {
            addAssetModal.close()
            const freshAssets = await loadAssets(activeAssetType)
            renderAssets(freshAssets, activeAssetType)
        }
        else {
            uploadErrorMessage.innerText = data.error || "Failed to upload asset."
        }
    }
    catch (err) {
        console.error("Upload error:", err)
        uploadErrorMessage.innerText = "Connection error during upload."
    }
    finally {
        submitAssetBtn.innerText = "Upload"
        submitAssetBtn.disabled = false
    }
})
// Add Effects
addEffectBtn.addEventListener('click', () => {
    addEffectModal.showModal()
    addEffectBtn.blur()
});
closeAddEffectModal.addEventListener('click', () => {
    addEffectModal.close()
    addEffectModal.blur()
});

addEffectModalBtn.addEventListener('click', () => {
    socket.emit('effects:add', {
        name: effectNameInput.value,
        duration: effectDurationInput.value
    })
    effectNameInput.value = '';
    effectDurationInput.value = '';
})

// Shop Toggle
const shopBtn = document.getElementById('shop-btn');

shopBtn.addEventListener('click', () => {
    socket.emit('shop:toggle', { isOpen: !isShopOpen() })
});

// Play Music
// --- AUDIO PLAYER LOGIC ---

// Helper function to format seconds into "M:SS"
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00"
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min}:${sec < 10 ? '0' : ''}${sec}`
}

async function loadPartyVolumeControls() {
    const listContainer = document.getElementById('party-volume-list')
    listContainer.innerHTML = '<span class="empty-state-text">Loading party...</span>'

    // Reuse the exact same fetch you built for the chat whispers!
    const participants = await fetchCampaignParticipants()
    listContainer.innerHTML = ''

    if (participants.length === 0) {
        listContainer.innerHTML = '<span class="empty-state-text">No players connected.</span>'
        return
    }

    participants.forEach(player => {
        const row = document.createElement('div')
        row.className = 'player-volume-row'
        
        const nameSpan = document.createElement('span')
        nameSpan.className = 'player-volume-name'
        nameSpan.innerText = player.first_name
        nameSpan.title = player.first_name

        const slider = document.createElement('input')
        slider.type = 'range'
        slider.min = '0'
        slider.max = '1'
        slider.step = '0.05'
        slider.value = '0.5'
        
        slider.addEventListener('input', () => {
            socket.emit('audio:setPlayerVolume', { 
                targetUserId: player.user_id, 
                volume: slider.value 
            })
        })

        row.appendChild(nameSpan)
        row.appendChild(slider)
        listContainer.appendChild(row)
    })
}

function playAudio(url, name) {
    currentAudioName = name
    currentAudio.src = url
    currentAudio.volume = volumeBar.value
    currentAudio.play()
    
    isAudioPlaying = true
    playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'
    showAudioPlayer()

    socket.emit('audio:play', { url: url, name: name })
}

function showAudioPlayer() {
    assetsGrid.classList.add('hidden-ui')
    searchContainer.classList.add('hidden-ui')
    audioPlayerContainer.classList.remove('hidden-ui')
    trackNameDisplay.innerText = currentAudioName
    loadPartyVolumeControls()
}

function hideAudioPlayer() {
    audioPlayerContainer.classList.add('hidden-ui')
    assetsGrid.classList.remove('hidden-ui')
    searchContainer.classList.remove('hidden-ui')
}

// Play/Pause Button
playPauseBtn.addEventListener('click', () => {
    if (currentAudio.paused) {
        currentAudio.play()
        playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i>'
        socket.emit('audio:resume')
    } 
    else {
        currentAudio.pause()
        playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>'
        socket.emit('audio:pause')
    }
})

// Update the seek bar as the song plays
currentAudio.addEventListener('timeupdate', () => {
    seekBar.value = currentAudio.currentTime
    currentTimeDisplay.innerText = formatTime(currentAudio.currentTime)
})

// Set the max length of the seek bar when the song loads
currentAudio.addEventListener('loadedmetadata', () => {
    seekBar.max = currentAudio.duration
    durationDisplay.innerText = formatTime(currentAudio.duration)
})

// Scrubbing (dragging the seek bar)
seekBar.addEventListener('input', () => {
    currentAudio.currentTime = seekBar.value
})

// Volume Slider
volumeBar.addEventListener('input', () => {
    currentAudio.volume = volumeBar.value
})

// The 'X' Button
closeAudioBtn.addEventListener('click', async () => {
    currentAudio.pause()
    currentAudio.src = ""
    isAudioPlaying = false
    hideAudioPlayer()

    socket.emit('audio:stop')
    
    // Re-fetch and show the audio list
    const assets = await loadAssets('audio')
    renderAssets(assets, 'audio')
})

// Change button back to play when song finishes naturally
currentAudio.addEventListener('ended', () => {
    playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
})

seekBar.addEventListener('change', () => {
    currentAudio.currentTime = seekBar.value
    socket.emit('audio:seek', { time: seekBar.value })
})

renderCombatTracker(activeCombatTracker);
loadAssets(activeAssetType).then(assets => renderAssets(assets, activeAssetType));