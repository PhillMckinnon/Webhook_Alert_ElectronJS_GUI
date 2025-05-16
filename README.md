# Webhook_Alert_ElectronJS_GUI
![Electron.js](https://img.shields.io/badge/Electron-2C2E3A?style=for-the-badge&logo=electron&logoColor=9FEAF9) ![ExpressJS](https://camo.githubusercontent.com/9789aea7953b74289df6760a71e717321e750032579075e89744c592f46461aa/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f457870726573732e6a732d3030303030303f7374796c653d666f722d7468652d6261646765266c6f676f3d65787072657373266c6f676f436f6c6f723d7768697465) ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) ![jQuery](https://img.shields.io/badge/jQuery-0769AD?style=for-the-badge&logo=jquery&logoColor=white) ![Node.js](https://camo.githubusercontent.com/5efede1ede485921a068d065e72eae3446b1d4f9c8aba580ab290b060e1d436a/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f4e6f64652e6a732d3333393933333f7374796c653d666f722d7468652d6261646765266c6f676f3d6e6f64652e6a73266c6f676f436f6c6f723d7768697465) ![SQLite3](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white) 

This project is a fork of (https://github.com/PhillMckinnon/Play-sound-on-webhook-alert) 
---

An application that listens for incoming webhook requests and plays a corresponding `.wav` sound file when a webhook is received, but with a GUI and packed into ElectronJS. Designed to be a simple and customisable alert system that can be integrated and used with various services (e.g ![Uptime Kuma](https://github.com/louislam/uptime-kuma)).

![forgit](https://github.com/user-attachments/assets/fab7c8e9-012f-4996-82fc-04f7dc7fe097)

The app was developed during my practical workshop experience ( 07/04/2025 - 30/04/2025 )


## Features
- Listens for webhook requests on multiple endpoints (`/webhook0`, `/webhook1`, `/webhook2`, etc.).
- Plays a specific `.wav` file for each webhook endpoint.
- Logs incoming webhook data and playback status.
- Easy to set up and use.

## Prerequisites
- Node.js installed on your system.
- NPM (Node Package Manager) installed.

---

## General Setup Instructions

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone https://github.com/PhillMckinnon/Webhook_Alert_ElectronJS_GUI
cd Webhook_Alert_ElectronJS_GUI
```

### 2. Install Dependencies
Install the required Node.js dependencies:
```bash
npm install
```

### 3. Configure Sound Files
Place your `.wav` sound files in the sounds directory. Ensure the filenames match the names  (e.g., `error2.wav`, `success2.wav`, etc.).

### 4. Run the Application
Start the application
```bash
npm start
```
The application will start listening on port `3000`. You can change it by editing port.json (located at UserDataDir).

---

## Building

### 1. Clone the Repository
Clone this repository to your local machine:
```bash
git clone https://github.com/PhillMckinnon/Webhook_Alert_ElectronJS_GUI
cd Webhook_Alert_ElectronJS_GUI
```

### 2. Build the app
```bash
npm run build
```

### 3. Configure Sound Files
Place your `.wav` sound files in the sounds directory. Ensure the filenames match the names  (e.g., `error2.wav`, `success2.wav`, etc.).

### 4. Run the Application
Start the application
```bash
run the .exe on windows or ./webhooking in the output directory on linux
```

---

## Usage
Once the application is running, you can send POST requests to the following endpoints to trigger sound alerts:
- `/webhook0` → Plays `success0.wav/error.wav`
- `/webhook1` → Plays `success1.wav/error1.wav`
- `/webhook2` → Plays `success2.wav/error2.wav`
- `/webhook3` → Plays `success3.wav/error3.wav`
- `/webhook4` → Plays `success4.wav/error4.wav`

My custom body for Uptime Kuma:
![notification_settings](https://github.com/user-attachments/assets/91098122-e543-4e6b-8902-e54d8476837d)

```bash
CUSTOM BODY
-----------
{
  "heartbeat": {
    "status": "{{ heartbeatJSON.status }}",
    "msg": "{{ heartbeatJSON.msg }}",
    "time": "{{ heartbeatJSON.time }}"
  },
  "monitor": {
    "name": "{{ monitorJSON.name }}",
    "url": "{{ monitorJSON.url }}"
  },
  "msg": "{{ msg }}"
}

ADDITIONAL HEADERS
------------------
{
"Content-Type": "application/json"
}
```


## Customization
- Modify the port number in the port.json file if needed.
- Replace the `.wav` files with your own sound files.

---

## Troubleshooting
- Ensure the `.wav` files are in the correct directory and have the correct filenames.
- Make sure the application has the necessary permissions to access the sound files.

---

## License
This project is open-source and available under the [MIT License](LICENSE).


Enjoy using the Webhook Sound Alert System! If you have any questions or issues, feel free to open an issue on GitHub.

---

## **📫Contact**

For any questions or feedback, feel free to reach out to:

    Email: phillipmckinnonwork@proton.me
    GitHub: @PhillMckinnon 
