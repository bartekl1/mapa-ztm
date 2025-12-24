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

function getStopIcon(sequence, type, zone, status) {
    return `<div class="stop-icon stop-status-${status}"><span class="stop-label-sequence">${sequence}</span></div>`;
}

function getStopType(dropOffType, pickupType) {
    if (dropOffType === 1 && pickupType === 0) return "starting";
    else if (dropOffType === 0 && pickupType === 1) return "final";
    else if (dropOffType === 3 && pickupType === 3) return "request";
    else return "normal";
}

async function fetchVehiclePositions() {
    let r = await fetch("/api/positions?routes_info&bearings");
    if (r.ok) return await r.json();
    else throw new Error("Failed to fetch vehicle positions");
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

async function fetchAllStops() {
    let r = await fetch("/api/stops");
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch stops");
        return [];
    }
}

async function fetchTripDetails(trip_id) {
    let r = await fetch(`/api/trips/${trip_id}`);
    if (r.ok) return await r.json();
    else {
        console.error("Failed to fetch trip details");
        return null;
    }
}

function showToast(message, title = "", variant = "primary", icon = "info-circle", duration = 5000, countdown = "rtl") {
    const darkTheme = (localStorage.getItem("theme") === null && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) || localStorage.getItem("theme") === "dark";
    const alert = Object.assign(document.createElement('sl-alert'), {
      variant,
      closable: true,
      duration: duration,
      countdown: countdown,
      innerHTML: `<sl-icon name="${icon}" slot="icon"></sl-icon>` + ((title !== "" && title !== null && title !== undefined) ? `<strong>${title}</strong><br />` : "") + message,
      classList: darkTheme ? "sl-theme-dark" : "",
    });

    document.body.append(alert);
    alert.toast();
}

function createVehicleMarker(vehicle_id, trip_id, route_type, route_id, latitude, longitude, label, bearing, current_stop_sequence, tracked = false) {
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
        current_stop_sequence: current_stop_sequence,
    });
    return marker;
}

function trackVehicle(vehicleMarker, tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer) {
    untrackVehicles(tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer);
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
        vehicleMarker.options.current_stop_sequence,
        true
    );
    vehiclesLayer.removeLayer(vehiclesLayer.getLayer(vehicleMarker._leaflet_id));
    marker.addTo(trackedVehicleLayer);
}

function untrackVehicles(tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer) {
    tripsLayer.clearLayers();
    tripStopsLayer.clearLayers();

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
            m.options.current_stop_sequence,
            false
        );
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            await onVehicleClick(e, tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer);
        });
    });
    trackedVehicleLayer.clearLayers();
}

async function prepareTripDrawer(vehicleDetails) {
    let drawer = document.querySelector("#trip-drawer");
    drawer.querySelector(".drawer-content").classList.add("d-none");
    drawer.querySelector(".drawer-error").classList.add("d-none");
    drawer.querySelector(".drawer-loading").classList.remove("d-none");
    drawer.show();

    try {
        drawer.label = vehicleDetails.route_id;
        drawer.querySelector("#vehicle-id-placeholder").innerHTML = vehicleDetails.vehicle_id;
        drawer.querySelector("#vehicle-label-placeholder").innerHTML = vehicleDetails.label;
        drawer.querySelector("#vehicle-trip-placeholder").innerHTML = vehicleDetails.trip_id;
        const vehicleTypes = {"tram": "Tramwaj", "bus": "Autobus"};
        drawer.querySelector("#vehicle-type-placeholder").innerHTML = Object.keys(vehicleTypes).includes(vehicleDetails.route_type) ? vehicleTypes[vehicleDetails.route_type] : "Nieznany";
        const details = await fetchTripDetails(vehicleDetails.trip_id);
        drawer.querySelector("#vehicle-agency-link").innerHTML = details.route.agency.agency_name;
        drawer.querySelector("#vehicle-agency-link").href = details.route.agency.agency_url;
        if (details.route.route_desc.toUpperCase().includes("NA LINII NIE OBOWIĄZUJE TARYFA ZTM")) drawer.querySelector("#vehicle-not-ztm-tariff").show();
        else drawer.querySelector("#vehicle-not-ztm-tariff").hide();

        const stops = await fetchTripStops(vehicleDetails.trip_id);
        drawer.querySelector("#trip-stops").innerHTML = "";
        if (stops.length > 0) {
            stops.forEach(stop => {
                let stopDiv = document.createElement("div");
                stopDiv.innerHTML = document.querySelector("#stop-template").innerHTML;
                stopDiv.querySelector(".stop-sequence").innerHTML = stop.stop_sequence;
                stopDiv.querySelector(".stop-name").innerHTML = stop.stop_name;
                const stopType = getStopType(stop.drop_off_type, stop.pickup_type);
                if (stopType === "starting") {
                    stopDiv.querySelector(".starting-stop").classList.remove("d-none");
                    stopDiv.querySelector(".stop-type").classList.remove("d-none");
                } else if (stopType === "final") {
                    stopDiv.querySelector(".final-stop").classList.remove("d-none");
                    stopDiv.querySelector(".stop-type").classList.remove("d-none");
                } else if (stopType === "request") {
                    stopDiv.querySelector(".request-stop").classList.remove("d-none");
                    stopDiv.querySelector(".stop-type").classList.remove("d-none");
                }
                stopDiv.querySelector(".stop-zone").innerHTML = stop.zone_id;
                stopDiv.querySelector(".stop-code").innerHTML = stop.stop_code;
                stopDiv.querySelector(".stop-departure-time").innerHTML = stop.departure_time.split(":").slice(0, 2).join(":");
                drawer.querySelector("#trip-stops").append(stopDiv);
            });
        }
        drawer.label += " - " + details.trip_headsign;

        drawer.querySelector(".drawer-loading").classList.add("d-none");
        drawer.querySelector(".drawer-content").classList.remove("d-none");
    } catch (exception) {
        drawer.querySelector(".drawer-loading").classList.add("d-none");
        drawer.querySelector(".drawer-error").classList.remove("d-none");
        throw exception;
    }
}

