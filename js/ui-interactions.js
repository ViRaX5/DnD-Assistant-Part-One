import { sendMessage, fetchCampaignParticipants } from './chat.js'
import { sessionContext } from './session-context.js'
import { socket } from './socket.js'
// Smoothly animates `element`'s height between its size before and after `applyChange`
// runs, by measuring both states and transitioning a temporary inline height between
// them (CSS can't transition to/from a content-based "auto" height directly). Any
// flex sibling with flex:1 will appear to grow/shrink in lockstep for free, since the
// browser recalculates the flex layout on every frame of the transition.
function animateHeightChange(element, applyChange, onComplete) {
    if (element._pendingHeightHandler) {
        element.removeEventListener('transitionend', element._pendingHeightHandler)
        element._pendingHeightHandler = null
    }

    const startHeight = element.getBoundingClientRect().height

    applyChange()

    const endHeight = element.getBoundingClientRect().height

    if (Math.abs(endHeight - startHeight) < 1) {
        if (onComplete) onComplete()
        return
    }

    element.style.overflow = 'hidden'
    element.style.height = `${startHeight}px`

    requestAnimationFrame(() => {
        element.style.transition = 'height 0.25s ease'
        element.style.height = `${endHeight}px`
    })

    const handleTransitionEnd = (e) => {
        if (e.propertyName === 'height') {
            element.style.height = ''
            element.style.overflow = ''
            element.style.transition = ''
            element.removeEventListener('transitionend', handleTransitionEnd)
            element._pendingHeightHandler = null
            if (onComplete) onComplete()
        }
    }

    element._pendingHeightHandler = handleTransitionEnd
    element.addEventListener('transitionend', handleTransitionEnd)
}

function showTemporaryNotice(text) {
    const notice = document.createElement('div')
    notice.className = 'temporary-notice'
    notice.textContent = text

    document.body.appendChild(notice)

    requestAnimationFrame(() => {
        notice.classList.add('visible')
    })

    setTimeout(() => {
        notice.classList.remove('visible')
        notice.addEventListener('transitionend', () => notice.remove(), { once: true })
    }, 2000)
}

function groupDiceByType(diceList) {
    const order = [...new Set(diceList)]
    const counts = {}
    diceList.forEach((die) => {
        counts[die] = (counts[die] || 0) + 1
    })

    return { order, counts }
}

function rollSelectedDice(diceList) {
    const { order, counts } = groupDiceByType(diceList)

    let total = 0
    const segments = order.map((dieType) => {
        const quantity = counts[dieType]
        const maxNumber = parseInt(dieType.substring(1))

        const rolls = []
        for (let i = 0; i < quantity; i++) {
            const result = Math.floor(Math.random() * maxNumber) + 1
            rolls.push(result)
            total += result
        }

        return `${rolls.join(", ")} (${quantity}${dieType})`
    })

    return { rollString: segments.join(" and "), total }
}

function initiativeRollInteraction() {
    const banner = document.getElementById('initiative-roll-banner')
    if (!banner) return

    const bannerText = document.getElementById('initiative-roll-banner-text')
    const autoBtn = document.getElementById('roll-initiative-auto-btn')
    const manualInput = document.getElementById('roll-initiative-manual-input')
    const manualSubmitBtn = document.getElementById('roll-initiative-manual-submit-btn')

    function submitRoll(d20Result) {
        const playerName = document.getElementById("player-name").textContent || "Unknown Hero"

        socket.emit('initiative:submitRoll', { d20Result })

        sendMessage({
            type: 'roll',
            text: `${playerName} rolled: ${d20Result} (1d20) for initiative.`,
            senderName: playerName,
            meta: { rollString: `${d20Result} (1d20)`, total: d20Result, dice: ['d20'] }
        })

        showTemporaryNotice("Roll submitted! Waiting for combat to start...")
        banner.close()
    }

    autoBtn.addEventListener('click', () => {
        const rollData = rollSelectedDice(['d20'])
        submitRoll(rollData.total)
    })

    manualSubmitBtn.addEventListener('click', () => {
        const value = parseInt(manualInput.value)
        if (!value || value < 1 || value > 20) {
            showTemporaryNotice("Enter a valid d20 result (1-20).")
            return
        }
        submitRoll(value)
    })

    socket.on('initiative:rollPrompt', () => {
        bannerText.textContent = 'Roll for Initiative!'
        manualInput.value = ''
        banner.showModal()
    })

    socket.on('initiative:rollPromptClear', () => {
        if (banner.open) banner.close()
    })
}

