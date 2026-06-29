export function renderEquipmentAndTraits(data) {
    // Currency
    if (data.currency) {
        renderCurrency(data.currency);
    }

    // Traits
    if (data.traits) {
        renderTraits(data.traits);
    }

    // Equipment
    if (data.equipment) {
        renderEquipment(data.equipment);
    }

}

function renderCurrency(currencyData) {
    document.querySelector("#gold-amount .currency-value").textContent = currencyData.gold;
    document.querySelector("#silver-amount .currency-value").textContent = currencyData.silver;
    document.querySelector("#copper-amount .currency-value").textContent = currencyData.copper;
}

function renderTraits(traitsData) {
    const traitsList = document.getElementById("equipment-and-traits-middle");

    traitsList.innerHTML = '';

    let htmlString = '';

    traitsData.forEach(trait => {
        htmlString +=
            `<div class="trait">
              <span class="trait-name">${trait.name}</span>
              <span class="trait-description"
                >${trait.description}</span
              >
            </div>`;
    });

    traitsList.innerHTML = htmlString;
}

function renderEquipment(equipmentData) {
    const eqipmentList = document.getElementById("equipment-and-traits-bottom");

    eqipmentList.innerHTML = '';

    let htmlString = '';

    equipmentData.forEach(equipment => {
        htmlString +=
            `<div class="equipment">
              <span class="equipment-name">${equipment.name}</span>
              <span class="equipment-modifier">${equipment.modifier}</span>
            </div>`;
    });

    eqipmentList.innerHTML = htmlString;
}