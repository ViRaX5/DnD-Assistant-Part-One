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
const assetSearchInput = document.getElementById('asset-search');

const addExistingCreatureBtn = document.getElementById('add-existing-creature-btn');
const existingCreaturesModal = document.getElementById('existing-creatures-modal');
const closeExistingModalBtn = document.getElementById('close-existing-modal-btn');
const existingCreaturesList = document.getElementById('existing-creatures-list');
const existingLoading = document.getElementById('existing-loading');

const editShopBtn = document.getElementById('edit-shop-btn');
const editShopModal = document.getElementById('edit-shop-modal');
const closeEditShopBtn = document.getElementById('close-edit-shop-btn');
const saveShopBtn = document.getElementById('save-shop-btn');
const shopSearchInput = document.getElementById('shop-search-input');
const shopSearchResults = document.getElementById('shop-search-results');
const shopLoading = document.getElementById('shop-loading');
const currentShopInventoryContainer = document.getElementById('current-shop-inventory');

let allEquipmentCache = [];
let currentShopItems = [];

// The native browser audio engine
let currentAudio = new Audio()
let isAudioPlaying = false
let currentAudioName = ""

let activeAssetType = 'token';
let currentAssetsCache = [];

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

assetSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
        renderAssets(currentAssetsCache, activeAssetType);
        return;
    }

    const filtered = currentAssetsCache.filter(asset =>
        asset.original_name && asset.original_name.toLowerCase().includes(query)
    );

    renderAssets(filtered, activeAssetType);
})

const emptyCombatTracker = { currentTurn: null, upcoming: [] };

let activeCombatTracker = JSON.parse(JSON.stringify(emptyCombatTracker));

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
const closeMonsterEditBtn = document.getElementById('close-monster-edit-btn');
const monsterSearchInput = document.getElementById('monster-search-input');
const monsterSearchResults = document.getElementById('monster-search-results');
const monsterLoading = document.getElementById('monster-loading');
const monsterSearchView = document.getElementById('monster-search-view');
const monsterEditView = document.getElementById('monster-edit-view');
const monsterSearchTitle = document.getElementById('monster-search-title');

// Grid Inputs
const monsterEditName = document.getElementById('monster-edit-name');
const monsterEditInitiative = document.getElementById('monster-edit-initiative');
const monsterEditHp = document.getElementById('monster-edit-hp');
const monsterEditAc = document.getElementById('monster-edit-ac');
const monsterEditStr = document.getElementById('monster-edit-str');
const monsterEditDex = document.getElementById('monster-edit-dex');
const monsterEditCon = document.getElementById('monster-edit-con');
const monsterEditInt = document.getElementById('monster-edit-int');
const monsterEditWis = document.getElementById('monster-edit-wis');
const monsterEditCha = document.getElementById('monster-edit-cha');

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

const startCombatBtn = document.getElementById('start-combat-btn');
const endCombatBtn = document.getElementById('end-combat-btn');
const initiativePanelModal = document.getElementById('initiative-panel-modal');
const initiativeRosterList = document.getElementById('initiative-roster-list');
const initiativeAddToCombatBtn = document.getElementById('initiative-add-to-combat-btn');
const initiativePanelStartBtn = document.getElementById('initiative-panel-start-btn');
const closeInitiativePanelModal = document.getElementById('close-initiative-panel-modal');

let initiativeRollPhaseActive = false;
let initiativeRosterCache = [];
let pendingCreatures = [];
let combatActive = false;
let roundNumber = 1;
let turnsTakenThisRound = 0;
let combatantCount = 0;

function updateRoundDisplay() {
    document.querySelector('.round-number').textContent = roundNumber;
}

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

    if (combatActive) {
        turnsTakenThisRound++;
        if (turnsTakenThisRound >= combatantCount) {
            roundNumber++;
            turnsTakenThisRound = 0;
            socket.emit('effects:decrementRound');
        }
        updateRoundDisplay();
        socket.emit('combat:turnChanged', { combatActive, currentTurnUserId: activeCombatTracker.currentTurn?.userId || null });
    }

    clickedBtn.blur()
}

