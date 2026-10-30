import L from "leaflet";

import { renderToStaticMarkup } from "react-dom/server";
import { Icon } from "@mdi/react";
import { mdiCog } from "@mdi/js";

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
