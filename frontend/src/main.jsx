import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./variables.css";

import App from "./ui/App.jsx";
import Map from "./map/map.js";
import Storage from "./utils/storage.js";
import appInfo from "./appInfo";
import { watchThemeChange } from "./utils/theme.js";

function main() {
    let storage = new Storage();
    storage.createValue("vehicles");
    storage.createValue("selectedVehicle");
    storage.createValue("selectedVehicleData-vehicle");
    storage.createValue("selectedVehicleData-trip");
    storage.createValue("currentStopSequence");
    storage.createValue("highlightedStop");
    storage.createValue("settingsOpen");
    storage.createValue("setStartPosFromMap");

    storage.createValue("appReady");
    storage.setValue("appReady", false);
    storage.createValue("loadingError");
    storage.createValue("receivedWelcomeMessage");
    storage.setValue("receivedWelcomeMessage", false);
    storage.createValue("receivedVehiclePositions");
    storage.setValue("receivedVehiclePositions", false);

    if (!window.navigator.onLine) {
        storage.setValue("loadingError", "offline");
        window.addEventListener("online", () => {
            window.location.reload();
        });
    }

    setTimeout(() => {
        if (!storage.getValue("receivedWelcomeMessage")) storage.setValue("loadingError", "connection");
    }, 15_000);
    setTimeout(() => {
        if (!storage.getValue("receivedVehiclePositions")) storage.setValue("loadingError", "vehicles");
    }, 90_000);

    const socket = new WebSocket("/ws");
    socket.addEventListener("open", (event) => {
        setInterval(() => {
            socket.send(JSON.stringify({"msg": "ping"}));
        }, 10_000);
    });
    socket.addEventListener("error", (event) => {
        if (!storage.getValue("receivedWelcomeMessage")) storage.setValue("loadingError", "connection");
    });
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.msg === "welcome") {
            storage.setValue("receivedWelcomeMessage", true);
            if (data.version !== appInfo.version) {
                if (sessionStorage.getItem("updateTargetVersion") !== data.version) {
                    console.log("updating")
                    sessionStorage.setItem("updateTargetVersion", data.version);
                    window.location.reload(true);
                } else {
                    console.error("Update failed");
                }
            }
            if (sessionStorage.getItem("updateTargetVersion") === appInfo.version) {
                console.log("updated")
                sessionStorage.removeItem("updateTargetVersion");
            }
        }
        if (data.msg === "vehicles") {
            storage.setValue("receivedVehiclePositions", true);
            storage.setValue("vehicles", data.vehicles);
            if (!storage.getValue("appReady")) storage.setValue("appReady", true);
        }
        if (data.msg === "trip" || data.msg === "vehicle") {
            const entityType = data.msg;
            if (storage.getValue("selectedVehicle")[entityType] === data[entityType + "_id"]) {
                storage.setValue("selectedVehicleData-" + entityType, data[entityType])
            }
        }
    });

    watchThemeChange((e) => {
        if (e.mapDarkTheme) document.querySelector("#map").classList.add("map-dark");
        else document.querySelector("#map").classList.remove("map-dark");
    }, true);

    let map = new Map("map", storage);

    storage.addChangeListener("selectedVehicle", (e) => {
        storage.setValue("selectedVehicleData-trip", null);
        storage.setValue("selectedVehicleData-vehicle", null);
        if (e.newValue !== null && e.newValue !== undefined) {
            socket.send(JSON.stringify({msg: "trip", trip_id: e.newValue.trip}));
            socket.send(JSON.stringify({msg: "vehicle", vehicle_id: e.newValue.vehicle}));
        }
    });

    createRoot(document.getElementById("react-root")).render(
        <StrictMode>
            <App storage={storage} />
        </StrictMode>,
    );
}

main();
