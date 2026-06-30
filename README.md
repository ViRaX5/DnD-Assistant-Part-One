frontend_content = """# 🐉 DnD Assistant (Frontend) 🎲

*Roll for initiative!* Welcome to the frontend portal of the **DnD Assistant**—the ultimate digital companion for Dungeon Masters and Adventurers alike. 

Whether you're exploring deep caverns, haggling with tavern merchants, or fighting off a horde of goblins, this web interface brings your tabletop experience to life on both desktop and mobile devices.

## ✨ Features (The Loot)

* **🗺️ Interactive Grid Map:** A fully synced HTML5 Canvas map! Drag and drop tokens, change backgrounds on the fly, and use custom two-finger pinch-to-zoom for mobile adventurers.
* **🎵 Synced Bardic Inspiration:** A real-time audio engine. When the DM hits play on the battle music, it instantly plays on every player's device (with individual volume controls for the DM!).
* **⚔️ Live Combat & Initiative:** An automated turn tracker that manages initiative rolls, tracks current rounds, and keeps the party in sync during the heat of battle.
* **📜 Interactive Character Sheets:** Live stat tracking, saving throws, skill checks, and active effects that update dynamically.
* **💰 The Local Merchant:** An interactive shop system! The DM stocks the shelves, and players can browse, add to cart, and checkout using their character's gold in real-time.
* **💬 Whispers & Shouts:** A built-in chat system for party communication and combat log tracking.

## 🛠️ The Arcane Stack (Tech)

We kept the spells simple but powerful. No heavy frameworks—just pure, untamed web magic:
* **HTML5 & CSS3:** Fully responsive design that gracefully adapts from desktop DM screens to mobile player sheets (say goodbye to the `100vh` mobile bug!).
* **Vanilla JavaScript (ES6 Modules):** Clean, modular scripts for handling UI interactions, canvas drawing, and logic.
* **Socket.io-client:** The magical tether that keeps everyone's game state, map tokens, and audio perfectly synced with the backend in real-time.

## 🚀 Getting Started (Summoning the App)

1. **Clone the Tome:** `git clone <your-repo-url>`
2. **Open the Scroll:** You don't need a build step! Simply open `login.html` in your browser, or use VS Code's **Live Server** extension to host it locally.
3. **Connect to the Nexus:** Ensure the backend server is running (see the Backend README). The app is pre-configured to detect if you are running on `localhost` or production.

---
*May your rolls be high and your critical fails be hilarious! Built with ❤️ (and lots of coffee) for our final presentation.*
"""
