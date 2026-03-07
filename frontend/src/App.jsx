import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { VehiclesLayer } from "./Layers";
import "./App.scss";

export default function App() {
    const [vehicles, setVehicles] = useState({});

    useEffect(() => {
        const evtSource = new EventSource("/api/positions/stream?as_dict");

        evtSource.onmessage = (event) => {
            setVehicles(JSON.parse(event.data));
        }

        evtSource.onerror = (error) => {
            console.error("SSE error:", error);
        };

        return () => { evtSource.close(); };
    }, []);

    return (
        <MapContainer
            center={[52.4, 16.96]}
            zoom={13}
            className="map"
        >
            <TileLayer
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                minZoom={4}
                maxZoom={19}
                attribution="&copy; OpenStreetMap"
            />
            <VehiclesLayer vehicles={vehicles} />
        </MapContainer>
    );
}
