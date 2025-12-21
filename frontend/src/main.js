import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "@shoelace-style/shoelace/dist/themes/light.css";
import "@shoelace-style/shoelace/dist/themes/dark.css";
import "@shoelace-style/shoelace/dist/shoelace.js";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";
setBasePath("/assets/shoelace");

import "./style.scss";

import busIcon from "./img/bus.svg?raw";
import tramIcon from "./img/tram.svg?raw";
import settingsIcon from "./img/cog.svg?raw";
import gpsIcon from "./img/crosshairs-gps.svg?raw";
import questionMarkIcon from "./img/help.svg?raw";
import loadingIcon from "./img/loading.svg?raw";
import arrowIcon from "./img/arrow-up-thin.svg?raw";

import appInfo from "./appInfo";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
});

function getVehicleIcon(type, number, label, bearing) {
    const icons = {
        bus: busIcon,
        tram: tramIcon,
        unknown: questionMarkIcon,
    }
    if (type === null) type = "unknown";
    if (number === null) number = (label !== null && label !== undefined) ? label.split("/")[0] : "???";
    const bearingArrow = (bearing !== null && bearing !== undefined) ? `<div class="vehicle-label-arrow" style="--bearing: ${Math.round(bearing)};">${arrowIcon}</div>` : ""
    return `<div class="vehicle-label vehicle-${type}">${bearingArrow}<div class="vehicle-label-icon">${icons[type]}</div><div class="vehicle-label-text">${number}</div></div>`;
}

async function fetchVehiclePositions() {
    let r = await fetch("/api/positions?routes_info&bearings");
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

async function fetchAllStops(trip_id) {
    let r = await fetch("/api/stops");
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch stops");
        return [];
    }
}

function createVehicleMarker(vehicle_id, trip_id, route_type, route_id, latitude, longitude, label, bearing, tracked = false) {
    let icon = L.divIcon({
        html: getVehicleIcon(route_type, route_id, label, bearing),
        className: "vehicle-icon" + (tracked ? " vehicle-icon-tracked": ""),
    });
    let marker = L.marker([latitude, longitude], {
        icon: icon,
        vehicle_id: vehicle_id,
        trip_id: trip_id,
        route_type: route_type,
        route_id: route_id,
        latitude: latitude,
        longitude: longitude,
        label: label,
        bearing: bearing,
    });
    return marker;
}

function trackVehicle(vehicleMarker, tripsLayer, vehiclesLayer, trackedVehicleLayer) {
    untrackVehicles(tripsLayer, vehiclesLayer, trackedVehicleLayer);
    document.querySelector("#map").setAttribute("tracked-vehicle-id", vehicleMarker.options.vehicle_id);
    let marker = createVehicleMarker(
        vehicleMarker.options.vehicle_id,
        vehicleMarker.options.trip_id,
        vehicleMarker.options.route_type,
        vehicleMarker.options.route_id,
        vehicleMarker.options.latitude,
        vehicleMarker.options.longitude,
        vehicleMarker.options.label,
        vehicleMarker.options.bearing,
        true
    );
    vehiclesLayer.removeLayer(vehiclesLayer.getLayer(vehicleMarker._leaflet_id));
    marker.addTo(trackedVehicleLayer);
}

function untrackVehicles(tripsLayer, vehiclesLayer, trackedVehicleLayer) {
    tripsLayer.clearLayers();

    document.querySelector("#map").removeAttribute("tracked-vehicle-id");
    let markers = trackedVehicleLayer.getLayers();
    markers.forEach(m => {
        let marker = createVehicleMarker(
            m.options.vehicle_id,
            m.options.trip_id,
            m.options.route_type,
            m.options.route_id,
            m.options.latitude,
            m.options.longitude,
            m.options.label,
            m.options.bearing,
            false
        );
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            await onVehicleClick(e, tripsLayer, vehiclesLayer, trackedVehicleLayer);
        });
    });
    trackedVehicleLayer.clearLayers();
}

