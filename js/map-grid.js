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
const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

const state = {
  scale: 1,
  offsetX: 50,
  offsetY: 50,
  minScale: 0.2,
  maxScale: 8,
  baseGrid: 60,
  gridCols: 50,
  gridRows: 50,
  tokens: [
    { id: "gamur", gridX: 15, gridY: 30, color: "#e74c3c", radius: 25 },
    { id: "goblin-1", gridX: 20, gridY: 34, color: "#2ecc71", radius: 25 }
  ]
};

let isDraggingMap = false;
let draggingTokenId = null;
let lastX = 0;
let lastY = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(canvas.clientWidth * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function draw() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#2d3748";
  ctx.fillRect(0, 0, w, h);

  const step = state.baseGrid * state.scale;
  const mapWidth = state.gridCols * step;
  const mapHeight = state.gridRows * step;

  ctx.fillStyle = "#f0f8ff";
  ctx.fillRect(state.offsetX, state.offsetY, mapWidth, mapHeight);

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();

  // Vertical lines
  for (let col = 0; col <= state.gridCols; col++) {
    const x = state.offsetX + (col * step);
    ctx.moveTo(x, state.offsetY);
    ctx.lineTo(x, state.offsetY + mapHeight);
  }

  // Horizontal lines
  for (let row = 0; row <= state.gridRows; row++) {
    const y = state.offsetY + (row * step);
    ctx.moveTo(state.offsetX, y);
    ctx.lineTo(state.offsetX + mapWidth, y);
  }

  ctx.stroke();

  state.tokens.forEach(token => {
    // Translate Grid Math to Pixel Math
    const screenX = state.offsetX + (token.gridX * state.baseGrid * state.scale);
    const screenY = state.offsetY + (token.gridY * state.baseGrid * state.scale);

    // Find the center of the grid square
    const halfSquare = (state.baseGrid * state.scale) / 2;
    const centerX = screenX + halfSquare;
    const centerY = screenY + halfSquare;

    // Draw the token
    ctx.beginPath();
    ctx.arc(centerX, centerY, token.radius * state.scale, 0, Math.PI * 2);
    ctx.fillStyle = token.color;
    ctx.fill();
    ctx.stroke();
  });
}

function zoomAt(clientX, clientY, factor) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  const prevScale = state.scale;
  const nextScale = Math.min(
    state.maxScale,
    Math.max(state.minScale, prevScale * factor)
  );
  if (nextScale === prevScale) return;

  state.offsetX = mouseX - ((mouseX - state.offsetX) * nextScale) / prevScale;
  state.offsetY = mouseY - ((mouseY - state.offsetY) * nextScale) / prevScale;
  state.scale = nextScale;
  draw();
}

function getGridCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;

  const step = state.baseGrid * state.scale;

  // Translate screen pixel to exact floating grid coordinate
  const floatX = (mouseX - state.offsetX) / step;
  const floatY = (mouseY - state.offsetY) / step;

  return { x: floatX, y: floatY };
}

// --- AUTO-FOCUS LOGIC ---
function focusOnFirstToken() {
  if (state.tokens.length === 0) return;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const token = state.tokens[0]; // Grab the first token in the array

  const step = state.baseGrid * state.scale;

  // 1. Calculate the exact pixel center of the token relative to the grid
  const tokenCenterX = (token.gridX * step) + (step / 2);
  const tokenCenterY = (token.gridY * step) + (step / 2);

  // 2. Adjust the map offsets so the token's center perfectly aligns with the screen's center
  state.offsetX = (w / 2) - tokenCenterX;
  state.offsetY = (h / 2) - tokenCenterY;

  draw();
}

// 3. Fire this function exactly once after the iframe and CSS have fully loaded
window.addEventListener("load", () => {
  focusOnFirstToken();
});

canvas.addEventListener("mousedown", (event) => {
  document.getElementById("hint").classList.add("hidden-ui");

  const { x, y } = getGridCoords(event.clientX, event.clientY);

  // 1. Check if a token occupies this integer cell
  const clickedToken = state.tokens.find(t =>
    Math.floor(x) === Math.floor(t.gridX) &&
    Math.floor(y) === Math.floor(t.gridY)
  );

  if (clickedToken) {
    // 2a. A token was clicked! Lock onto it.
    draggingTokenId = clickedToken.id;

    clickedToken.originalGridX = clickedToken.gridX;
    clickedToken.originalGridY = clickedToken.gridY;
  } else {
    // 2b. Empty space was clicked. Pan the map.
    isDraggingMap = true;
  }

  lastX = event.clientX;
  lastY = event.clientY;
  canvas.classList.add("dragging");
});

