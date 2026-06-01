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

const combatTracker1 = {
    currentTurn: { id: 2, name: "Player 2", initiative: 10 },
    upcoming: [
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 },
        { id: 3, name: "Goblin", initiative: 8 },
        { id: 1, name: "Player 1", initiative: 14 }
    ]
};
const combatTracker2 = {};

const activeAssetts = assetsDB1;
let activeCombatTracker = JSON.parse(JSON.stringify(combatTracker1));
const activeMaps = mapsDB1;
const activeAudio = audioDB1;

const currentPlayerContainer = document.getElementById('current-player-container');
const nextInitiativesContainer = document.getElementById('next-initiatives-container');
const assetsGrid = document.getElementById('assets-grid');

const prevBtn = document.getElementById('prev-turn-btn');
const nextBtn = document.getElementById('next-turn-btn');
const addInitBtn = document.getElementById('add-initiative-btn');
const initModal = document.getElementById('add-initiative-modal');
const closeInitModal = document.getElementById('close-initiative-modal');
const assetTabs = document.querySelectorAll('.assets-tabs button');

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
        btn.addEventListener('click', (e) => handleRemoveEntity(e.target.dataset.id));
    });
}

function renderAssets(assetsData) {
    assetsGrid.innerHTML = '';
    if (!assetsData || assetsData.length === 0) {
        assetsGrid.innerHTML = `<span style="grid-column: span 2; text-align: center; color: #63748c; padding-top: 20px;">No assets found</span>`;
        return; 
    }
    assetsData.forEach(asset => {
        if (!asset.name) return; 
        const token = document.createElement('div');
        token.className = 'asset-item';
        token.innerText = asset.name;
        assetsGrid.appendChild(token);
    });
}

function handleNextTurn() {
    if (activeCombatTracker.upcoming.length === 0) return; 
    const oldCurrent = activeCombatTracker.currentTurn;
    activeCombatTracker.currentTurn = activeCombatTracker.upcoming.shift(); 
    if (oldCurrent) activeCombatTracker.upcoming.push(oldCurrent); 
    renderCombatTracker(activeCombatTracker);
}

function handlePrevTurn() {
    if (activeCombatTracker.upcoming.length === 0) return; 
    const oldCurrent = activeCombatTracker.currentTurn;
    activeCombatTracker.currentTurn = activeCombatTracker.upcoming.pop(); 
    if (oldCurrent) activeCombatTracker.upcoming.unshift(oldCurrent); 
    renderCombatTracker(activeCombatTracker);
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

nextBtn.addEventListener('click', handleNextTurn);
prevBtn.addEventListener('click', handlePrevTurn);

addInitBtn.addEventListener('click', () => initModal.showModal());
closeInitModal.addEventListener('click', () => initModal.close());

assetTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
        assetTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const tabName = e.target.innerText.toLowerCase();
        if (tabName === 'tokens') renderAssets(assetsDB1);
        else if (tabName === 'maps') renderAssets(activeMaps);
        else if (tabName === 'audio') renderAssets(activeAudio);
    });
});

renderCombatTracker(activeCombatTracker);
renderAssets(activeAssetts);