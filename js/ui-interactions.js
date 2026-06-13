import { addChatMessage } from './chat.js';

export function setupUIInteractions() {
    // Navbar Page Switch
    navbarPageSwitch();

    // Dice Tray Interaction
    diceTrayInteraction();

    // Active Effects Pop-up
    activeEffectsPopUp();

    // Nav Footer Switch
    navFooterSwitch();
}

function navbarPageSwitch() {
    const playerPageButton = document.getElementsByClassName("player");
    const DMPageButton = document.getElementsByClassName("DM");

    const currentPath = window.location.pathname;

    playerPageButton[0].addEventListener('click', () => {
        if (!currentPath.endsWith("playerScreen.html")) {
            window.location.href = "playerScreen.html";
        }
    });

    DMPageButton[0].addEventListener('click', () => {
        if (!currentPath.endsWith("DMScreen.html")) {
            window.location.href = "DMScreen.html";
        }
    });
}

function diceTrayInteraction() {
    let selectedDie = null;
    let diceAmount = 1;

    const diceGrid = document.getElementById("dice-grid");
    const diceTray = document.getElementById("dice-tray-area");
    const diceQuantityAmount = document.getElementById("quantity-amount");

    const plusBtn = document.getElementById("plus-quantity");
    const minusBtn = document.getElementById("minus-quantity");
    diceQuantityAmount.textContent = diceAmount;

    function renderTray() {
        diceQuantityAmount.textContent = diceAmount;

        diceTray.innerHTML = '';

        if (!selectedDie) {
            return;
        }

        let htmlString = '';
        for (let i = 0; i < diceAmount; i++) {
            htmlString += `<img class="die-tray-img" src="./images/${selectedDie}.png" alt="${selectedDie}" />`;
        }

        diceTray.innerHTML = htmlString;
    }

    function rollDice(dieType, quantity) {
        const maxNumber = parseInt(dieType.substring(1));

        let rolls = [];
        let total = 0;

        for (let i = 0; i < quantity; i++) {
            const result = Math.floor(Math.random() * maxNumber) + 1;
            rolls.push(result);
            total += result;
        }

        return { rolls, total };
    }

    diceGrid.addEventListener('click', (e) => {
        const dieButton = e.target.closest('.die-button');

        if (!dieButton) return;

        const clickedDie = dieButton.getAttribute('data-die');

        if (selectedDie !== clickedDie) {
            selectedDie = clickedDie;
            diceAmount = 1;
            renderTray();
        }
        else {
            diceAmount = 0;
            selectedDie = null;
            renderTray();
        }
    });

    minusBtn.addEventListener('click', () => {
        if (selectedDie && diceAmount > 1) {
            diceAmount--;
            renderTray();
        }
    });

    plusBtn.addEventListener('click', () => {
        if (selectedDie) {
            diceAmount++;
            renderTray();
        }
    });

    renderTray();

    const rollButton = document.getElementById("roll-button");

    rollButton.addEventListener('click', () => {
        if (!selectedDie) {
            addChatMessage("Please select a die first!", "system-msg");
            return;
        }

        const rollData = rollDice(selectedDie, diceAmount);

        const rollString = rollData.rolls.join(" and ");

        let message = '';

        if (window.location.pathname.endsWith("playerScreen.html")) {
            const playerName = document.getElementById("player-name").textContent || "Unknown Hero";

            message = `${playerName} rolled: ${rollString} on ${diceAmount}${selectedDie}.`;
        }
        else {
            message = `DM rolled: ${rollString} on ${diceAmount}${selectedDie}.`;
        }



        if (diceAmount > 1) {
            message += ` (Total: ${rollData.total})`;
        }

        addChatMessage(message, "system-msg");
    });
}

function activeEffectsPopUp() {
    const activeEffectsButton = document.getElementById("active-effects");
    const activeEffectsWrapper = document.getElementById("active-effects-wrapper");

    activeEffectsButton.addEventListener('click', () => {
        activeEffectsWrapper.classList.toggle("is-open");
    });

    document.addEventListener('click', (event) => {
        const isOpen = activeEffectsWrapper.classList.contains("is-open");

        const clickedOutside = !activeEffectsWrapper.contains(event.target);

        if (isOpen && clickedOutside) {
            activeEffectsWrapper.classList.remove("is-open");
        }
    });
}

function navFooterSwitch() {
    const infoButton = document.getElementById("nav-info-btn");
    const mapButton = document.getElementById("nav-map-btn");
    const diceButton = document.getElementById("nav-dice-btn");

    const leftPanel = document.getElementById("left-panel");
    const mainPanel = document.getElementById("main");
    const rightPanel = document.getElementById("right-panel");

    function resetViews() {
        infoButton.classList.remove("active");
        mapButton.classList.remove("active");
        diceButton.classList.remove("active");

        leftPanel.classList.remove("mobile-active");
        mainPanel.classList.remove("mobile-active");
        rightPanel.classList.remove("mobile-active");
    }

    infoButton.addEventListener('click', () => {
        resetViews();
        infoButton.classList.add("active");
        leftPanel.classList.add("mobile-active");
    });

    mapButton.addEventListener('click', () => {
        resetViews();
        mapButton.classList.add("active");
        mainPanel.classList.add("mobile-active");
    });

    diceButton.addEventListener('click', () => {
        resetViews();
        diceButton.classList.add("active");
        rightPanel.classList.add("mobile-active");
    });
}
