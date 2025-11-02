# **App Name**: Solaris智控

## Core Features:

- Real-time Energy Monitoring: Display real-time data from the ESP32, including voltage, current, battery level, and power consumption.
- Predictive Analytics: Use the deployed model in Firebase ML to predict future energy consumption based on historical data.
- Smart Switch Control: Allow users to remotely control five switches based on predicted usage and battery levels, considering user preferences. An AI tool will intelligently manage these switches based on current parameters, predictions, and user preferences.
- Historical Data Visualization: Provide interactive graphs and charts to visualize historical energy usage patterns.
- User Preference Settings: Allow users to set their energy usage preferences and priorities for automated switch control.
- Firebase ML Integration: Integrate with Firebase ML to utilize the deployed model for making usage predictions. Read and display model output.
- Data Ingestion and Storage: Collect and store data from ESP32 into Firestore for historical analysis and model training.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to reflect solar energy and technology.
- Background color: Light gray (#F5F5F5), creating a clean and modern look.
- Accent color: Vibrant yellow (#FFEB3B) to highlight interactive elements and data points.
- Body font: 'PT Sans' for a modern, readable style.
- Headline font: 'Space Grotesk' for impactful headers (if longer text is anticipated, use PT Sans for body)
- Use clear, minimalist icons to represent energy parameters and control functions.
- Implement a responsive, grid-based layout to ensure optimal viewing on different devices.
- Use subtle transitions and animations to provide feedback and enhance user engagement.