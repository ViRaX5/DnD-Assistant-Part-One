const log_out = document.getElementsByClassName("log-out")[0]
const log_out_modal = document.getElementById("logout-modal")
const cancel_logout_button = document.getElementById("cancel-logout")
const confirm_logout_button = document.getElementById("confirm-logout")
const player_button = document.getElementsByClassName("player")[0]
const dm_button = document.getElementsByClassName("DM")[0]
const logo = document.getElementsByClassName("logo")[0]
const button_container = document.getElementsByClassName("buttons-placeholder")[0]
const dmAbandonModal = document.getElementById("dm-abandon-modal")
const dmModalCampaignName = document.getElementById("dm-modal-campaign-name")
const dmModalPlayerList = document.getElementById("dm-modal-player-list")
const cancelDmAbandonBtn = document.getElementById("cancel-dm-abandon")
const confirmDmAbandonBtn = document.getElementById("confirm-dm-abandon")
const dmErrorMessage = document.getElementById("dm-error-message")
const playerAbandonModal = document.getElementById("player-abandon-modal")
const playerModalCampaignName = document.getElementById("player-modal-campaign-name")
const cancelPlayerAbandonBtn = document.getElementById("cancel-player-abandon")
const confirmPlayerAbandonBtn = document.getElementById("confirm-player-abandon")
const deleteCampaignModal = document.getElementById("delete-campaign-modal")
const cancelDeleteBtn = document.getElementById("cancel-delete-campaign")
const confirmDeleteBtn = document.getElementById("confirm-delete-campaign")

const campaigns_info = [
    {
        "campaign_id": 1, "campaign_name": "test1", "participants": ["name1", "name2", "name3"], "participants_id": [1, 2, 3]
    },
    {
        "campaign_id": 2, "campaign_name": "test1", "participants": ["name1", "name2", "name3", "name4", "name5"], "participants_id": [1, 2, 3, 4, 5]
    },
    {
        "campaign_id": 3, "campaign_name": "test1", "participants": ["name1", "name2", "name3"], "participants_id": [1, 2, 3]
    }
]

const campaigns1 = [
    {
        "campaign_id": 1, "campaign_name": "test1", "status": "player", "character_name": "Steve Rogers"
    },
    {
        "campaign_id": 2, "campaign_name": "test2", "status": "DM", "amout_of_players": "5"
    },
    {
        "campaign_id": 3, "campaign_name": "test3", "status": "player", "character_name": "Crash Bandicot"
    }
]

const tempID = getUserIdFromToken()


