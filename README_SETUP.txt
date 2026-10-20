DRIVEGUARD - SIMPLE THREE FILE VERSION

This version uses the same Firebase config and project as the working DriveGuard single-file version, and keeps only the core functions.

Files:
- index.html
- style.css
- app.js

Keep all three files in one folder. Open index.html the same way you opened the working single-file version. This version uses the Firebase compat SDK from the CDN so app.js is a regular script, not a JavaScript module.

Firebase paths:
- Restricted Area: lat_r, lon_r, rad_r
- Speed Area: lat_s, lon_s, rad_s, speed
- Vehicle status: vehicle/status
- Alerts: alerts

If it says disconnected, check that the browser is online. If the page shows a permission error, check Firebase Realtime Database Rules. The website does not control the servo: ESP32 firmware must implement that action. Speed Area is alert-only.

Security: don't leave database paths publicly writable for a real deployment.
