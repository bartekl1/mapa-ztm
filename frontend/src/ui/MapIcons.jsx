import { Icon } from "@mdi/react";
import { mdiBus, mdiTram, mdiHelp, mdiArrowUpThin } from "@mdi/js";

import "./MapIcons.css";

const vehicleTypeIcons = {
    bus: mdiBus,
    tram: mdiTram,
    unknown: mdiHelp,
};

export function VehicleIcon({ type, label, bearing }) {
    return <div className={`vehicle-icon ${type}`}>
        { (bearing !== null && bearing !== undefined) &&
            <div className="vehicle-icon-arrow" style={{"--rotation": Math.round(bearing)}}>
                <Icon path={mdiArrowUpThin} />
            </div>
        }
        <div className="vehicle-icon-type-icon">
            <Icon path={vehicleTypeIcons[type]} />
        </div>
        <div className="vehicle-icon-label">{label}</div>
    </div>;
}

export function TripStopIcon({ sequence }) {
    return <div className="trip-stop-icon">{sequence}</div>;
}