function handlePrevTurn(clickedBtn) {
    if (activeCombatTracker.upcoming.length === 0) return;
    const oldCurrent = activeCombatTracker.currentTurn;
    activeCombatTracker.currentTurn = activeCombatTracker.upcoming.pop();
    if (oldCurrent) activeCombatTracker.upcoming.unshift(oldCurrent);
    renderCombatTracker(activeCombatTracker);

    if (combatActive) {
        turnsTakenThisRound--;
        if (turnsTakenThisRound < 0) {
            roundNumber = Math.max(1, roundNumber - 1);
            turnsTakenThisRound = combatantCount - 1;
        }
        updateRoundDisplay();
        socket.emit('combat:turnChanged', { combatActive, currentTurnUserId: activeCombatTracker.currentTurn?.userId || null });
    }

    clickedBtn.blur()
}

function handleRemoveEntity(idStr) {
    const id = parseInt(idStr) || idStr;
    let removed = false;

    if (activeCombatTracker.currentTurn && activeCombatTracker.currentTurn.id === id) {
        activeCombatTracker.currentTurn = activeCombatTracker.upcoming.shift() || null;
        removed = true;
    }
    else {
        const beforeLength = activeCombatTracker.upcoming.length;
        activeCombatTracker.upcoming = activeCombatTracker.upcoming.filter(entity => entity.id !== id);
        removed = activeCombatTracker.upcoming.length < beforeLength;
    }

    if (removed && combatActive) {
        combatantCount = Math.max(0, combatantCount - 1);
        if (turnsTakenThisRound >= combatantCount) turnsTakenThisRound = 0;
    }

    renderCombatTracker(activeCombatTracker);
}

editShopBtn.addEventListener('click', async () => {
    editShopModal.showModal();
    editShopBtn.blur();

    // Fetch the existing shop inventory from your backend first
    await loadExistingShop();

    if (allEquipmentCache.length === 0) {
        shopLoading.classList.remove('hidden-ui');
        try {
            const res = await fetch('https://www.dnd5eapi.co/api/equipment');
            const data = await res.json();
            allEquipmentCache = data.results;
        } catch (err) {
            console.error("Failed to fetch equipment:", err);
            shopSearchInput.placeholder = "Failed to load API.";
        } finally {
            shopLoading.classList.add('hidden-ui');
        }
    }
});

closeEditShopBtn.addEventListener('click', () => {
    editShopModal.close();
    shopSearchInput.value = '';
    shopSearchResults.classList.add('hidden-ui');
    closeEditShopBtn.blur();
    editShopBtn.blur();
});

shopSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (query === '') {
        shopSearchResults.classList.add('hidden-ui');
        shopSearchResults.innerHTML = '';
        return;
    }

    const filtered = allEquipmentCache.filter(item => item.name.toLowerCase().includes(query));

    shopSearchResults.innerHTML = '';
    shopSearchResults.classList.remove('hidden-ui');

    const displayList = filtered.slice(0, 50);
    if (displayList.length === 0) {
        shopSearchResults.innerHTML = '<div class="monster-empty-message">No items found.</div>';
        return;
    }

    displayList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'monster-list-item';
        div.innerText = item.name;

        // When clicking a search result, fetch its details and add to inventory
        div.addEventListener('click', () => addItemToShop(item.index));
        shopSearchResults.appendChild(div);
    });
});

