import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "./style.scss";
import busIcon from "./img/bus.svg?raw";
import tramIcon from "./img/tram.svg?raw";
import gpsIcon from "./img/crosshairs-gps.svg?raw";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
});

function getVehicleIcon(type, number) {
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
    let r = await fetch(`/api/trips/${trip_id}/shape?geojson`);
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch trip shape");
        return [];
    }
}

async function fetchTripStops(trip_id) {
    let r = await fetch(`/api/trips/${trip_id}/stops`);
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch trip stops");
        return [];
    }
}

function createVehicleMarker(vehicle_id, trip_id, route_type, route_id, latitude, longitude) {
    let icon = L.divIcon({
        html: getVehicleIcon(route_type, route_id),
        className: "",
    });
    let marker = L.marker([latitude, longitude], {
        icon: icon,
        vehicle_id: vehicle_id,
        trip_id: trip_id,
        route_type: route_type,
        route_id: route_id,
        latitude: latitude,
        longitude: longitude,
    });
    return marker;
}

function trackVehicle(vehicleMarker, vehiclesLayer, trackedVehicleLayer) {
    untrackVehicles(vehiclesLayer, trackedVehicleLayer);
    document.querySelector("#map").setAttribute("tracked-vehicle-id", vehicleMarker.options.vehicle_id);
    let marker = createVehicleMarker(
        vehicleMarker.options.vehicle_id,
        vehicleMarker.options.trip_id,
        vehicleMarker.options.route_type,
        vehicleMarker.options.route_id,
        vehicleMarker.options.latitude,
        vehicleMarker.options.longitude
    );
    vehiclesLayer.removeLayer(vehiclesLayer.getLayer(vehicleMarker._leaflet_id));
    marker.addTo(trackedVehicleLayer);
}

function untrackVehicles(vehiclesLayer, trackedVehicleLayer) {
    document.querySelector("#map").removeAttribute("tracked-vehicle-id");
    let markers = trackedVehicleLayer.getLayers();
    markers.forEach(m => {
        let marker = createVehicleMarker(
            m.options.vehicle_id,
            m.options.trip_id,
            m.options.route_type,
            m.options.route_id,
            m.options.latitude,
            m.options.longitude
        );
        marker.addTo(vehiclesLayer);
    });
    trackedVehicleLayer.clearLayers();
}

function addVehiclesToMap(vehiclesLayer, tripsLayer, trackedVehicleLayer, vehicles) {
    vehiclesLayer.clearLayers();
    trackedVehicleLayer.clearLayers();
    let trackedVehicleId = document.querySelector("#map").getAttribute("tracked-vehicle-id");
    vehicles.forEach((vehicle) => {
        let marker = createVehicleMarker(
            vehicle.vehicle.id,
            vehicle.trip.id,
            vehicle.route.type,
            vehicle.route.id,
            vehicle.coords.latitude,
            vehicle.coords.longitude
        );
        if (trackedVehicleId === vehicle.vehicle.id) {
            marker.addTo(trackedVehicleLayer);
            return;
        }
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            trackVehicle(e.target, vehiclesLayer, trackedVehicleLayer);

            tripsLayer.clearLayers();
            let shape = await fetchTripShape(e.target.options.trip_id);
            let stops = await fetchTripStops(e.target.options.trip_id);
            L.geoJSON(shape, {
                style: {
                    weight: 5,
                    className: "route-path",
                },
            }).addTo(tripsLayer);
            stops.forEach(stop => {
                let marker = L.marker([stop.stop_lat, stop.stop_lon]);
                marker.addTo(tripsLayer);
            });
        });
    });
}

async function updateVehicles(vehiclesLayer, tripsLayer, trackedVehicleLayer) {
    let vehicles = await fetchVehiclePositions();
    addVehiclesToMap(vehiclesLayer, tripsLayer, trackedVehicleLayer, vehicles);
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
    map.attributionControl.addAttribution('<a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/">API ZTM Poznań</a>');

    let vehiclesLayer = L.markerClusterGroup({
        maxClusterRadius: (zoom) => {
            if (zoom === 19) return 0;
            if (zoom === 18) return 10;
            if (zoom === 17) return 20;
            if (zoom === 16) return 40;
            return 80;
        },
    });
    map.addLayer(vehiclesLayer);

    let tripsLayer = L.layerGroup();
    map.addLayer(tripsLayer);

    let gpsLayer = L.layerGroup();
    map.addLayer(gpsLayer);

    let trackedVehicleLayer = L.layerGroup();
    map.addLayer(trackedVehicleLayer);

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

    await updateVehicles(vehiclesLayer, tripsLayer, trackedVehicleLayer);
    if (localStorage.getItem("disable-updates")) console.warn(
        'Vehicle position updates are disabled.\nRun %clocalStorage.removeItem("disable-updates")%c in console and refresh to enable.',
        "background-color: lightgray; color: black; padding: 2px; border-radius: 5px;",
        "",
    );
    else setInterval(async () => updateVehicles(vehiclesLayer, tripsLayer, trackedVehicleLayer), 5000);

    updateZoom(map);
    map.on("zoomend", () => updateZoom(map));

    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            tripsLayer.clearLayers();
            untrackVehicles(vehiclesLayer, trackedVehicleLayer);
        }
    });
}

main();
