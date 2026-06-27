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

let activeAssetType = 'token';

async function loadAssets(assetType) {
    // TODO: replace with a real fetch to /api/DM/getAsset once the backend
    // wiring for this panel is ready.
    return mockAssetsByType[assetType] || [];
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

const addEffectBtn = document.getElementsByClassName('add-effect-btn')[0];
const addEffectModal = document.getElementById('add-effect-modal');
const closeAddEffectModal = document.getElementById('close-add-effect-modal');
const addEffectModalBtn = document.getElementById('add-effect-modal-button');
const activeEffectsBtn = document.getElementById("active-effects");
const effectNameInput = document.getElementById('effect-name-input');
const effectDurationInput = document.getElementById('effect-duration-input');
const effectsListPopup = document.getElementsByClassName('effects-list')[0];

function renderCombatTracker(combatData) {
    if (!combatData || (!combatData.currentTurn && combatData.upcoming.length === 0)) {
        currentPlayerContainer.innerHTML = `<span style="color: #63748c;">No active combat</span>`;
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
        currentPlayerContainer.innerHTML = `<span style="color: #63748c;">No current player</span>`;
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
    const addButtonHtml = `<div id="add-asset-item" class="asset-item">${ASSET_TYPE_LABELS[assetType] || 'Add Asset'}</div>`;

    assetsGrid.innerHTML = '';
    if (!assetsData || assetsData.length === 0) {
        assetsGrid.innerHTML += addButtonHtml;
        assetsGrid.innerHTML += `<span class="no-assets-message">No assets found</span>`;
        return;
    }
    assetsData.forEach(asset => {
        if (!asset.name) return;
        const token = document.createElement('div');
        const info = document.createElement('span')
        token.className = 'asset-item';
        info.innerText = asset.name;
        token.appendChild(info);
        assetsGrid.appendChild(token);
    });
    assetsGrid.innerHTML += addButtonHtml;
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

assetTabs.forEach(tab => {
    tab.addEventListener('click', async (e) => {
        assetTabs.forEach(t => {
            t.classList.remove('active')
            t.classList.add('not-active')
        });
        e.target.classList.add('active')
        e.target.classList.remove('not-active')
        e.target.blur()

        const tabName = e.target.innerText.toLowerCase();
        const assetType = TAB_TO_ASSET_TYPE[tabName];
        if (!assetType) return;

        activeAssetType = assetType;
        const assets = await loadAssets(assetType);
        renderAssets(assets, assetType);
    });
});

// #add-asset-item is recreated on every renderAssets() call, so this listener
// is attached once to the grid itself rather than to the button directly.
assetsGrid.addEventListener('click', (e) => {
    const addButton = e.target.closest('#add-asset-item');
    if (addButton) {
        // TODO: open the add-asset popup for activeAssetType once it's built.
        console.log(`TODO: open add-${activeAssetType} popup`);
    } else {
        console.log(e.target);
    }
});

// Add Effects
addEffectBtn.addEventListener('click', () => {
    addEffectModal.showModal()
    addEffectBtn.blur()
});
closeAddEffectModal.addEventListener('click', () => {
    addEffectModal.close()
    addEffectModal.blur()
});

const activeEffects = [];

function renderEffects() {
    effectsListPopup.innerHTML = '';
    activeEffects.forEach(effect => {
        effectsListPopup.innerHTML += `<div class="effect-item">${effect.name}: ${effect.duration}</div>`
    })
}

addEffectModalBtn.addEventListener('click', () => {
    activeEffects.push(
        {
            name: effectNameInput.value,
            duration: effectDurationInput.value
        }
    )
    effectNameInput.value = '';
    effectDurationInput.value = '';
    renderEffects();
})

renderCombatTracker(activeCombatTracker);
loadAssets(activeAssetType).then(assets => renderAssets(assets, activeAssetType));