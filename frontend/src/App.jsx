import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { VehiclesLayer, GPSLayer, TrackedVehicleLayer } from "./Layers";
import { SettingsDialog, TripDetailsDrawer, LoadingScreen } from "./UIElements";
import { SettingsButton, TrackLocationButton } from "./MapControls";
import "./App.scss";

import "@shoelace-style/shoelace/dist/themes/light.css";
import { setBasePath } from "@shoelace-style/shoelace/dist/utilities/base-path.js";

setBasePath("/assets/shoelace");

export default function App() {
    const [appReady, setAppReady] = useState(false);

    const [vehicles, setVehicles] = useState({});
    const [trackedVehicle, setTrackedVehicle] = useState(null);
    const [tripDetailsStatus, setTripDetailsStatus] = useState("not_requested");
    const [tripDetails, setTripDetails] = useState(null);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [locationTracking, setLocationTracking] = useState(false);

    useEffect(() => {
        const evtSource = new EventSource("/api/positions/stream?as_dict");

        evtSource.onmessage = (event) => {
            setVehicles(JSON.parse(event.data));
            if (!appReady) setAppReady(true);
        }

        evtSource.onerror = (error) => {
            if (evtSource.readyState === EventSource.CLOSED) return;
            console.error("SSE error:", error);
        };

        return () => { evtSource.close(); };
    }, []);

    useEffect(() => {
        async function loadTripDetails(tripID) {
            setTripDetailsStatus("loading");
            const r = await fetch(`/api/trips/${encodeURIComponent(tripID)}`);
            if (r.ok) {
                const json = await r.json();
                setTripDetails(json);
                setTripDetailsStatus("ready");
            } else {
                setTripDetails(null);
                setTripDetailsStatus("error");
            }
        }

        const vehicle = (trackedVehicle !== null && Object.keys(vehicles).includes(trackedVehicle)) ? vehicles[trackedVehicle] : null;
        const tripID = vehicle?.trip?.id;
        if (tripID !== null && tripID !== undefined) loadTripDetails(tripID);
        else setTripDetails(null);
    }, [trackedVehicle]);

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
                {trackedVehicle !== null && <TrackedVehicleLayer vehicles={vehicles} vehicleID={trackedVehicle} tripDetails={tripDetails} />}
                {locationTracking && <GPSLayer />}
            </MapContainer>

            {!appReady && <LoadingScreen />}

            <SettingsDialog isOpen={settingsOpen} setOpen={setSettingsOpen} />
            <TripDetailsDrawer vehicles={vehicles} trackedVehicle={trackedVehicle} setTrackedVehicle={setTrackedVehicle} tripDetails={tripDetails} tripDetailsStatus={tripDetailsStatus} />
        </>
    );
}
