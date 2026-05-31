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
  offsetX: 0,
  offsetY: 0,
  minScale: 0.2,
  maxScale: 8,
  baseGrid: 60,
  tokens: [
    { id: "gamur", gridX: 2, gridY: 3, color: "#e74c3c", radius: 25 },
    { id: "goblin-1", gridX: 5, gridY: 4, color: "#2ecc71", radius: 25 }
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
  ctx.fillStyle = "#f0f8ff";
  ctx.fillRect(0, 0, w, h);

  const step = state.baseGrid * state.scale;
  const startX = ((state.offsetX % step) + step) % step;
  const startY = ((state.offsetY % step) + step) % step;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.beginPath();

  for (let x = startX; x <= w; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }

  for (let y = startY; y <= h; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
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
    // --- TOKEN SNAPPING LOGIC ---
    const token = state.tokens.find(t => t.id === draggingTokenId);
    if (token) {
      // Math.round pulls the floating coordinate (e.g. 4.25) to the nearest whole cell (4)
      token.gridX = Math.round(token.gridX);
      token.gridY = Math.round(token.gridY);
      draw();
    }
    draggingTokenId = null; // Release the token
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

canvas.addEventListener("touchstart", (event) => {
  if (event.touches.length === 1) {
    document.getElementById("hint").classList.add("hidden-ui");

    const touch = event.touches[0];
    const { x, y } = getGridCoords(touch.clientX, touch.clientY);

    // Hit detection for tokens on mobile
    const clickedToken = state.tokens.find(t =>
      Math.floor(x) === Math.floor(t.gridX) &&
      Math.floor(y) === Math.floor(t.gridY)
    );

    if (clickedToken) {
      draggingTokenId = clickedToken.id;
    } else {
      isDraggingMap = true;
    }

    lastX = touch.clientX;
    lastY = touch.clientY;
  }
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

canvas.addEventListener("touchend", () => {
  isDraggingMap = false;
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
