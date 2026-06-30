/*
  Grid map walkthrough:
  1) Keep map state in `state`:
     - `scale` controls zoom level.
     - `offsetX` and `offsetY` control panning.
  2) `draw()` redraws the full canvas each time state changes.
     - Grid spacing is `baseGrid * scale`.
     - `startX/startY` use modulo math so lines repeat smoothly while dragging.
  3) Mouse/touch drag updates offsets, then calls `draw()`.
  4) `zoomAt()` zooms around the cursor point (not the top-left corner).
  5) `resize()` keeps canvas crisp on high-DPI screens and window resize.
*/
const canvas = document.getElementById("map")
const ctx = canvas.getContext("2d")

const state = {
  scale: 1,
  offsetX: 50,
  offsetY: 50,
  minScale: 0.2,
  maxScale: 8,
  baseGrid: 60,
  gridCols: 50,
  gridRows: 50,
  tokens: []
}

let isDraggingMap = false
let draggingTokenId = null
let lastX = 0
let lastY = 0

let initialPinchDistance = null

function getDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function resize() {
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.floor(canvas.clientWidth * dpr)
  canvas.height = Math.floor(canvas.clientHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  draw()
}

function draw() {
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = "#2d3748"
  ctx.fillRect(0, 0, w, h)

  const step = state.baseGrid * state.scale
  const mapWidth = state.gridCols * step
  const mapHeight = state.gridRows * step

  ctx.fillStyle = "#f0f8ff"
  ctx.fillRect(state.offsetX, state.offsetY, mapWidth, mapHeight)

  if (mapImageObj) {
    const imgAspect = mapImageObj.width / mapImageObj.height
    const gridAspect = mapWidth / mapHeight

    let drawWidth = mapWidth
    let drawHeight = mapHeight

    // Adjust dimensions to prevent stretching
    if (imgAspect > gridAspect) {
      drawHeight = mapWidth / imgAspect // Image is wider, scale height down
    } else {
      drawWidth = mapHeight * imgAspect // Image is taller, scale width down
    }

    const centerX = state.offsetX + (mapWidth - drawWidth) / 2
    const centerY = state.offsetY + (mapHeight - drawHeight) / 2

    ctx.drawImage(mapImageObj, centerX, centerY, drawWidth, drawHeight)
  }

  state.tokens.forEach(token => {
    const screenX = state.offsetX + (token.gridX * state.baseGrid * state.scale)
    const screenY = state.offsetY + (token.gridY * state.baseGrid * state.scale)
    const squareSize = state.baseGrid * state.scale

    if (token.imgObj) {
      ctx.drawImage(token.imgObj, screenX, screenY, squareSize, squareSize)
    } else {
      const halfSquare = squareSize / 2
      ctx.beginPath()
      ctx.arc(screenX + halfSquare, screenY + halfSquare, token.radius * state.scale, 0, Math.PI * 2)
      ctx.fillStyle = token.color
      ctx.fill()
      ctx.stroke()
    }
  })

  ctx.strokeStyle = "#000000"
  ctx.lineWidth = 1
  ctx.beginPath()

  for (let col = 0; col <= state.gridCols; col++) {
    const x = state.offsetX + (col * step)
    ctx.moveTo(x, state.offsetY)
    ctx.lineTo(x, state.offsetY + mapHeight)
  }

  for (let row = 0; row <= state.gridRows; row++) {
    const y = state.offsetY + (row * step)
    ctx.moveTo(state.offsetX, y)
    ctx.lineTo(state.offsetX + mapWidth, y)
  }

  ctx.stroke()

  state.tokens.forEach(token => {
    const screenX = state.offsetX + (token.gridX * state.baseGrid * state.scale)
    const screenY = state.offsetY + (token.gridY * state.baseGrid * state.scale)

    const halfSquare = (state.baseGrid * state.scale) / 2
    const tokenCenterX = screenX + halfSquare
    const tokenCenterY = screenY + halfSquare

    ctx.beginPath()
    ctx.arc(tokenCenterX, tokenCenterY, token.radius * state.scale, 0, Math.PI * 2)
    ctx.fillStyle = token.color
    ctx.fill()
    ctx.stroke()
  })
}

function zoomAt(clientX, clientY, factor) {
  const rect = canvas.getBoundingClientRect()
  const mouseX = clientX - rect.left
  const mouseY = clientY - rect.top

  const prevScale = state.scale
  const nextScale = Math.min(
    state.maxScale,
    Math.max(state.minScale, prevScale * factor)
  )
  if (nextScale === prevScale) return

  state.offsetX = mouseX - ((mouseX - state.offsetX) * nextScale) / prevScale
  state.offsetY = mouseY - ((mouseY - state.offsetY) * nextScale) / prevScale
  state.scale = nextScale
  draw()
}

function getGridCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect()
  const mouseX = clientX - rect.left
  const mouseY = clientY - rect.top

  const step = state.baseGrid * state.scale

  const floatX = (mouseX - state.offsetX) / step
  const floatY = (mouseY - state.offsetY) / step

  return { x: floatX, y: floatY }
}

