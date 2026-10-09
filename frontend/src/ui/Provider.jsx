import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ThemeProvider } from "next-themes";

export function AppProvider({ children, theme }) {
    return (
        <ChakraProvider value={defaultSystem}>
            <ThemeProvider attribute="class" forcedTheme={theme} disableTransitionOnChange >
                {children}
            </ThemeProvider>
        </ChakraProvider>
    );
}