let campaigns = []
const campaignContainerSection = document.querySelector('.campaigns-container')
const noCampaignContainerSection = document.querySelector('.no-campaigns-container')
async function loadPage() {
    campaignContainerSection.innerHTML = ''
    noCampaignContainerSection.innerHTML = ''
    button_container.innerHTML = ''

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/campaignListID`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
        const data = await response.json()
        if (response.ok && data.success) {
            campaigns = data.campaigns
        }
        else {
            console.error("Backend sent an error: ", data.error)
        }
    }
    catch (err) {
        console.error("Error communicationg with backend:", err)
    }

    if (campaigns.length === 0) {
        noSessions()
    }
    else {
        noCampaignContainerSection.style.display = 'none'
        campaignContainerSection.style.display = ''
        campaigns.forEach(campaign => {
            if (campaign.users_role === "player") {
                displayPlayerSessions(campaign)
            }
            else if (campaign.users_role === "DM") {
                displayDMSessions(campaign)
            }
            else {
                console.log("NOT A PLAYER OR A DM!!!")
            }
        })
        addButtons(campaignContainerSection)
    }

}

loadPage()

campaignContainerSection.addEventListener('click', async (e) => {
    if (e.target.classList.contains('join-button')) {
        const campaignId = e.target.closest('.campaign-instance').dataset.id
        sessionStorage.setItem('activeCampaignId', campaignId)
        window.location.href = `./playerScreen.html`
    }
    else if (e.target.classList.contains('start-session-button')) {
        const campaignId = e.target.closest('.campaign-instance').dataset.id
        sessionStorage.setItem('activeCampaignId', campaignId)
        window.location.href = `./DMScreen.html`
    }
    else if (e.target.classList.contains('abandon-button')) {
        const relevantCampaign = e.target.closest('.campaign-instance')
        const campaignId = relevantCampaign.dataset.id
        const campaignName = relevantCampaign.dataset.name

        if (relevantCampaign.classList.contains('dm-campaign')) {
            dmModalCampaignName.innerText = campaignName
            dmModalPlayerList.innerHTML = ''
            dmErrorMessage.innerText = ''

            confirmDmAbandonBtn.dataset.campaignId = campaignId

            try {
                const response = await fetchWithAuth(`${BASE_URL}/api/campaignListCampaignAndDM?id=${campaignId}`, {
                    method: "GET",
                    headers: { 'Content-Type': 'application/json' }
                })
                const data = await response.json()
                const matchedCampaign = data.campaign
                if (matchedCampaign.length === 0) {
                    confirmDeleteBtn.dataset.campaignId = campaignId
                    deleteCampaignModal.showModal()
                }
                else {
                    matchedCampaign.forEach(user => {
                        const li = document.createElement('li')
                        li.innerHTML = `
                        <label>
                        <input type="radio" name="new-dm" value="${user.user_id}">
                        ${user.first_name} ${user.last_name}
                        </label>
                        `
                        dmModalPlayerList.appendChild(li)
                    })

                    dmAbandonModal.showModal()
                }
            }
            catch (err) {
                console.error("Failed to fetch campaign:", err)
            }
        }
        else if (relevantCampaign.classList.contains('player-campaign')) {
            playerModalCampaignName.innerText = campaignName
            confirmPlayerAbandonBtn.dataset.campaignId = campaignId
            playerAbandonModal.showModal()
        }
    }
})

function addButtons() {
    const buttonsContainer = document.createElement('div')
    const createButton = document.createElement('button')
    const joinButton = document.createElement('button')
    buttonsContainer.classList.add("buttons-container")
    createButton.classList.add("create-button")
    let htmlCreate = `<dialog id="create-new-campaign-modal">
                <h3>Create a new campaign!</h3>
            <p>By creating the campaign, you will become the campaign DM</p>
            <p>Enter the campaign name!</p>
            <input type="text" id="new-campaign-name" placeholder="Enter campaign name here">
            <input type="text" class="campaign-code" value="Generating..." readonly>
            <button class="copy-button">Copy!</button>
            <p>Send the code above to your party so they can join the campaign</p>
            <p>The adventure awaits!</p>

            <div id="create-error-message" class="form-error-message"></div>

            <button class="finish-create">Create Campaign!</button>
            <button type="button" id="cancel-create" class="cancel-button">
                Cancel
            </button>
            </dialog>`
    joinButton.classList.add("join-new-button")
    let htmlJoin = `<dialog id="join-new-campaign-modal">
                <form action="" class="join-new-campaign-form">
                    <div class="capaign-code">
                    <h3>Enter the campaign code</h3>
                    <p>This should be provided by the DM</p>
                    <input type="text" name="campaign-code" id="campaign-code" placeholder="Campaign Code">
                    </div>
                    <div class="character-name">
                    <h3>Enter your Character's name</h3>
                    <input type="text" name="character-name" id="character-name" placeholder="Character's Name">
                    </div>
                    
                    <div id="stage-1-error" class="form-error-message"></div>

                    <div class="initial-submit">
                        <button type="submit" id="btn-next-to-stage-2" class="continue-join">Continue</button>
                    <!-- this is a submit on porpuse to give the dm time to approve while you create the character -->
                    </div>
                </form>
                <form action="" class="character-info not-active">
                    <div id="stage-2-stats" class="character-info not-active">
                        <select name="characters-class" id="characters-class">
                            <option value="">Loading classes...</option>
                        </select>
                        <select name="characters-race" id="characters-race">
                            <option value="">Loading races...</option>
                        </select>
                        <div class="stats">
                            <div class="stat-group">
                                <input type="number" name="characters-str" id="characters-str" placeholder="Strength" min="0" max ="30">
                                <span id="mod-str" class="race-mod"></span>
                            </div>
                            <div class="stat-group">
                                <input type="number" name="characters-dex" id="characters-dex" placeholder="Dexterity"min="0" max ="30">
                                <span id="mod-dex" class="race-mod"></span>
                            </div>
                            <div class="stat-group">
                                <input type="number" name="characters-con" id="characters-con" placeholder="Constitution"min="0" max ="30">
                                <span id="mod-con" class="race-mod"></span>
                            </div>
                            <div class="stat-group">
                                <input type="number" name="characters-int" id="characters-int" placeholder="Inteligence" min="0" max ="30">
                                <span id="mod-int" class="race-mod"></span>
                            </div>
                            <div class="stat-group">
                                <input type="number" name="characters-wis" id="characters-wis" placeholder="Wisdom" min="0" max ="30">
                                <span id="mod-wis" class="race-mod"></span>
                            </div>
                            <div class="stat-group">
                                <input type="number" name="characters-cha" id="characters-cha" placeholder="Charisma" min="0" max ="30">
                                <span id="mod-cha" class="race-mod"></span>
                            </div>
                        </div>
                        <div id="equipment-container" >
                        </div>
                        <div id="stage-2-error" class="form-error-message"></div>
                        <div class="final-submit">
                            <button type="button" id="continue-to-proficiencies" class="continue-join">Continue to Skills</button>
                        </div>
                    </div>
                    <div id="stage-3-proficiencies" class="character-info not-active">
                        <h3>Skills & Languages</h3>
                        <div id="class-proficiencies-container"></div>
                        <div id="race-proficiencies-container"></div>
                        
                        <div id="join-error-message" class="form-error-message"></div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button type="button" id="back-to-stats" class="cancel-button">Back</button>
                            <button type="submit" id="btn-final-join" class="finish-join">Join the Adventure</button>
                        </div>
                    </div>
                </form>
              <button type="button" id="cancel-join" class="cancel-button">
                Cancel
              </button>
            </dialog>`

    let htmlSubModal = `
    <dialog id="sub-equipment-modal">
        <h3 id="sub-equip-title">Choose an Item</h3>
        <p">Select one item to fulfill this choice.</p>
        <div id="sub-equip-grid" class="equip-grid"></div>
        <button type="button" id="cancel-sub-equip" class="cancel-button">
            Cancel
        </button>
    </dialog>`

    let completeHTML = htmlJoin + htmlCreate + htmlSubModal
    createButton.innerText = "Create Campaign"
    joinButton.innerText = "Join Campaign"
    buttonsContainer.appendChild(joinButton)
    buttonsContainer.appendChild(createButton)
    button_container.appendChild(buttonsContainer)
    buttonsContainer.innerHTML += completeHTML

    const statInputs = document.querySelectorAll('.stats input')

    statInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            if (e.target.value !== "" && parseInt(e.target.value) < 0) {
                e.target.value = 0
            }
            else if (e.target.value !== "" && parseInt(e.target.value) > 30) {
                e.target.value = 30
            }

            const statName = e.target.id.split('-')[1]
            const targetSpan = document.getElementById(`mod-${statName}`)

            updateModifierDisplay(e.target, targetSpan)
        })
    })
}

function noSessions() {
    const noSessionsContainer = document.createElement('div')
    const messageContainer = document.createElement('div')
    const heading = document.createElement('h3')
    const message = document.createElement('p')

    noSessionsContainer.classList.add("no-session-container")
    messageContainer.classList.add("empty-state-message")
    heading.innerText = "You have no active campaigns"
    message.innerText = "It seems your adventure hasn't started yet\nJoin a party as a player or create new world as a DM!\nYour journey awaits!"

    messageContainer.appendChild(heading)
    messageContainer.appendChild(message)
    addButtons(messageContainer)
    noSessionsContainer.appendChild(messageContainer)

    campaignContainerSection.style.display = 'none'

    noCampaignContainerSection.appendChild(noSessionsContainer)
}

function displayDMSessions(campaign) {
    const campaignName = campaign.campaign_name
    const status = campaign.users_role
    const playerCount = campaign.amount_of_players

    const campaignInstance = document.createElement('div')
    const buttonsContainer = document.createElement('div')
    const campaignNameSpan = document.createElement('span')
    const statusSpan = document.createElement('span')
    const playerCountSpan = document.createElement('span')
    const startSessionButton = document.createElement('button')
    const abandonButton = document.createElement('button')

    campaignInstance.dataset.id = campaign.campaign_id
    campaignInstance.dataset.name = campaignName

    campaignInstance.classList.add('campaign-instance', 'dm-campaign')
    buttonsContainer.classList.add("instance-buttons-container")
    startSessionButton.classList.add('start-session-button')
    abandonButton.classList.add('abandon-button')

    campaignNameSpan.innerText = `Campaign name: ${campaignName}`
    statusSpan.innerText = `Status: ${status}`
    playerCountSpan.innerText = `Amount of players: ${playerCount}`
    startSessionButton.innerText = "Host Session"
    abandonButton.innerText = "Abandon Campaign"

    campaignInstance.appendChild(campaignNameSpan)
    campaignInstance.appendChild(statusSpan)
    campaignInstance.appendChild(playerCountSpan)
    campaignInstance.appendChild(buttonsContainer)
    buttonsContainer.appendChild(startSessionButton)
    buttonsContainer.appendChild(abandonButton)

    campaignContainerSection.appendChild(campaignInstance)
}

function displayPlayerSessions(campaign) {
    const campaignName = campaign.campaign_name
    const status = campaign.users_role
    const characterName = campaign.character_name

    const campaignInstance = document.createElement('div')
    const buttonsContainer = document.createElement('div')
    const campaignNameSpan = document.createElement('span')
    const statusSpan = document.createElement('span')
    const nameSpan = document.createElement('span')
    const joinButton = document.createElement('button')
    const abandonButton = document.createElement('button')

    campaignInstance.dataset.id = campaign.campaign_id
    campaignInstance.dataset.name = campaignName

    campaignInstance.classList.add('campaign-instance', 'player-campaign')
    buttonsContainer.classList.add("instance-buttons-container")
    joinButton.classList.add('join-button')
    abandonButton.classList.add('abandon-button')

    campaignNameSpan.innerText = `Campaign name: ${campaignName}`
    statusSpan.innerText = `Status: ${status}`
    nameSpan.innerText = `Character's name: ${characterName}`
    joinButton.innerText = "Join Session"
    abandonButton.innerText = "Abandon Campaign"

    campaignInstance.appendChild(campaignNameSpan)
    campaignInstance.appendChild(statusSpan)
    campaignInstance.appendChild(nameSpan)
    buttonsContainer.appendChild(joinButton)
    buttonsContainer.appendChild(abandonButton)
    campaignInstance.appendChild(buttonsContainer)

    campaignContainerSection.appendChild(campaignInstance)
}