async function onVehicleClick(event, tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer) {
    trackVehicle(event.target, tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer);
    const currentStopSequence = event.target.options.current_stop_sequence;
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
        let status;
        if (stop.stop_sequence === currentStopSequence) status = "current";
        else if (stop.stop_sequence > currentStopSequence) status = "next";
        else status = "past";
        const stopType = getStopType(stop.drop_off_type, stop.pickup_type);
        let icon = L.divIcon({
            html: getStopIcon(stop.stop_sequence, stopType, stop.zone_id, status),
            className: "stop-icon",
        });
        let marker = L.marker([stop.stop_lat, stop.stop_lon], {
            icon: icon,
            sequence: stop.stop_sequence,
            type: stopType,
            zone: stop.zone_id,
        });
        marker.addTo(tripStopsLayer);
    });
}

function addVehiclesToMap(vehiclesLayer, tripsLayer, tripStopsLayer, trackedVehicleLayer, vehicles) {
    vehiclesLayer.clearLayers();
    trackedVehicleLayer.clearLayers();
    let trackedVehicleId = document.querySelector("#map").getAttribute("tracked-vehicle-id");
    let currentStopSequence;
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
            vehicle.current_stop_sequence,
            trackedVehicleId === vehicle.vehicle.id
        );
        if (trackedVehicleId === vehicle.vehicle.id) {
            marker.addTo(trackedVehicleLayer);
            currentStopSequence = vehicle.current_stop_sequence;
            return;
        }
        marker.addTo(vehiclesLayer);
        marker.on("click", async (e) => {
            await onVehicleClick(e, tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer);
        });
    });
    tripStopsLayer.getLayers().forEach(marker => {
        let status;
        if (marker.options.sequence === currentStopSequence) status = "current";
        else if (marker.options.sequence > currentStopSequence) status = "next";
        else status = "past";
        let icon = L.divIcon({
            html: getStopIcon(marker.options.sequence, marker.options.type, marker.options.zone, status),
            className: "stop-icon",
        });
        marker.setIcon(icon);
    });
}

async function updateVehicles(vehiclesLayer, tripsLayer, tripStopsLayer, trackedVehicleLayer) {
    let vehicles;
    try {
        vehicles = await fetchVehiclePositions();
    } catch (exception) {
        showToast("Wystąpił błąd podczas wczytywania lokalizacji pojazdów", "", "danger", "x-circle");
        // throw exception;
    }
    addVehiclesToMap(vehiclesLayer, tripsLayer, tripStopsLayer, trackedVehicleLayer, vehicles);
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
        document.querySelectorAll(["sl-dialog", "sl-drawer", "sl-alert"]).forEach(e => e.classList.add("sl-theme-dark"));
    } else {
        document.querySelectorAll(["sl-dialog", "sl-drawer", "sl-alert"]).forEach(e => e.classList.remove("sl-theme-dark"));
    }
    if (mapDarkTheme) document.querySelector("#map").classList.add("map-dark-theme");
    else document.querySelector("#map").classList.remove("map-dark-theme");
}