async function prepareTripDrawer(vehicleDetails) {
    let drawer = document.querySelector("#trip-drawer");

    drawer.label = vehicleDetails.route_id;
    drawer.querySelector("#vehicle-id-placeholder").innerHTML = vehicleDetails.vehicle_id;
    drawer.querySelector("#vehicle-label-placeholder").innerHTML = vehicleDetails.label;
    drawer.querySelector("#vehicle-trip-placeholder").innerHTML = vehicleDetails.trip_id;
    const vehicleTypes = {"tram": "Tramwaj", "bus": "Autobus"};
    drawer.querySelector("#vehicle-type-placeholder").innerHTML = Object.keys(vehicleTypes).includes(vehicleDetails.route_type) ? vehicleTypes[vehicleDetails.route_type] : "Nieznany";

    const stops = await fetchTripStops(vehicleDetails.trip_id);
    drawer.querySelector("#trip-stops").innerHTML = "";
    if (stops.length > 0) {
        drawer.label += " - " + stops[stops.length - 1].stop_name;
        stops.forEach(stop => {
            let stopDiv = document.createElement("div");
            stopDiv.innerHTML = document.querySelector("#stop-template").innerHTML;
            stopDiv.querySelector(".stop-sequence").innerHTML = stop.stop_sequence;
            stopDiv.querySelector(".stop-name").innerHTML = stop.stop_name;
            if (stop.drop_off_type === 1 && stop.pickup_type === 0) {
                stopDiv.querySelector(".starting-stop").classList.remove("d-none");
                stopDiv.querySelector(".stop-type").classList.remove("d-none");
            } else if (stop.drop_off_type === 0 && stop.pickup_type === 1) {
                stopDiv.querySelector(".final-stop").classList.remove("d-none");
                stopDiv.querySelector(".stop-type").classList.remove("d-none");
            } else if (stop.drop_off_type === 3 && stop.pickup_type === 3) {
                stopDiv.querySelector(".request-stop").classList.remove("d-none");
                stopDiv.querySelector(".stop-type").classList.remove("d-none");
            }
            stopDiv.querySelector(".stop-zone").innerHTML = stop.zone_id;
            stopDiv.querySelector(".stop-code").innerHTML = stop.stop_code;
            stopDiv.querySelector(".stop-departure-time").innerHTML = stop.departure_time.split(":").slice(0, 2).join(":");
            drawer.querySelector("#trip-stops").append(stopDiv);
        });
    }

    drawer.show();
}

async function onVehicleClick(event, tripsLayer, vehiclesLayer, trackedVehicleLayer) {
    trackVehicle(event.target, tripsLayer, vehiclesLayer, trackedVehicleLayer);

    await prepareTripDrawer(event.target.options);

    tripsLayer.clearLayers();
    let shape = await fetchTripShape(event.target.options.trip_id);
    let stops = await fetchTripStops(event.target.options.trip_id);
    L.geoJSON(shape, {
        style: {
            weight: 5,
            className: "route-path route-" + event.target.options.route_type,
        },
    }).addTo(tripsLayer);
    stops.forEach(stop => {
        let marker = L.marker([stop.stop_lat, stop.stop_lon]);
        marker.addTo(tripsLayer);
    });
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
            vehicle.coords.longitude,
            vehicle.vehicle.label,
            vehicle.bearing,
            trackedVehicleId === vehicle.vehicle.id
        );
        if (trackedVehicleId === vehicle.vehicle.id) {
            marker.addTo(trackedVehicleLayer);
            return;
        }
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            await onVehicleClick(e, tripsLayer, vehiclesLayer, trackedVehicleLayer);
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

function createLoadingOverlay() {
    let loading = document.createElement("div");
    loading.classList.add("loading-overlay");
    loading.innerHTML = loadingIcon;
    loading.querySelector("svg").classList.add("spinner");
    return loading
}

