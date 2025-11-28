import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./style.scss";
import busIcon from "./img/bus.svg?raw";
import tramIcon from "./img/tram.svg?raw";

function getIcon(type, number) {
    return `<div class="vehicle-label vehicle-${type}">
                <div class="vehicle-label-icon">
                    ${type === "bus" ? busIcon : tramIcon}
                </div>
                <div class="vehicle-label-text">${number}</div>
            </div>`;
}

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
        let icon = L.divIcon({
            html: getIcon(parseInt(vehicle.route_id) < 100 ? "tram" : "bus", vehicle.route_id),
            className: "",
        });
        let marker = L.marker([vehicle.latitude, vehicle.longitude], {icon: icon}).addTo(layer);
        marker.bindPopup(vehicle.vehicle_label);
    });
}

async function updateVehicles(layer) {
    let vehicles = await fetchVehiclePositions();
    addVehiclesToMap(layer, vehicles);
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

    await updateVehicles(layer);
    setInterval(async () => updateVehicles(layer), 5000);
}

main();
