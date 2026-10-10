import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./variables.css";

import App from "./ui/App.jsx";
import Map from "./map/map.js";
import Storage from "./utils/storage.js";
import { watchThemeChange } from "./utils/theme.js";

function main() {
    let storage = new Storage();
    storage.createValue("vehicles");
    storage.createValue("trackedVehicle");
    storage.createValue("trackedVehicleData-vehicle");
    storage.createValue("trackedVehicleData-trip");

    const socket = new WebSocket("/ws");
    socket.addEventListener("open", (event) => {
        setInterval(() => {
            socket.send(JSON.stringify({"msg": "ping"}));
        }, 10000);
    });
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.msg === "vehicles") storage.setValue("vehicles", data.vehicles);
        if (data.msg === "trip" || data.msg === "vehicle") {
            const entityType = data.msg;
            if (storage.getValue("trackedVehicle")[entityType] === data[entityType + "_id"]) {
                storage.setValue("trackedVehicleData-" + entityType, data[entityType])
            }
        }
    });

    watchThemeChange((e) => {
        if (e.mapDarkTheme) document.querySelector("#map").classList.add("map-dark");
        else document.querySelector("#map").classList.remove("map-dark");
    }, true);

    let map = new Map("map", storage);

    storage.addChangeListener("trackedVehicle", (e) => {
        socket.send(JSON.stringify({msg: "trip", trip_id: e.newValue.trip}));
        socket.send(JSON.stringify({msg: "vehicle", vehicle_id: e.newValue.vehicle}));
    });

    createRoot(document.getElementById("react-root")).render(
        <StrictMode>
            <App storage={storage} />
        </StrictMode>,
    );
}

main();
