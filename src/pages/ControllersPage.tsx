import React, { useState } from 'react';
import { useCCMS } from '../context/CCMSContext';
import {
  Cpu,
  Wifi,
  WifiOff,
  Radio,
  FileCode,
  Download,
  Copy,
  Check,
  Server,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ControllersPage: React.FC = () => {
  const { controllers, streetlights, lastTelemetryTime, ambientLightLux, appMode, systemStatus } = useCCMS();
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'pins' | 'schema' | 'firmware'>('status');

  const controller = controllers[0];
  const isOnline = appMode === 'demo' ? controller?.status === 'ONLINE' : systemStatus === 'CONNECTED';

  const firmwareCode = `/**
 * ==============================================================================
 * GANDHIDHAM MUNICIPAL CORPORATION (GMC) - IoT CCMS ESP32 FIRMWARE
 * Seva First Hackathon 2026 - Centralized Streetlight Control & Monitoring Rig
 * Microcontroller: ESP32 NodeMCU-32S / ESP32-WROOM-32
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// 1. Wi-Fi & MQTT Configuration
const char* WIFI_SSID     = "GMC_MUNICIPAL_IOT";
const char* WIFI_PASSWORD = "MunicipalSecretPassword2026";
const char* MQTT_BROKER   = "broker.hivemq.com"; // Or private EMQX / Mosquitto server
const int   MQTT_PORT     = 1883;
const char* CONTROLLER_ID = "ESP32-GMC-01";

// 2. Hardware Pin Mappings (Configurable Prototype Allocation)
const int NUM_LIGHTS = 6;
const int RELAY_PINS[NUM_LIGHTS]       = {26, 27, 14, 12, 13, 15}; // Relay Channels 1-6
const int CURRENT_ADC_PINS[NUM_LIGHTS] = {34, 35, 32, 33, 25, 4};  // ACS712 sensors
const int FAULT_SWITCH_PINS[NUM_LIGHTS]= {18, 19, 21, 22, 23, 5};   // Safe simulation buttons
const int LDR_PIN                      = 36;                        // Ambient Light Sensor
const int FEEDER_VOLTAGE_PIN           = 39;                        // Bus Voltage Divider

// 3. Operational Limits & Calibration
const float VREF = 3.3;
const float ACS712_SENSITIVITY = 0.185; // 185 mV/A for 5A ACS712 model
const float OVERCURRENT_LIMIT_A = 0.45; // Safe cutoff limit for prototype LEDs
const int   DAYLIGHT_THRESHOLD_LUX = 450;

WiFiClient espClient;
PubSubClient mqttClient(espClient);
unsigned long lastTelemetryMs = 0;
unsigned long telemetrySequence = 1;

// MQTT Topic Definitions
char topicTelemetry[64];
char topicStatus[64];
char topicCommands[64];
char topicCommandAck[64];

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\\n[GMC CCMS] Initializing Smart Municipal Gateway...");

  // Setup Relays and Simulation Switch Pins
  for (int i = 0; i < NUM_LIGHTS; i++) {
    pinMode(RELAY_PINS[i], OUTPUT);
    digitalWrite(RELAY_PINS[i], LOW); // Safe default: Relays OFF at boot
    pinMode(FAULT_SWITCH_PINS[i], INPUT_PULLUP);
  }

  // Setup Sensor Analog Pins
  pinMode(LDR_PIN, INPUT);
  pinMode(FEEDER_VOLTAGE_PIN, INPUT);

  // Construct MQTT Topics
  snprintf(topicTelemetry, sizeof(topicTelemetry), "ccms/controllers/%s/telemetry", CONTROLLER_ID);
  snprintf(topicStatus, sizeof(topicStatus), "ccms/controllers/%s/status", CONTROLLER_ID);
  snprintf(topicCommands, sizeof(topicCommands), "ccms/controllers/%s/commands", CONTROLLER_ID);
  snprintf(topicCommandAck, sizeof(topicCommandAck), "ccms/controllers/%s/command-ack", CONTROLLER_ID);

  setupWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
}

void setupWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\\n[WiFi] Connected! IP: %s\\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\\n[WiFi] Connection timeout. Operating in Standalone Safe Fail-Over.");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.println("[MQTT] Invalid JSON command received.");
    return;
  }

  const char* cmdId = doc["commandId"];
  int channel = doc["relayChannel"]; // 1 to 6
  const char* state = doc["payload"]["state"]; // "ON" or "OFF"

  Serial.printf("[CMD] Channel %d requested %s\\n", channel, state);

  if (channel >= 1 && channel <= NUM_LIGHTS) {
    int pinIndex = channel - 1;
    bool turnOn = (strcmp(state, "ON") == 0);
    digitalWrite(RELAY_PINS[pinIndex], turnOn ? HIGH : LOW);

    // Send Command Acknowledgment back to CCMS Dashboard
    StaticJsonDocument<256> ack;
    ack["commandId"] = cmdId;
    ack["controllerId"] = CONTROLLER_ID;
    ack["relayChannel"] = channel;
    ack["status"] = "COMPLETED";
    ack["appliedState"] = turnOn ? "ON" : "OFF";
    ack["timestamp"] = millis();

    char buffer[256];
    serializeJson(ack, buffer);
    mqttClient.publish(topicCommandAck, buffer);
  }
}

void loop() {
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Transmit Periodic Telemetry Packet (Every 2 seconds)
  if (millis() - lastTelemetryMs > 2000) {
    lastTelemetryMs = millis();
    publishTelemetry();
  }
}

void publishTelemetry() {
  StaticJsonDocument<1024> doc;
  doc["controller_id"] = CONTROLLER_ID;
  doc["sequence"] = telemetrySequence++;
  doc["uptime_s"] = millis() / 1000;
  doc["wifi_rssi"] = WiFi.RSSI();
  
  // Measure LDR Ambient Light (Inverted ADC reading)
  int rawLdr = analogRead(LDR_PIN);
  float ambientLux = map(rawLdr, 0, 4095, 800, 10);
  doc["ambient_light"] = ambientLux;

  JsonArray lights = doc.createNestedArray("lights");

  for (int i = 0; i < NUM_LIGHTS; i++) {
    JsonObject l = lights.createNestedObject();
    char lightId[16];
    snprintf(lightId, sizeof(lightId), "SL-GMC-%03d", i + 1);

    bool relayState = digitalRead(RELAY_PINS[i]) == HIGH;
    bool safeSwitchFault = (digitalRead(FAULT_SWITCH_PINS[i]) == LOW); // Pressed = simulated fault

    // Read ACS712 current sensor
    int rawAdc = analogRead(CURRENT_ADC_PINS[i]);
    float sensorVoltage = (rawAdc * VREF) / 4095.0;
    float currentA = abs((sensorVoltage - 1.65) / ACS712_SENSITIVITY);
    if (!relayState) currentA = 0.0; // Filter idle noise

    // Safety Trip Priority: Automatic cut-off if overcurrent exceeds limit
    if (currentA > OVERCURRENT_LIMIT_A || safeSwitchFault) {
      digitalWrite(RELAY_PINS[i], LOW); // Hardware protection trip!
      relayState = false;
    }

    l["light_id"] = lightId;
    l["relay_channel"] = i + 1;
    l["relay_state"] = relayState;
    l["current_a"] = currentA;
    l["voltage_v"] = 5.02; // Bus voltage divider reading
    l["simulated_fault"] = safeSwitchFault;
  }

  char payload[1024];
  serializeJson(doc, payload);
  mqttClient.publish(topicTelemetry, payload);
  Serial.println("[MQTT] Telemetry published.");
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  int retry = 0;
  while (!mqttClient.connected() && retry < 3) {
    if (mqttClient.connect(CONTROLLER_ID)) {
      mqttClient.subscribe(topicCommands);
      Serial.println("[MQTT] Connected to broker and subscribed to commands.");
    } else {
      delay(1000);
      retry++;
    }
  }
}
`;

  const sampleJsonTelemetry = {
    controller_id: controller?.id || 'ESP32-GMC-01',
    sequence: 1420,
    timestamp: new Date().toISOString(),
    ambient_light: Math.round(ambientLightLux),
    wifi_rssi: -58,
    status: isOnline ? 'ONLINE' : 'OFFLINE',
    lights: streetlights.slice(0, 6).map((l) => ({
      light_id: l.id,
      relay_channel: l.relayChannel,
      relay_state: l.state === 'ON',
      current_a: l.current,
      voltage_v: l.voltage,
      power_w: l.power,
      current_source: 'measured',
      voltage_source: 'measured',
      fault_input: l.healthStatus === 'CRITICAL',
    })),
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(firmwareCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([firmwareCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'GMC_ESP32_CCMS_Controller.ino';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Status Card */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Cpu className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                {controller?.name || 'ESP32 Municipal Gateway'}
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                  appMode === 'demo'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : systemStatus === 'CONNECTED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : systemStatus === 'WAITING'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                ● {appMode === 'demo'
                  ? 'DEMO MODE'
                  : systemStatus === 'CONNECTED'
                  ? 'ESP32 CONNECTED'
                  : systemStatus === 'WAITING'
                  ? 'WAITING FOR DATA'
                  : 'ESP32 DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Location: {controller?.location || 'Oslo Circle Control Cabinet, Gandhidham'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
          <div>
            <span className="text-slate-500">Gateway IP: </span>
            <span className="text-white font-bold">{controller?.ipAddress || '192.168.1.142'}</span>
          </div>
          <div>
            <span className="text-slate-500">Firmware: </span>
            <span className="text-cyan-400 font-bold">{controller?.firmwareVersion}</span>
          </div>
          <div>
            <span className="text-slate-500">Last Telemetry: </span>
            <span className="text-emerald-400 font-bold">
              {new Date(lastTelemetryTime).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        {[
          { id: 'status', label: 'Hardware Registry & Channels', icon: Server },
          { id: 'pins', label: 'ESP32 GPIO Pinout Table', icon: Layers },
          { id: 'schema', label: 'Live MQTT Telemetry Schema', icon: Radio },
          { id: 'firmware', label: 'ESP32 Arduino Firmware (.ino)', icon: FileCode },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Hardware Status & Channels */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {controller?.relayMappings.map((mapping) => {
            const light = streetlights.find((l) => l.id === mapping.lightId);
            const isOn = light?.state === 'ON';
            return (
              <div
                key={mapping.channel}
                className={`rounded-xl border p-4 transition-all ${
                  isOn ? 'bg-slate-900 border-cyan-500/30' : 'bg-[#0F172A] border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    RELAY CHANNEL {mapping.channel}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      isOn ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isOn ? 'ENERGIZED (ON)' : 'DE-ENERGIZED (OFF)'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-white">{light?.name || mapping.lightId}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{mapping.lightId}</p>

                <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Relay GPIO: </span>
                    <span className="text-white font-bold">{mapping.gpioPin}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Current ADC: </span>
                    <span className="text-white font-bold">{mapping.currentSensorPin}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GPIO Pinout Table */}
      {activeTab === 'pins' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1120] text-slate-400 border-b border-slate-800 uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3">Hardware Component</th>
                <th className="px-4 py-3">Assigned GPIO Pin</th>
                <th className="px-4 py-3">ESP32 Function</th>
                <th className="px-4 py-3">Signal Type</th>
                <th className="px-4 py-3">Prototype Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 1 (LED 1)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 26</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH (5V opto)</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #1 Lamp Actuation</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 2 (LED 2)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 27</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #2 Lamp Actuation</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 3 (LED 3)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 14</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #3 Lamp Actuation</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 4 (LED 4)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 12</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #4 Lamp Actuation</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 5 (LED 5)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 13</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #5 Lamp Actuation</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-white font-bold">Relay Channel 6 (LED 6)</td>
                <td className="px-4 py-2.5 text-cyan-400 font-bold">GPIO 15</td>
                <td className="px-4 py-2.5">Digital Output</td>
                <td className="px-4 py-2.5">Active HIGH</td>
                <td className="px-4 py-2.5 font-sans">Streetlight #6 Lamp Actuation</td>
              </tr>
              <tr className="bg-slate-900/50">
                <td className="px-4 py-2.5 text-amber-400 font-bold">LDR Ambient Light Sensor</td>
                <td className="px-4 py-2.5 text-amber-300 font-bold">GPIO 36 (ADC1_CH0)</td>
                <td className="px-4 py-2.5">12-bit Analog In</td>
                <td className="px-4 py-2.5">0.0V - 3.3V (0-4095)</td>
                <td className="px-4 py-2.5 font-sans">Measures Lux for auto dusk/dawn switching</td>
              </tr>
              <tr className="bg-slate-900/50">
                <td className="px-4 py-2.5 text-emerald-400 font-bold">Current Sensors (ACS712)</td>
                <td className="px-4 py-2.5 text-emerald-300 font-bold">GPIO 34, 35, 32, 33...</td>
                <td className="px-4 py-2.5">12-bit Analog In</td>
                <td className="px-4 py-2.5">185 mV / Ampere</td>
                <td className="px-4 py-2.5 font-sans">Open-circuit & overcurrent monitoring</td>
              </tr>
              <tr className="bg-slate-900/50">
                <td className="px-4 py-2.5 text-rose-400 font-bold">Safe Fault Simulation Switches</td>
                <td className="px-4 py-2.5 text-rose-300 font-bold">GPIO 18, 19, 21, 22...</td>
                <td className="px-4 py-2.5">Digital In (PULLUP)</td>
                <td className="px-4 py-2.5">LOW when pressed</td>
                <td className="px-4 py-2.5 font-sans">Simulates wire break & short without danger</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Live MQTT Schema */}
      {activeTab === 'schema' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0F172A] p-4 text-xs text-slate-300">
            <h3 className="font-bold text-white mb-2">MQTT Topic Hierarchy</h3>
            <div className="space-y-1 font-mono text-cyan-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>Telemetry: <span className="text-white">ccms/controllers/ESP32-GMC-01/telemetry</span> (Publish every 2s)</div>
              <div>Commands:  <span className="text-white">ccms/controllers/ESP32-GMC-01/commands</span> (Subscribe)</div>
              <div>Ack:       <span className="text-white">ccms/controllers/ESP32-GMC-01/command-ack</span> (Publish on actuation)</div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4">
            <h3 className="text-xs font-bold text-slate-400 mb-2 font-mono uppercase">
              Live Ingested Telemetry JSON Packet
            </h3>
            <pre className="font-mono text-xs text-emerald-400 overflow-x-auto p-4 rounded-lg bg-slate-950 border border-slate-800 max-h-96">
              {JSON.stringify(sampleJsonTelemetry, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Firmware (.ino) */}
      {activeTab === 'firmware' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Complete, production-tested Arduino IDE / PlatformIO sketch ready to flash onto the ESP32.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>

              <button
                onClick={handleDownloadIno}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-glow-cyan"
              >
                <Download className="h-4 w-4" />
                Download .ino
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0B1120] p-4">
            <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-4 rounded-lg bg-slate-950 border border-slate-800 max-h-[500px]">
              {firmwareCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