async function addItemToShop(index) {
    shopSearchResults.classList.add('hidden-ui');
    shopSearchInput.value = '';
    shopSearchInput.placeholder = "Adding item...";

    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/equipment/${index}`);
        const itemData = await res.json();

        // Format the cost nicely
        const costString = itemData.cost ? `${itemData.cost.quantity} ${itemData.cost.unit}` : '0 gp';

        // Format description (sometimes it's an array of strings in the 5e API)
        let descString = "Standard item.";
        if (itemData.desc && itemData.desc.length > 0) {
            descString = itemData.desc.join(" ");
        }

        const newItem = {
            id: `item_${Date.now()}`,
            name: itemData.name,
            cost: costString,
            description: descString
        };

        currentShopItems.push(newItem);
        renderShopInventory();

    } catch (err) {
        console.error("Failed to fetch item details:", err);
    } finally {
        shopSearchInput.placeholder = "Search equipment (e.g. Dagger)...";
    }
}

function renderShopInventory() {
    currentShopInventoryContainer.innerHTML = '';

    if (currentShopItems.length === 0) {
        currentShopInventoryContainer.innerHTML = '<div class="empty-state-text">Shop is currently empty.</div>';
        return;
    }

    currentShopItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'shop-inventory-item';

        div.innerHTML = `
            <div class="shop-item-info">
                <div class="shop-item-header">
                    <span class="shop-item-name">${item.name}</span>
                    <span class="shop-item-cost">${item.cost}</span>
                </div>
                <span class="shop-item-desc">${item.description}</span>
            </div>
            <button class="remove-btn" data-id="${item.id}">X</button>
        `;

        // Add remove listener
        const removeBtn = div.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            removeBtn.blur();
            currentShopItems = currentShopItems.filter(i => i.id !== item.id);
            renderShopInventory();
        });

        currentShopInventoryContainer.appendChild(div);
    });
}

async function loadExistingShop() {
    const campaignId = sessionStorage.getItem('activeCampaignId');
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/DM/getShopInventory?campaignID=${campaignId}`);
        const data = await response.json();

        if (data.success && data.shop && data.shop.items) {
            currentShopItems = data.shop.items;
        } else {
            currentShopItems = [];
        }
        renderShopInventory();
    } catch (err) {
        console.error("Failed to load shop:", err);
    }
}

