# IoT Centralized Control and Monitoring System (CCMS) for Public Street Lighting
### Gandhidham Municipal Corporation (GMC) — Seva First Hackathon 2026 (Government of Gujarat)

[![Live Demo](https://img.shields.io/badge/🌐%20Live%20Demo-gmc--ccms--streetlight.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://gmc-ccms-streetlight.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-ShreyaXiii%2Fgmc--ccms--streetlight-181717?style=for-the-badge&logo=github)](https://github.com/ShreyaXiii/gmc-ccms-streetlight)
[![Hackathon](https://img.shields.io/badge/Seva%20First%20Hackathon-2026%20Gujarat-orange?style=for-the-badge)](https://github.com/ShreyaXiii/gmc-ccms-streetlight)

> 🚀 **[LIVE WEBSITE → https://gmc-ccms-streetlight.vercel.app](https://gmc-ccms-streetlight.vercel.app)**
>
> **Demo Login:** `admin@gmc.gov.in` / `GmcAdmin@2026`

A modern, responsive, enterprise-grade municipal IoT control room platform engineered for public street lighting networks. Designed to interface seamlessly with an **ESP32 microcontroller prototype** controlling a 6-channel relay board, current and voltage sensors, LDR ambient light sensor, and safe fault simulation switches, with support for scalable virtual streetlights across municipal wards.

---

## 🌟 Key Features

1. **Central Control Room Overview**:
   - 12 real-time calculated KPIs (active/idle fixtures, healthy vs tripped lights, instantaneous power in Watts, cumulative kWh, average bus voltage, ambient Lux, and estimated PGVCL tariff savings).
   - Real-time ESP32 heartbeat monitoring and connection status indicator (`CONNECTED`, `RECONNECTING`, `OFFLINE`, `DEMO_MODE`).
   - Quick bulk actuation (`All ON` / `All OFF`) and primary relay channels 1–6 status.

2. **Streetlight Registry & Actuation**:
   - Searchable, sortable, and filterable table by ward, state, health, and hardware type.
   - Initial 6 physical relay channels (1 to 6) strictly bound to hardware; supports unlimited virtual nodes with clear demarcation (no fake physical channels).
   - Complete Add/Edit/Delete streetlights with geographical coordinates and maintenance notes.
   - One-click CSV export with CSV injection sanitization.

3. **Individual Streetlight Deep Diagnostics**:
   - Dedicated time-series graphs for Power (W), Current (A), and Bus Voltage (V).
   - Time-range filters: Last 1h, 4h, 8h, 12h, 24h, and 7 days.
   - Operating mode switching (`Automatic LDR`, `Manual`, `Scheduled`).
   - Command dispatch feedback (`Pending` ➔ `Acknowledged` ➔ `Completed` / `Failed`).

4. **Gandhidham GIS Streetlight Map (Leaflet + OpenStreetMap)**:
   - Centered on Gandhidham, Gujarat, India (23.0760° N, 70.1350° E).
   - Real-time status markers (Healthy ON/OFF, Critical Fault pulsing red, Warning amber).
   - Interactive popups with live readings, ward filtering, and zoom-to-light locator.

5. **Fault Detection Engine**:
   - `OPEN_CIRCUIT`: Detects wire cuts or lamp burnout when commanded ON but current < configurable threshold.
   - `SHORT_CIRCUIT_OR_OVERCURRENT`: Detects dangerous overcurrent and immediately trips relay protection.
   - `DAYTIME_LIGHT_ON`: Compares LDR ambient light vs lamp state to prevent daytime energy waste.
   - `UNDERVOLTAGE` & `OVERVOLTAGE`: Detects voltage sags and grid surges.
   - `CONTROLLER_OFFLINE`: Heartbeat timeout tracking.
   - Full operator workflow: Acknowledge alert ➔ Create Maintenance Work Order ➔ Resolve.

6. **Energy Analytics & PGVCL Tariffs**:
   - Exact numerical integration (kWh) using timestamped power samples.
   - Municipal tariff calculator (default ₹7.20 / kWh for Gujarat PGVCL).
   - Automated savings calculation vs unmanaged 12-hour baseline burn.
   - Ward-by-ward and individual fixture energy breakdown.

7. **ESP32 IoT Gateway & C++ Firmware**:
   - Full pinout diagram for ESP32 (Relay pins 26, 27, 14, 12, 13, 15; ADC current pins 34, 35, 32, 33, 25, 4; LDR pin 36; simulation switches 18, 19, 21, 22, 23, 5).
   - Live MQTT telemetry JSON schema inspector.
   - Ready-to-flash production-grade ESP32 Arduino sketch (`.ino`) with one-click download.

8. **Hackathon Demonstration Rig Bar**:
   - Top interactive control bar to test LDR daylight/dark conditions, trigger safe open-circuit or overcurrent simulations, or disconnect the ESP32 gateway to verify emergency failover.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+ (tested on Node.js v24.20.0)
- npm 9+

### 1. Installation
Clone or navigate to the repository and install dependencies:
\`\`\`bash
npm install
\`\`\`

### 2. Environment Configuration (Optional)
Copy `.env.example` to `.env`:
\`\`\`bash
copy .env.example .env
\`\`\`
> **Note**: If Supabase or MQTT credentials are not set, the platform automatically runs in **Demonstration Mode** with local persistent storage.

### 3. Run Development Server
\`\`\`bash
npm run dev
\`\`\`
The application will be live at: **http://localhost:3000**

### 4. Run Automated Unit & Integration Tests
\`\`\`bash
npm test
\`\`\`
Runs Vitest suite covering fault classification, safety threshold handling, trapezoidal energy numerical integration, and tariff math.

### 5. Production Build
\`\`\`bash
npm run build
\`\`\`

---

## 🔐 Operator Demo Accounts (Hackathon)

The login system comes pre-configured with two demonstration accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@gmc.gov.in` | `GmcAdmin@2026` | Full access: Add/Edit/Delete lights, tune thresholds, dispatch work orders |
| **Field Operator** | `operator@gmc.gov.in` | `GmcOperator@2026` | Actuate lights, acknowledge alerts, view telemetry, export reports |

---

## ⚡ ESP32 Hardware Prototype Setup

### Bill of Materials (BOM)
1. **ESP32 NodeMCU-32S / ESP32-WROOM-32**
2. **6-Channel 5V Relay Module with optocoupler isolation**
3. **6x High-Brightness LEDs with current-limiting resistors (representing lamps)**
4. **ACS712 Current Sensor(s) (5A or 20A model)**
5. **LDR Light Dependent Resistor + 10kΩ divider (Ambient Light measurement)**
6. **Push buttons / toggle switches (for safe hardware fault simulation)**

### MQTT Topic Architecture
- Telemetry: `ccms/controllers/{controllerId}/telemetry` (Published every 2s)
- Heartbeat / Status: `ccms/controllers/{controllerId}/status` (LWT & online)
- Actuation Commands: `ccms/controllers/{controllerId}/commands` (Subscribed by ESP32)
- Command Acknowledgment: `ccms/controllers/{controllerId}/command-ack` (Published by ESP32)

---

## ☁️ Deployment to Vercel

1. Push this repository to GitHub or GitLab.
2. In the Vercel dashboard, click **Add New Project** and select this repository.
3. Vercel automatically detects the Vite framework with output directory `dist`.
4. Add environment variables from `.env.example` if connecting to a live Supabase backend.
5. Click **Deploy**. The included `vercel.json` ensures full SPA rewrite support.

