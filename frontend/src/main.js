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

async function fetchTripShape(trip_id) {
    let r = await fetch(`/api/shapes/${trip_id}`);
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch trip shape");
        return [];
    }
}

function addVehiclesToMap(vehiclesLayer, vehicles, tripsLayer) {
    vehiclesLayer.clearLayers();
    vehicles.forEach((vehicle) => {
        let icon = L.divIcon({
            html: getIcon(parseInt(vehicle.route_id) < 100 ? "tram" : "bus", vehicle.vehicle_label.split("/")[0]),
            className: "",
        });
        let marker = L.marker([vehicle.latitude, vehicle.longitude], {
            icon: icon,
            vehicle_id: vehicle.vehicle_id,
            trip_id: vehicle.trip_id,
        });
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            tripsLayer.clearLayers()
            let shape = await fetchTripShape(e.target.options.trip_id);
            L.geoJSON(shape, {
                style: {
                    "color": "#ff0000",
                    "weight": 5,
                },
            }).addTo(tripsLayer);
        });
    });
}

async function updateVehicles(vehiclesLayer, tripsLayer) {
    let vehicles = await fetchVehiclePositions();
    addVehiclesToMap(vehiclesLayer, vehicles, tripsLayer);
}

async function main() {
    const map = L.map("map").setView([52.40, 16.96], 13);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 4,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    let vehiclesLayer = L.layerGroup();
    map.addLayer(vehiclesLayer);

    let tripsLayer = L.layerGroup();
    map.addLayer(tripsLayer);

    await updateVehicles(vehiclesLayer, tripsLayer);
    // setInterval(async () => updateVehicles(vehiclesLayer), 5000);
}

main();
