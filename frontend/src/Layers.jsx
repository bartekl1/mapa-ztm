import { Marker, LayerGroup, Circle, CircleMarker, Polyline, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { createDivIcon, VehicleIcon, TripStopIcon } from "./Icons";
import { useEffect, useState } from "react";
import "./Layers.scss";

export function VehiclesLayer({ vehicles, trackedVehicle, setTrackedVehicle }) {
    return (
        <MarkerClusterGroup maxClusterRadius={(zoom) => {
            if (zoom === 19) return 0;
            if (zoom === 18) return 10;
            if (zoom === 17) return 20;
            if (zoom === 16) return 40;
            return 80;
        }}>
            {Object.values(vehicles).map((vehicle) => vehicle.vehicle.id !== trackedVehicle ? (
                <Marker
                    key={"v"+vehicle.vehicle.id}
                    vehicleID={vehicle.vehicle.id}
                    position={vehicle.coordinates}
                    icon={createDivIcon(<VehicleIcon line={vehicle?.route?.id ?? vehicle?.vehicle?.label.split("/")[0]} type={vehicle.route.type} direction={vehicle.direction} />)}
                    eventHandlers={{
                        click: (e) => {
                            setTrackedVehicle(e.target.options.vehicleID);
                        },
                    }}
                />
            ) : null)}
        </MarkerClusterGroup>
    );
}

function useZoom() {
    const [zoom, setZoom] = useState(null);

    useMapEvents({
        zoomend(e) {
            setZoom(e.target.getZoom());
        }
    });

    return zoom;
}

export function TrackedVehicleLayer({ vehicles, vehicleID }) {
    const zoom = useZoom();
    const vehicle = (vehicleID !== null && Object.keys(vehicles).includes(vehicleID)) ? vehicles[vehicleID] : null;
    const [tripDetails, setTripDetails] = useState({});

    useEffect(() => {
        async function loadTripDetails() {
            const r = await fetch(`/api/trips/${encodeURIComponent(vehicle.trip.id)}`);
            const json = await r.json();
            setTripDetails(json);
        }

        if (vehicle !== null) loadTripDetails();
    }, [vehicleID]);

    function getStopStatus(stopSequence, currentStopSequence) {
        if (stopSequence === currentStopSequence) return "current";
        else if (stopSequence > currentStopSequence) return "next";
        else return "past";
    }

    return (
        <LayerGroup>
            {vehicle !== null && <Marker
                position={vehicle.coordinates}
                icon={createDivIcon(<VehicleIcon line={vehicle?.route?.id ?? vehicle?.vehicle?.label.split("/")[0]} type={vehicle.route.type} direction={vehicle.direction} tracked={true} />)}
            />}
            {(tripDetails?.shape?.shape !== null && tripDetails?.shape?.shape !== undefined) && <Polyline
                key={`t${tripDetails.trip?.id ?? vehicle?.trip?.id}z${zoom}`}
                positions={tripDetails.shape.shape}
                pathOptions={{
                    weight: 5,
                    className: `route-path route-${tripDetails?.route?.type ?? "unknown"} map-zoom-${zoom ?? 13}`,
                }}
            />}
            {(tripDetails?.stops ?? []).map((stop) => (
                <Marker
                    key={`t${tripDetails.trip?.id ?? vehicle?.trip?.id}s${stop.id}`}
                    position={stop.coordinates}
                    icon={createDivIcon(<TripStopIcon sequence={stop.sequence} status={getStopStatus(stop.sequence, vehicle.current_stop_sequence)} />)}
                />
            ))}
        </LayerGroup>
    );
}

export function GPSLayer() {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition((position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            setAccuracy(position.coords.accuracy);
            setReady(true);
        });

        return () => {
            navigator.geolocation.clearWatch(watchId);
        }
    }, [])

    return (
        <LayerGroup>
            {ready && <Circle center={[latitude, longitude]} radius={accuracy} weight={1} opacity={0.75} />}
            {ready && <CircleMarker center={[latitude, longitude]} radius={6} fillColor="#4285f2" fillOpacity={1} color="#ffffff" weight={1} />}
        </LayerGroup>
    )
}
