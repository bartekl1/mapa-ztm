import { Marker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { createDivIcon, VehicleIcon } from "./Icons";

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
