import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import SlDrawer from "@shoelace-style/shoelace/dist/react/drawer/index.js";
import SlAlert from "@shoelace-style/shoelace/dist/react/alert/index.js";
import SlTab from "@shoelace-style/shoelace/dist/react/tab/index.js";
import SlTabGroup from "@shoelace-style/shoelace/dist/react/tab-group/index.js";
import SlTabPanel from "@shoelace-style/shoelace/dist/react/tab-panel/index.js";
import SlSpinner from "@shoelace-style/shoelace/dist/react/spinner/index.js";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import SlIconButton from "@shoelace-style/shoelace/dist/react/icon-button/index.js";
import SlSelect from "@shoelace-style/shoelace/dist/react/select/index.js";
import SlOption from "@shoelace-style/shoelace/dist/react/option/index.js";
import SlInput from "@shoelace-style/shoelace/dist/react/input/index.js";
import SlSwitch from "@shoelace-style/shoelace/dist/react/switch/index.js";
import appInfo from "./appInfo";
import "./UIElements.scss";
import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiLoading } from "@mdi/js";
import { useLocalStorage } from "./utils";

export function SettingsDialog({ isOpen, setOpen }) {
    const [tabsPlacement, setTabsPlacement] = useState("start");

    useEffect(() => {
        function onResize() {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            setTabsPlacement(vw >= 800 ? "start" : "top");
        }

        window.addEventListener("resize", onResize);
        onResize();

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    const [theme, setTheme] = useLocalStorage("theme", "system");
    const [darkMap, setDarkMap] = useLocalStorage("dark-map", true);
    const [startLatitude, setStartLatitude] = useLocalStorage("start-latitude", null);
    const [startLongitude, setStartLongitude] = useLocalStorage("start-longitude", null);
    const [startZoom, setStartZoom] = useLocalStorage("start-zoom", null);
    const [startLocationTracking, setStartLocationTracking] = useLocalStorage("start-location-tracking", false);

    return (
        <>
            <SlDialog open={isOpen} onSlAfterHide={(e) => { if (e.target.nodeName === "SL-DIALOG") setOpen(false); }}>
                <span slot="label">Ustawienia</span>
                <div>
                    <SlTabGroup placement={tabsPlacement}>
                        <SlTab slot="nav" panel="general">
                            <SlIcon name="grid-3x3-gap-fill" className="mr-5"></SlIcon>
                            Ogólne
                        </SlTab>
                        <SlTab slot="nav" panel="about">
                            <SlIcon name="info-circle-fill" className="mr-5"></SlIcon>
                            O aplikacji
                        </SlTab>

                        <SlTabPanel name="general">
                            <div className="mb-20">
                                <div className="t-24">Motyw</div>
                                <SlSelect label="Motyw" className="mb-10" value={theme} onSlChange={e => setTheme(e.target.value)}>
                                    <SlOption value="system">Systemowy</SlOption>
                                    <SlOption value="light">Jasny</SlOption>
                                    <SlOption value="dark">Ciemny</SlOption>
                                </SlSelect>

                                <SlSwitch checked={darkMap} onSlChange={e => setDarkMap(e.target.checked)}>Zastosuj ciemny motyw w mapie</SlSwitch>
                            </div>
                            <div className="mb-20">
                                <div className="t-24">Lokalizacja startowa mapy</div>
                                <div className="mb-10 map-start-position-coords-settings">
                                    <SlInput label="Szerokość" placeholder="Szerokość" value={startLatitude} onSlChange={e => setStartLatitude(e.target.value)}></SlInput>
                                    <SlInput label="Długość" placeholder="Długość" value={startLongitude} onSlChange={e => setStartLongitude(e.target.value)}></SlInput>
                                    <SlInput label="Powiększenie" placeholder="Powiększenie" value={startZoom} onSlChange={e => setStartZoom(e.target.value)}></SlInput>
                                </div>
                                <div className="mb-10">
                                    <SlButton className="mr-5" variant="primary" outline>
                                        <SlIcon slot="prefix" name="map"></SlIcon>
                                        Pobierz z mapy
                                    </SlButton>
                                    <SlButton variant="danger" outline onClick={() => {
                                        setStartLatitude(null);
                                        setStartLongitude(null);
                                        setStartZoom(null);
                                    }}>
                                        <SlIcon slot="prefix" name="x-circle"></SlIcon>
                                        Resetuj
                                    </SlButton>
                                </div>
                                <div>
                                    <SlSwitch checked={startLocationTracking} onSlChange={e => setStartLocationTracking(e.target.checked)}>Używaj bieżącej lokalizacji użytkownika, gdy to możliwe</SlSwitch>
                                </div>
                            </div>
                        </SlTabPanel>
                        <SlTabPanel name="about">
                            <div className="t-30">{appInfo.name}</div>
                            <div className="mb-20">{appInfo.description}</div>

                            <div className="mb-5"><span className="fw-700">Autor:</span> <a href={`https://github.com/${appInfo.author}`} target="_blank" rel="noopener">{appInfo.author}</a></div>
                            <div className="mb-5"><span className="fw-700">Wersja:</span> {appInfo.version}</div>
                            <div className="mb-5"><span className="fw-700">Commit hash:</span> {appInfo.hash} {appInfo.modified && <>(zmodyfikowano)</>}</div>
                            <div className="mb-20"><span className="fw-700">Licencja:</span> <a href={`https://spdx.org/licenses/${appInfo.license}.html`} target="_blank" rel="noopener">{appInfo.license}</a></div>

                            <SlButton href={appInfo.repo} target="_blank" size="small">
                                <SlIcon slot="prefix" name="github"></SlIcon>
                                Repozytorium GitHub
                            </SlButton>
                            <span> </span>
                            <SlButton href={appInfo.issues} target="_blank" size="small">
                                <SlIcon slot="prefix" name="bug-fill"></SlIcon>
                                Problemy i sugestie
                            </SlButton>
                            <span> </span>
                            <SlButton href={appInfo.changelog} target="_blank" size="small">
                                <SlIcon slot="prefix" name="clock"></SlIcon>
                                Rejestr zmian
                            </SlButton>

                            <div className="t-20 mt-20">API i źródła danych</div>
                            <ul>
                                <li><a href="https://www.ztm.poznan.pl/otwarte-dane/dla-deweloperow/" target="_blank" rel="noopener">ZTM Poznań</a> - GTFS Realtime i GTFS Schedule</li>
                                <li><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a></li>
                            </ul>

                            <SlButton href={appInfo.repo + "/network/dependencies"} target="_blank" size="small">
                                <SlIcon slot="prefix" name="diagram-3-fill"></SlIcon>
                                Zależności projektu
                            </SlButton>
                        </SlTabPanel>
                    </SlTabGroup>
                </div>
            </SlDialog>
        </>
    );
}

export function TripDetailsDrawer({ vehicles, trackedVehicle, setTrackedVehicle, tripDetails, tripDetailsStatus }) {
    const vehicle = (trackedVehicle !== null && Object.keys(vehicles).includes(trackedVehicle)) ? vehicles[trackedVehicle] : null;

    function getStopStatus(stopSequence, currentStopSequence) {
        if (stopSequence === currentStopSequence) return "current";
        else if (stopSequence > currentStopSequence) return "next";
        else return "past";
    }

    const [placement, setPlacement] = useState("end");

    useEffect(() => {
        function onResize() {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            setPlacement(vw >= 800 ? "end" : "bottom");
        }

        window.addEventListener("resize", onResize);
        onResize();

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    const [size, setSize] = useState(undefined);

    return (
        <SlDrawer open={trackedVehicle !== null} onSlAfterHide={() => setTrackedVehicle(null)} contained placement={placement} style={size !== undefined ? {"--size": `${size}px`} : {}}>
            {(tripDetailsStatus === "ready" && tripDetails !== null && vehicle !== null) ? <span slot="label">{vehicle.route.id + " - " + tripDetails.trip.headsign}</span> : <span slot="label">{vehicle?.route?.id ?? "Szczegóły kursu"}</span>}
            {(tripDetailsStatus === "ready" && tripDetails !== null && vehicle !== null) && <span>
                <div className="fs-14"><span className="fw-bold">Numer taborowy:</span> {vehicle.vehicle.id}</div>
                <div className="fs-14"><span className="fw-bold">Linia/brygada:</span> {vehicle.vehicle.label}</div>
                <div className="fs-14"><span className="fw-bold">Identyfikator kursu:</span> {vehicle.trip.id}</div>
                <div className="fs-14"><span className="fw-bold">Typ pojazdu:</span> {vehicle.route.type}</div>
                <div className="fs-14"><span className="fw-bold">Przewoźnik:</span> <a href={tripDetails.agency.url} target="_blank" rel="noopener">{tripDetails.agency.name}</a></div>

                {tripDetails.route.description.toUpperCase().includes("NA LINII NIE OBOWIĄZUJE TARYFA ZTM") && <SlAlert className="mt-10" variant="warning" open>
                    <SlIcon slot="icon" name="ticket-perforated"></SlIcon>
                    <span>Na linii nie obowiązuje taryfa ZTM</span>
                </SlAlert>}

                <div className="mt-20">
                    {(tripDetails?.stops ?? []).map((stop) => (
                        <div className="stop-template" key={`td${tripDetails.trip?.id ?? vehicle?.trip?.id}s${stop.id}`}>
                            <div className="stop-sequence" stop-sequence-status={getStopStatus(stop.sequence, vehicle.current_stop_sequence)}>{stop.sequence}</div>
                            <div className="stop-details">
                                <div className="stop-name">{stop.name}</div>
                                <div className="stop-more-details">
                                    <div className="stop-code">{stop.code}</div>
                                    <SlIcon name="dot"></SlIcon>
                                    <div className="stop-zone">{stop.zone}</div>
                                    {stop.type !== "normal" && <div className="stop-type">
                                        <SlIcon name="dot"></SlIcon>
                                        {stop.type === "request" && <SlIcon className="request-stop" name="exclamation-square"></SlIcon>}
                                        {stop.type === "starting" && <SlIcon className="starting-stop" name="box-arrow-in-right"></SlIcon>}
                                        {stop.type === "stop" && <SlIcon className="final-stop" name="box-arrow-right"></SlIcon>}
                                    </div>}
                                </div>
                            </div>
                            <div className="stop-departure-time">{stop.time}</div>
                        </div>
                    ))}
                </div>
            </span>}
            {tripDetailsStatus === "loading" && <span className="drawer-loading">
                <SlSpinner></SlSpinner>
            </span>}
            {tripDetailsStatus === "error" && <span>
                <SlAlert variant="danger" open>
                    <SlIcon slot="icon" name="x-circle"></SlIcon>
                    <strong>Wystąpił błąd!</strong><br />
                    Nie można wczytać szczegółów tego kursu
                </SlAlert>
            </span>}
            <DrawerResizer setSize={setSize} />
        </SlDrawer>
    );
}

export function LoadingScreen() {
    return (
        <div className="loading-screen">
            <div>
                <Icon className="spinner" path={mdiLoading} />
            </div>
        </div>
    );
}

function DrawerResizer({ setSize }) {
    const [placement, setPlacement] = useState("vertical");

    useEffect(() => {
        function onResize() {
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            setPlacement(vw >= 800 ? "vertical" : "horizontal");
        }

        window.addEventListener("resize", onResize);
        onResize();

        return () => {
            window.removeEventListener("resize", onResize);
        };
    }, []);

    function downCallback() {
        document.addEventListener("pointermove", moveCallback);
        document.addEventListener("pointerup", upCallback);
    }

    function upCallback() {
        document.removeEventListener("pointermove", moveCallback);
        document.removeEventListener("pointerup", upCallback);
    }

    function moveCallback(evt) {
        let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        let newSize;
        if (placement === "vertical") newSize = vw - evt.clientX;
        else if (placement === "horizontal") newSize = vh - evt.clientY;
        if (newSize < 50) newSize = 50;
        setSize(newSize)
    }

    return (
        <SlIconButton
            className={`drawer-resizer drawer-resizer-${placement}`}
            name={placement === "vertical" ? "grip-vertical" : "grip-horizontal"}
            onPointerDown={downCallback}
        />
    );
}
