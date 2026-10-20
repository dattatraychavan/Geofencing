// Uses the same Firebase project configuration as the working DriveGuard single-file version.
const firebaseConfig = {
  apiKey: "AIzaSyA8CG8XRsNsBxmVAuhGNi5FYbO6NXb4Hwo",
  authDomain: "geofencing-93350.firebaseapp.com",
  databaseURL: "https://geofencing-93350-default-rtdb.firebaseio.com",
  projectId: "geofencing-93350",
  storageBucket: "geofencing-93350.firebasestorage.app",
  messagingSenderId: "375227942243",
  appId: "1:375227942243:web:90738e6d65812fed977f56",
  measurementId: "G-0HX6Y7M2HR"
};

const statusText = document.getElementById("connectionStatus");
const statusDot = document.getElementById("statusDot");
const messageBox = document.getElementById("message");
const mapDialog = document.getElementById("mapDialog");
const mapPreviewStatus = document.getElementById("mapPreviewStatus");
const mapStatus = document.getElementById("mapStatus");
let trackingMap;
let partnerMarker;
let userMarker;
let routeLine;
let partnerLocation = null;
let userLocation = null;

function setMapStatus(text) {
  mapPreviewStatus.textContent = text;
  mapStatus.textContent = text;
}
function markerIcon(kind) {
  return L.divIcon({
    className: `location-marker ${kind}-marker`,
    html: `<span class="marker-pulse"></span><span class="marker-core"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
}
function refreshMap() {
  if (!trackingMap) return;
  if (partnerLocation) {
    const point = [partnerLocation.lat, partnerLocation.lon];
    if (!partnerMarker) partnerMarker = L.marker(point, { icon: markerIcon("partner") }).addTo(trackingMap).bindPopup("Delivery partner");
    else partnerMarker.setLatLng(point);
  }
  if (userLocation) {
    const point = [userLocation.lat, userLocation.lon];
    if (!userMarker) userMarker = L.marker(point, { icon: markerIcon("user") }).addTo(trackingMap).bindPopup("Your location");
    else userMarker.setLatLng(point);
  }
  if (partnerLocation && userLocation) {
    const points = [[userLocation.lat, userLocation.lon], [partnerLocation.lat, partnerLocation.lon]];
    if (!routeLine) routeLine = L.polyline(points, { color: "#087f95", weight: 4, opacity: 0.85, dashArray: "8 8" }).addTo(trackingMap);
    else routeLine.setLatLngs(points);
    trackingMap.fitBounds(points, { padding: [45, 45], maxZoom: 15 });
    setMapStatus("Both locations are on the map");
  } else if (partnerLocation) {
    trackingMap.setView([partnerLocation.lat, partnerLocation.lon], 15);
    setMapStatus(userLocation ? "Delivery partner location updated" : "Partner location is live · add your location");
  } else {
    setMapStatus("Waiting for vehicle location");
  }
}
function openTrackingMap() {
  mapDialog.classList.add("open");
  mapDialog.setAttribute("aria-hidden", "false");
  document.body.classList.add("map-open");
  if (!window.L) {
    setMapStatus("Map could not load. Check your internet connection.");
    return;
  }
  if (!trackingMap) {
    trackingMap = L.map("trackingMap", { zoomControl: true, scrollWheelZoom: true }).setView([20, 0], 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(trackingMap);
  }
  window.setTimeout(() => { trackingMap.invalidateSize(); refreshMap(); }, 80);
}

document.getElementById("openMap").addEventListener("click", openTrackingMap);
document.getElementById("closeMap").addEventListener("click", () => {
  mapDialog.classList.remove("open");
  mapDialog.setAttribute("aria-hidden", "true");
  document.body.classList.remove("map-open");
});
mapDialog.addEventListener("click", event => {
  if (event.target === mapDialog) document.getElementById("closeMap").click();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && mapDialog.classList.contains("open")) document.getElementById("closeMap").click();
});
document.getElementById("locateMe").addEventListener("click", () => {
  if (!navigator.geolocation) {
    setMapStatus("Location is not available in this browser");
    return;
  }
  setMapStatus("Finding your location…");
  navigator.geolocation.getCurrentPosition(position => {
    userLocation = { lat: position.coords.latitude, lon: position.coords.longitude };
    refreshMap();
    if (trackingMap && partnerLocation) trackingMap.fitBounds([[userLocation.lat, userLocation.lon], [partnerLocation.lat, partnerLocation.lon]], { padding: [45, 45], maxZoom: 15 });
  }, error => {
    const text = error.code === 1 ? "Allow location access to show your position" : "Could not get your location. Try again.";
    setMapStatus(text);
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 });
});

function message(text, isError = false) {
  messageBox.textContent = text;
  messageBox.classList.remove("hidden", "error");
  if (isError) messageBox.classList.add("error");
}
function connection(online) {
  statusText.textContent = online ? "Connected to Firebase" : "Disconnected";
  statusDot.classList.toggle("online", online);
  statusDot.classList.toggle("offline", !online);
}
function validZone(lat, lon, radius) {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90 &&
    Number.isFinite(lon) && lon >= -180 && lon <= 180 &&
    Number.isFinite(radius) && radius > 0;
}
function timeText(value) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

if (typeof firebase === "undefined") {
  connection(false);
  message("Firebase SDK could not load. Check internet access and the Firebase script URLs in index.html.", true);
} else {
  try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    // These paths and keys match the existing Firebase database.
    const restrictedRef = db.ref("Restricted Area");
    const speedRef = db.ref("Speed Area");
    const vehicleRef = db.ref("vehicle/status");
    const alertsRef = db.ref("alerts").limitToLast(10);
    const connectedRef = db.ref(".info/connected");

    connectedRef.on("value", snap => connection(snap.val() === true),
      err => message("Connection error: " + err.message, true));

    restrictedRef.on("value", snap => {
      const d = snap.val() || {};
      document.getElementById("lat_r").value = d.lat_r ?? "";
      document.getElementById("lon_r").value = d.lon_r ?? "";
      document.getElementById("rad_r").value = d.rad_r ?? "";
    }, err => message("Cannot read Restricted Area: " + err.message, true));

    speedRef.on("value", snap => {
      const d = snap.val() || {};
      document.getElementById("lat_s").value = d.lat_s ?? "";
      document.getElementById("lon_s").value = d.lon_s ?? "";
      document.getElementById("rad_s").value = d.rad_s ?? "";
      document.getElementById("speed").value = d.speed ?? "";
    }, err => message("Cannot read Speed Area: " + err.message, true));

    vehicleRef.on("value", snap => {
      const d = snap.val();
      if (!d) return;
      const speed = d.speed ?? d.speedKmh ?? d.speed_kmh;
      document.getElementById("vehicleSpeed").textContent =
        speed == null ? "--" : Number(speed).toFixed(1);
      const lat = d.latitude ?? d.lat;
      const lon = d.longitude ?? d.lon ?? d.lng;
      document.getElementById("vehicleLocation").textContent =
        lat == null || lon == null ? "GPS: waiting for coordinates" :
        `GPS: ${Number(lat).toFixed(6)}, ${Number(lon).toFixed(6)}`;
      if (lat != null && lon != null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon)) &&
          Number(lat) >= -90 && Number(lat) <= 90 && Number(lon) >= -180 && Number(lon) <= 180) {
        partnerLocation = { lat: Number(lat), lon: Number(lon) };
        setMapStatus("Partner location is live · add your location");
        refreshMap();
      }
      const impact = d.impactDetected ?? d.impact ?? d.accident;
      document.getElementById("impactStatus").textContent =
        impact === true || impact === 1 || impact === "true" ? "Impact detected" :
        impact === false || impact === 0 || impact === "false" ? "No impact" : "No data";
    }, err => message("Cannot read vehicle status: " + err.message, true));

    alertsRef.on("value", snap => {
      const rows = Object.entries(snap.val() || {}).reverse();
      const list = document.getElementById("alerts");
      document.getElementById("alertCount").textContent = `${rows.length} event${rows.length === 1 ? "" : "s"}`;
      list.replaceChildren();
      if (!rows.length) {
        const p = document.createElement("p");
        p.className = "empty";
        p.textContent = "No alerts received yet.";
        list.appendChild(p);
        return;
      }
      rows.forEach(([key, event]) => {
        const row = document.createElement("div");
        row.className = "alert-row";
        const title = document.createElement("strong");
        title.textContent = typeof event === "string" ? event :
          (event.message || event.type || event.event || key);
        const time = document.createElement("small");
        time.textContent = typeof event === "object" ?
          timeText(event.timestamp || event.time || event.createdAt) : "";
        row.append(title, time);
        list.appendChild(row);
      });
    }, err => message("Cannot read alerts: " + err.message, true));

    document.getElementById("restrictedForm").addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        lat_r: Number(document.getElementById("lat_r").value),
        lon_r: Number(document.getElementById("lon_r").value),
        rad_r: Number(document.getElementById("rad_r").value),
        action: "SERVO_ALERT",
        updatedAt: Date.now()
      };
      if (!validZone(data.lat_r, data.lon_r, data.rad_r)) {
        message("Enter valid latitude, longitude, and radius greater than 0.", true);
        return;
      }
      try {
        await restrictedRef.set(data);
        message("Restricted Area saved to Firebase. Servo action must be handled by the ESP32.");
      } catch (err) { message("Save failed: " + err.message, true); }
    });

    document.getElementById("speedForm").addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        lat_s: Number(document.getElementById("lat_s").value),
        lon_s: Number(document.getElementById("lon_s").value),
        rad_s: Number(document.getElementById("rad_s").value),
        speed: Number(document.getElementById("speed").value),
        action: "WEBSITE_ALERT_ONLY",
        updatedAt: Date.now()
      };
      if (!validZone(data.lat_s, data.lon_s, data.rad_s) ||
          !Number.isFinite(data.speed) || data.speed <= 0) {
        message("Enter valid coordinates, radius, and speed limit greater than 0.", true);
        return;
      }
      try {
        await speedRef.set(data);
        message("Speed Area saved to Firebase. This zone is alert-only; no servo action.");
      } catch (err) { message("Save failed: " + err.message, true); }
    });
  } catch (err) {
    connection(false);
    message("Firebase setup error: " + err.message, true);
  }
}
