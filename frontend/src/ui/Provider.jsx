import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

import { getTheme, watchThemeChange } from "../utils/theme";

export default function AppProvider({ children }) {
    const [theme, setTheme] = useState(getTheme());

    useEffect(() => {
        watchThemeChange((e) => setTheme(e.theme))
    }, []);

    return (
        <ChakraProvider value={defaultSystem}>
            <ThemeProvider attribute="class" forcedTheme={theme} disableTransitionOnChange >
                {children}
            </ThemeProvider>
        </ChakraProvider>
    );
}
