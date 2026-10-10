import { Button, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import AppProvider from "./Provider";

function App({ storage }) {
    const [vehicle, setVehicle] = useState();
    const [trip, setTrip] = useState();

    useEffect(() => {
        storage.addChangeListener("trackedVehicleData-vehicle", (e) => {
            setVehicle(e.newValue);
        });
        storage.addChangeListener("trackedVehicleData-trip", (e) => {
            setTrip(e.newValue);
        });
    }, []);

    return <>
        <div>
            <AppProvider>
                <HStack m="2">
                    <Button>Click me</Button>
                    <div>test</div>
                </HStack>
                <HStack m="2">
                    <div><strong>vehicle: </strong> {JSON.stringify(vehicle)}</div>
                </HStack>
                <HStack m="2">
                    <div><strong>trip: </strong> {JSON.stringify(trip)}</div>
                </HStack>
            </AppProvider>
        </div>
    </>;
}

export default App;
