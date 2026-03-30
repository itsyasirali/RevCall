# RevCall

RevCall is a comprehensive app-to-app calling platform. Built with a modern tech stack encompassing React Native (Expo) and a robust Node.js backend, RevCall enables seamless real-time communication via WebRTC.

---

## Features

*   **Peer-to-Peer Calling**: High-quality, real-time app-to-app voice calling leveraging React Native WebRTC and Socket.io signaling.
*   **Contact Management**: Built-in full-featured contact lists—add, remove, and search users effortlessly.
*   **Call History and Logs**: Keep track of incoming, outgoing, and missed calls securely on the cloud.
*   **Modern UI/UX**: Crafted carefully tailored overlays, splash screens, and dialers utilizing NativeWind (Tailwind CSS) and React Navigation.

---

## Technology Stack

### Frontend (Mobile App)

| Concern | Technology |
| :--- | :--- |
| Framework | React Native / Expo |
| Routing | Expo Router |
| Styling | NativeWind (Tailwind CSS for React Native) |
| State Management | React Context API / Hooks |
| Real-time Audio | React Native WebRTC |

### Backend (API Server)

| Concern | Technology |
| :--- | :--- |
| Runtime | Node.js |
| Framework | Express.js (TypeScript) |
| Database | MongoDB (Mongoose) |
| Authentication | Express Session + Connect-Mongo (Cookies) |
| Signaling | Socket.io |

---

## Getting Started

Follow these steps to set up RevCall on your local machine. You will need to start both the backend API server and the frontend Expo development application.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or newer recommended)
*   [MongoDB](https://www.mongodb.com/try/download/community) Instance (Local or Cloud/Atlas)
*   [Expo CLI](https://docs.expo.dev/get-started/installation/)

---

### 1. Backend Setup (`/api`)

1. Navigate to the backend directory:
   ```bash
   cd api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `/api` root directory configured with your environment credentials:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/revcall
   SESSION_SECRET=your_secure_session_secret
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server should now be running and bound to `0.0.0.0:*PORT*`.*

---

### 2. Frontend Setup (`/`)

1. Open a new terminal and stay in the root project directory:
   ```bash
   cd RevCall
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development bundler:
   ```bash
   npm start
   ```
4. Run the app on your desired platform:
   - For **Android**: Press `a` or scan the QR code via Expo Go app or an Android Emulator.
   - For **iOS**: Press `i` to open in iOS Simulator natively.

---

## License

This project is licensed under the Internal/Proprietary or standard ISC License (refer to `package.json` configurations).
