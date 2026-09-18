import { renderToStaticMarkup } from "react-dom/server";
import { VehicleIcon } from "../ui/MapIcons";

export function renderVehicleIcon(type, label, bearing) {
    return renderToStaticMarkup(<VehicleIcon type={type} label={label} bearing={bearing}></VehicleIcon>);
}
