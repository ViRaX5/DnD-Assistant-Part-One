export function setupUIInteractions() {
    // Navbar Page Switch
    navbarPageSwitch();
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
