import SlButton from "@shoelace-style/shoelace/dist/react/button/index.js";
import SlDialog from "@shoelace-style/shoelace/dist/react/dialog/index.js";
import SlTab from "@shoelace-style/shoelace/dist/react/tab/index.js";
import SlTabGroup from "@shoelace-style/shoelace/dist/react/tab-group/index.js";
import SlTabPanel from "@shoelace-style/shoelace/dist/react/tab-panel/index.js";
import SlIcon from "@shoelace-style/shoelace/dist/react/icon/index.js";
import appInfo from "./appInfo";
import "./UIElements.scss";
import { useEffect, useState } from "react";

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