function focusOnFirstToken() {
  if (state.tokens.length === 0) return

  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const token = state.tokens[0]

  const step = state.baseGrid * state.scale

  const tokenCenterX = (token.gridX * step) + (step / 2)
  const tokenCenterY = (token.gridY * step) + (step / 2)

  state.offsetX = (w / 2) - tokenCenterX
  state.offsetY = (h / 2) - tokenCenterY

  draw()
}

// Fire this function exactly once after the iframe and CSS have fully loaded
window.addEventListener("load", () => {
  focusOnFirstToken()
})

canvas.addEventListener("mousedown", (event) => {
  document.getElementById("hint").classList.add("hidden-ui")

  const { x, y } = getGridCoords(event.clientX, event.clientY)

  const clickedToken = state.tokens.find(t =>
    Math.floor(x) === Math.floor(t.gridX) &&
    Math.floor(y) === Math.floor(t.gridY)
  )

  if (clickedToken) {
    draggingTokenId = clickedToken.id

    clickedToken.originalGridX = clickedToken.gridX
    clickedToken.originalGridY = clickedToken.gridY
  } else {
    isDraggingMap = true
  }

  lastX = event.clientX
  lastY = event.clientY
  canvas.classList.add("dragging")
})

window.addEventListener("mousemove", (event) => {
  if (draggingTokenId) {
    const { x, y } = getGridCoords(event.clientX, event.clientY)
    const token = state.tokens.find(t => t.id === draggingTokenId)

    // We subtract 0.5 so the center of the token stays pinned to the mouse cursor
    token.gridX = x - 0.5
    token.gridY = y - 0.5

    draw()

  } else if (isDraggingMap) {
    state.offsetX += event.clientX - lastX
    state.offsetY += event.clientY - lastY
    lastX = event.clientX
    lastY = event.clientY

    draw()
  }
})

window.addEventListener("mouseup", () => {
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId)
    if (token) {
      let droppedX = Math.round(token.gridX)
      let droppedY = Math.round(token.gridY)

      const isOutsideX = droppedX < 0 || droppedX >= state.gridCols
      const isOutsideY = droppedY < 0 || droppedY >= state.gridRows

      if (isOutsideX || isOutsideY) {
        token.gridX = token.originalGridX
        token.gridY = token.originalGridY
      } else {
        token.gridX = droppedX
        token.gridY = droppedY

        if (window.parent !== window && window.parent.broadcastTokenMove) {
          window.parent.broadcastTokenMove({
            tokenId: token.id,
            newX: token.gridX,
            newY: token.gridY
          })
        }
      }

      draw()
    }
    draggingTokenId = null
  }

  isDraggingMap = false
  canvas.classList.remove("dragging")
})

document.addEventListener("mouseleave", () => {
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId)

    // If we lose track of the mouse, revert the token to its original safe spot
    if (token && token.originalGridX !== undefined) {
      token.gridX = token.originalGridX
      token.gridY = token.originalGridY
      draw()
    }

    draggingTokenId = null
  }

  isDraggingMap = false
  canvas.classList.remove("dragging")
})

canvas.addEventListener(
  "wheel",
  (event) => {
    document.getElementById("hint").classList.add("hidden-ui")

    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.1 : 0.9
    zoomAt(event.clientX, event.clientY, factor)
  },
  { passive: false }
)

canvas.addEventListener("touchstart", (event) => {
  document.getElementById("hint").classList.add("hidden-ui")

  if (event.touches.length === 2) {
    initialPinchDistance = getDistance(event.touches[0], event.touches[1])
    isDraggingMap = false // Disable panning while zooming
    return // Skip single-finger logic
  }

  const touch = event.touches[0]
  const { x, y } = getGridCoords(touch.clientX, touch.clientY)

  const clickedToken = state.tokens.find(t =>
    Math.floor(x) === Math.floor(t.gridX) &&
    Math.floor(y) === Math.floor(t.gridY)
  )

  if (clickedToken) {
    draggingTokenId = clickedToken.id
    clickedToken.originalGridX = clickedToken.gridX
    clickedToken.originalGridY = clickedToken.gridY
  } else {
    isDraggingMap = true
  }

  lastX = touch.clientX
  lastY = touch.clientY
  canvas.classList.add("dragging")
})

