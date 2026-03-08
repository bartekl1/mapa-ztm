import { useEffect } from "react";
import { useLeafletContext } from "@react-leaflet/core";
import { useMap } from "react-leaflet";
import { renderToStaticMarkup } from "react-dom/server";
import L from "leaflet";
import Icon from "@mdi/react";
import { mdiCog, mdiCrosshairsGps } from "@mdi/js";
import "./MapControls.scss";

export function SettingsButton({ position, setSettingsOpen }) {
    const context = useLeafletContext();

    L.Control.Settings = L.Control.extend({
        onAdd: () => {
            let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            let button = L.DomUtil.create("a", "leaflet-control-button", container);
            button.innerHTML = renderToStaticMarkup(<Icon path={mdiCog} />);
            L.DomEvent.disableClickPropagation(button);

            L.DomEvent.on(button, "click", () => {
                setSettingsOpen(true);
            });

            return container;
        },
        onRemove: () => {},
    });
    L.control.settings = function (opts) {
        return new L.Control.Settings(opts);
    }

    useEffect(() => {
        const container = context.layerContainer || context.map;

        const control = L.control.settings({ position: position });
        container.addControl(control);

        return () => {
            container.removeControl(control);
        }
    });

    return null;
}

export function TrackLocationButton({ position, locationTracking, setLocationTracking }) {
    const context = useLeafletContext();

    L.Control.TrackLocation = L.Control.extend({
        onAdd: () => {
            let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            let button = L.DomUtil.create("a", "leaflet-control-button", container);
            button.innerHTML = renderToStaticMarkup(<Icon path={mdiCrosshairsGps} />);
            L.DomEvent.disableClickPropagation(button);

            L.DomEvent.on(button, "click", () => {
                setLocationTracking(!locationTracking);
            });

            return container;
        },
        onRemove: () => {},
    });
    L.control.trackLocation = function (opts) {
        return new L.Control.TrackLocation(opts);
    }

    useEffect(() => {
        const container = context.layerContainer || context.map;

        const control = L.control.trackLocation({ position: position });
        container.addControl(control);

        return () => {
            container.removeControl(control);
        }
    });

    return null;
}
