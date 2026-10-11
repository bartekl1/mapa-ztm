import { Button, HStack } from "@chakra-ui/react";
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
                    <Drawer open={true} setOpen={(open) => { if (!open) setSelectedVehicle(null); }} title="tytuł">
                        <HStack m="2">
                            <div><strong>vehicle: </strong> {JSON.stringify(vehicle)}</div>
                        </HStack>
                        <HStack m="2">
                            <div><strong>trip: </strong> {JSON.stringify(trip)}</div>
                        </HStack>
                    </Drawer>
                }
            </AppProvider>
        </div>
    </>;
}

export default App;