export function setupUIInteractions() {
    navbarExitSession()
    playerInfoToggle()
    updateProficiency()
    diceTrayInteraction()
    activeEffectsPopUp()
    actionsHoverPopUp()
    actionBarInteraction()
    chatInputInteraction()
    shopInteraction()
    initiativeRollInteraction()
    restInteraction()
    navFooterSwitch()
}

function navbarExitSession() {
    const endSession = document.getElementsByClassName("end-session")[0]
    const endSessionModal = document.getElementById("end-session-modal")
    const cancelEndSessionButton = document.getElementById("cancel-end-session")
    const confirmEndSessionButton = document.getElementById("confirm-end-session")

    endSession.addEventListener('click', () => {
        endSessionModal.showModal()
        cancelEndSessionButton.blur()
    })

    cancelEndSessionButton.addEventListener('click', () => {
        endSessionModal.close()
        endSession.blur()
    })

    confirmEndSessionButton.addEventListener('click', () => {
        window.location.href = "campaignList.html"
    })
}

function playerInfoToggle() {
    const toggleBtn = document.getElementById("info-page-toggle-btn")
    const page1 = document.getElementById("info-page-1")
    const page2 = document.getElementById("info-page-2")
    const leftPanel = document.getElementById("player-info-main-left")
    const playerInfoFooter = document.getElementById("player-info-footer")
    const playerInfo = document.getElementById("player-info")

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            animateHeightChange(playerInfo, () => {
                page1.classList.toggle("hidden-page")
                page2.classList.toggle("hidden-page")
                leftPanel.classList.toggle("hidden-page")
                playerInfoFooter.classList.toggle("hidden-page")

                if (page1.classList.contains("hidden-page")) {
                    toggleBtn.textContent = "Main Stats"

                } else {
                    toggleBtn.textContent = "Skills & Saves"
                }
            })
        })
    }
}

function updateProficiency() {
    const savingThrowsList = document.getElementById('saving-throws-list')
    const skillsList = document.getElementById('skill-list')

    if (!savingThrowsList || !skillsList) return

    savingThrowsList.addEventListener('change', async (e) => {
        if (e.target.type !== 'checkbox') return

        const response = await fetchWithAuth(`${BASE_URL}/api/updateSavingThrowProficiency`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: sessionContext.campaignId, savingThrowId: e.target.id, proficient: e.target.checked })
        })

        const data = await response.json()

        if (data.success) {
            const label = e.target.nextElementSibling
            label.textContent = `${data.savingThrow.modifier} ${data.savingThrow.name}`
        }
    })

    skillsList.addEventListener('change', async (e) => {
        if (e.target.type !== 'checkbox') return

        const response = await fetchWithAuth(`${BASE_URL}/api/updateSkillProficiency`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ campaignId: sessionContext.campaignId, skillId: e.target.id, proficient: e.target.checked })
        })

        const data = await response.json()

        if (data.success) {
            const label = e.target.nextElementSibling
            label.textContent = `${data.skill.modifier} ${data.skill.name} (${data.skill.attribute})`
        }
    })
}

