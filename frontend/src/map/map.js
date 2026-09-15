import L from "leaflet";
import "leaflet/dist/leaflet.css";

import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
setWorkerUrl(workerUrl);

import "./map.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
});

export function initMap(storage) {
    const map = L.map("map", {
        minZoom: 4,
        maxZoom: 19,
    });

    map.setView([52.40, 16.96], 13);

    // const tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    //     attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    //     className: "map-tiles",
    // }).addTo(map);
    const gl = maplibreGL({
        style: "https://tiles.openfreemap.org/styles/liberty",
        // style: "https://tiles.openfreemap.org/styles/bright",
    }).addTo(map);
    map.attributionControl.addAttribution('<a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/">API ZTM Poznań</a>');

    let vehiclesLayer = L.markerClusterGroup({
        // maxClusterRadius: (zoom) => {
        //     if (zoom === 19) return 0;
        //     if (zoom === 18) return 10;
        //     if (zoom === 17) return 20;
        //     if (zoom === 16) return 40;
        //     return 80;
        // },
    });
    map.addLayer(vehiclesLayer);

    storage.addChangeListener("vehicles", (e) => {
        Object.entries(e.newValue).forEach(([id, vehicle]) => {
            // console.log(id, vehicle)
            // console.log(vehicle.coords.latitude, vehicle.coords.longitude)
            L.marker([vehicle.coords.latitude, vehicle.coords.longitude]).addTo(vehiclesLayer);
        })
    })
}
