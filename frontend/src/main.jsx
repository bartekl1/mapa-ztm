import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./gui/App.jsx";
import { initMap } from "./map/map.js";

initMap();

createRoot(document.getElementById("react-root")).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
