import { Marker, LayerGroup, Circle, CircleMarker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { createDivIcon, VehicleIcon } from "./Icons";
import { useEffect, useState } from "react";

export function VehiclesLayer({ vehicles }) {
    return (
        <MarkerClusterGroup maxClusterRadius={(zoom) => {
            if (zoom === 19) return 0;
            if (zoom === 18) return 10;
            if (zoom === 17) return 20;
            if (zoom === 16) return 40;
            return 80;
        }}>
            {Object.values(vehicles).map((vehicle) => (
                <Marker
                    key={"v"+vehicle.vehicle.id}
                    position={vehicle.coordinates}
                    icon={createDivIcon(<VehicleIcon line={vehicle.route.id} type={vehicle.route.type} direction={vehicle.direction} />)}
                />
            ))}
        </MarkerClusterGroup>
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
