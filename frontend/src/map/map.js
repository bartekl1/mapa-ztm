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
import { renderVehicleIcon, renderTripStopIcon } from "./icons";
import { settingsControl } from "./controls";
import { getSetting, addChangeListener, setSetting } from "../utils/userSettings";
import { getRouteType } from "../utils/gtfs";

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

        settingsControl({ setOpen: (open) => { storage.setValue("settingsOpen", open); } }).addTo(this.map);

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

        this.selectedVehicleLayer = L.layerGroup();
        this.map.addLayer(this.selectedVehicleLayer);

        storage.addChangeListener("vehicles", (e) => {
            const selectedVehicle = storage.getValue("selectedVehicle")?.vehicle;

            this.vehiclesLayer.clearLayers()
            this.selectedVehicleLayer.clearLayers()

            Object.entries(e.newValue).forEach(([id, vehicle]) => {
                const iconHtml = renderVehicleIcon(vehicle.vehicle.type, vehicle.vehicle.label.split("/")[0], vehicle.coords.bearing);
                const icon = L.divIcon({ html: iconHtml, className: id === selectedVehicle ? "selected" : "" });
                const marker = L.marker([vehicle.coords.latitude, vehicle.coords.longitude],
                                        {
                                            icon: icon,
                                            vehicleId: vehicle.vehicle.id,
                                            tripId: vehicle.trip.id,
                                            currentStopSequence: vehicle.current_stop_sequence
                                        });
                (id === selectedVehicle) ? marker.addTo(this.selectedVehicleLayer) : marker.addTo(this.vehiclesLayer);
                marker.on("click", (e) => {
                    storage.setValue("selectedVehicle", {vehicle: e.target.options.vehicleId, trip: e.target.options.tripId});
                    let marker = e.target;
                    marker.removeFrom(this.vehiclesLayer);
                    marker.addTo(this.selectedVehicleLayer);
                    let icon = marker.getIcon();
                    icon.options.className = "selected";
                    marker.setIcon(icon);
                    storage.setValue("currentStopSequence", marker.options.currentStopSequence);
                });
                if (id === selectedVehicle) storage.setValue("currentStopSequence", vehicle.current_stop_sequence);
            });
        });

        storage.addChangeListener("selectedVehicle", (e) => {
            const marker = this.selectedVehicleLayer.getLayers()[0];
            if (marker !== undefined) {
                marker.removeFrom(this.selectedVehicleLayer);
                marker.addTo(this.vehiclesLayer);
                let icon = marker.getIcon();
                icon.options.className = "";
                marker.setIcon(icon);
            }
        });

        this.tripLayer = L.layerGroup();
        this.map.addLayer(this.tripLayer);

        storage.addChangeListener("selectedVehicleData-trip", (e) => {
            this.tripLayer.clearLayers();
            if (e.newValue !== null && e.newValue !== undefined) {
                const polyline = L.polyline(e.newValue.shape, {
                    weight: 5,
                    className: "trip-route " + getRouteType(e.newValue.route.route_type),
                });
                polyline.addTo(this.tripLayer);

                (e.newValue?.stops ?? []).forEach(stop => {
                    const currentStopSequence = storage.getValue("currentStopSequence");
                    const status = {"-1": "past", "0": "current", "1": "next"}[String(Math.sign(stop.stop_sequence-currentStopSequence))];
                    const iconHtml = renderTripStopIcon(stop.stop_sequence);
                    const icon = L.divIcon({ html: iconHtml, className: "trip-stop trip-stop-" + status });
                    const marker = L.marker([stop.stop_lat, stop.stop_lon], {
                        icon: icon,
                        stopSequence: stop.stop_sequence,
                    });
                    marker.addTo(this.tripLayer);
                });
            }
        });
        storage.addChangeListener("currentStopSequence", (e) => {
            if (e.newValue !== null && e.newValue !== undefined) {
                const currentStopSequence = e.newValue;
                this.tripLayer.getLayers().forEach(el => {
                    if (el.options.stopSequence !== undefined) {
                        const status = {"-1": "past", "0": "current", "1": "next"}[String(Math.sign(el.options.stopSequence-currentStopSequence))];
                        let icon = el.getIcon();
                        icon.options.className = "trip-stop trip-stop-" + status + (storage.getValue("highlightedStop") === el.options.stopSequence ? " trip-stop-highlighted" : "");
                        el.setIcon(icon);
                    }
                });
            }
        });
        storage.addChangeListener("highlightedStop", (e) => {
            this.tripLayer.getLayers().forEach(el => {
                if (el.options.stopSequence !== undefined) {
                    let icon = el.getIcon();
                    icon.options.className = icon.options.className.replace(" trip-stop-highlighted", "");
                    if (el.options.stopSequence === e.newValue) icon.options.className += " trip-stop-highlighted";
                    el.setIcon(icon);
                }
            });
        });

        document.querySelector("#map").setAttribute("zoom", this.map.getZoom());
        this.map.on("zoomend", () => { document.querySelector("#map").setAttribute("zoom", this.map.getZoom()); });

        storage.addChangeListener("setStartPosFromMap", () => {
            setSetting("startPos", [this.map.getCenter().lat, this.map.getCenter().lng, this.map.getZoom()]);
        });
    }
    setTileLayer() {
        if (this.osmTiles !== undefined) this.osmTiles.remove();
        if (this.gl !== undefined) this.gl.remove();
        
        const mapType = getSetting("mapType");
        if (mapType === "openstreetmap") {
            this.osmTiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                className: "map-tiles openstreetmap",
            });
            this.osmTiles.addTo(this.map);
        } else if (mapType === "openfreemap") {
            const style = getSetting("ofmStyle")
            this.gl = maplibreGL({
                style: "https://tiles.openfreemap.org/styles/" + style,
                className: "map-tiles openfreemap " + style,
            });
            this.gl.addTo(this.map);
        }
    }
}