canvas.addEventListener("touchend", () => {
  if (event.touches.length < 2) {
    initialPinchDistance = null
  }
  if (event.touches.length === 1) {
    lastX = event.touches[0].clientX
    lastY = event.touches[0].clientY
  }
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId)
    if (token) {
      let droppedX = Math.round(token.gridX)
      let droppedY = Math.round(token.gridY)

      const isOutsideX = droppedX < 0 || droppedX >= state.gridCols
      const isOutsideY = droppedY < 0 || droppedY >= state.gridRows

      if (isOutsideX || isOutsideY) {
        token.gridX = token.originalGridX
        token.gridY = token.originalGridY
      } else {
        token.gridX = droppedX
        token.gridY = droppedY

        if (window.parent !== window && window.parent.broadcastTokenMove) {
          window.parent.broadcastTokenMove({
            tokenId: token.id,
            newX: token.gridX,
            newY: token.gridY
          })
        }
      }
      draw()
    }
    draggingTokenId = null
  }

  isDraggingMap = false
  canvas.classList.remove("dragging")
})

canvas.addEventListener("touchmove", (event) => {
  event.preventDefault()
  if (event.touches.length === 2) {
    if (initialPinchDistance) {
      const currentDistance = getDistance(event.touches[0], event.touches[1])
      const pinchFactor = currentDistance / initialPinchDistance

      // Find the center point between the two fingers to zoom exactly where they are looking
      const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2
      const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2

      zoomAt(centerX, centerY, pinchFactor)

      initialPinchDistance = currentDistance
    }
  }
  else if (event.touches.length === 1) {
    event.preventDefault() // Prevents the whole browser from scrolling down
    const touch = event.touches[0]

    if (draggingTokenId) {
      const { x, y } = getGridCoords(touch.clientX, touch.clientY)
      const token = state.tokens.find(t => t.id === draggingTokenId)
      token.gridX = x - 0.5
      token.gridY = y - 0.5
      draw()
    } else if (isDraggingMap) {
      state.offsetX += touch.clientX - lastX
      state.offsetY += touch.clientY - lastY
      lastX = touch.clientX
      lastY = touch.clientY
      draw()
    }
  }
}, { passive: false })

document.addEventListener('click', () => {
  if (window.parent !== window) {

    const parentWrapper = window.parent.document.getElementById("active-effects-wrapper")

    if (parentWrapper && parentWrapper.classList.contains("is-open")) {
      parentWrapper.classList.remove("is-open")
    }
  }
})

window.updateRemoteToken = (tokenId, newX, newY) => {
  const token = state.tokens.find(t => t.id === tokenId)
  if (token) {
    token.gridX = newX
    token.gridY = newY
    draw()
  }
}

const canvasObserver = new ResizeObserver(() => {
  resize()
})

canvasObserver.observe(canvas)


let mapImageObj = null

window.setMapImage = (imageUrl) => {
  const img = new Image()
  img.onload = () => {
    mapImageObj = img
    draw()
  }
  img.src = imageUrl
}

window.addToken = (imageUrl) => {
  const img = new Image()
  img.onload = () => {
    const newToken = {
      id: 'token-' + Date.now(),
      gridX: Math.floor(state.gridCols / 2),
      gridY: Math.floor(state.gridRows / 2),
      imageUrl: imageUrl,
      imgObj: img
    }
    state.tokens.push(newToken)
    draw()

    if (window.parent !== window && window.parent.broadcastTokenSpawn) {
      window.parent.broadcastTokenSpawn({
        id: newToken.id,
        gridX: newToken.gridX,
        gridY: newToken.gridY,
        imageUrl: newToken.imageUrl
      })
    }
  }
  img.src = imageUrl
}

window.addRemoteToken = (data) => {
  const img = new Image()
  img.onload = () => draw()
  img.src = data.imageUrl

  state.tokens.push({
    id: data.id,
    gridX: data.gridX,
    gridY: data.gridY,
    imageUrl: data.imageUrl,
    imgObj: img
  })
  draw()
}

window.setInitialTokens = (tokens) => {
  state.tokens = (tokens || []).map(token => {
    const restored = { ...token, imgObj: null }
    if (token.imageUrl) {
      const img = new Image()
      img.onload = () => draw()
      img.src = token.imageUrl
      restored.imgObj = img
    }
    return restored
  })
  draw()
}

window.resetMap = () => {
  state.tokens = []
  mapImageObj = null
  draw()
}