function diceTrayInteraction() {
    let selectedDice = []
    let trayContentVisible = false

    const diceGrid = document.getElementById("dice-grid")
    const diceTray = document.getElementById("dice-tray-area")
    const diceRollerOuter = document.getElementById("dice-roller-outer")
    const rollButton = document.getElementById("roll-button")

    function setElementVisible(element, visible, displayValue) {
        // Clear out any not-yet-fired hide listener from a previous call, so it
        // can't fire later and stomp on a transition it was never meant to see.
        if (element._pendingHideHandler) {
            element.removeEventListener('transitionend', element._pendingHideHandler)
            element._pendingHideHandler = null
        }

        if (visible) {
            element.style.display = displayValue
            requestAnimationFrame(() => {
                element.classList.add("fade-visible")
            })
        }
        else {
            element.classList.remove("fade-visible")

            const handleTransitionEnd = (e) => {
                if (e.propertyName === 'opacity') {
                    element.style.display = 'none'
                    element.removeEventListener('transitionend', handleTransitionEnd)
                    element._pendingHideHandler = null
                }
            }

            element._pendingHideHandler = handleTransitionEnd
            element.addEventListener('transitionend', handleTransitionEnd)
        }
    }

    function buildTrayHtml() {
        const { order, counts } = groupDiceByType(selectedDice)

        let htmlString = ''
        order.forEach((die) => {
            const quantity = counts[die]
            const countBadge = quantity > 1 ? `<span class="die-tray-count">x${quantity}</span>` : ''

            htmlString += `<div class="die-tray-entry" data-die="${die}">
                <img class="die-tray-img" src="./images/${die}.png" alt="${die}" />
                ${countBadge}
            </div>`
        })

        return htmlString
    }

    function renderTray() {
        const hasDice = selectedDice.length > 0

        if (hasDice && !trayContentVisible) {
            // Box is currently collapsed: grow it first (with the tray/button laid out
            // but invisible, just for correct measurement), then fade them in once
            // there's actually room, to avoid overlapping the dice grid.
            trayContentVisible = true
            animateHeightChange(diceRollerOuter, () => {
                diceTray.innerHTML = buildTrayHtml()
                diceTray.style.display = 'flex'
                rollButton.style.display = 'block'
            }, () => {
                setElementVisible(diceTray, true, 'flex')
                setElementVisible(rollButton, true, 'block')
            })
        }
        else if (hasDice) {
            // Already visible: just update the content, smoothly resizing if the
            // tray's own height changed (e.g. wrapped to a second row).
            animateHeightChange(diceRollerOuter, () => {
                diceTray.innerHTML = buildTrayHtml()
            })
        }
        else if (trayContentVisible) {
            // No dice left: fade the tray/button out first, then shrink the box
            // once they're gone, so the box doesn't squeeze them while still visible.
            trayContentVisible = false
            setElementVisible(diceTray, false)
            setElementVisible(rollButton, false)

            const handleFadeOutDone = (e) => {
                if (e.target !== diceTray || e.propertyName !== 'opacity') return
                diceTray.removeEventListener('transitionend', handleFadeOutDone)
                animateHeightChange(diceRollerOuter, () => {
                    diceTray.innerHTML = ''
                })
            }
            diceTray.addEventListener('transitionend', handleFadeOutDone)
        }
        else {
            // Already empty and already collapsed - nothing to animate.
            diceTray.innerHTML = ''
        }
    }

    diceGrid.addEventListener('click', (e) => {
        const dieButton = e.target.closest('.die-button')

        if (!dieButton) return

        const clickedDie = dieButton.getAttribute('data-die')

        selectedDice.push(clickedDie)
        renderTray()
    })

    diceTray.addEventListener('click', (e) => {
        const trayEntry = e.target.closest('.die-tray-entry')

        if (!trayEntry) return

        const dieType = trayEntry.getAttribute('data-die')
        const index = selectedDice.indexOf(dieType)

        if (index !== -1) {
            selectedDice.splice(index, 1)
        }

        renderTray()
    })

    renderTray()

    rollButton.addEventListener('click', () => {
        if (selectedDice.length === 0) {
            showTemporaryNotice("Please select a die first!")
            return
        }

        const rollData = rollSelectedDice(selectedDice)

        const isPlayer = window.location.pathname.endsWith("playerScreen.html")
        const senderName = isPlayer
            ? (document.getElementById("player-name").textContent || "Unknown Hero")
            : "DM"

        let message = `${senderName} rolled: ${rollData.rollString}.`
        if (selectedDice.length > 1) {
            message += ` (Total: ${rollData.total})`
        }

        sendMessage({
            type: 'roll',
            text: message,
            senderName,
            meta: { rollString: rollData.rollString, total: rollData.total, dice: selectedDice }
        })

        selectedDice = []
        renderTray()
    })
}

function activeEffectsPopUp() {
    const activeEffectsButton = document.getElementById("active-effects")
    const activeEffectsWrapper = document.getElementById("active-effects-wrapper")

    activeEffectsButton.addEventListener('click', () => {
        activeEffectsWrapper.classList.toggle("is-open")
    })

    document.addEventListener('click', (event) => {
        const isOpen = activeEffectsWrapper.classList.contains("is-open")

        const clickedOutside = !activeEffectsWrapper.contains(event.target)

        if (isOpen && clickedOutside) {
            activeEffectsWrapper.classList.remove("is-open")
        }
    })
}

let activeEffects = []

