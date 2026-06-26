import { addChatMessage } from './chat.js';

// Smoothly animates `element`'s height between its size before and after `applyChange`
// runs, by measuring both states and transitioning a temporary inline height between
// them (CSS can't transition to/from a content-based "auto" height directly). Any
// flex sibling with flex:1 will appear to grow/shrink in lockstep for free, since the
// browser recalculates the flex layout on every frame of the transition.
function animateHeightChange(element, applyChange, onComplete) {
    if (element._pendingHeightHandler) {
        element.removeEventListener('transitionend', element._pendingHeightHandler);
        element._pendingHeightHandler = null;
    }

    const startHeight = element.getBoundingClientRect().height;

    applyChange();

    const endHeight = element.getBoundingClientRect().height;

    if (Math.abs(endHeight - startHeight) < 1) {
        if (onComplete) onComplete();
        return;
    }

    element.style.overflow = 'hidden';
    element.style.height = `${startHeight}px`;

    requestAnimationFrame(() => {
        element.style.transition = 'height 0.25s ease';
        element.style.height = `${endHeight}px`;
    });

    const handleTransitionEnd = (e) => {
        if (e.propertyName === 'height') {
            element.style.height = '';
            element.style.overflow = '';
            element.style.transition = '';
            element.removeEventListener('transitionend', handleTransitionEnd);
            element._pendingHeightHandler = null;
            if (onComplete) onComplete();
        }
    };

    element._pendingHeightHandler = handleTransitionEnd;
    element.addEventListener('transitionend', handleTransitionEnd);
}

export function setupUIInteractions() {
    // Navbar Page Switch
    navbarPageSwitch();

    // Navbar End / Exit Session
    navbarExitSession();

    // Player Info Page Toggle
    playerInfoToggle();

    // Dice Tray Interaction
    diceTrayInteraction();

    // Active Effects Pop-up
    activeEffectsPopUp();

    // Actions Hover Pop-up
    actionsHoverPopUp();

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

function navbarExitSession() {
    const endSession = document.getElementsByClassName("end-session")[0];
    const endSessionModal = document.getElementById("end-session-modal");
    const cancelEndSessionButton = document.getElementById("cancel-end-session");
    const confirmEndSessionButton = document.getElementById("confirm-end-session");

    endSession.addEventListener('click', () => {
        endSessionModal.showModal()
        cancelEndSessionButton.blur()
    });

    cancelEndSessionButton.addEventListener('click', () => {
        endSessionModal.close()
        endSession.blur()
    })

    confirmEndSessionButton.addEventListener('click', () => {
        /* some save to database logic that needs to come in the future */
        window.location.href = "campaignList.html"
    })
}

function playerInfoToggle() {
    const toggleBtn = document.getElementById("info-page-toggle-btn");
    const page1 = document.getElementById("info-page-1");
    const page2 = document.getElementById("info-page-2");
    const leftPanel = document.getElementById("player-info-main-left");
    const playerInfoFooter = document.getElementById("player-info-footer");
    const playerInfo = document.getElementById("player-info");

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            animateHeightChange(playerInfo, () => {
                page1.classList.toggle("hidden-page");
                page2.classList.toggle("hidden-page");
                leftPanel.classList.toggle("hidden-page");
                playerInfoFooter.classList.toggle("hidden-page");

                if (page1.classList.contains("hidden-page")) {
                    toggleBtn.textContent = "Main Stats";

                } else {
                    toggleBtn.textContent = "Skills & Saves";
                }
            });
        });
    }
}

