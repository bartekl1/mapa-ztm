import L from "leaflet";

import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "@mdi/react";
import { mdiCog, mdiCrosshairsGps, mdiLoading } from "@mdi/js";

import "./controls.css";

export function settingsControl({ setOpen }) {
    const control = L.Control.extend({
        options: {
            position: "topleft",
        },
        onAdd: (map) => {
            let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            let button = L.DomUtil.create("a", "leaflet-control-button", container);
            button.innerHTML = renderToStaticMarkup(<Icon path={mdiCog} />);
            L.DomEvent.disableClickPropagation(button);

            L.DomEvent.on(button, "click", () => { setOpen(true); });

            return container;
        },
        onRemove: () => {},
    });
    return new control();
}

export function gpsControl({ gpsLayer }) {
    const control = L.Control.extend({
        options: {
            position: "topleft",
        },
        onAdd: (map) => {
            let container = L.DomUtil.create("div", "leaflet-bar leaflet-control");
            let button = L.DomUtil.create("a", "leaflet-control-button gps-button", container);
            button.innerHTML = renderToStaticMarkup(<>
                <Icon path={mdiCrosshairsGps} />
                <Icon path={mdiLoading} />
            </>);
            L.DomEvent.disableClickPropagation(button);

            let watchId = null;

            L.DomEvent.on(button, "click", () => {
                if (watchId === null) {
                    button.classList.add("loading");

                    navigator.geolocation.getCurrentPosition((position) => {
                        let zoom = map.getZoom();
                        if (zoom < 15) zoom = 17;
                        map.setView([position.coords.latitude, position.coords.longitude], zoom);

                        button.classList.remove("loading");
                    }, () => {
                        button.classList.remove("loading");
                    });
                    watchId = navigator.geolocation.watchPosition((position) => {
                        gpsLayer.clearLayers();
                        L.circle([position.coords.latitude, position.coords.longitude], {
                            radius: position.coords.accuracy,
                            weight: 1,
                            opacity: 0.75,
                        }).addTo(gpsLayer);
                        L.circleMarker([position.coords.latitude, position.coords.longitude], {
                            radius: 6,
                            fillColor: "#4285f2",
                            fillOpacity: 1,
                            color: "#ffffff",
                            weight: 1,
                        }).addTo(gpsLayer);
                    });
                } else {
                    gpsLayer.clearLayers();
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                }
            });

            return container;
        },
        onRemove: () => {},
    });
    return new control();
}
