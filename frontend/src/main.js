import L from "leaflet";
import "leaflet/dist/leaflet.css";

import "./style.scss";
import busIcon from "./img/bus.svg?raw";
import tramIcon from "./img/tram.svg?raw";
import gpsIcon from "./img/crosshairs-gps.svg?raw";

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
    let r = await fetch(`/api/shapes/${trip_id}?geojson`);
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
                    weight: 5,
                    className: "route-path",
                },
            }).addTo(tripsLayer);
        });
    });
}

async function updateVehicles(vehiclesLayer, tripsLayer) {
    let vehicles = await fetchVehiclePositions();
    addVehiclesToMap(vehiclesLayer, vehicles, tripsLayer);
}

function updateZoom(map) {
    document.querySelector("#map").setAttribute("zoom", map.getZoom());
}

async function main() {
    const map = L.map("map").setView([52.40, 16.96], 13);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 4,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: "map-tiles",
    }).addTo(map);

    let vehiclesLayer = L.layerGroup();
    map.addLayer(vehiclesLayer);

    let tripsLayer = L.layerGroup();
    map.addLayer(tripsLayer);

    let gpsLayer = L.layerGroup();
    map.addLayer(gpsLayer);

    if ("geolocation" in navigator) {
        L.Control.TrackLocation = L.Control.extend({
            options: {
                position: "topleft",
            },
            onAdd: () => {
                let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                let button = L.DomUtil.create("a", "leaflet-control-button", container);
                button.innerHTML = gpsIcon;
                button.querySelector("svg").style.margin = "4px";
                L.DomEvent.disableClickPropagation(button);

                let watchId = null;

                L.DomEvent.on(button, "click", () => {
                    if (watchId === null) {
                        navigator.geolocation.getCurrentPosition((position) => {
                            let zoom = map.getZoom();
                            if (zoom < 15) zoom = 17;
                            map.setView([position.coords.latitude, position.coords.longitude], zoom);
                        });
                        watchId = navigator.geolocation.watchPosition((position) => {
                            gpsLayer.clearLayers();
                            L.circle([position.coords.latitude, position.coords.longitude], {
                                radius: position.coords.accuracy,
                                weight: 1,
                                opacity: 0.75,
                            }).addTo(gpsLayer);
                            L.circleMarker([position.coords.latitude, position.coords.longitude], {
                                radius: 6,
                                fillColor: "#4285f2",
                                fillOpacity: 1,
                                color: "#ffffff",
                                weight: 1,
                            }).addTo(gpsLayer);
                        });
                    } else {
                        gpsLayer.clearLayers();
                        navigator.geolocation.clearWatch(watchId);
                        watchId = null;
                    }
                });

                container.title = "Track location";

                return container;
            },
            onRemove: () => {},
        });
        let trackControl = new L.Control.TrackLocation();
        trackControl.addTo(map);
    }

    await updateVehicles(vehiclesLayer, tripsLayer);
    setInterval(async () => updateVehicles(vehiclesLayer, tripsLayer), 5000);

    updateZoom(map);
    map.on("zoomend", () => updateZoom(map));

    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") tripsLayer.clearLayers();
    });
}

main();