player_button.addEventListener('click', () => {

    const dmCampaigns = document.querySelectorAll('.dm-campaign')
    const playerCampaigns = document.querySelectorAll('.player-campaign')


    if (player_button.classList.contains('not-clicked')) {
        if (dm_button.classList.contains('clicked')) {
            dm_button.classList.remove('clicked')
            dm_button.classList.add('not-clicked')
        }
        player_button.classList.remove('not-clicked')
        player_button.classList.add('clicked')
        dmCampaigns.forEach(campaign => {
            campaign.style.display = 'none'
        })
        playerCampaigns.forEach(campaign => campaign.style.display = '')
    }
    else {
        player_button.classList.remove('clicked')
        player_button.classList.add('not-clicked')
        dmCampaigns.forEach(campaign => campaign.style.display = '')
    }

    player_button.blur()
})

dm_button.addEventListener('click', () => {

    const dmCampaigns = document.querySelectorAll('.dm-campaign')
    const playerCampaigns = document.querySelectorAll('.player-campaign')

    if (dm_button.classList.contains('not-clicked')) {
        if (player_button.classList.contains('clicked')) {
            player_button.classList.remove('clicked')
            player_button.classList.add('not-clicked')
        }
        dm_button.classList.remove('not-clicked')
        dm_button.classList.add('clicked')

        playerCampaigns.forEach(campaign => campaign.style.display = 'none')
        dmCampaigns.forEach(campaign => campaign.style.display = '')
    }
    else {
        dm_button.classList.remove('clicked')
        dm_button.classList.add('not-clicked')
        playerCampaigns.forEach(campaign => campaign.style.display = '')
    }

    dm_button.blur()
})

logo.addEventListener('click', () => {
    logo.blur()
})

log_out.addEventListener('click', () => {
    log_out_modal.showModal()
    cancel_logout_button.blur()
})

cancel_logout_button.addEventListener('click', () => {
    log_out_modal.close()
    log_out.blur()
})

confirm_logout_button.addEventListener('click', () => {
    localStorage.removeItem('accessToken')
    sessionStorage.clear()

    window.location.href = "index.html"
})