function initSettings(map) {
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

    const lsLatitude = parseFloat(localStorage.getItem("map-start-latitude"))
    const lsLongitude = parseFloat(localStorage.getItem("map-start-longitude"))
    const lsZoom = parseInt(localStorage.getItem("map-start-zoom"))
    if (!isNaN(lsLatitude)) document.querySelector("#map-start-latitude").value = lsLatitude;
    if (!isNaN(lsLongitude)) document.querySelector("#map-start-longitude").value = lsLongitude;
    if (!isNaN(lsZoom)) document.querySelector("#map-start-zoom").value = lsZoom;
    document.querySelector("#map-start-location-tracking").checked = localStorage.getItem("map-start-location-tracking");

    document.querySelector("#map-start-latitude").addEventListener("sl-change", (evt) => { if (!isNaN(parseFloat(evt.currentTarget.value))) localStorage.setItem(evt.currentTarget.id, evt.currentTarget.value); });
    document.querySelector("#map-start-longitude").addEventListener("sl-change", (evt) => { if (!isNaN(parseFloat(evt.currentTarget.value))) localStorage.setItem(evt.currentTarget.id, evt.currentTarget.value); });
    document.querySelector("#map-start-zoom").addEventListener("sl-change", (evt) => { if (!isNaN(parseInt(evt.currentTarget.value))) localStorage.setItem(evt.currentTarget.id, evt.currentTarget.value); });
    document.querySelector("#load-location-from-map").addEventListener("click", () => {
        const center = map.getCenter();
        const lat = center.lat;
        const lon = center.lng;
        const zoom = map.getZoom();
        document.querySelector("#map-start-latitude").value = lat;
        document.querySelector("#map-start-longitude").value = lon;
        document.querySelector("#map-start-zoom").value = zoom;
        localStorage.setItem("map-start-latitude", lat);
        localStorage.setItem("map-start-longitude", lon);
        localStorage.setItem("map-start-zoom", zoom);
    });
    document.querySelector("#reset-map-start-location").addEventListener("click", () => {
        document.querySelector("#map-start-latitude").value = "";
        document.querySelector("#map-start-longitude").value = "";
        document.querySelector("#map-start-zoom").value = "";
        localStorage.removeItem("map-start-latitude");
        localStorage.removeItem("map-start-longitude");
        localStorage.removeItem("map-start-zoom");
    });
    document.querySelector("#map-start-location-tracking").addEventListener("sl-change", (e) => {
        let checked = e.currentTarget.checked;
        if (checked) localStorage.setItem("map-start-location-tracking", "true");
        else localStorage.removeItem("map-start-location-tracking");
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
        document.querySelector("#settings-tabs").setAttribute("placement", vw >= 800 ? "start" : "top");
        document.querySelectorAll("sl-drawer").forEach(e => e.setAttribute("placement", vw >= 800 ? "end" : "bottom"));
        document.querySelectorAll(".drawer-resizer").forEach(e => e.setAttribute("name", vw >= 800 ? "grip-vertical" : "grip-horizontal"));
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
    applyAppInfo();

    const map = L.map("map");

    initSettings(map);

    const startLat = parseFloat(localStorage.getItem("map-start-latitude")) || 52.40;
    const startLon = parseFloat(localStorage.getItem("map-start-longitude")) || 16.96;
    const startZoom = parseInt(localStorage.getItem("map-start-zoom")) || 13;
    map.setView([startLat, startLon], startZoom);

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

    let tripStopsLayer = L.layerGroup();
    map.addLayer(tripStopsLayer);

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
        if (localStorage.getItem("map-start-location-tracking")) document.querySelector(".leaflet-control-button.track-user-location-button").click();
    }

    if (navigator.onLine) {
        await updateVehicles(vehiclesLayer, tripsLayer, tripStopsLayer, trackedVehicleLayer);
        if (localStorage.getItem("disable-vehicle-position-updates")) console.warn(
            "%cWarning! Debug option enabled.\n%cVehicle position updates are disabled.",
            "font-weight: bold;",
            "",
        );
        else setInterval(async () => updateVehicles(vehiclesLayer, tripsLayer, tripStopsLayer, trackedVehicleLayer), 5000);

        updateZoom(map);
        map.on("zoomend", () => updateZoom(map));

        document.addEventListener("keyup", (e) => {
            if (e.key === "Escape") {
                document.querySelector("#trip-drawer").hide();
                untrackVehicles(tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer);
            }
        });

        document.querySelector("#trip-drawer").addEventListener("sl-request-close", () => untrackVehicles(tripsLayer, tripStopsLayer, vehiclesLayer, trackedVehicleLayer));

        addEventListener("offline", () => showToast("Jesteś offline", "", "danger", "wifi-off"));
        addEventListener("online", () => showToast("Jesteś znowu online", "", "success", "wifi"));
    } else {
        showToast("Jesteś offline", "", "danger", "wifi-off", Infinity, undefined);
        addEventListener("online", () => showToast("Jesteś znowu online" + `<br /><sl-button class="mt-5" variant="primary" outline onclick="location.reload()"><sl-icon slot="prefix" name="arrow-clockwise"></sl-icon>Odśwież</sl-button>`, "", "success", "wifi", Infinity, undefined));
    }

    document.querySelectorAll(["sl-button.refresh-website", "button.refresh-website"]).forEach(e => e.addEventListener("click", () => location.reload()));

    document.querySelectorAll(".drawer-resizer").forEach(e => e.addEventListener("pointerdown", (evt) => {
        let drawer = evt.currentTarget.parentElement;
        let placement = drawer.getAttribute("placement");
        let moveCallback = (evt2) => {
            let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
            let newSize;
            if (placement === "end") newSize = vw - evt2.clientX;
            else if (placement === "bottom") newSize = vh - evt2.clientY;
            if (newSize < 50) newSize = 50;
            drawer.style.setProperty("--size", `${newSize}px`);
        };
        let upCallback = () => {
            document.removeEventListener("pointermove", moveCallback);
            document.removeEventListener("pointerup", upCallback);
        };
        document.addEventListener("pointermove", moveCallback);
        document.addEventListener("pointerup", upCallback);
    }));

    loadingOverlay.remove();
    document.querySelector("#map").classList.remove("loading");
}

main();
