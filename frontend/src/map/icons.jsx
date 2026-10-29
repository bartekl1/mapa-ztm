import { renderToStaticMarkup } from "react-dom/server";
import { VehicleIcon, TripStopIcon } from "../ui/MapIcons";

export function renderVehicleIcon(type, label, bearing) {
    return renderToStaticMarkup(<VehicleIcon type={type} label={label} bearing={bearing} />);
}

export function renderTripStopIcon(sequence) {
    return renderToStaticMarkup(<TripStopIcon sequence={sequence} />);
}