button_container.addEventListener('click', async (e) => {
    const join_new_campaign = document.getElementsByClassName("join-new-button")[0]
    const join_new_campaign_modal = document.getElementById("join-new-campaign-modal")
    const cancel_join_new_campaign = document.getElementById("cancel-join")
    const continue_join = document.getElementsByClassName("continue-join")[0]
    const join_form = document.getElementsByClassName("join-new-campaign-form")[0]
    const finish_join = document.getElementsByClassName("finish-join")[0]
    const character_info = document.getElementsByClassName("character-info")[0]
    const create_new_campaign = document.getElementsByClassName("create-button")[0]
    const create_new_campaign_modal = document.getElementById("create-new-campaign-modal")
    const cancel_create_new_campaign = document.getElementById("cancel-create")
    const copy_button = document.getElementsByClassName("copy-button")[0]
    const code_value = document.getElementsByClassName("campaign-code")[0]
    const finish_creating = document.getElementsByClassName("finish-create")[0]

    if (e.target.classList.contains('join-new-button')) {
        join_new_campaign_modal.showModal()
        cancel_join_new_campaign.blur()
    }
    else if (e.target.classList.contains('create-button')) {
        create_new_campaign_modal.showModal()
        cancel_create_new_campaign.blur()

        let dotCount = 0
        code_value.value = "Generating"

        const loadingInterval = setInterval(() => {
            dotCount++
            if (dotCount > 3) dotCount = 0

            const dots = ".".repeat(dotCount)
            code_value.value = `Generating${dots}`
        }, 500)

        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/generateCode`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await response.json()

            if (response.ok && data.success) {
                code_value.value = data.join_code
            } else {
                code_value.value = "Error generating code"
            }
        }
        catch (err) {
            console.error("Failed to fetch campaign code:", err)
            code_value.value = "Connection Error"
        }
        finally {
            clearInterval(loadingInterval)
        }
    }
    else if (e.target.id === 'cancel-join') {
        join_new_campaign_modal.close()
        e.target.blur()

        resetJoinModal()
    }
    else if (e.target.id === 'btn-next-to-stage-2') {
        e.preventDefault()
        e.target.blur()
        const codeInput = document.getElementById('campaign-code').value.trim()
        const nameInput = document.getElementById('character-name').value.trim()
        const stage1Error = document.getElementById('stage-1-error')
        if (!codeInput || !nameInput) {
            stage1Error.innerText = "Please enter both a Campaign Code and Character Name!\n"
            return
        }

        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/campaignListCode?code=${codeInput}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            })
            const data = await response.json()
            if (response.ok && data.success) {
                if (data.campaign.length === 0) {
                    stage1Error.innerText = "Invalid join code.\nMake sure you have the currect join code"
                    return
                }
                let alreadyInCampaign = false
                data.campaign.forEach(instance => {
                    if (instance.user_id === tempID) {
                        alreadyInCampaign = true
                    }
                })
                if (alreadyInCampaign) {
                    stage1Error.innerText = "You are already in this campaign!\nPlease insert a code to a campaign you are not part of"
                    return
                }
                campaigns = data.campaigns
            }
            else {
                console.error("Backend sent an error: ", data.error)
            }
        }
        catch (err) {
            console.error("Error communicationg with backend:", err)
        }

        stage1Error.innerText = ""

        join_form.classList.add("not-active")
        setUpCharacterCreation()

        character_info.classList.remove("not-active")
        document.getElementById('stage-2-stats').classList.remove("not-active")
    }
    else if (e.target.id === 'btn-final-join') {
        e.preventDefault()

        const errorMessage = document.getElementById('join-error-message')
        errorMessage.innerText = ""

        const campaignCode = document.getElementById('campaign-code').value
        const characterName = document.getElementById('character-name').value
        const characterClass = document.getElementById('characters-class').value
        const characterRace = document.getElementById('characters-race').value

        if (!campaignCode || !characterName || !characterClass || !characterRace) {
            errorMessage.innerText = "Please complete all previous steps!"
            return
        }

        const allChoiceGroups = document.querySelectorAll('.equip-group')

        for (let group of allChoiceGroups) {
            const allowed = parseInt(group.dataset.allowed)
            const selected = parseInt(group.dataset.selectedCount)

            if (selected < allowed) {
                errorMessage.innerText = `You have unfinished choices! Please select ${allowed} option(s) in all categories.`
                return
            }
        }

        const calculateFinalStat = (inputId) => {
            const inputEl = document.getElementById(inputId)
            const baseScore = parseInt(inputEl.value) || 0
            const raceBonus = parseInt(inputEl.dataset.raceBonus) || 0
            return baseScore + raceBonus
        }

        const stats = {
            str: calculateFinalStat('characters-str'),
            dex: calculateFinalStat('characters-dex'),
            con: calculateFinalStat('characters-con'),
            int: calculateFinalStat('characters-int'),
            wis: calculateFinalStat('characters-wis'),
            cha: calculateFinalStat('characters-cha')
        }
        const selectedEquip = Array.from(document.querySelectorAll('#equipment-container .equip-card.selected')).map(card => card.innerText)
        const guaranteedEquipRaw = document.getElementById('characters-class').dataset.guaranteedEquipment
        const guaranteedEquip = guaranteedEquipRaw ? JSON.parse(guaranteedEquipRaw) : []
        const equipment = [...guaranteedEquip, ...selectedEquip]

        const skills = Array.from(document.querySelectorAll('#stage-3-proficiencies .equip-group[data-category="skill"] .equip-card.selected')).map(card => card.innerText)
        const tools = Array.from(document.querySelectorAll('#stage-3-proficiencies .equip-group[data-category="tool"] .equip-card.selected')).map(card => card.innerText)

        const selectedLangs = Array.from(document.querySelectorAll('#stage-3-proficiencies .equip-group[data-category="language"] .equip-card.selected')).map(card => card.innerText)
        const guaranteedLangsRaw = document.getElementById('characters-race').dataset.guaranteedLanguages
        const guaranteedLangs = guaranteedLangsRaw ? JSON.parse(guaranteedLangsRaw) : []
        const languages = [...guaranteedLangs, ...selectedLangs]

        const computedSheet = await computeCharacterSheet(characterClass, characterRace, stats, skills)

        const payload = {
            userId: getUserIdFromToken(),
            campaignCode: campaignCode,
            characterName: characterName,
            className: characterClass,
            race: characterRace,
            classDisplayName: computedSheet.classDisplayName,
            raceDisplayName: computedSheet.raceDisplayName,
            level: computedSheet.level,
            xp: computedSheet.xp,
            stats: stats,
            modifiers: computedSheet.modifiers,
            proficiencyBonus: computedSheet.proficiencyBonus,
            combat: computedSheet.combat,
            health: computedSheet.health,
            savingThrows: computedSheet.savingThrows,
            equipment: equipment,
            skills: computedSheet.skills,
            languages: languages,
            tools: tools
        }

        fetchWithAuth(`${BASE_URL}/api/joinCampaign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resetJoinModal()
                    join_new_campaign_modal.close()

                    loadPage()
                }
                else {
                    errorMessage.innerText = data.error
                }
            })
            .catch(err => {
                console.error("Error joining campaign: ", err)
                errorMessage.innerText = "Connection Error. Please try again."
            })
    }
    else if (e.target.id === 'cancel-create') {
        create_new_campaign_modal.close()
        e.target.blur()

        resetCreateModal()
    }
    else if (e.target.classList.contains('copy-button')) {
        const codeToCopy = code_value.value
        navigator.clipboard.writeText(codeToCopy)
            .then(() => {
                copy_button.innerText = "Copied!"
                copy_button.classList.add("copied")
                setTimeout(() => {
                    copy_button.innerText = "Copy!"
                    copy_button.classList.remove("copied")
                }, 2000)
            })
            .catch(err => {
                console.error("Failed to copy code: ", err)
            })
    }
    else if (e.target.classList.contains('finish-create')) {
        const finalJoinCode = code_value.value
        const campaignName = document.getElementById('new-campaign-name').value
        const errorMsgBox = document.getElementById('create-error-message')
        if (campaignName.length === 0) {
            errorMsgBox.innerText = "Please enter a name for your campaign!"
            return
        }
        errorMsgBox.innerText = ""
        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/createNewCampaign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    joinCode: finalJoinCode,
                    campaignName: campaignName,
                    hostID: tempID
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                create_new_campaign_modal.close()
                create_new_campaign.blur()

                loadPage()
            }
            else {
                console.error("Failed to create campaign:", data.error)
            }
        }
        catch (err) {
            console.error("Connection error creating campaign: ", err)
        }

    }
    else if (e.target.id === 'continue-to-proficiencies') {
        const errorMsg = document.getElementById('stage-2-error')

        let warningList = []

        const charClass = document.getElementById('characters-class').value
        const charRace = document.getElementById('characters-race').value

        if (!charClass || !charRace) {
            warningList.push("• Please select a Class and Race.")
        }

        const statInputs = document.querySelectorAll('.stats input')
        let statsComplete = true
        statInputs.forEach(input => {
            if (input.value.trim() === "") {
                statsComplete = false
            }
        })

        if (!statsComplete) {
            warningList.push("• Please fill out all 6 ability scores.")
        }

        const equipmentGroups = document.querySelectorAll('#equipment-container .equip-group')
        let equipComplete = true
        for (let group of equipmentGroups) {
            const allowed = parseInt(group.dataset.allowed)
            const selected = parseInt(group.dataset.selectedCount)

            if (selected < allowed) {
                equipComplete = false
            }
        }

        if (!equipComplete) {
            warningList.push("• Please finish selecting your starting equipment.")
        }

        if (warningList.length > 0) {
            errorMsg.innerText = warningList.join('\n')
            return
        }

        errorMsg.innerText = ""
        document.getElementById('stage-2-stats').classList.add('not-active')
        document.getElementById('stage-3-proficiencies').classList.remove('not-active')

        document.getElementById('join-new-campaign-modal').scrollTo(0, 0)
    }
    else if (e.target.id === 'back-to-stats') {
        document.getElementById('stage-3-proficiencies').classList.add('not-active')
        document.getElementById('stage-2-stats').classList.remove('not-active')
    }
})

