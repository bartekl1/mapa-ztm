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

export function useZoom() {
    const [zoom, setZoom] = useState(null);

    useMapEvents({
        zoomend(e) {
            setZoom(e.target.getZoom());
        }
    });

    return zoom;
}
