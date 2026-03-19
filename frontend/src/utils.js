import { useEffect, useState } from "react";
import { useMapEvents } from "react-leaflet";

export function useLocalStorage(key, defaultValue) {
    const [value, setValue] = useState(() => {
        const stored = localStorage.getItem(key);
        return stored !== null ? JSON.parse(stored) : defaultValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);

    return [value, setValue];
}

export function getFromLocalStorage(key, defaultValue) {
    const stored = localStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
}

export function getTheme() {
    const stored = getFromLocalStorage("theme", "system");
    const preference = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    return stored === "system" ? preference : stored;
}

export function getMapTheme() {
    return (getFromLocalStorage("dark-map", true) && getTheme() === "dark") ? "dark" : "light";
}

export function useZoom() {
    const [zoom, setZoom] = useState(null);

    useMapEvents({
        zoomend(e) {
            setZoom(e.target.getZoom());
        }
    });

    return zoom;
}
