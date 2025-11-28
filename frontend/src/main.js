import "./style.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

async function fetchVehiclePositions() {
    let r = await fetch("/api/positions");
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch vehicle positions");
        return [];
    }
}

function addVehiclesToMap(layer, vehicles) {
    layer.clearLayers();
    vehicles.forEach((vehicle) => {
        let marker = L.marker([vehicle.latitude, vehicle.longitude]).addTo(layer);
        marker.bindPopup(vehicle.vehicle_label);
    });
}

async function main() {
    const map = L.map("map").setView([52.40, 16.96], 13);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 4,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    var layer = L.layerGroup();
    map.addLayer(layer);

    setInterval(async () => {
        let vehicles = await fetchVehiclePositions();
        addVehiclesToMap(layer, vehicles);
    }, 1000);
}

main();
