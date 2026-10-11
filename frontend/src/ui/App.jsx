import { Button, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import AppProvider from "./Provider";
import Drawer from "./Drawer";

function App({ storage }) {
    const [vehicle, setVehicle] = useState();
    const [trip, setTrip] = useState();

    useEffect(() => {
        storage.addChangeListener("selectedVehicleData-vehicle", (e) => {
            setVehicle(e.newValue);
        });
        storage.addChangeListener("selectedVehicleData-trip", (e) => {
            setTrip(e.newValue);
        });
    }, []);

    const [open, setOpen] = useState(true);

    return <>
        <div>
            <AppProvider>
                <HStack m="2">
                    <Button>Click me</Button>
                    <Button onClick={() => { storage.setValue("selectedVehicle", null); }}>deselect</Button>
                    <div>test</div>
                </HStack>
                <HStack m="2">
                    <div><strong>vehicle: </strong> {JSON.stringify(vehicle)}</div>
                </HStack>
                <HStack m="2">
                    <div><strong>trip: </strong> {JSON.stringify(trip)}</div>
                </HStack>
                <Drawer open={open} setOpen={setOpen} title="tytuł">
                    <p>test test test</p>
                    <strong>test</strong>
                    <em>test</em>
                </Drawer>
            </AppProvider>
        </div>
    </>;
}

export default App;
