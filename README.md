# Quick Meet (local video conference)

Simple local video conferencing app where you can **create a meeting link** and share it so others can join the same call.

## Features

- **Create meeting link**: One click from the home page generates a unique `/room/<id>` URL.
- **Join by link**: Anyone with the link can open it in their browser to join the same room.
- **Audio & video**: Peer‑to‑peer WebRTC connection with camera and microphone.
- **Basic controls**: Mute/unmute, stop/start video, and leave meeting.

> This project is intended for learning and small internal use. It does not include TURN servers, authentication, or production‑grade scaling.

## Prerequisites

- Node.js (v18+ recommended)

## Setup

```bash
cd "c:\Users\rampr\Documents\Video Confenrence"
npm install
```

## Run the app

```bash
npm start
```

Then open `http://localhost:4000` in your browser.

1. Click **Create new meeting** – you’ll be redirected to a URL like `http://localhost:4000/room/abc123`.
2. Copy that URL and send it to someone else on your network.
3. When they open the link, both of you will see each other’s video (after granting camera/mic permissions).

## Deployed on Render (free tier)

If you deploy to Render, the free tier **spins down after ~15 minutes of inactivity**. The next visitor then has to wait 30–60 seconds while the server wakes up, and the app shows “Connecting to server…” / “Server is waking up…”.

**Keep the service awake** so people can join anytime:

1. Use a free cron service (e.g. **cron-job.org** or **UptimeRobot**).
2. Ping your app’s health URL every **14 minutes**:
   - `https://your-app-name.onrender.com/health`
3. That keeps the service from spinning down so links work on the first try.

After you push the new code to GitHub, Render will auto-deploy. No extra config on Render is needed.