function diceTrayInteraction() {
    let selectedDice = [];
    let trayContentVisible = false;

    const diceGrid = document.getElementById("dice-grid");
    const diceTray = document.getElementById("dice-tray-area");
    const diceRollerOuter = document.getElementById("dice-roller-outer");
    const rollButton = document.getElementById("roll-button");

    function setElementVisible(element, visible, displayValue) {
        // Clear out any not-yet-fired hide listener from a previous call, so it
        // can't fire later and stomp on a transition it was never meant to see.
        if (element._pendingHideHandler) {
            element.removeEventListener('transitionend', element._pendingHideHandler);
            element._pendingHideHandler = null;
        }

        if (visible) {
            element.style.display = displayValue;
            requestAnimationFrame(() => {
                element.classList.add("fade-visible");
            });
        }
        else {
            element.classList.remove("fade-visible");

            const handleTransitionEnd = (e) => {
                if (e.propertyName === 'opacity') {
                    element.style.display = 'none';
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    element._pendingHideHandler = null;
                }
            };

            element._pendingHideHandler = handleTransitionEnd;
            element.addEventListener('transitionend', handleTransitionEnd);
        }
    }

    function groupDiceByType(diceList) {
        const order = [...new Set(diceList)];
        const counts = {};
        diceList.forEach((die) => {
            counts[die] = (counts[die] || 0) + 1;
        });

        return { order, counts };
    }

    function buildTrayHtml() {
        const { order, counts } = groupDiceByType(selectedDice);

        let htmlString = '';
        order.forEach((die) => {
            const quantity = counts[die];
            const countBadge = quantity > 1 ? `<span class="die-tray-count">x${quantity}</span>` : '';

            htmlString += `<div class="die-tray-entry" data-die="${die}">
                <img class="die-tray-img" src="./images/${die}.png" alt="${die}" />
                ${countBadge}
            </div>`;
        });

        return htmlString;
    }

    function renderTray() {
        const hasDice = selectedDice.length > 0;

        if (hasDice && !trayContentVisible) {
            // Box is currently collapsed: grow it first (with the tray/button laid out
            // but invisible, just for correct measurement), then fade them in once
            // there's actually room, to avoid overlapping the dice grid.
            trayContentVisible = true;
            animateHeightChange(diceRollerOuter, () => {
                diceTray.innerHTML = buildTrayHtml();
                diceTray.style.display = 'flex';
                rollButton.style.display = 'block';
            }, () => {
                setElementVisible(diceTray, true, 'flex');
                setElementVisible(rollButton, true, 'block');
            });
        }
        else if (hasDice) {
            // Already visible: just update the content, smoothly resizing if the
            // tray's own height changed (e.g. wrapped to a second row).
            animateHeightChange(diceRollerOuter, () => {
                diceTray.innerHTML = buildTrayHtml();
            });
        }
        else if (trayContentVisible) {
            // No dice left: fade the tray/button out first, then shrink the box
            // once they're gone, so the box doesn't squeeze them while still visible.
            trayContentVisible = false;
            setElementVisible(diceTray, false);
            setElementVisible(rollButton, false);

            const handleFadeOutDone = (e) => {
                if (e.target !== diceTray || e.propertyName !== 'opacity') return;
                diceTray.removeEventListener('transitionend', handleFadeOutDone);
                animateHeightChange(diceRollerOuter, () => {
                    diceTray.innerHTML = '';
                });
            };
            diceTray.addEventListener('transitionend', handleFadeOutDone);
        }
        else {
            // Already empty and already collapsed - nothing to animate.
            diceTray.innerHTML = '';
        }
    }

    function rollSelectedDice(diceList) {
        const { order, counts } = groupDiceByType(diceList);

        let total = 0;
        const segments = order.map((dieType) => {
            const quantity = counts[dieType];
            const maxNumber = parseInt(dieType.substring(1));

            const rolls = [];
            for (let i = 0; i < quantity; i++) {
                const result = Math.floor(Math.random() * maxNumber) + 1;
                rolls.push(result);
                total += result;
            }

            return `${rolls.join(", ")} (${quantity}${dieType})`;
        });

        return { rollString: segments.join(" and "), total };
    }

    diceGrid.addEventListener('click', (e) => {
        const dieButton = e.target.closest('.die-button');

        if (!dieButton) return;

        const clickedDie = dieButton.getAttribute('data-die');

        selectedDice.push(clickedDie);
        renderTray();
    });

    diceTray.addEventListener('click', (e) => {
        const trayEntry = e.target.closest('.die-tray-entry');

        if (!trayEntry) return;

        const dieType = trayEntry.getAttribute('data-die');
        const index = selectedDice.indexOf(dieType);

        if (index !== -1) {
            selectedDice.splice(index, 1);
        }

        renderTray();
    });

    renderTray();

    rollButton.addEventListener('click', () => {
        if (selectedDice.length === 0) {
            addChatMessage("Please select a die first!", "system-msg");
            return;
        }

        const rollData = rollSelectedDice(selectedDice);

        let message = '';

        if (window.location.pathname.endsWith("playerScreen.html")) {
            const playerName = document.getElementById("player-name").textContent || "Unknown Hero";

            message = `${playerName} rolled: ${rollData.rollString}.`;
        }
        else {
            message = `DM rolled: ${rollData.rollString}.`;
        }

        if (selectedDice.length > 1) {
            message += ` (Total: ${rollData.total})`;
        }

        addChatMessage(message, "system-msg");

        selectedDice = [];
        renderTray();
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

function actionsHoverPopUp() {
    const actionWrappers = document.querySelectorAll(".action-wrapper");

    actionWrappers.forEach((wrapper) => {
        wrapper.addEventListener('mouseenter', () => {
            wrapper.classList.add("is-open");
        });

        wrapper.addEventListener('mouseleave', () => {
            wrapper.classList.remove("is-open");
        });
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
