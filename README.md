# AATAKSH — 3D Battle Royale Shooting Game

A fully playable 3D third-person battle royale shooting game inspired by Garena Free Fire. **AATAKSH** features its own original design, expansive island map, two distinct tactical operatives (**Akshat** and **Akshita**), an arsenal of firearms and grenades, 19 autonomous AI combatants, a shrinking safe zone, responsive procedural audio, and mobile touch controls.

---

## 🎮 Quick Start Guide

### Option 1: Double-Click Launcher (Recommended for Windows)
1. Navigate to:
   ```
   C:\Users\udayi\.gemini\antigravity\scratch\aataksh-game
   ```
2. Double-click **`start-game.bat`**.
3. The local game server will automatically start on `http://localhost:8080/` and launch your default browser!

### Option 2: PowerShell Launcher
Run the built-in PowerShell web server:
```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

### Option 3: Direct Browser Launch
Open `index.html` directly in Google Chrome, Microsoft Edge, or Mozilla Firefox.

---

## 🎖️ Operatives (Main Characters)

Before entering the battleground, choose your operative:

### 1. **Akshat — Speed Specialist**
- **Profile**: Athletic male operative in modern tactical jacket, utility cargo pants, and combat boots.
- **Weapon Preference**: Assault rifles, tactical pistols, and frag grenades.
- **Special Ability**: **Adrenaline Rush** ⚡
  - Provides a **+65% movement speed boost** for 8 seconds (25s cooldown).
  - Emits dynamic neon speed trails. Ideal for rapid storm rotations and aggressive flanking maneuvers.

### 2. **Akshita — Defense Specialist**
- **Profile**: Athletic female operative in sleek tactical armor with a striking matte black and crimson red color theme.
- **Weapon Preference**: Sniper precision, shotgun breach, and tactical assault rifles.
- **Special Ability**: **Titan Shield** 🛡️
  - Deploys a **hexagonal energy barrier dome** absorbing **75% of incoming bullet damage** for 8 seconds (25s cooldown).
  - Perfect for surviving intense crossfire and winning 1v1 duels.

---

## 🗺️ The Battle Royale Island (Apex Isle)

The 400x400 unit terrain features high-altitude rolling hills, strategic cover, and landmark points of interest:

1. **Central City (Apex Plaza)**:
   - Walkable 2-story houses with climbable roof stairs, barricades, and high-tier military loot.
2. **Military Outpost (Camp Titan)**:
   - Elevated watchtowers with 360° sniper sightlines, perimeter shipping containers, and sandbag bunkers.
3. **Industrial Warehouse District (Omega Bay)**:
   - Massive twin warehouses with roll-up bay doors and interior storage crate labyrinths.
4. **Coastal Ruins (Sunset Ridge)**:
   - Tactical stone cover, seaside outpost houses, and secluded loot caches.
5. **Wilderness & Natural Cover**:
   - 90+ pine trees, 45+ granite boulders, winding highways, and parachute supply airdrops.

---

## 🔫 Weapons & Ballistics

| Weapon | Type | Damage | Fire Rate | Mag Size | Special Feature |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AK-47 Tactical** | Assault Rifle | 34 (85 Headshot) | 550 RPM | 30 | Fully automatic, reliable mid-range stopping power |
| **AWM Arctic** | Sniper Rifle | 115 (287 Headshot) | Bolt Action | 5 | Extreme zoom mil-dot sniper scope, one-hit headshot knockout |
| **Spas-12** | Shotgun | 18 x 8 pellets (144 max) | Pump Action | 8 | Devastating close-quarters spread pattern |
| **Desert Eagle .50** | Sidearm Pistol | 50 (120 Headshot) | Semi-Auto | 7 | Heavy caliber secondary sidearm |
| **Frag Grenade** | Throwable Explosive | Up to 180 Area Damage | 3.0s Fuse | 3 | Physical parabolic bounce, massive fireball & screen shake |

---

## ⚡ Shrinking Safe Zone (Electric Storm)

- **Phase 1**: Initial safe radius of 175m; 45s grace period before shrinking to 115m (DPS: 3).
- **Phase 2**: 35s grace countdown; contracts to 65m (DPS: 6).
- **Phase 3**: 25s grace countdown; contracts to 28m (DPS: 10).
- **Final Circle**: Extreme sudden death! Shrinks down to 6m (DPS: 16).
- Visual warning sirens sound before each shrink phase. Anyone outside suffers continuous damage accompanied by electric static vignetting.

---

## 🤖 AI Enemy Bots

- 19 autonomous AI combatants (`Phantom`, `Viper`, `Ghost`, `Striker`, `Nova`, `Blitz`, `Shadow`, etc.).
- Behavioral states: Exploring/Looting, Hunting, Engaging firefights, and Fleeing the storm.
- AI bots engage in realistic combat with both the player and each other.
- Eliminated bots drop military death crates containing weapons, ammo, and medkits.
- Live animated Kill Feed tracks all combat encounters in real time.

---

## ⌨️ Controls Guide

### PC Controls
- **W, A, S, D** — Move Operative
- **Shift** — Tactical Sprint
- **Space** — Jump
- **C** — Crouch / Duck Cover
- **Left Mouse Click** — Fire Weapon (Hold for Automatic Rifle)
- **Right Mouse Click** — Aim Down Sights (ADS Zoom / Sniper Scope)
- **R** — Reload Active Weapon
- **1, 2, 3, 4** — Quick Switch Weapon Slots
- **G** — Throw Frag Grenade
- **E** — Activate Hero Ability (*Adrenaline Rush* / *Titan Shield*)
- **F** — Loot Items & Equipment
- **Mouse Movement** — Look / Aim (Pointer Lock enabled)

### Android / Mobile Touch Controls
- **Left Virtual Thumbstick** — Responsive directional movement & sprint threshold.
- **Right Swipe Area** — Smooth look and aim rotation.
- **On-Screen Action Buttons** — `FIRE`, `AIM`, `JUMP`, `DUCK`, `RELOAD`, `LOOT`, and `ABILITY`.

---

## 🔊 Procedural Audio Engine

All sound effects are generated procedural-first using the browser's built-in **Web Audio API**:
- Distinct acoustic profiles for rifles, snipers, shotguns, pistols, and explosions.
- Procedural footsteps tailored to walk and sprint cadences.
- Satisfying high-register hitmarker clicks and dual-bell headshot pings.
- Klaxon storm sirens and celebratory **BOOYAH!** victory fanfares.
- Zero external MP3 downloads required!

---

## 📁 Project Architecture

```
aataksh-game/
├── index.html            # Main game entry point & UI structure
├── server.ps1            # Lightweight PowerShell HTTP server
├── start-game.bat        # Windows one-click launcher
├── README.md             # Complete documentation
├── css/
│   └── style.css         # Cyber-tactical glassmorphism stylesheet
├── js/
│   ├── audio.js          # Procedural Web Audio API sound synthesizer
│   ├── models.js         # Procedural 3D models for Akshat, Akshita, weapons & props
│   ├── weapons.js        # Ballistics, bullet tracers, recoil & grenade physics
│   ├── map.js            # Island map generation, POIs, landmarks & loot spawns
│   ├── player.js         # Third-person player controller & camera mechanics
│   ├── ai.js             # Autonomous AI bot manager & combat behavior
│   ├── safezone.js       # Shrinking electric storm zone & DPS damage system
│   ├── ui.js             # Tactical HUD, minimap 2D radar, damage numbers & kill feed
│   └── game.js           # Core game state manager, match loop & input coordinator
└── libs/
    └── three.min.js      # Bundled Three.js r128 3D rendering library
```
