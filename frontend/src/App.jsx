import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { VehiclesLayer, GPSLayer, TrackedVehicleLayer } from "./Layers";
import { SettingsDialog, TripDetailsDrawer } from "./UIElements";
import { SettingsButton, TrackLocationButton } from "./MapControls";
import "./App.scss";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

setBasePath("/assets/shoelace");

export default function App() {
    const [vehicles, setVehicles] = useState({});
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [locationTracking, setLocationTracking] = useState(false);
    const [trackedVehicle, setTrackedVehicle] = useState(null);

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
        <>
            <MapContainer
                center={[52.4, 16.96]}
                zoom={13}
                className="map"
            >
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    minZoom={4}
                    maxZoom={19}
                    attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/">API ZTM Poznań</a>'
                />

                <SettingsButton position="topleft" setSettingsOpen={setSettingsOpen} />
                <TrackLocationButton position="topleft" locationTracking={locationTracking} setLocationTracking={setLocationTracking} />

                <VehiclesLayer vehicles={vehicles} trackedVehicle={trackedVehicle} setTrackedVehicle={setTrackedVehicle} />
                {trackedVehicle !== null && <TrackedVehicleLayer vehicles={vehicles} vehicleID={trackedVehicle} />}
                {locationTracking && <GPSLayer />}
            </MapContainer>

            <SettingsDialog isOpen={settingsOpen} setOpen={setSettingsOpen} />
            <TripDetailsDrawer vehicles={vehicles} trackedVehicle={trackedVehicle} setTrackedVehicle={setTrackedVehicle} />
        </>
    );
}
