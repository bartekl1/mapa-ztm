import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./gui/App.jsx";
import { initMap } from "./map/map.js";
import Storage from "./storage.js";

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

    initMap(storage);

    createRoot(document.getElementById("react-root")).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}

main();
