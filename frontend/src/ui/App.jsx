import { Tabs } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { Icon } from "@mdi/react";
import { mdiBus, mdiBusStopCovered, mdiMap } from "@mdi/js";

import AppProvider from "./Provider";
import Drawer from "./Drawer";
import SettingsDialog from "./Settings";
import {
    FrameVehicleID,
    FrameVehicleTram,
    FrameVehicleBus,
    FrameVehicleUnknown,
    FrameVehicleHighFloor,
    FrameVehicleLowFloor,
    FrameVehicleLowEntry,
    FrameVehicleRamp,
    FrameVehicleAirConditioner,
    FrameVehiclePlaceForBicycles,
    FrameVehicleVoiceAnnouncements,
    FrameVehicleTicketMachine,
    FrameVehicleTicketSalesDriver,
    FrameVehicleCharger,
    FrameTripID,
    FrameTripOperator,
    FrameTripOtherTickets,
    FrameStop
} from "./VehicleTripFeatures";
import { getRouteType } from "../utils/gtfs";

function App({ storage }) {
    const [selectedVehicle, setSelectedVehicle] = useState();
    const [vehicle, setVehicle] = useState();
    const [trip, setTrip] = useState();
    const [currentStopSequence, setCurrentStopSequence] = useState();
    const [highlightedStop, setHighlightedStop] = useState(null);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

    useEffect(() => {
        storage.addChangeListener("selectedVehicle", (e) => {
            setSelectedVehicle(e.newValue);
        });
        storage.addChangeListener("selectedVehicleData-vehicle", (e) => {
            setVehicle(e.newValue);
        });
        storage.addChangeListener("selectedVehicleData-trip", (e) => {
            setTrip(e.newValue);
        });
        storage.addChangeListener("currentStopSequence", (e) => {
            setCurrentStopSequence(e.newValue);
        });
        storage.addChangeListener("settingsOpen", (e) => {
            setSettingsDialogOpen(e.newValue);
        });
    }, []);

    useEffect(() => {
        if (selectedVehicle === null) storage.setValue("selectedVehicle", null);
    }, [selectedVehicle]);

    useEffect(() => {
        storage.setValue("highlightedStop", highlightedStop);
    }, [highlightedStop]);

    return <>
        <div>
            <AppProvider>
                {selectedVehicle !== null && selectedVehicle !== undefined &&
                    <Drawer open={true} setOpen={(open) => { if (!open) setSelectedVehicle(null); }} title={`${trip?.route_id ?? ""} - ${trip?.trip_headsign ?? ""}`}>
                        <Tabs.Root defaultValue="stops">
                            <Tabs.List>
                                <Tabs.Trigger value="stops">
                                    <Icon path={mdiBusStopCovered} size="1em" />
                                    Przystanki
                                </Tabs.Trigger>
                                <Tabs.Trigger value="vehicle">
                                    <Icon path={mdiBus} size="1em" />
                                    Pojazd
                                </Tabs.Trigger>
                                <Tabs.Trigger value="trip">
                                    <Icon path={mdiMap} size="1em" />
                                    Kurs
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Content value="stops">
                                {(trip?.stops ?? []).map((stop) => 
                                    <FrameStop
                                        sequence={stop?.stop_sequence}
                                        name={stop?.stop_name}
                                        code={stop?.stop_code}
                                        zone={stop?.zone_id}
                                        time={stop?.arrival_time}
                                        pickupType={stop?.pickup_type}
                                        dropOffType={stop?.drop_off_type}
                                        currentSequence={currentStopSequence}
                                        setHighlightedStop={setHighlightedStop}
                                    />
                                )}
                            </Tabs.Content>
                            <Tabs.Content value="vehicle">
                                <FrameVehicleID>{vehicle?.vehicle}</FrameVehicleID>
                                {{tram: <FrameVehicleTram />, bus: <FrameVehicleBus />, unknown: <FrameVehicleUnknown />}[vehicle?.type ?? "unknown"]}
                                {vehicle?.hf_lf_le && {hf: <FrameVehicleHighFloor />, lf: <FrameVehicleLowFloor />, le: <FrameVehicleLowEntry />}[vehicle.hf_lf_le]}
                                {vehicle?.ramp && <FrameVehicleRamp />}
                                {vehicle?.air_conditioner && <FrameVehicleAirConditioner />}
                                {vehicle?.place_for_transp_bicycles && <FrameVehiclePlaceForBicycles />}
                                {vehicle?.voice_announcement_sys && <FrameVehicleVoiceAnnouncements />}
                                {vehicle?.ticket_machine && <FrameVehicleTicketMachine />}
                                {vehicle?.ticket_sales_by_the_driver && <FrameVehicleTicketSalesDriver />}
                                {vehicle?.usb_charger && <FrameVehicleCharger />}
                            </Tabs.Content>
                            <Tabs.Content value="trip">
                                <FrameTripID>{trip?.trip_id}</FrameTripID>
                                {{tram: <FrameVehicleTram />, bus: <FrameVehicleBus />, unknown: <FrameVehicleUnknown />}[getRouteType(trip?.route?.route_type)]}
                                {trip?.route?.agency?.agency_name && <FrameTripOperator url={trip.route.agency.agency_url}>{trip.route.agency.agency_name}</FrameTripOperator>}
                                {(trip?.route?.route_desc ?? "").includes("NA LINII NIE OBOWIĄZUJE TARYFA ZTM") && <FrameTripOtherTickets />}
                            </Tabs.Content>
                        </Tabs.Root>
                    </Drawer>
                }
                <SettingsDialog open={settingsDialogOpen} setOpen={setSettingsDialogOpen} storage={storage} />
            </AppProvider>
        </div>
    </>;
}

export default App;
