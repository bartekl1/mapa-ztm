import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./ui/App.jsx";
import Map from "./map/map.js";
import Storage from "./utils/storage.js";
import { getSetting, setSetting, removeSetting, addChangeListener } from "./utils/userSettings.js";

function main() {
    let storage = new Storage();
    storage.createValue("vehicles");

    const socket = new WebSocket("/ws");
    socket.addEventListener("open", (event) => {
        setInterval(() => {
            socket.send(JSON.stringify({"msg": "ping"}));
        }, 10000);
    });
    socket.addEventListener("message", (event) => {
        const data = JSON.parse(event.data);
        if (data.msg === "vehicles") storage.setValue("vehicles", data.vehicles)
    });

    let map = new Map("map", storage);

    createRoot(document.getElementById("react-root")).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );

    addChangeListener("mapType", (e) => console.log(e), true)
}

main();
