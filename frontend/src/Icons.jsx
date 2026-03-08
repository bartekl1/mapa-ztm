import L from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import Icon from "@mdi/react";
import { mdiArrowUpThin, mdiBus, mdiTram, mdiHelp } from "@mdi/js";
import "./Icons.scss";

export function createDivIcon(icon) {
    const html = renderToStaticMarkup(icon);
    return L.divIcon({ html: html });
}

export function VehicleIcon({ line, type, direction, tracked }) {
    const icons = {
        bus: mdiBus,
        tram: mdiTram,
        unknown: mdiHelp,
    }
    if (type === null) type = "unknown";
    if (line === null) line = "???";

    return (
        <>
            <div className={`vehicle-icon vehicle-${type}` + (tracked ? " tracked-vehicle-icon": "")}>
                <div className="vehicle-icon-arrow" style={{ "--rotation": Math.round(direction) }}>
                    <Icon path={mdiArrowUpThin} />
                </div>
                <div className="vehicle-icon-icon">
                    <Icon path={icons[type]} />
                </div>
                <div className="vehicle-icon-text">{line}</div>
            </div>
        </>
    );
}

export function TripStopIcon({ sequence, status }) {
    return (
        <>
            <div className={`trip-stop-icon trip-stop-status-${status}`}>
                <span className="trip-stop-icon-sequence">{sequence}</span>
            </div>
        </>
    );
}