function renderActiveEffects() {
    const effectsListPopup = document.querySelector('.effects-list')

    if (!effectsListPopup) return

    effectsListPopup.innerHTML = ''
    activeEffects.forEach(effect => {
        effectsListPopup.innerHTML += `<div class="effect-item">${effect.name}: ${effect.roundsRemaining}</div>`
    })
}

export async function loadActiveEffects() {
    try {
        const response = await fetchWithAuth(
            `${BASE_URL}/api/getEffects?campaignId=${sessionContext.campaignId}`
        )
        const data = await response.json()

        if (response.ok && data.success) {
            activeEffects = data.effects
            renderActiveEffects()
        }
    } catch (err) {
        console.error("Failed to load active effects:", err)
    }
}

socket.on('effects:new', (effect) => {
    activeEffects.push(effect)
    renderActiveEffects()
})

socket.on('effects:sync', (effects) => {
    activeEffects = effects
    renderActiveEffects()
})

let shopOpen = false
let equipmentCategories = null
const equipmentCategoryCache = {}

function updateShopButtonState() {
    const shopBtn = document.getElementById('shop-btn')

    if (!shopBtn) return

    const isDMScreen = window.location.pathname.endsWith("DMScreen.html")

    if (isDMScreen) {
        shopBtn.textContent = shopOpen ? "Close Shop" : "Open Shop"
    }
    else {
        shopBtn.disabled = !shopOpen
        shopBtn.classList.toggle('locked', !shopOpen)

        const shopModal = document.getElementById('shop-modal')
        if (!shopOpen && shopModal && shopModal.open) {
            shopModal.close()
            showTemporaryNotice("The DM closed the shop.")
        }
    }
}

export async function loadShopStatus() {
    try {
        const response = await fetchWithAuth(
            `${BASE_URL}/api/getShopStatus?campaignId=${sessionContext.campaignId}`
        )
        const data = await response.json()

        if (response.ok && data.success) {
            shopOpen = data.isOpen
            updateShopButtonState()
        }
    } catch (err) {
        console.error("Failed to load shop status:", err)
    }
}

export function isShopOpen() {
    return shopOpen
}

socket.on('shop:status', ({ isOpen }) => {
    shopOpen = isOpen
    updateShopButtonState()
})

let shopInventory = []
let shoppingCart = []

// Helper: Converts D&D string costs (e.g., "15 gp", "5 sp") to pure Copper Pieces
function parseCostToCP(costString) {
    if (!costString) return 0
    const match = costString.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(cp|sp|ep|gp|pp)/)
    if (!match) return 0

    const amount = parseFloat(match[1])
    const unit = match[2]

    switch (unit) {
        case 'cp': return amount
        case 'sp': return amount * 10
        case 'ep': return amount * 50
        case 'gp': return amount * 100
        case 'pp': return amount * 1000
        default: return 0
    }
}

// Helper: Converts Copper Pieces back to a readable string (e.g., "1 gp, 5 sp")
function formatCPtoCoinage(totalCP) {
    if (totalCP === 0) return "0 gp"

    const gp = Math.floor(totalCP / 100)
    const remainder = totalCP % 100
    const sp = Math.floor(remainder / 10)
    const cp = remainder % 10

    let res = []
    if (gp > 0) res.push(`${gp} gp`)
    if (sp > 0) res.push(`${sp} sp`)
    if (cp > 0) res.push(`${cp} cp`)

    return res.join(", ")
}

function renderCart() {
    const cartList = document.getElementById('cart-items-list')
    const totalDisplay = document.getElementById('cart-total-display')
    const checkoutMessage = document.getElementById('checkout-message')

    checkoutMessage.innerText = ""

    if (shoppingCart.length === 0) {
        cartList.innerHTML = '<div class="empty-state-text" style="text-align: center; margin-top: 20px;">Cart is empty.</div>'
        totalDisplay.innerText = "0 gp"
        return
    }

    cartList.innerHTML = ''
    let totalCP = 0

    shoppingCart.forEach((cartItem, index) => {
        const itemTotalCP = cartItem.unitCostCP * cartItem.quantity
        totalCP += itemTotalCP

        const div = document.createElement('div')
        div.className = 'cart-item'
        div.innerHTML = `
            <span>${cartItem.item.name}</span>
            <div class="cart-controls">
                <button class="qty-btn minus-btn" data-index="${index}">-</button>
                <span>${cartItem.quantity}</span>
                <button class="qty-btn plus-btn" data-index="${index}">+</button>
            </div>
        `
        cartList.appendChild(div)
    })

    totalDisplay.innerText = formatCPtoCoinage(totalCP)

    document.querySelectorAll('.minus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = e.target.dataset.index
            if (shoppingCart[idx].quantity > 1) {
                shoppingCart[idx].quantity--
            } else {
                shoppingCart.splice(idx, 1)
            }
            renderCart()
        })
    })

    document.querySelectorAll('.plus-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            shoppingCart[e.target.dataset.index].quantity++
            renderCart()
        })
    })
}

