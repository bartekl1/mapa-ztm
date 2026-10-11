import { Tabs, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import AppProvider from "./Provider";
import Drawer from "./Drawer";

function App({ storage }) {
    const [selectedVehicle, setSelectedVehicle] = useState();
    const [vehicle, setVehicle] = useState();
    const [trip, setTrip] = useState();

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
    }, []);

    useEffect(() => {
        if (selectedVehicle === null) storage.setValue("selectedVehicle", null);
    }, [selectedVehicle]);

    return <>
        <div>
            <AppProvider>
                {selectedVehicle !== null && selectedVehicle !== undefined &&
                    <Drawer open={true} setOpen={(open) => { if (!open) setSelectedVehicle(null); }} title={`${trip?.route_id ?? ""} - ${trip?.trip_headsign ?? ""}`}>
                        <Tabs.Root defaultValue="stops">
                            <Tabs.List>
                                <Tabs.Trigger value="stops">
                                    Przystanki
                                </Tabs.Trigger>
                                <Tabs.Trigger value="vehicle">
                                    Pojazd
                                </Tabs.Trigger>
                                <Tabs.Trigger value="details">
                                    Szczegóły (JSON)
                                </Tabs.Trigger>
                            </Tabs.List>
                            <Tabs.Content value="stops">
                                {trip?.route?.agency?.agency_name && <a href={trip.route.agency.agency_url} target="_blank">{trip.route.agency.agency_name}</a>}
                                {(trip?.stops ?? []).map((stop) => 
                                <div>
                                    {stop?.stop_sequence} <br />
                                    {stop?.stop_name} <br />
                                    {stop?.stop_code} <br />
                                    {stop?.zone_id} <br />
                                    {stop?.arrival_time} <br />
                                    {stop?.pickup_type} {stop?.drop_off_type}
                                    <br /> <br />
                                </div>
                                )}
                            </Tabs.Content>
                            <Tabs.Content value="vehicle">
                                Numer taborowy: {vehicle?.vehicle} <br />
                                Typ pojazdu: {{tram: "Tramwaj", bus: "Autobus", unknown: "Nieznany"}[vehicle?.type ?? "unknown"]} <br />
                                {vehicle?.hf_lf_le && {hf: "Pojazd wysokopodłogowy", lf: "Pojazd niskopodłogowy", le: "Pojazd częściowo niskopodłogowy"}[vehicle.hf_lf_le]} <br />
                                {vehicle?.ramp && "Rampa"} <br />
                                {vehicle?.air_conditioner && "Pojazd klimatyzowany"} <br />
                                {vehicle?.place_for_transp_bicycles && "Miejsce do przewozu rowerów"} <br />
                                {vehicle?.voice_announcement_sys && "Zapowiedzi głosowe"} <br />
                                {vehicle?.ticket_machine && "Biletomat"} <br />
                                {vehicle?.ticket_sales_by_the_driver && "Możliwość zakupu biletu u kierowcy"} <br />
                                {vehicle?.usb_charger && "Ładowarka USB"} <br />
                            </Tabs.Content>
                            <Tabs.Content value="details">
                                numer taborowy
                                identyfikator kursu
                                typ kursu
                                przewoźnik
                                
                                <HStack m="2">
                                    <div><strong>vehicle: </strong> {JSON.stringify(vehicle)}</div>
                                </HStack>
                                <HStack m="2">
                                    <div><strong>trip: </strong> {JSON.stringify(trip)}</div>
                                </HStack>
                            </Tabs.Content>
                        </Tabs.Root>
                    </Drawer>
                }
            </AppProvider>
        </div>
    </>;
}

export default App;