dmModalPlayerList.addEventListener('change', (e) => {
    if (e.target.name === 'new-dm') {
        dmErrorMessage.innerText = ""
    }
})

cancelDmAbandonBtn.addEventListener('click', () => {
    dmErrorMessage.innerText = ""
    dmAbandonModal.close()
})

confirmDmAbandonBtn.addEventListener('click', async (e) => {
    const campaignId = e.target.dataset.campaignId
    const selectedPlayerID = document.querySelector('input[name="new-dm"]:checked')

    if (selectedPlayerID) {
        const newDMID = selectedPlayerID.value
        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/campaignListNewDM?campaignID=${campaignId}&newDMid=${newDMID}`, {
                method: "DELETE",
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await response.json()
            if (response.ok && data.success) {
                const campaignBox = document.querySelector(`.campaign-instance[data-id="${campaignId}"]`)
                if (campaignBox) {
                    campaignBox.remove()
                }
            }
        }
        catch (err) {
            console.error("Error communicationg with backend:", err)
        }
        dmErrorMessage.innerText = ""
        dmAbandonModal.close()
    } else {
        dmErrorMessage.innerText = "Please select a player to take over before leaving."
    }
})

cancelPlayerAbandonBtn.addEventListener('click', () => {
    playerAbandonModal.close()
})

confirmPlayerAbandonBtn.addEventListener('click', async (e) => {
    const campaignId = e.target.dataset.campaignId
    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/campaignListPlayerLeave?campaignID=${campaignId}`, {
            method: "DELETE",
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()
        if (response.ok && data.success) {
            const campaignBox = document.querySelector(`.campaign-instance[data-id="${campaignId}"]`)
            if (campaignBox) {
                campaignBox.remove()
            }
        }
    }
    catch (err) {
        console.error("Error communicationg with backend:", err)
    }
    playerAbandonModal.close()
})

cancelDeleteBtn.addEventListener('click', () => {
    deleteCampaignModal.close()
})

confirmDeleteBtn.addEventListener('click', async (e) => {
    const campaignId = e.target.dataset.campaignId

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/deleteEntireCampaign?campaignID=${campaignId}`, {
            method: "DELETE",
            headers: { 'Content-Type': 'application/json' }
        })
        const data = await response.json()

        if (response.ok && data.success) {
            const campaignBox = document.querySelector(`.campaign-instance[data-id="${campaignId}"]`)
            if (campaignBox) {
                campaignBox.remove()
            }
            deleteCampaignModal.close()
        } else {
            document.getElementById("delete-error-message").innerText = "Failed to destroy campaign."
        }
    } catch (err) {
        console.error("Error communicating with backend:", err)
        document.getElementById("delete-error-message").innerText = "Connection error."
    }
})

async function setUpCharacterCreation() {
    const classDropdown = document.getElementById('characters-class')
    const raceDropdown = document.getElementById('characters-race')

    try {
        const [classRes, raceRes] = await Promise.all([
            fetch('https://www.dnd5eapi.co/api/classes'),
            fetch('https://www.dnd5eapi.co/api/races')
        ])

        const classData = await classRes.json()
        const raceData = await raceRes.json()

        classDropdown.innerHTML = '<option value="">Select a Class</option>'
        raceDropdown.innerHTML = '<option value="">Select a Race</option>'

        classData.results.forEach(c => {
            const option = document.createElement('option')
            option.value = c.index
            option.innerText = c.name
            classDropdown.appendChild(option)
        })

        raceData.results.forEach(r => {
            const option = document.createElement('option')
            option.value = r.index
            option.innerText = r.name
            raceDropdown.appendChild(option)
        })

    } catch (err) {
        console.error("Failed to load D&D 5e API data: ", err)
        classDropdown.innerHTML = '<option value="">Error loading classes</option>'
        raceDropdown.innerHTML = '<option value="">Error loading races</option>'
    }
    classDropdown.addEventListener('change', async (e) => {
        const selectedClass = e.target.value
        const equipmentContainer = document.getElementById('equipment-container')

        if (!selectedClass) {
            equipmentContainer.style.display = 'none'
            return
        }

        try {
            document.getElementById('class-proficiencies-container').innerHTML = ''

            equipmentContainer.style.display = 'block'
            equipmentContainer.innerHTML = "<p><em>Drafting equipment armory...</em></p>"

            const [equipRes, classRes] = await Promise.all([
                fetch(`https://www.dnd5eapi.co/api/classes/${selectedClass}/starting-equipment`),
                fetch(`https://www.dnd5eapi.co/api/classes/${selectedClass}`)
            ])

            const equipData = await equipRes.json()
            const classData = await classRes.json()
            const skillChoices = []
            const toolChoices = []

            if (classData.proficiency_choices) {
                classData.proficiency_choices.forEach(choiceGroup => {
                    const desc = (choiceGroup.desc || "").toLowerCase()
                    if (desc.includes('tool') || desc.includes('instrument')) {
                        toolChoices.push(choiceGroup)
                    } else {
                        skillChoices.push(choiceGroup)
                    }
                })
            }

            renderProficiencyChoices(skillChoices, 'class-proficiencies-container', 'Class Skills', 'skill')
            renderProficiencyChoices(toolChoices, 'class-proficiencies-container', 'Tool Proficiencies', 'tool')

            // No inline styles — guaranteed items list uses the CSS class below
            let equipHtml = "<strong>Guaranteed Items:</strong><ul class='guaranteed-items-list'>"
            const guaranteedItemsArray = []

            equipData.starting_equipment.forEach(item => {
                const itemString = `${item.equipment.name} (x${item.quantity})`
                equipHtml += `<li>${itemString}</li>`
                guaranteedItemsArray.push(itemString)
            })

            classDropdown.dataset.guaranteedEquipment = JSON.stringify(guaranteedItemsArray)

            equipHtml += "</ul><div id='equip-choices-container'></div>"

            equipmentContainer.innerHTML = equipHtml
            const choicesContainer = document.getElementById('equip-choices-container')

            equipData.starting_equipment_options.forEach((choiceGroup) => {
                const allowedCount = choiceGroup.choose

                const groupDiv = document.createElement('div')
                groupDiv.className = 'equip-group'
                groupDiv.dataset.allowed = allowedCount
                groupDiv.dataset.selectedCount = 0
                groupDiv.innerHTML = `<h4>Choose ${allowedCount} from below:</h4><div class="equip-grid"></div>`

                const grid = groupDiv.querySelector('.equip-grid')

                const appendCard = (displayText, isCategory, categoryUrl) => {
                    const card = document.createElement('div')
                    card.className = 'equip-card'
                    if (isCategory) card.classList.add('needs-sub-choice')

                    card.innerText = displayText
                    card.dataset.rawText = displayText
                    card.dataset.isCategory = isCategory
                    card.dataset.categoryUrl = categoryUrl

                    card.addEventListener('click', () => handleEquipClick(card, groupDiv, allowedCount))
                    grid.appendChild(card)
                }

                // SCENARIO A: The API gives us a broad category (This fixes the Cleric/Druid crash!)
                if (choiceGroup.from.option_set_type === 'equipment_category') {
                    const cat = choiceGroup.from.equipment_category
                    appendCard(`Any ${cat.name}`, true, cat.index)
                }
                // SCENARIO B: The API gives us a specific list of options
                else if (choiceGroup.from.option_set_type === 'options_array' && choiceGroup.from.options) {
                    choiceGroup.from.options.forEach((opt) => {
                        let displayText = "Unknown Item"
                        let isCategory = false
                        let categoryUrl = ""

                        if (opt.option_type === 'item') {
                            displayText = opt.item.name
                        }
                        else if (opt.option_type === 'counted_reference') {
                            displayText = opt.count > 1 ? `${opt.of.name} (x${opt.count})` : opt.of.name
                        }
                        else if (opt.option_type === 'multiple') {
                            displayText = opt.items.map(i => {
                                if (i.option_type === 'counted_reference') {
                                    return i.count > 1 ? `${i.of.name} (x${i.count})` : i.of.name
                                }
                                if (i.option_type === 'item') return i.item.name
                                if (i.option_type === 'choice') return i.choice.desc || `Any ${i.choice.from.equipment_category.name}`
                                return 'Item'
                            }).join(' + ')
                        }
                        else if (opt.option_type === 'choice') {
                            displayText = opt.choice.desc || `Any ${opt.choice.from.equipment_category.name}`
                            isCategory = true
                            categoryUrl = opt.choice.from.equipment_category.index
                        }

                        appendCard(displayText, isCategory, categoryUrl)
                    })
                }
                choicesContainer.appendChild(groupDiv)
            })

        } catch (err) {
            console.error("Failed to load equipment: ", err)
            // Replaced inline style with our form-error-message class!
            equipmentContainer.innerHTML = '<p class="form-error-message">Error loading equipment.</p>'
        }
    })
    raceDropdown.addEventListener('change', async (e) => {
        if (e.target.value !== "" && e.target.value !== "Select a Race") {
            const selectedRace = e.target.value

            const allModSpans = document.querySelectorAll('.race-mod')
            allModSpans.forEach(span => span.innerText = '')

            if (!selectedRace) return

            try {
                document.getElementById('race-proficiencies-container').innerHTML = ''

                const response = await fetch(`https://www.dnd5eapi.co/api/races/${selectedRace}`)
                const raceDetails = await response.json()

                const raceSkillChoices = []
                const raceToolChoices = []

                if (raceDetails.starting_proficiency_options) {
                    // Safety check: The API sometimes returns a single object instead of an array for races!
                    const optionsArray = Array.isArray(raceDetails.starting_proficiency_options)
                        ? raceDetails.starting_proficiency_options
                        : [raceDetails.starting_proficiency_options]

                    optionsArray.forEach(choiceGroup => {
                        if (!choiceGroup) return
                        const desc = (choiceGroup.desc || "").toLowerCase()
                        // Dwarves use 'Artisan', others use 'Tool' or 'Instrument'
                        if (desc.includes('tool') || desc.includes('instrument') || desc.includes('artisan')) {
                            raceToolChoices.push(choiceGroup)
                        } else {
                            raceSkillChoices.push(choiceGroup)
                        }
                    })
                }

                if (raceDetails.languages && raceDetails.languages.length > 0) {
                    const langContainer = document.getElementById('race-proficiencies-container')
                    const langNames = raceDetails.languages.map(l => l.name)

                    raceDropdown.dataset.guaranteedLanguages = JSON.stringify(langNames)

                    const guaranteedLangs = document.createElement('p')
                    guaranteedLangs.className = 'sub-modal-desc'
                    guaranteedLangs.innerHTML = `<strong>Known Languages:</strong> ${langNames}`

                    langContainer.appendChild(guaranteedLangs)
                }
                renderProficiencyChoices(raceSkillChoices, 'race-proficiencies-container', 'Race Skills', 'skill')
                renderProficiencyChoices(raceToolChoices, 'race-proficiencies-container', 'Race Tools', 'tool')

                // Languages usually come as a single choice object, so we wrap it safely too
                if (raceDetails.language_options) {
                    const langChoices = Array.isArray(raceDetails.language_options)
                        ? raceDetails.language_options
                        : [raceDetails.language_options]

                    renderProficiencyChoices(langChoices, 'race-proficiencies-container', 'Bonus Languages', 'language')
                }

                raceDetails.ability_bonuses.forEach(bonusObj => {
                    const statIndex = bonusObj.ability_score.index
                    const bonusValue = bonusObj.bonus

                    const targetSpan = document.getElementById(`mod-${statIndex}`)
                    const targetInput = document.getElementById(`characters-${statIndex}`)

                    if (targetSpan && targetInput) {
                        targetSpan.innerText = `+${bonusValue} Race Bonus`
                        targetSpan.style.color = "green"

                        targetInput.dataset.raceBonus = bonusValue

                        updateModifierDisplay(targetInput, targetSpan)
                    }
                })
            } catch (err) {
                console.error("Failed to fetch race bonuses: ", err)
            }
        }
        else if (e.target.value === "") {
            const raceMods = document.querySelectorAll(".race-mod")
            if (raceMods) {
                raceMods.forEach(m => {
                    m.innerHTML = ""
                })
            }
        }
    })
}

