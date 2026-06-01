export function renderPlayerInfo(data) {
    document.getElementById("player-name").textContent = data.name;
    document.getElementById("player-character-summary").textContent = `${data.race} ${data.class} Level ${data.level}`;
    document.getElementById("xp-amount").textContent = data.xp;

    // Attributes
    document.getElementById("strength-modifier").textContent = data.attributes.strength.modifier;
    document.getElementById("strength-amount").textContent = data.attributes.strength.score;
    document.getElementById("dexterity-modifier").textContent = data.attributes.dexterity.modifier;
    document.getElementById("dexterity-amount").textContent = data.attributes.dexterity.score;
    document.getElementById("constituition-modifier").textContent = data.attributes.constituition.modifier;
    document.getElementById("constituition-amount").textContent = data.attributes.constituition.score;
    document.getElementById("intelligence-modifier").textContent = data.attributes.intelligence.modifier;
    document.getElementById("intelligence-amount").textContent = data.attributes.intelligence.score;
    document.getElementById("wisdom-modifier").textContent = data.attributes.wisdom.modifier;
    document.getElementById("wisdom-amount").textContent = data.attributes.wisdom.score;
    document.getElementById("charisma-modifier").textContent = data.attributes.charisma.modifier;
    document.getElementById("charisma-amount").textContent = data.attributes.charisma.score;

    // Combat Stats
    document.getElementById("armor-class-amount").textContent = data.combat.armorClass;
    document.getElementById("initiative-amount").textContent = data.combat.initiative;
    document.getElementById("speed-amount").textContent = data.combat.speed;

    // Health
    document.getElementById("hit-points-amount").textContent = data.health.current;
    document.getElementById("hit-point-max").textContent = data.health.max;

    // Skills
    if (data.skills) {
        renderSkills(data.skills);
    }

    // Attacks
    if (data.attacks) {
        renderAttacks(data.attacks);
    }
}

function renderSkills(skillsData) {
    const skillList = document.getElementById("skill-list");

    skillList.innerHTML = '';

    let htmlString = '';

    skillsData.forEach(skill => {
        if (skill.proficient === true) {
            htmlString +=
                `<div class="skill-toggle">
            <input
              type="checkbox"
              id="${skill.id}"
              name="skills"
              value="${skill.id}"
              checked
            />
            <label for="${skill.id}">${skill.modifier} ${skill.name} (${skill.attribute})</label>
        </div>`;
        }
        else {
            htmlString +=
                `<div class="skill-toggle">
            <input
              type="checkbox"
              id="${skill.id}"
              name="skills"
              value="${skill.id}"
            />
            <label for="${skill.id}">${skill.modifier} ${skill.name} (${skill.attribute})</label>
        </div>`;
        }
    });

    skillList.innerHTML = htmlString;
}

function renderAttacks(attacksData) {
    const attacksList = document.getElementById("player-info-footer");

    attacksList.innerHTML = '';

    let htmlString = '';

    attacksData.forEach(attack => {
        if (attack.bonus === "N/A" || attack.bonus === "n/a") {
            htmlString +=
                `<div id="${attack.id}" class="attack-container">
              <span class="weapon-name">${attack.name}</span>
              <span class="damage-dice">${attack.damage}</span>
            </div>`;
        }
        else {
            htmlString +=
                `<div id="${attack.id}" class="attack-container">
              <span class="weapon-name">${attack.name}</span>
              <span class="attack-bonus">${attack.bonus}</span>
              <span class="damage-dice">${attack.damage}</span>
            </div>`;
        }
    });

    attacksList.innerHTML = htmlString;
}