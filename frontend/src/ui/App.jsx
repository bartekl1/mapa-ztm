import { Button, HStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

import { AppProvider } from "./Provider";
import { getTheme, watchThemeChange } from "../utils/theme";

function App() {
    const [theme, setTheme] = useState(getTheme());

    useEffect(() => {
        watchThemeChange((e) => setTheme(e.theme))
    }, []);

    return <>
        <div>
            <AppProvider theme={theme}>
                <HStack m="2">
                    <Button>Click me</Button>
                    <div>test</div>
                </HStack>
            </AppProvider>
        </div>
    </>;
}

export default App;