function updateModifierDisplay(inputEl, spanEl) {
    const baseValue = parseInt(inputEl.value)
    const raceBonus = parseInt(inputEl.dataset.raceBonus) || 0

    if (isNaN(baseValue)) {
        spanEl.innerText = raceBonus > 0 ? `+${raceBonus} Race` : ""
        spanEl.style.color = raceBonus > 0 ? "green" : "inherit"
        return
    }

    const totalScore = baseValue + raceBonus
    const modifier = Math.floor((totalScore - 10) / 2)

    const modString = modifier >= 0 ? `+${modifier}` : `${modifier}`

    spanEl.innerText = `Total: ${totalScore} (Mod: ${modString})`
    spanEl.style.color = "var(--text-color-base)"
}

function applySelection(card, groupDiv, allowedCount) {
    // If we are at the limit, we must SWAP
    if (parseInt(groupDiv.dataset.selectedCount) >= allowedCount) {
        const oldestSelection = groupDiv.querySelector('.selected')
        if (oldestSelection) {
            oldestSelection.classList.remove('selected')
            groupDiv.dataset.selectedCount = parseInt(groupDiv.dataset.selectedCount) - 1

            // If we are un-selecting a category, revert its text back to the generic prompt
            if (oldestSelection.dataset.isCategory === "true") {
                oldestSelection.innerText = oldestSelection.dataset.rawText
            }
        }
    }

    card.classList.add('selected')
    groupDiv.dataset.selectedCount = parseInt(groupDiv.dataset.selectedCount) + 1
}