function addToCart(itemId) {
    const item = shopInventory.find(i => i.id === itemId)
    if (!item) return

    const existingCartItem = shoppingCart.find(i => i.item.id === itemId)

    if (existingCartItem) {
        existingCartItem.quantity++
    } else {
        shoppingCart.push({
            item: item,
            quantity: 1,
            unitCostCP: parseCostToCP(item.cost)
        })
    }
    renderCart()
}

async function openShopModal() {
    const shopModal = document.getElementById('shop-modal')
    const shopItemsList = document.getElementById('shop-items-list')

    shoppingCart = []
    renderCart()

    shopItemsList.innerHTML = '<div class="monster-loading-text">Loading shop inventory...</div>'
    shopModal.showModal()

    try {
        const response = await fetchWithAuth(`${BASE_URL}/api/getShopInventory?campaignID=${sessionContext.campaignId}`)
        const data = await response.json()

        shopItemsList.innerHTML = ''

        if (data.success && data.shop && data.shop.items && data.shop.items.length > 0) {
            shopInventory = data.shop.items // Store locally for cart reference

            shopInventory.forEach(item => {
                const div = document.createElement('div')
                div.className = 'shop-inventory-item'

                div.innerHTML = `
                    <div class="shop-item-info">
                        <div class="shop-item-header">
                            <span class="shop-item-name">${item.name}</span>
                            <span class="shop-item-cost">${item.cost}</span>
                        </div>
                        <span class="shop-item-desc">${item.description}</span>
                    </div>
                    <button class="add-to-cart-btn" data-id="${item.id}">Add</button>
                `

                div.querySelector('.add-to-cart-btn').addEventListener('click', (e) => {
                    e.target.blur()
                    addToCart(item.id)
                })

                shopItemsList.appendChild(div)
            })
        } else {
            shopItemsList.innerHTML = '<div class="empty-state-text">The shop is currently empty.</div>'
        }
    } catch (err) {
        console.error("Failed to load shop inventory:", err)
        shopItemsList.innerHTML = '<div class="monster-error-message">Failed to load shop inventory.</div>'
    }
}