function applyTheme() {
    let darkTheme = (localStorage.getItem("theme") === null && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) || localStorage.getItem("theme") === "dark";
    let mapDarkTheme = darkTheme && !localStorage.getItem("map-dark-theme");
    if (darkTheme) {
        document.querySelectorAll(["#settings-dialog", "#trip-drawer"]).forEach(e => e.classList.add("sl-theme-dark"));
    } else {
        document.querySelectorAll(["#settings-dialog", "#trip-drawer"]).forEach(e => e.classList.remove("sl-theme-dark"));
    }
    if (mapDarkTheme) document.querySelector("#map").classList.add("map-dark-theme");
    else document.querySelector("#map").classList.remove("map-dark-theme");
}

function initSettings() {
    let currentTheme = localStorage.getItem("theme");
    if (currentTheme === null) currentTheme = "system";
    document.querySelector("#theme-select").value = currentTheme;

    document.querySelector("#map-dark-theme-switch").checked = !localStorage.getItem("map-dark-theme");
    document.querySelector("#disable-vehicle-position-updates-switch").checked = localStorage.getItem("disable-vehicle-position-updates");
    document.querySelector("#do-not-block-map-when-loading-switch").checked = localStorage.getItem("do-not-block-map-when-loading");

    document.querySelector("#theme-select").addEventListener("sl-change", (e) => {
        let value = e.currentTarget.value;
        if (value === "light" || value === "dark") localStorage.setItem("theme", value);
        else localStorage.removeItem("theme");
        applyTheme();
    });
    document.querySelector("#map-dark-theme-switch").addEventListener("sl-change", (e) => {
        let checked = e.currentTarget.checked;
        if (checked) localStorage.removeItem("map-dark-theme");
        else localStorage.setItem("map-dark-theme", "false");
        applyTheme();
    });

    document.querySelector("#disable-vehicle-position-updates-switch").addEventListener("sl-change", (e) => {
        let checked = e.currentTarget.checked;
        if (checked) localStorage.setItem("disable-vehicle-position-updates", "true");
        else localStorage.removeItem("disable-vehicle-position-updates");
    });
    document.querySelector("#do-not-block-map-when-loading-switch").addEventListener("sl-change", (e) => {
        let checked = e.currentTarget.checked;
        if (checked) localStorage.setItem("do-not-block-map-when-loading", "true");
        else localStorage.removeItem("do-not-block-map-when-loading");
    });

    document.querySelectorAll(".debug-option").forEach(e => e.addEventListener("sl-change", () => document.querySelector("#debug-options-changed").show()));

    let resizeCallback = () => {
        let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        document.querySelector("sl-tab-group").setAttribute("placement", vw >= 800 ? "start" : "top");
        document.querySelector("#trip-drawer").setAttribute("placement", vw >= 800 ? "end" : "bottom");
    };
    resizeCallback();
    addEventListener("resize", resizeCallback);
}

function applyAppInfo() {
    document.querySelector("#app-name-placeholder").innerHTML = appInfo.name;
    document.querySelector("#app-description-placeholder").innerHTML = appInfo.description;
    document.querySelector("#app-author-placeholder").innerHTML = appInfo.author;
    document.querySelector("#app-version-placeholder").innerHTML = appInfo.version;
    document.querySelector("#app-commit-placeholder").innerHTML = appInfo.hash;
    document.querySelector("#app-modified-placeholder").innerHTML = appInfo.modified ? "(zmodyfikowano)" : "";
    document.querySelector("#app-license-link").innerHTML = appInfo.license;
    document.querySelector("#app-license-link").href = `https://spdx.org/licenses/${appInfo.license}.html`;
    document.querySelector("#app-repo-link").href = appInfo.repo;
    document.querySelector("#app-issues-link").href = appInfo.issues;
    document.querySelector("#app-changelog-link").href = appInfo.changelog;
    document.querySelector("#python-dependencies").innerHTML = appInfo.pythonDependencies.map(dep => `<li><a href="https://pypi.org/project/${dep}/" target="_blank" rel="noopener">${dep}</a></li>`).join("");
    document.querySelector("#node-dependencies").innerHTML = appInfo.nodeDependencies.map(dep => `<li><a href="https://www.npmjs.com/package/${dep}" target="_blank" rel="noopener">${dep}</a></li>`).join("");
}

