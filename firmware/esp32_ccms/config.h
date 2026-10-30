#ifndef CONFIG_H
#define CONFIG_H

// ==============================================================================
// GANDHIDHAM MUNICIPAL CORPORATION - ESP32 CCMS HARDWARE CONFIGURATION
// ==============================================================================

// WiFi Credentials
#define WIFI_SSID           "GMC_MUNICIPAL_IOT"
#define WIFI_PASSWORD       "MunicipalSecretPassword2026"

// MQTT Broker Settings
#define MQTT_BROKER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define CONTROLLER_ID       "ESP32-GMC-01"

// Relay Output GPIO Pins (Channels 1 to 6)
#define RELAY_CH1_PIN       26
#define RELAY_CH2_PIN       27
#define RELAY_CH3_PIN       14
#define RELAY_CH4_PIN       12
#define RELAY_CH5_PIN       13
#define RELAY_CH6_PIN       15

// Current Sensor Analog Inputs (ACS712 5A)
#define CURRENT_CH1_PIN     34
#define CURRENT_CH2_PIN     35
#define CURRENT_CH3_PIN     32
#define CURRENT_CH4_PIN     33
#define CURRENT_CH5_PIN     25
#define CURRENT_CH6_PIN     4

// Safe Simulation Switch Inputs
#define FAULT_SW1_PIN       18
#define FAULT_SW2_PIN       19
#define FAULT_SW3_PIN       21
#define FAULT_SW4_PIN       22
#define FAULT_SW5_PIN       23
#define FAULT_SW6_PIN       5

// Environmental & Line Sensors
#define LDR_SENSOR_PIN      36 // ADC1_CH0
#define BUS_VOLTAGE_PIN     39 // ADC1_CH3

// Operational Parameters
#define OVERCURRENT_LIMIT   0.45 // Amperes cutoff
#define OPENCIRCUIT_MIN     0.03 // Amperes minimum
#define DAYLIGHT_LUX_THRESH 450  // Lux

#endif

