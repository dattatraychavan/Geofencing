DRIVEGUARD WEBSITE — FIXED TO MATCH ESP32 FIRMWARE

Files:
- index.html
- style.css
- app.js
- README_SETUP.txt

Keep all files in the same GitHub repository folder. Commit/push changes to publish through GitHub Pages.

Firebase paths now match the ESP32 sketch:
- Settings: /settings/restrictedZone
- Speed zone settings: /settings/speedZone
- Live telemetry/impact/GPS/speed: /vehicle
- Events (including impact events): /events

Impact status is read from /vehicle/impactDetected. Acceleration magnitude is read from
/vehicle/accelerationMagnitudeG (and compatible impactG keys).

IMPORTANT TROUBLESHOOTING:
1. Your Serial Monitor showed `Firebase POST /events.json -> HTTP -1`. HTTP -1 is a connection/TLS/network failure, not a website display issue. The ESP32 is not successfully sending that event. Check Wi-Fi connection and Firebase request output.
2. The ESP32 sketch sends live status to `/vehicle.json`; this website now listens to `/vehicle`, not `/vehicle/status`.
3. If the website still says No data, open Firebase Realtime Database and check whether `/vehicle` contains `impactDetected` and `accelerationMagnitudeG`. If those fields are absent, the ESP32 upload has not succeeded or the wrong firmware is running.
4. If the page says Disconnected or shows a permission error, check Firebase Realtime Database rules. Do not leave the database publicly writable in a real deployment.
5. GPS may show no coordinates until the NEO-6M obtains an outdoor GPS fix.

GitHub Pages:
1. Replace the old index.html, style.css, app.js and README_SETUP.txt with these files.
2. Commit and push the changes.
3. Wait for GitHub Pages to publish, then hard-refresh the site (Ctrl+F5).


UPDATES IN THIS VERSION
- Firmware uploads restrictedZoneActive, restrictedZoneConfigured, speedZoneActive,
  speedZoneConfigured, impactDetected and impactG to /vehicle.
- Firmware sends a speed-zone-entered/exited event, and overspeed events while
  inside the speed zone and above the configured speed limit.
- Firmware requests NTP time and formats event timestamps as India Standard Time
  (Asia/Kolkata, UTC+05:30).
- Website explicitly formats event times in Asia/Kolkata and shows restricted-zone
  and speed-zone status cards.

IMPORTANT:
- Zone alerts require a valid GPS fix. If GPS says fix=NO, neither restricted-area
  entry nor speed-zone detection can be evaluated.
- A speed-zone entry alert means the GPS position is inside that configured zone.
  An overspeed alert occurs only when the GPS-reported speed exceeds the limit.
- If event posts fail with HTTP -1, check Wi-Fi/TLS/connectivity. Events cannot
  appear on the website until the ESP32 successfully writes them to Firebase.
- This is a tabletop prototype only; never connect servo to real vehicle controls.