async function main() {
    applyTheme();
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", applyTheme);
    initSettings();
    applyAppInfo();

    const map = L.map("map").setView([52.40, 16.96], 13);

    const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        minZoom: 4,
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        className: "map-tiles",
    }).addTo(map);
    map.attributionControl.addAttribution('<a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/">API ZTM Poznań</a>');

    if (!localStorage.getItem("do-not-block-map-when-loading")) document.querySelector("#map").classList.add("loading");
    let loadingOverlay = createLoadingOverlay()
    document.querySelector("body").appendChild(loadingOverlay);

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

    // let stopsLayer = L.markerClusterGroup({
    //     maxClusterRadius: 0,
    //     disableClusteringAtZoom: 16,
    // });
    // // map.addLayer(stopsLayer);
    // let stops = await fetchAllStops();
    // stops.forEach(stop => {
    //     let marker = L.marker([stop.stop_lat, stop.stop_lon]);
    //     marker.addTo(stopsLayer);
    // });
    // map.on("zoomend", () => {
    //     if (map.getZoom() >= 16) {
    //         if (!map.hasLayer(stopsLayer)) map.addLayer(stopsLayer);
    //     } else {
    //         if (map.hasLayer(stopsLayer)) map.removeLayer(stopsLayer);
    //     }
    // });

    L.Control.Settings = L.Control.extend({
        options: {
            position: "topleft",
        },
        onAdd: () => {
            let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            let button = L.DomUtil.create("a", "leaflet-control-button open-settings-button", container);
            button.innerHTML = settingsIcon;
            L.DomEvent.disableClickPropagation(button);

            L.DomEvent.on(button, "click", () => {
                document.querySelector("#settings-dialog").show();
            });

            container.title = "Settings";

            return container;
        },
        onRemove: () => {},
    });
    let settingsControl = new L.Control.Settings();
    settingsControl.addTo(map);

    if ("geolocation" in navigator) {
        L.Control.TrackLocation = L.Control.extend({
            options: {
                position: "topleft",
            },
            onAdd: () => {
                let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
                let button = L.DomUtil.create("a", "leaflet-control-button track-user-location-button", container);
                button.innerHTML = gpsIcon;
                L.DomEvent.disableClickPropagation(button);

                let watchId = null;

                L.DomEvent.on(button, "click", () => {
                    if (watchId === null) {
                        button.classList.add("loading");
                        button.innerHTML = loadingIcon;

                        navigator.geolocation.getCurrentPosition((position) => {
                            let zoom = map.getZoom();
                            if (zoom < 15) zoom = 17;
                            map.setView([position.coords.latitude, position.coords.longitude], zoom);

                            button.classList.remove("loading");
                            button.innerHTML = gpsIcon;
                        }, () => {
                            button.classList.remove("loading");
                            button.innerHTML = gpsIcon;
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
    if (localStorage.getItem("disable-vehicle-position-updates")) console.warn(
        "%cWarning! Debug option enabled.\n%cVehicle position updates are disabled.",
        "font-weight: bold;",
        "",
    );
    else setInterval(async () => updateVehicles(vehiclesLayer, tripsLayer, trackedVehicleLayer), 5000);

    updateZoom(map);
    map.on("zoomend", () => updateZoom(map));

    document.addEventListener("keyup", (e) => {
        if (e.key === "Escape") {
            document.querySelector("#trip-drawer").hide();
            untrackVehicles(tripsLayer, vehiclesLayer, trackedVehicleLayer);
        }
    });

    loadingOverlay.remove();
    document.querySelector("#map").classList.remove("loading");

    document.querySelectorAll(["sl-button.refresh-website", "button.refresh-website"]).forEach(e => e.addEventListener("click", () => location.reload()));

    document.querySelector("#trip-drawer").addEventListener("sl-request-close", () => untrackVehicles(tripsLayer, vehiclesLayer, trackedVehicleLayer));
}

main();
