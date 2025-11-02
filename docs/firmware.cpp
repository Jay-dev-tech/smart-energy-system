/**
 * =================================================================================================
 * SOLARIS - FULL ESP32 FIRMWARE
 * =================================================================================================
 *
 * This sketch connects the ESP32 to the Solaris web application via Firebase Realtime Database.
 * It listens for real-time changes to switch states from the web app and controls the
 * corresponding GPIO pins.
 *
 * It also reads local sensor data (voltage, current, etc.) and sends it to Firebase
 * for the web app to display.
 *
 * REQUIRED LIBRARIES:
 * - Arduino_JSON (by Arduino)
 * - Firebase ESP32 Client (by Mobizt) -> Search for "Firebase ESP32 Client" in Library Manager
 * - DHT sensor library (by Adafruit)
 * - LiquidCrystal (built-in)
 *
 */

#include <Arduino.h>
#include <WiFi.h>
#include <LiquidCrystal.h>
#include <DHT.h>
#include <Firebase_ESP_Client.h> // Modern Firebase library

// ===== 1. WIFI & FIREBASE CREDENTIALS =====
// IMPORTANT: The DEVICE_API_KEY from the Solaris app settings is NOT used for Realtime Database auth.
// The Realtime Database uses a "Database Secret" for legacy authentication, which is what this firmware uses.
// You can find your database secret in your Firebase Project Settings > Service Accounts > Database secrets.
#define WIFI_SSID "Peniel"
#define WIFI_PASSWORD "peniel234"
#define FIREBASE_HOST "https://smart-solar-agent-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH_SECRET "KEUSzaJSC2VSN1KRekN55FdHLyo1AVvESULCgAZF" // This is your DATABASE SECRET

// ===== 2. GPIO PIN DEFINITIONS =====
#define RELAY_1_PIN 13
#define RELAY_2_PIN 14
#define RELAY_3_PIN 27
#define RELAY_4_PIN 26
#define RELAY_5_PIN 25

#define CURRENT_PIN 32
#define VOLTAGE_PIN 34
#define LDR_PIN 35
#define DHT_PIN 23
#define CONST_PIN 33 // Brightness control for LCD

// LCD (4-bit mode)
LiquidCrystal lcd(22, 21, 19, 18, 5, 4);

// DHT Sensor
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// ===== 3. FIREBASE & APP OBJECTS =====
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
FirebaseData stream; // Dedicated object for the stream

// ===== 4. SENSOR CALIBRATION & GLOBALS =====
const float VREF = 3.3;
const int ADC_MAX = 4095;
float currentOffset = 2048.0; // Auto-calibrated on startup
const float CURRENT_CALIBRATION_FACTOR = 0.185; // For ACS712 30A version
const float VOLTAGE_DIVIDER_RATIO = (47.0 + 10.0) / 10.0;
const float VOLTAGE_CALIBRATION = 1.25;

volatile float voltageRMS = 0;
volatile float currentRMS = 0;
volatile float power = 0;
volatile float temp = 0;
volatile float hum = 0;
volatile int ldrValue = 0;

unsigned long lastSensorRead = 0;
unsigned long lastFirebaseUpdate = 0;

// Function to get the correct GPIO pin for a given switch ID
int getPinForSwitch(int switchId) {
  switch (switchId) {
    case 1: return RELAY_1_PIN;
    case 2: return RELAY_2_PIN;
    case 3: return RELAY_3_PIN;
    case 4: return RELAY_4_PIN;
    case 5: return RELAY_5_PIN;
    default: return -1; // Invalid pin
  }
}

// =======================================================================
//   FIREBASE STREAM CALLBACK - This function handles incoming data
// =======================================================================
void streamCallback(StreamData data) {
  Serial.println("------------------------------------");
  Serial.printf("Stream update received at path: %s\n", data.streamPath().c_str());
  Serial.printf("Data: %s\n", data.stringData().c_str());
  Serial.printf("Data type: %s\n", data.dataType().c_str());
  Serial.println("------------------------------------");

  String dataPath = data.dataPath();

  // Handle updates for a single switch's state (e.g., from a PUT)
  // This is the primary logic for switch toggling.
  if (dataPath.endsWith("/state")) {
    dataPath.remove(dataPath.lastIndexOf("/state"));
    if (dataPath.startsWith("/")) {
        dataPath.remove(0, 1); // remove leading '/'
    }
    int switchId = dataPath.toInt();
    
    if (switchId > 0) {
      bool switchState = data.dataType() == "boolean" && data.to<bool>();
      int pin = getPinForSwitch(switchId);

      if (pin != -1) {
        // **LOGIC INVERTED FOR NORMALLY CLOSED RELAYS**
        // App "ON" (true) -> Relay LOW to turn ON
        // App "OFF" (false) -> Relay HIGH to turn OFF
        Serial.printf("Switch %d state from App: %s. Setting GPIO %d to %s (NC Logic)\n", 
                      switchId, 
                      switchState ? "ON" : "OFF", 
                      pin, 
                      switchState ? "LOW" : "HIGH");
        digitalWrite(pin, switchState ? LOW : HIGH);
      }
    }
  } 
  // Handle the initial data load when the stream connects
  else if (data.dataType() == "json" && data.dataPath() == "/") {
    Serial.println("Received initial JSON object for all switches.");
    FirebaseJson* json = data.to<FirebaseJson*>();
    
    size_t len = json->iteratorBegin();
    FirebaseJson::IteratorValue value;
    String key;

    for (size_t i = 0; i < len; i++) {
        value = json->valueAt(i);
        key = value.key;
        int switchId = key.toInt();

        if (switchId > 0) {
          FirebaseJsonData result;
          json->get(result, key + "/state"); 
          if(result.success) {
              bool switchState = result.to<bool>();
              int pin = getPinForSwitch(switchId);
              if (pin != -1) {
                Serial.printf("Initial state for Switch %d: %s. Setting GPIO %d to %s (NC Logic)\n", 
                              switchId, 
                              switchState ? "ON" : "OFF", 
                              pin, 
                              switchState ? "LOW" : "HIGH");
                digitalWrite(pin, switchState ? LOW : HIGH);
              }
          }
        }
    }
    json->iteratorEnd();
    delete json; // free memory
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("Stream timeout, resuming...");
  }
}

