# Rally Compass

A regularity / TSD (*Time-Speed-Distance*) rally computer, built to run on a phone inside the car.

In a regularity stage the winner isn't the fastest car but the one that holds an **imposed average speed** most precisely. Rally Compass measures distance with the phone's GPS, compares it against the elapsed time and tells you at every moment how many seconds you are **ahead** of or **behind** the ideal time, so you know whether to slow down or speed up.

It's a PWA: you install it on your phone from the browser, it works offline and it keeps the screen on while a stage is running.

## How it works

### Ideal time and difference

Tapping the start button starts the stage clock. With distance covered `d` and target speed `v`:

```
ideal time = d / v
difference = real time − ideal time
```

- **Positive difference (+)** → you're **late**: speed up.
- **Negative difference (−)** → you're **ahead**: slow down.

All times are shown with hundredths of a second (`mm:ss.cc`).

### Dual GPS measurement

Distance is computed two ways in parallel, so you can see how much to trust the GPS:

| Track | What it does |
|---|---|
| **RAW GPS** | Adds up every GPS fix as it arrives (Haversine). The unfiltered baseline. |
| **KALMAN FUSED** | Rejects bad fixes (low accuracy or impossible jumps), estimates position through tunnels and signal gaps (*dead reckoning*) and smooths with a Kalman filter. **This is the measurement used for pacing and checkpoints.** |

Between the two panels you see the divergence between both measurements (`Δ %`), signal quality (GOOD / FAIR / POOR / LOST) and, when it applies, how many seconds it has been estimating without GPS (`DR`). Divergence above 5 % is highlighted in red.

Technical details of the filter are in [src/tracking/README.md](src/tracking/README.md).

### Pace indicator

On the driver screen the background changes color based on the fused difference:

- **Green** — within tolerance: you're on pace.
- **Red** — ahead: shows **FRENÁ** (brake).
- **Violet** — late: shows **ACELERÁ** (accelerate).

The color intensifies as you drift further from the tolerance and blinks once the difference exceeds twice the tolerance.

## Usage

The app's interface is in Spanish; labels below are quoted as they appear on screen.

### 1. Setup

On the start screen you choose:

- **Target average speed** (10–200 km/h), with `−` / `+` buttons and presets for 30, 50, 70, 90 and 110 km/h.
- **Alert tolerance**: TIGHT (±0.5 s), NORMAL (±1.5 s) or LOOSE (±3 s).
- **Role**: CONDUCTOR (driver) or COPILOTO (co-driver) — changes the in-stage screen.
- **Theme**: OSCURO (dark, for night) or CLARO (light, for bright sun).

Settings are saved on the phone. Tap **▶ START STAGE** when you're at the start line.

### 2. Start line

The screen turns into one large **▶ LARGAR** (start) button. The GPS warms up meanwhile and the screen shows whether it has a fix. **Tap anywhere on the screen** at the start signal: the stage clock starts at the moment your finger touches the screen. **✕ Cancelar** goes back to setup.

### 3. In stage — driver

Shows both panels (RAW and FUSED) with the difference in seconds, distance and current speed, over the pace indicator background.

### 4. In stage — co-driver

Shows the current difference, stage time and distance, plus a large **MARCAR CP** (mark checkpoint) button. Tap it when passing each checkpoint to record time and distance at that point. The last marked checkpoint and its difference are shown below.

### Reset and exit

Both buttons trigger on a **press and hold** and ask for confirmation, so they can't be hit by accident:

- **↺ Reset** — saves the current stage to the log and starts a new one from zero.
- **✕ Salir** (exit) — saves the current stage and returns to setup.

### 5. Log

**REGISTRO** on the start screen lists all saved stages. For each stage:

- Checkpoint table with distance, **real** time, **ideal** time and **difference**, plus splits between checkpoints and the RAW measurement for comparison.
- Rename the stage by tapping its name.
- **⇪ Compartir imagen** (share image) — renders the table as a PNG and opens the phone's share sheet (WhatsApp, etc.); if the browser doesn't support it, the image is downloaded.

**Nuevo rally** (new rally) clears the whole log (also press-and-hold plus confirmation).

Stages without checkpoints aren't saved. If the app is closed mid-stage, checkpoints already marked are kept and the stage is flagged as interrupted.

## Tips

- Install the app to your home screen ("Add to Home Screen") to use it fullscreen and offline.
- Grant the browser precise location permission and wait for a GPS fix before starting.
- Keep the phone in a mount with a view of the sky and plugged into a charger: GPS and an always-on screen drain the battery.

## Development

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev       # dev server
npm test          # tests (Vitest)
npm run lint      # ESLint
npm run build     # production build into dist/
npm run preview   # serve the build locally
```

Browser geolocation only works on `localhost` or over HTTPS. To test on a phone, use a deployment or an HTTPS tunnel.

### Stack

React 19 + TypeScript + Vite, with `vite-plugin-pwa` for offline support. No backend: everything (settings and log) is stored in `localStorage`. Deployment is configured for Vercel ([vercel.json](vercel.json)).

### Structure

```
src/
  App.tsx            Navigation between screens (setup, stage, log)
  components/        Screens and UI pieces (SetupScreen, DrivingScreen, CoDriverScreen, LogScreen…)
  hooks/             GPS, stage clock, persistence, wake lock, theme
  lib/
    rallyLog.ts      Stage and checkpoint logic, pace calculation (no React)
    format.ts        Time, distance and difference formatting
    shareImage.ts    Renders the shareable PNG for a stage
  tracking/          Dual GPS tracker (raw + Kalman), pure and tested TypeScript
```
