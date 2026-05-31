export function setupUIInteractions() {
    // Active Effects Pop-up
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