// Sensor reading functions (placeholders/simplified for brevity)
void calibrateCurrentSensor() {
  Serial.println("Calibrating current sensor offset...");
  long sum = 0;
  for (int i = 0; i < 1000; i++) {
    sum += analogRead(CURRENT_PIN);
    delay(1);
  }
  currentOffset = sum / 1000.0;
  Serial.print("Current sensor offset: "); Serial.println(currentOffset);
}

float readVoltageRMS() {
  const int samples = 100;
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(VOLTAGE_PIN);
    sum += (raw - 2048) * (raw - 2048);
    delayMicroseconds(200);
  }
  float rms = sqrt(sum / (float)samples);
  float vRMS = (rms * VREF / ADC_MAX) * VOLTAGE_DIVIDER_RATIO * VOLTAGE_CALIBRATION;
  return vRMS;
}

float readCurrentRMS() {
  const int samples = 200;
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(CURRENT_PIN);
    currentOffset = 0.999 * currentOffset + 0.001 * raw;
    int centered = raw - currentOffset;
    sum += (long)centered * (long)centered;
  }
  float rms = sqrt(sum / (float)samples);
  float vRMS = (rms * VREF) / ADC_MAX;
  float iRMS = vRMS / CURRENT_CALIBRATION_FACTOR;
  return (iRMS < 0.05) ? 0.0 : iRMS;
}

float readLux() {
  int raw = analogRead(LDR_PIN);
  return 4095 - raw; // Simplified, adjust as needed
}

void readAllSensors() {
  voltageRMS = readVoltageRMS();
  currentRMS = readCurrentRMS();
  power = voltageRMS * currentRMS;

  float t_reading = dht.readTemperature();
  float h_reading = dht.readHumidity();
  if (!isnan(t_reading)) temp = t_reading;
  if (!isnan(h_reading)) hum = h_reading;

  ldrValue = readLux();
}

void sendSensorDataToFirebase() {
  if (WiFi.status() != WL_CONNECTED || !Firebase.ready()) return;

  Serial.println("Sending sensor data to Firebase...");

  // Use a JSON object to send all data at once to a new timestamped entry
  FirebaseJson json;
  json.set("voltage", voltageRMS);
  json.set("current", currentRMS);
  json.set("power", power);
  json.set("temperature", temp);
  json.set("humidity", hum);
  json.set("ldr", ldrValue);
  json.set("timestamp/.sv", "timestamp"); // Correct way to set server value timestamp

  // Push a new entry under /app/energyData
  if (Firebase.RTDB.pushJSON(&fbdo, "/app/energyData", &json)) {
    Serial.println("Sensor data sent successfully.");
  } else {
    Serial.printf("Failed to send data: %s\n", fbdo.errorReason().c_str());
  }
}

void displayOnLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("V:");
  lcd.print(voltageRMS, 0);
  lcd.print("V A:");
  lcd.print(currentRMS, 2);
  lcd.print("A");

  lcd.setCursor(0, 1);
  lcd.print("P:");
  lcd.print(power, 0);
  lcd.print("W LDR:");
  lcd.print(ldrValue);
}

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  // Initialize pins
  pinMode(RELAY_1_PIN, OUTPUT);
  pinMode(RELAY_2_PIN, OUTPUT);
  pinMode(RELAY_3_PIN, OUTPUT);
  pinMode(RELAY_4_PIN, OUTPUT);
  pinMode(RELAY_5_PIN, OUTPUT);
  
  pinMode(CONST_PIN, OUTPUT);
  analogWrite(CONST_PIN, 80); // Set LCD brightness

  dht.begin();
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("System Booting...");
  delay(1000);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  lcd.clear();
  lcd.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println("\nWiFi Connected!");
  lcd.clear();
  lcd.print("WiFi Connected!");
  delay(1000);

  // Configure Firebase
  config.database_url = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH_SECRET;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Calibrate sensor and perform initial read
  calibrateCurrentSensor();
  readAllSensors();
  displayOnLCD();

  // =======================================================================
  //   START FIREBASE STREAM
  // =======================================================================
  // This is the crucial part that listens for changes from your web app.
  // The path "/app/switchStates" must exactly match what the web app uses.
  if (!Firebase.RTDB.beginStream(&stream, "/app/switchStates")) {
    Serial.printf("Could not begin stream: %s\n", stream.errorReason().c_str());
  }

  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);
  
  Serial.println("\nSetup complete. System is running.");
  lcd.clear();
  lcd.print("System Ready!");
}

void loop() {
  // The loop handles non-blocking sensor reads and Firebase updates.
  // The stream for switches runs automatically in the background.

  // Read sensors every 2 seconds
  if (millis() - lastSensorRead > 2000) {
    lastSensorRead = millis();
    readAllSensors();
    displayOnLCD();
  }

  // Send data to Firebase every 10 seconds
  if (millis() - lastFirebaseUpdate > 10000) {
    lastFirebaseUpdate = millis();
    sendSensorDataToFirebase();
  }
}
