const log_out = document.getElementsByClassName("log-out")[0];
const log_out_modal = document.getElementById("logout-modal");
const cancel_logout_button = document.getElementById("cancel-logout");
const confirm_logout_button = document.getElementById("confirm-logout");
const player_button = document.getElementsByClassName("player")[0];
const dm_button = document.getElementsByClassName("DM")[0];
const logo = document.getElementsByClassName("logo")[0];

const campaigns1 = [
    {
        "campaign_name": "test1", "status": "player", "character_name": "Steve Rogers"
    },
    {
        "campaign_name": "test2", "status": "DM", "amout_of_players": "5"
    },
    {
        "campaign_name": "test3", "status": "player", "character_name": "Crash Bandicot"
    }
]
const campaigns2 = []

const campaigns = campaigns1

const campaignContainerSection = document.querySelector('.campaigns-container')
const noCampaignContainerSection = document.querySelector('.no-campaigns-container')
/* no campaigns */
if (campaigns.length === 0) {
    noSessions()
}
else {
    noCampaignContainerSection.style.display = 'none'
    campaigns.forEach(campaign => {
        if (campaign.status === "player") {
            displayPlayerSessions(campaign)
        }
        else if (campaign.status === "DM") {
            displayDMSessions(campaign)
        }
        else {
            console.log("NOT A PLAYER OR A DM!!!")
        }
    });
    addButtons(campaignContainerSection)
}

campaignContainerSection.addEventListener('click', (e) => {
    if(e.target.classList.contains('join-button')){
        window.location.href = "./playerScreen.html"
    }
})

function addButtons(location) {
    const buttonsContainer = document.createElement('div')
    const createButton = document.createElement('button')
    const joinButton = document.createElement('button')
    buttonsContainer.classList.add("buttons-container")
    createButton.classList.add("create-button")
    joinButton.classList.add("join-button")
    createButton.innerText = "Create Campaign"
    joinButton.innerText = "Join Campaign"
    buttonsContainer.appendChild(joinButton)
    buttonsContainer.appendChild(createButton)
    location.appendChild(buttonsContainer)
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
    const status = campaign.status
    const playerCount = campaign.amout_of_players

    const campaignInstance = document.createElement('div')
    const buttonsContainer = document.createElement('div')
    const campaignNameSpan = document.createElement('span')
    const statusSpan = document.createElement('span')
    const playerCountSpan = document.createElement('span')
    const startSessionButton = document.createElement('button')
    const abandonButton = document.createElement('button')

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
    const status = campaign.status
    const characterName = campaign.character_name

    const campaignInstance = document.createElement('div')
    const buttonsContainer = document.createElement('div')
    const campaignNameSpan = document.createElement('span')
    const statusSpan = document.createElement('span')
    const nameSpan = document.createElement('span')
    const joinButton = document.createElement('button')
    const abandonButton = document.createElement('button')

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

const dmCampaigns = document.querySelectorAll('.dm-campaign')
const playerCampaigns = document.querySelectorAll('.player-campaign')

player_button.addEventListener('click', () => {

    if (player_button.classList.contains('not-clicked')) {
        if (dm_button.classList.contains('clicked')) {
            dm_button.classList.remove('clicked')
            dm_button.classList.add('not-clicked')
        }
        player_button.classList.remove('not-clicked')
        player_button.classList.add('clicked')

        dmCampaigns.forEach(campaign => campaign.style.display = 'none')
        playerCampaigns.forEach(campaign => campaign.style.display = '')
    }
    else {
        player_button.classList.remove('clicked')
        player_button.classList.add('not-clicked')
        dmCampaigns.forEach(campaign => campaign.style.display = '')
    }

    player_button.blur()            //will probably need to chage it later to what it takes to
})

dm_button.addEventListener('click', () => {

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

    dm_button.blur()                //will probably need to chage it later to what it takes to
})

logo.addEventListener('click', () => {
    logo.blur()
})

log_out.addEventListener('click', () => {
    log_out_modal.showModal()
    cancel_logout_button.blur()
});

cancel_logout_button.addEventListener('click', () => {
    log_out_modal.close()
    log_out.blur()
})

confirm_logout_button.addEventListener('click', () => {
    /* some save to database logic that needs to come in the future */
    window.location.href = "index.html"
})