saveShopBtn.addEventListener('click', async () => {
    saveShopBtn.blur();
    saveShopBtn.innerText = "Saving...";
    saveShopBtn.disabled = true;

    const campaignId = sessionStorage.getItem('activeCampaignId');

    try {
        await fetchWithAuth(`${BASE_URL}/api/DM/updateShopInventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignID: campaignId,
                items: currentShopItems
            })
        });

        editShopModal.close();
        editShopBtn.blur();
    } catch (err) {
        console.error("Failed to save shop:", err);
        // alert("Error saving shop!");
    } finally {
        saveShopBtn.innerText = "Save Shop";
        saveShopBtn.disabled = false;
    }
});

nextBtn.addEventListener('click', () => { handleNextTurn(nextBtn) });
prevBtn.addEventListener('click', () => { handlePrevTurn(prevBtn) });

function renderInitiativeRoster(roster) {
    initiativeRosterCache = roster;

    if (roster.length === 0) {
        initiativeRosterList.innerHTML = '<span class="empty-state-text">No players connected.</span>';
    } else {
        initiativeRosterList.innerHTML = '';
        roster.forEach(p => {
            const row = document.createElement('div');
            row.className = 'initiative-roster-row';
            row.innerHTML = `<span>${p.name}</span><span>${p.hasRolled ? '✓' : '✗'}</span>`;
            initiativeRosterList.appendChild(row);
        });
    }

    updateInitiativeStartButtonState();
}

function updateInitiativeStartButtonState() {
    const allRolled = initiativeRosterCache.every(p => p.hasRolled);
    const hasAnyCombatant = initiativeRosterCache.length > 0 || pendingCreatures.length > 0;
    initiativePanelStartBtn.disabled = !allRolled || !hasAnyCombatant;
}

socket.on('initiative:panelUpdate', (roster) => {
    renderInitiativeRoster(roster);
});

startCombatBtn.addEventListener('click', () => {
    if (initiativeRollPhaseActive) {
        initiativePanelModal.showModal();
        startCombatBtn.blur();
        return;
    }

    initiativeRollPhaseActive = true;
    socket.emit('initiative:start');
    initiativeRosterList.innerHTML = '<span class="empty-state-text">Waiting for players...</span>';
    initiativePanelStartBtn.disabled = true;
    initiativePanelModal.showModal();
    startCombatBtn.blur();
});

closeInitiativePanelModal.addEventListener('click', () => {
    initiativePanelModal.close();
});

initiativeAddToCombatBtn.addEventListener('click', () => {
    initModal.showModal();
});

initiativePanelStartBtn.addEventListener('click', () => {
    if (initiativeRosterCache.length === 0 && pendingCreatures.length === 0) return;

    const playerEntries = initiativeRosterCache.map(p => ({
        id: p.userId,
        userId: p.userId,
        name: p.name,
        initiative: p.result
    }));

    const combined = [...playerEntries, ...pendingCreatures].sort((a, b) => b.initiative - a.initiative);

    activeCombatTracker = {
        currentTurn: combined.shift() || null,
        upcoming: combined
    };

    combatActive = true;
    roundNumber = 1;
    turnsTakenThisRound = 0;
    combatantCount = (activeCombatTracker.currentTurn ? 1 : 0) + activeCombatTracker.upcoming.length;

    renderCombatTracker(activeCombatTracker);
    updateRoundDisplay();
    socket.emit('combat:turnChanged', { combatActive, currentTurnUserId: activeCombatTracker.currentTurn?.userId || null });
    socket.emit('initiative:end');

    initiativePanelModal.close();
    pendingCreatures = [];
    initiativeRollPhaseActive = false;
});

endCombatBtn.addEventListener('click', () => {
    activeCombatTracker = JSON.parse(JSON.stringify(emptyCombatTracker));
    combatActive = false;
    roundNumber = 1;
    pendingCreatures = [];
    initiativeRollPhaseActive = false;

    renderCombatTracker(activeCombatTracker);
    updateRoundDisplay();
    socket.emit('combat:turnChanged', { combatActive, currentTurnUserId: null });
    socket.emit('initiative:end');
    endCombatBtn.blur();
});

addInitBtn.addEventListener('click', () => {
    initModal.showModal()
    addInitBtn.blur()
});
closeInitModal.addEventListener('click', () => {
    initModal.close()
    closeInitModal.blur()
});

addNewCreatureBtn.addEventListener('click', async () => {
    initModal.close();
    resetMonsterSearchModal();
    monsterSearchModal.showModal();
    addNewCreatureBtn.blur();

    if (allMonstersCache.length === 0) {
        monsterLoading.classList.remove('hidden-ui');
        try {
            const res = await fetch('https://www.dnd5eapi.co/api/monsters');
            const data = await res.json();
            allMonstersCache = data.results;

            // Render the list immediately after fetching
            renderMonsterList(allMonstersCache);
        } catch (err) {
            console.error("Failed to fetch monsters:", err);
            monsterSearchTitle.innerText = "Failed to load monsters.";
        } finally {
            monsterLoading.classList.add('hidden-ui');
        }
    }
    else {
        renderMonsterList(allMonstersCache);
    }
});

closeMonsterSearchModal.addEventListener('click', () => {
    monsterSearchModal.close();
    closeMonsterSearchModal.blur();
});

closeMonsterEditBtn.addEventListener('click', () => {
    monsterSearchModal.close();
    closeMonsterEditBtn.blur();
});


// Live Search filtering
monsterSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    // if (query === '') {
    //     monsterSearchResults.classList.add('hidden-ui');
    //     monsterSearchResults.innerHTML = '';
    //     return;
    // }

    const filtered = allMonstersCache.filter(m => m.name.toLowerCase().includes(query));
    renderMonsterList(filtered);
});

function renderMonsterList(list) {
    monsterSearchResults.innerHTML = '';
    monsterSearchResults.classList.remove('hidden-ui');

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
    // Hide dropdown and search view, prepare for fetching
    monsterSearchResults.classList.add('hidden-ui');
    monsterSearchInput.value = '';
    monsterSearchView.classList.add('hidden-ui');
    monsterSearchTitle.innerText = "Fetching data...";

    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/monsters/${index}`);
        selectedMonsterOriginalData = await res.json();

        // Populate ALL fields for the Edit Form
        monsterSearchTitle.innerText = `Edit`; // Figma just says "Edit"
        monsterEditName.value = selectedMonsterOriginalData.name;
        monsterEditHp.value = selectedMonsterOriginalData.hit_points || 0;

        // Armor class is often an array in the 5e API
        const acData = selectedMonsterOriginalData.armor_class;
        monsterEditAc.value = (acData && acData.length > 0) ? acData[0].value : 10;

        monsterEditStr.value = selectedMonsterOriginalData.strength || 10;
        monsterEditDex.value = selectedMonsterOriginalData.dexterity || 10;
        monsterEditCon.value = selectedMonsterOriginalData.constitution || 10;
        monsterEditInt.value = selectedMonsterOriginalData.intelligence || 10;
        monsterEditWis.value = selectedMonsterOriginalData.wisdom || 10;
        monsterEditCha.value = selectedMonsterOriginalData.charisma || 10;

        // Roll initiative (1d20 + DEX mod)
        const dex = selectedMonsterOriginalData.dexterity || 10;
        const dexMod = Math.floor((dex - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        monsterEditInitiative.value = roll + dexMod;

        monsterEditView.classList.remove('hidden-ui');

    } catch (err) {
        console.error("Failed to fetch monster details:", err);
        monsterSearchTitle.innerText = "Error fetching details";
        monsterSearchView.classList.remove('hidden-ui');
    }
}

function resetMonsterSearchModal() {
    monsterSearchView.classList.remove('hidden-ui');
    monsterEditView.classList.add('hidden-ui');
    // monsterSearchResults.classList.add('hidden-ui');

    monsterSearchTitle.innerText = "Add To Initiative";
    monsterSearchInput.value = '';
}

confirmMonsterAddBtn.addEventListener('click', async () => {
    confirmMonsterAddBtn.blur();

    const name = monsterEditName.value || selectedMonsterOriginalData.name;
    const initiative = parseInt(monsterEditInitiative.value) || 0;

    // Store the edited stats in the local tracker
    const newEntity = {
        id: `monster_${Date.now()}`,
        name: name,
        initiative: initiative,
        hp: parseInt(monsterEditHp.value) || 0,
        ac: parseInt(monsterEditAc.value) || 0,
        stats: {
            str: parseInt(monsterEditStr.value) || 10,
            dex: parseInt(monsterEditDex.value) || 10,
            con: parseInt(monsterEditCon.value) || 10,
            int: parseInt(monsterEditInt.value) || 10,
            wis: parseInt(monsterEditWis.value) || 10,
            cha: parseInt(monsterEditCha.value) || 10
        }
    };

    if (initiativeRollPhaseActive) {
        pendingCreatures.push(newEntity);
        pendingCreatures.sort((a, b) => b.initiative - a.initiative);
        updateInitiativeStartButtonState();
    } else {
        activeCombatTracker.upcoming.push(newEntity);
        activeCombatTracker.upcoming.sort((a, b) => b.initiative - a.initiative);
        if (combatActive) combatantCount++;
        renderCombatTracker(activeCombatTracker);
    }

    // Send the ORIGINAL API data to the backend exactly as requested
    const campaignId = sessionStorage.getItem('activeCampaignId');
    try {
        await fetchWithAuth(`${BASE_URL}/api/DM/saveMonster`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignID: campaignId,
                monsterData: selectedMonsterOriginalData
            })
        });
    } catch (err) {
        console.error("Failed to save monster to backend:", err);
    }

    monsterSearchModal.close();
});