window.addEventListener("mousemove", (event) => {
  if (draggingTokenId) {
    // --- TOKEN DRAGGING LOGIC ---
    const { x, y } = getGridCoords(event.clientX, event.clientY);
    const token = state.tokens.find(t => t.id === draggingTokenId);

    // We subtract 0.5 so the center of the token stays pinned to the mouse cursor
    token.gridX = x - 0.5;
    token.gridY = y - 0.5;

    draw(); // Redraw immediately to show movement

  } else if (isDraggingMap) {
    // --- MAP PANNING LOGIC ---
    state.offsetX += event.clientX - lastX;
    state.offsetY += event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    draw();
  }
});

window.addEventListener("mouseup", () => {
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId);
    if (token) {
      // 1. Calculate the exact integer square we are hovering over
      let droppedX = Math.round(token.gridX);
      let droppedY = Math.round(token.gridY);

      // 2. Check if that square is outside the white map boundaries
      const isOutsideX = droppedX < 0 || droppedX >= state.gridCols;
      const isOutsideY = droppedY < 0 || droppedY >= state.gridRows;

      if (isOutsideX || isOutsideY) {
        // REJECT: Teleport back to the original integer square
        token.gridX = token.originalGridX;
        token.gridY = token.originalGridY;
      } else {
        // ACCEPT: Snap to the new integer square
        token.gridX = droppedX;
        token.gridY = droppedY;
      }

      draw();
    }
    draggingTokenId = null; // Successfully drop the token!
  }

  isDraggingMap = false;
  canvas.classList.remove("dragging");
});

document.addEventListener("mouseleave", () => {
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId);

    // If we lose track of the mouse, revert the token to its original safe spot
    if (token && token.originalGridX !== undefined) {
      token.gridX = token.originalGridX;
      token.gridY = token.originalGridY;
      draw();
    }

    draggingTokenId = null; // Let go of the token
  }

  isDraggingMap = false;
  canvas.classList.remove("dragging");
});

canvas.addEventListener(
  "wheel",
  (event) => {
    document.getElementById("hint").classList.add("hidden-ui");

    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.1 : 0.9;
    zoomAt(event.clientX, event.clientY, factor);
  },
  { passive: false }
);

canvas.addEventListener("touchend", () => {
  if (draggingTokenId) {
    const token = state.tokens.find(t => t.id === draggingTokenId);
    if (token) {
      let droppedX = Math.round(token.gridX);
      let droppedY = Math.round(token.gridY);

      const isOutsideX = droppedX < 0 || droppedX >= state.gridCols;
      const isOutsideY = droppedY < 0 || droppedY >= state.gridRows;

      if (isOutsideX || isOutsideY) {
        token.gridX = token.originalGridX;
        token.gridY = token.originalGridY;
      } else {
        token.gridX = droppedX;
        token.gridY = droppedY;
      }
      draw();
    }
    draggingTokenId = null;
  }

  isDraggingMap = false;
});

canvas.addEventListener("touchmove", (event) => {
  if (event.touches.length === 1) {
    event.preventDefault(); // Prevents the whole browser from scrolling down
    const touch = event.touches[0];

    if (draggingTokenId) {
      // Move token via touch
      const { x, y } = getGridCoords(touch.clientX, touch.clientY);
      const token = state.tokens.find(t => t.id === draggingTokenId);
      token.gridX = x - 0.5;
      token.gridY = y - 0.5;
      draw();
    } else if (isDraggingMap) {
      // Pan map via touch
      state.offsetX += touch.clientX - lastX;
      state.offsetY += touch.clientY - lastY;
      lastX = touch.clientX;
      lastY = touch.clientY;
      draw();
    }
  }
});

document.addEventListener('click', () => {
  if (window.parent !== window) {

    const parentWrapper = window.parent.document.getElementById("active-effects-wrapper");

    if (parentWrapper && parentWrapper.classList.contains("is-open")) {
      parentWrapper.classList.remove("is-open");
    }
  }
});

// Creates an observer that calls your resize() function 
// whenever the canvas's physical layout dimensions change.
const canvasObserver = new ResizeObserver(() => {
  resize();
});

// Attach it to the canvas
canvasObserver.observe(canvas);