function shopInteraction() {
    const shopBtn = document.getElementById('shop-btn')
    const shopModal = document.getElementById('shop-modal')
    const checkoutBtn = document.getElementById('checkout-btn')

    if (!shopBtn || !shopModal) return

    shopBtn.addEventListener('click', () => {
        shopBtn.blur()
        if (!shopOpen) return
        openShopModal()
    })

    const closeShopModalButton = document.getElementById('close-shop-modal')
    closeShopModalButton.addEventListener('click', () => {
        shopModal.close()
        closeShopModalButton.blur()
    })

    checkoutBtn.addEventListener('click', async () => {
        checkoutBtn.blur()
        const checkoutMessage = document.getElementById('checkout-message')

        if (shoppingCart.length === 0) {
            checkoutMessage.innerText = "Your cart is empty."
            return
        }

        const totalCostCP = shoppingCart.reduce((total, cartItem) => total + (cartItem.unitCostCP * cartItem.quantity), 0)

        checkoutBtn.innerText = "Processing..."
        checkoutBtn.disabled = true

        try {
            const response = await fetchWithAuth(`${BASE_URL}/api/player/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: sessionContext.campaignId,
                    cart: shoppingCart,
                    totalCostCP: totalCostCP
                })
            })

            const data = await response.json()

            if (data.success) {
                checkoutMessage.style.color = "#10b981" // Success Green
                checkoutMessage.innerText = "Purchase successful!"
                shoppingCart = []
                renderCart()

                setTimeout(() => shopModal.close(), 1500)
            } else {
                checkoutMessage.style.color = "#ef4444" // Error Red
                checkoutMessage.innerText = data.error || "Transaction failed."
            }
        } catch (err) {
            checkoutMessage.style.color = "#ef4444"
            checkoutMessage.innerText = "Connection error during checkout."
        } finally {
            checkoutBtn.innerText = "Checkout"
            checkoutBtn.disabled = false
        }
    })
}

let combatActive = false
let currentTurnUserId = null
const activeCooldowns = new Map() // actionId -> Set<cooldownType>

function updateActionLockState() {
    const actionsList = document.getElementById('actions-list')
    if (!actionsList) return

    actionsList.querySelectorAll('.action-container').forEach(button => {
        const turnLocked = !combatActive || currentTurnUserId !== sessionContext.userId
        const cooldownLocked = activeCooldowns.has(button.id)
        const locked = turnLocked || cooldownLocked

        button.classList.toggle('locked', locked)
        button.disabled = locked
    })
}

socket.on('combat:turnChanged', ({ combatActive: ca, currentTurnUserId: id }) => {
    combatActive = ca
    currentTurnUserId = id

    if (id === sessionContext.userId) {
        activeCooldowns.forEach((types, actionId) => {
            types.delete('round')
            if (types.size === 0) activeCooldowns.delete(actionId)
        })
    }

    updateActionLockState()
})

function actionsHoverPopUp() {
    const actionWrappers = document.querySelectorAll(".action-wrapper")

    actionWrappers.forEach((wrapper) => {
        wrapper.addEventListener('mouseenter', () => {
            wrapper.classList.add("is-open")
        })

        wrapper.addEventListener('mouseleave', () => {
            wrapper.classList.remove("is-open")
        })
    })
}

function actionBarInteraction() {
    const actionsList = document.getElementById("actions-list")

    if (!actionsList) return

    actionsList.addEventListener('click', (e) => {
        const button = e.target.closest('.action-container')

        if (!button) return

        if (!combatActive) {
            showTemporaryNotice("No active combat.")
            return
        }
        if (currentTurnUserId !== sessionContext.userId) {
            showTemporaryNotice("It's not your turn!")
            return
        }
        if (activeCooldowns.has(button.id)) {
            showTemporaryNotice("That action is on cooldown.")
            return
        }

        const wrapper = button.closest('.action-wrapper')
        const nameSpan = wrapper.querySelector('.action-name')
        const fullText = nameSpan.textContent.trim()

        const [rawName, rawNotation] = fullText.split(':').map(s => s.trim())

        const diceMatch = rawNotation && rawNotation.match(/^(\d+)d(\d+)([+-]\d+)?$/i)

        if (diceMatch) {
            const count = parseInt(diceMatch[1])
            const sides = parseInt(diceMatch[2])
            const modifier = diceMatch[3] ? parseInt(diceMatch[3]) : 0

            const diceList = Array(count).fill(`d${sides}`)
            const rollData = rollSelectedDice(diceList)
            const total = rollData.total + modifier

            const playerName = document.getElementById("player-name").textContent || "Unknown Hero"

            let message = `${playerName} used ${rawName}: ${rollData.rollString}`
            if (modifier !== 0) {
                message += ` ${modifier > 0 ? '+' : ''}${modifier}`
            }
            message += ` (Total: ${total}).`

            sendMessage({
                type: 'action',
                text: message,
                senderName: playerName,
                meta: { actionName: rawName, rollString: rollData.rollString, total }
            })
        }
        else {
            const playerName = document.getElementById("player-name").textContent || "Unknown Hero"

            sendMessage({
                type: 'action',
                text: `${playerName} used ${rawName}.`,
                senderName: playerName,
                meta: { actionName: rawName }
            })
        }

        if (button.dataset.cooldown) {
            activeCooldowns.set(button.id, new Set(button.dataset.cooldown.split(',')))
            updateActionLockState()
        }
    })
}

function restInteraction() {
    const restBtn = document.getElementById('rest-btn')
    const restModal = document.getElementById('rest-modal')
    if (!restBtn || !restModal) return

    const shortRestBtn = document.getElementById('short-rest-btn')
    const longRestBtn = document.getElementById('long-rest-btn')
    const closeRestModal = document.getElementById('close-rest-modal')

    function hasCooldownType(type) {
        for (const types of activeCooldowns.values()) {
            if (types.has(type)) return true
        }
        return false
    }

    restBtn.addEventListener('click', () => {
        if (combatActive) {
            showTemporaryNotice("You can't rest during combat.")
            return
        }

        const canShortRest = hasCooldownType('shortRest')
        const canLongRest = canShortRest || hasCooldownType('longRest')

        if (!canShortRest && !canLongRest) {
            showTemporaryNotice("Nothing to rest from right now.")
            return
        }

        shortRestBtn.classList.toggle('hidden-ui', !canShortRest)
        longRestBtn.classList.toggle('hidden-ui', !canLongRest)

        restModal.showModal()
    })

    closeRestModal.addEventListener('click', () => {
        restModal.close()
    })

    function requestRest(restType) {
        const playerName = document.getElementById('player-name').textContent || 'Unknown Hero'
        socket.emit('rest:request', { restType, playerName })
        restModal.close()
    }

    shortRestBtn.addEventListener('click', () => requestRest('short'))
    longRestBtn.addEventListener('click', () => requestRest('long'))

    socket.on('rest:response', ({ restType, approved, reason }) => {
        if (approved) {
            activeCooldowns.forEach((types, actionId) => {
                types.delete('shortRest')
                if (restType === 'long') types.delete('longRest')
                if (types.size === 0) activeCooldowns.delete(actionId)
            })
            updateActionLockState()
            showTemporaryNotice("Rest approved!")
        } else {
            showTemporaryNotice(reason || "The DM denied your rest request.")
        }
    })
}

async function openRecipientPicker(anchorBtn, onSelect) {
    const existing = document.getElementById("recipient-dropdown")
    if (existing) {
        existing.remove()
        return
    }

    const participants = await fetchCampaignParticipants()

    const dropdown = document.createElement('div')
    dropdown.id = "recipient-dropdown"

    const allOption = document.createElement('button')
    allOption.textContent = "All"
    allOption.addEventListener('click', () => {
        onSelect(null, null)
        dropdown.remove()
    })
    dropdown.appendChild(allOption)

    participants.forEach((participant) => {
        const option = document.createElement('button')
        option.textContent = `${participant.first_name} ${participant.last_name}`

        option.addEventListener('click', () => {
            onSelect(participant.user_id, `${participant.first_name} ${participant.last_name}`)
            dropdown.remove()
        })

        dropdown.appendChild(option)
    })

    anchorBtn.insertAdjacentElement('afterend', dropdown)
}

function chatInputInteraction() {
    const input = document.getElementById("chat-input")
    const sendBtn = document.getElementById("send-btn")
    const recipientBtn = document.getElementById("recipient-btn")

    let whisperTargetId = null
    let whisperTargetName = null

    function doSend() {
        const text = input.value.trim()
        if (!text) return

        const isPlayer = window.location.pathname.endsWith("playerScreen.html")
        const senderName = isPlayer
            ? (document.getElementById("player-name").textContent || "Unknown Hero")
            : "DM"

        if (whisperTargetId) {
            sendMessage({
                type: 'whisper',
                text,
                targetId: whisperTargetId,
                targetName: whisperTargetName,
                senderName
            })
        }
        else {
            sendMessage({
                type: 'chat',
                text: `${senderName}: ${text}`,
                senderName
            })
        }

        input.value = ''
    }

    sendBtn.addEventListener('click', doSend)

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doSend()
    })

    recipientBtn.addEventListener('click', () => {
        openRecipientPicker(recipientBtn, (targetId, targetName) => {
            whisperTargetId = targetId
            whisperTargetName = targetName
            recipientBtn.textContent = targetId ? `To: ${targetName}` : "To: All"
        })
    })
}

function navFooterSwitch() {
    const infoButton = document.getElementById("nav-info-btn")
    const mapButton = document.getElementById("nav-map-btn")
    const diceButton = document.getElementById("nav-dice-btn")

    const leftPanel = document.getElementById("left-panel")
    const mainPanel = document.getElementById("main")
    const rightPanel = document.getElementById("right-panel")

    function resetViews() {
        infoButton.classList.remove("active")
        mapButton.classList.remove("active")
        diceButton.classList.remove("active")

        leftPanel.classList.remove("mobile-active")
        mainPanel.classList.remove("mobile-active")
        rightPanel.classList.remove("mobile-active")
    }

    infoButton.addEventListener('click', () => {
        resetViews()
        infoButton.classList.add("active")
        leftPanel.classList.add("mobile-active")
    })

    mapButton.addEventListener('click', () => {
        resetViews()
        mapButton.classList.add("active")
        mainPanel.classList.add("mobile-active")
    })

    diceButton.addEventListener('click', () => {
        resetViews()
        diceButton.classList.add("active")
        rightPanel.classList.add("mobile-active")
    })
}