async function handleEquipClick(card, groupDiv, allowedCount) {
    const isSelected = card.classList.contains('selected')

    // Scenario A: User is explicitly un-selecting an item they already picked
    if (isSelected) {
        card.classList.remove('selected')
        groupDiv.dataset.selectedCount = parseInt(groupDiv.dataset.selectedCount) - 1
        if (card.dataset.isCategory === "true") card.innerText = card.dataset.rawText
        return
    }

    // Scenario B: User clicks a category -> Open Modal first, apply selection later!
    if (card.dataset.isCategory === "true") {
        await openSubEquipmentModal(card.dataset.categoryUrl, card, groupDiv, allowedCount)
    }
    // Scenario C: Standard item click -> Apply immediately
    else {
        applySelection(card, groupDiv, allowedCount)
    }
}

// Handles fetching and displaying a specific category (like "Simple Weapons")
async function openSubEquipmentModal(categoryIndex, parentCard, groupDiv, allowedCount) {
    const subModal = document.getElementById('sub-equipment-modal')
    const grid = document.getElementById('sub-equip-grid')
    const title = document.getElementById('sub-equip-title')

    grid.innerHTML = '<p>Opening the armory...</p>'
    subModal.showModal()

    const cancelBtn = document.getElementById('cancel-sub-equip')
    cancelBtn.onclick = () => subModal.close()

    try {
        const res = await fetch(`https://www.dnd5eapi.co/api/equipment-categories/${categoryIndex}`)
        const data = await res.json()

        title.innerText = `Choose: ${data.name}`
        grid.innerHTML = ''

        data.equipment.forEach(item => {
            const subCard = document.createElement('div')
            subCard.className = 'equip-card'
            subCard.innerText = item.name

            subCard.addEventListener('click', () => {
                applySelection(parentCard, groupDiv, allowedCount)

                parentCard.innerText = item.name
                subModal.close()
            })

            grid.appendChild(subCard)
        })
    } catch (err) {
        console.error("Failed to load category:", err)
        grid.innerHTML = '<p class="form-error-message">Error loading category items.</p>'
    }
}

