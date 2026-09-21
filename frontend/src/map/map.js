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
import { getSetting, addChangeListener } from "../utils/userSettings";
import { renderVehicleIcon } from "./icons";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
});

export default class Map {
    constructor(elementId, storage) {
        this.map = L.map(elementId, {
            minZoom: 4,
            maxZoom: 19,
        });

        const startPos = getSetting("startPos");
        this.map.setView([startPos[0], startPos[1]], startPos[2]);

        this.setTileLayer();
        addChangeListener("mapType", () => { this.setTileLayer() });
        addChangeListener("ofmStyle", () => { this.setTileLayer() });
        this.map.attributionControl.addAttribution('<a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/">API ZTM Poznań</a>');
        
        this.vehiclesLayer = L.markerClusterGroup({
            maxClusterRadius: (zoom) => {
                if (zoom === 19) return 0;
                if (zoom === 18) return 10;
                if (zoom === 17) return 20;
                if (zoom === 16) return 40;
                return 80;
            },
        });
        this.map.addLayer(this.vehiclesLayer);

        storage.addChangeListener("vehicles", (e) => {
            this.vehiclesLayer.clearLayers()
            Object.entries(e.newValue).forEach(([id, vehicle]) => {
                // console.log(id, vehicle)
                // console.log(vehicle.coords.latitude, vehicle.coords.longitude)
                const iconHtml = renderVehicleIcon(vehicle.vehicle.type, vehicle.vehicle.label.split("/")[0], vehicle.coords.bearing);
                const icon = L.divIcon({ html: iconHtml, className: "" });
                const marker = L.marker([vehicle.coords.latitude, vehicle.coords.longitude], { icon: icon });
                marker.addTo(this.vehiclesLayer);
            })
        })
    }
    setTileLayer() {
        if (this.osmTiles !== undefined) this.osmTiles.remove();
        if (this.gl !== undefined) this.gl.remove();
        
        const mapType = getSetting("mapType");
        if (mapType === "openstreetmap") {
            this.osmTiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                className: "map-tiles",
            });
            this.osmTiles.addTo(this.map);
        } else if (mapType === "openfreemap") {
            this.gl = maplibreGL({
                style: "https://tiles.openfreemap.org/styles/" + getSetting("ofmStyle"),
            });
            this.gl.addTo(this.map);
        }
    }
}
