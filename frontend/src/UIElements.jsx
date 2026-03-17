import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import SlDrawer from "@shoelace-style/shoelace/dist/react/drawer/index.js";
import SlAlert from "@shoelace-style/shoelace/dist/react/alert/index.js";
import SlTab from "@shoelace-style/shoelace/dist/react/tab/index.js";
import SlTabGroup from "@shoelace-style/shoelace/dist/react/tab-group/index.js";
import SlTabPanel from "@shoelace-style/shoelace/dist/react/tab-panel/index.js";
import SlSpinner from "@shoelace-style/shoelace/dist/react/spinner/index.js";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import appInfo from "./appInfo";
import "./UIElements.scss";
import { useEffect, useState } from "react";
import Icon from "@mdi/react";
import { mdiLoading } from "@mdi/js";

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

    return (
        <>
            <SlDialog open={isOpen} onSlAfterHide={() => setOpen(false)}>
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

                        <SlTabPanel name="general">This is the general tab panel.</SlTabPanel>
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

    return (
        <SlDrawer open={trackedVehicle !== null} onSlAfterHide={() => setTrackedVehicle(null)} contained>
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