function renderProficiencyChoices(choicesArray, containerId, titlePrefix, categoryType) {
    const container = document.getElementById(containerId)

    if (!choicesArray || choicesArray.length === 0) return

    choicesArray.forEach((choiceGroup) => {
        const allowed = choiceGroup.choose
        const groupDiv = document.createElement('div')
        // We reuse the equipment CSS classes here to keep styling perfectly consistent!
        groupDiv.className = 'equip-group'
        groupDiv.dataset.allowed = allowed
        groupDiv.dataset.selectedCount = 0
        groupDiv.dataset.category = categoryType
        groupDiv.innerHTML = `<h4>${titlePrefix}: Choose ${allowed}</h4><div class="equip-grid"></div>`

        const grid = groupDiv.querySelector('.equip-grid')

        if (choiceGroup.from && choiceGroup.from.options) {
            choiceGroup.from.options.forEach(opt => {
                const card = document.createElement('div')
                card.className = 'equip-card'

                // Clean up the text (e.g., changing "Skill: Acrobatics" to just "Acrobatics")
                let text = opt.item ? opt.item.name : (opt.choice ? opt.choice.desc : "Option")
                card.innerText = text.replace("Skill: ", "")

                // Reuse our auto-swapping selection logic from the equipment phase!
                card.addEventListener('click', () => handleEquipClick(card, groupDiv, allowed))
                grid.appendChild(card)
            })
        }
        container.appendChild(groupDiv)
    })
}

// Completely wipes the Join Modal clean and returns to Stage 1
function resetJoinModal() {
    document.getElementById('campaign-code').value = ''
    document.getElementById('character-name').value = ''
    document.getElementById('stage-1-error').innerText = ""

    document.getElementById('characters-class').value = ''
    document.getElementById('characters-race').value = ''

    const statInputs = document.querySelectorAll('.stats input')
    statInputs.forEach(input => {
        input.value = ''
        input.dataset.raceBonus = 0
    })

    const statMods = document.querySelectorAll('.race-mod')
    statMods.forEach(mod => mod.innerText = '')

    document.getElementById('equipment-container').style.display = 'none'
    document.getElementById('equipment-container').innerHTML = ''
    document.getElementById('class-proficiencies-container').innerHTML = ''
    document.getElementById('race-proficiencies-container').innerHTML = ''

    document.getElementById('stage-2-error').innerText = ''
    document.getElementById('join-error-message').innerText = ''

    document.getElementsByClassName("join-new-campaign-form")[0].classList.remove("not-active")
    document.getElementById('stage-2-stats').classList.add("not-active")
    document.getElementById('stage-3-proficiencies').classList.add("not-active")

    document.getElementById('characters-class').dataset.guaranteedEquipment = "[]"
    document.getElementById('characters-race').dataset.guaranteedLanguages = "[]"
}

function resetCreateModal() {
    document.getElementById('new-campaign-name').value = ''
    const errorMsgBox = document.getElementById('create-error-message')
    if (errorMsgBox) {
        errorMsgBox.innerText = ''
    }
    // The code input will automatically overwrite itself with "Generating..." next time it opens!
}