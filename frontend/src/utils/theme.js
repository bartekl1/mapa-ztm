import { getSetting, addChangeListener } from "./userSettings";

export function getTheme() {
    const lsTheme = getSetting("theme");
    if (lsTheme !== "auto") return lsTheme;
    const darkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return darkMode ? "dark" : "light";
}

export function getMapDarkTheme() {
    return getTheme() === "dark" && getSetting("mapDarkTheme");
}

export function watchThemeChange(handler, start = false) {
    const internalHandler = () => {
        handler({ theme: getTheme(), mapDarkTheme: getMapDarkTheme() });
    };
    addChangeListener("theme", internalHandler);
    addChangeListener("mapDarkTheme", internalHandler);
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", internalHandler);
    if (start) internalHandler();
}