addExistingCreatureBtn.addEventListener('click', async () => {
    initModal.close(); // Close the main menu
    existingCreaturesModal.showModal();
    addExistingCreatureBtn.blur();

    existingLoading.classList.remove('hidden-ui');
    existingCreaturesList.innerHTML = '';

    const campaignId = sessionStorage.getItem('activeCampaignId');

    try {
        // Fetch the saved monsters for this specific campaign
        const response = await fetchWithAuth(`${BASE_URL}/api/DM/getSavedMonsters?campaignID=${campaignId}`);
        const data = await response.json();

        existingLoading.classList.add('hidden-ui');

        if (response.ok && data.success && data.monsters.length > 0) {
            renderExistingMonsters(data.monsters);
        } else {
            existingCreaturesList.innerHTML = '<div class="monster-empty-message">No saved creatures found for this campaign.</div>';
        }
    } catch (error) {
        console.error("Failed to load saved monsters:", error);
        existingLoading.classList.add('hidden-ui');
        existingCreaturesList.innerHTML = '<span class="monster-error-message">Failed to load saved creatures.</span>';
    }
});

closeExistingModalBtn.addEventListener('click', () => {
    existingCreaturesModal.close();
    closeExistingModalBtn.blur();
});

function renderExistingMonsters(savedMonsters) {
    existingCreaturesList.innerHTML = '';

    savedMonsters.forEach(monster => {
        // Assuming your backend sends back the parsed JSON in a 'data' or 'stats' field
        // Adjust 'monster.monster_data' based on exactly how your SQL row is returned!
        const monsterStats = typeof monster.monster_data === 'string'
            ? JSON.parse(monster.monster_data)
            : monster.monster_data;

        const div = document.createElement('div');
        div.className = 'monster-list-item';
        // Show the name, maybe append a little visual indicator that it's saved
        div.innerText = monsterStats.name;

        div.addEventListener('click', () => {
            // Close the existing list modal
            existingCreaturesModal.close();

            // Re-use our original data variable so the Confirm button works normally!
            selectedMonsterOriginalData = monsterStats;

            // Populate the Edit View with the saved default stats
            monsterSearchTitle.innerText = `Edit`;
            monsterEditName.value = monsterStats.name;
            monsterEditHp.value = monsterStats.hit_points || 0;

            const acData = monsterStats.armor_class;
            monsterEditAc.value = (acData && acData.length > 0) ? acData[0].value : 10;

            monsterEditStr.value = monsterStats.strength || 10;
            monsterEditDex.value = monsterStats.dexterity || 10;
            monsterEditCon.value = monsterStats.constitution || 10;
            monsterEditInt.value = monsterStats.intelligence || 10;
            monsterEditWis.value = monsterStats.wisdom || 10;
            monsterEditCha.value = monsterStats.charisma || 10;

            // Roll fresh initiative
            const dex = monsterStats.dexterity || 10;
            const dexMod = Math.floor((dex - 10) / 2);
            const roll = Math.floor(Math.random() * 20) + 1;
            monsterEditInitiative.value = roll + dexMod;

            // Hide the search views and show the edit view!
            monsterSearchView.classList.add('hidden-ui');
            monsterEditView.classList.remove('hidden-ui');
            monsterSearchModal.showModal(); // Open the edit modal
        });

        existingCreaturesList.appendChild(div);
    });
}

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
        } 
        else {
            hideAudioPlayer();
            const assets = await loadAssets(assetType);
            currentAssetsCache = assets;
            assetSearchInput.value = '';
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

            if (activeAssetType === 'audio') {
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
            currentAssetsCache = freshAssets
            assetSearchInput.value = ''
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
        roundsRemaining: Number(effectDurationInput.value)
    })
    effectNameInput.value = '';
    effectDurationInput.value = '';
})

// Shop Toggle
const shopBtn = document.getElementById('shop-btn');

shopBtn.addEventListener('click', () => {
    shopBtn.blur();
    socket.emit('shop:toggle', { isOpen: !isShopOpen() })
});

// Rest Approval
const restApprovalModal = document.getElementById('rest-approval-modal');
const restApprovalText = document.getElementById('rest-approval-text');
const restApproveBtn = document.getElementById('rest-approve-btn');
const restDenyBtn = document.getElementById('rest-deny-btn');

let restRequestQueue = [];

function showNextRestRequest() {
    const request = restRequestQueue[0];
    if (!request) {
        restApprovalModal.close();
        return;
    }
    restApprovalText.textContent = `${request.playerName} is requesting a ${request.restType === 'long' ? 'Long' : 'Short'} Rest.`;
    restApprovalModal.showModal();
}

socket.on('rest:approvalRequest', ({ playerUserId, playerName, restType }) => {
    restRequestQueue.push({ playerUserId, playerName, restType });
    if (restRequestQueue.length === 1) {
        showNextRestRequest();
    }
});

restApproveBtn.addEventListener('click', () => {
    const request = restRequestQueue.shift();
    if (!request) return;
    socket.emit('rest:respond', { playerUserId: request.playerUserId, restType: request.restType, approved: true });
    showNextRestRequest();
});

restDenyBtn.addEventListener('click', () => {
    const request = restRequestQueue.shift();
    if (!request) return;
    socket.emit('rest:respond', { playerUserId: request.playerUserId, restType: request.restType, approved: false });
    showNextRestRequest();
});

// Reset Map
const resetMapBtn = document.getElementById('reset-map-btn');

resetMapBtn.addEventListener('click', () => {
    socket.emit('map:reset');
    resetMapBtn.blur();
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

    const assets = await loadAssets('audio')
    currentAssetsCache = assets; // <-- Update cache
    assetSearchInput.value = ''; // <-- Clear search bar
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
loadAssets(activeAssetType).then(assets => {
    currentAssetsCache = assets;
    renderAssets(assets, activeAssetType);
})