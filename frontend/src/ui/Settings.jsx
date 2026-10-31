import { Tabs, Listbox, Stack, createListCollection, Switch, Box } from "@chakra-ui/react";
import { useState, useEffect } from "react";

import { Icon } from "@mdi/react";
import { mdiDotsGrid, mdiInformation, mdiLaptop, mdiWeatherNight, mdiWhiteBalanceSunny } from "@mdi/js";

import Dialog from "./Dialog";
import { addChangeListener, getSetting, setSetting } from "../utils/userSettings";

export default function SettingsDialog({ open, setOpen }) {
    const [mapType, setMapType] = useState();
    const [ofmStyle, setOfmStyle] = useState();
    const [theme, setTheme] = useState();
    const [mapDarkTheme, setMapDarkTheme] = useState();

    useEffect(() => {
        addChangeListener("mapType", (e) => { if (e.newValue !== mapType) setMapType(e.newValue); }, true);
        addChangeListener("ofmStyle", (e) => { if (e.newValue !== ofmStyle) setOfmStyle(e.newValue); }, true);
        addChangeListener("theme", (e) => { if (e.newValue !== theme) setTheme(e.newValue); }, true);
        addChangeListener("mapDarkTheme", (e) => { if (e.newValue !== mapDarkTheme) setMapDarkTheme(e.newValue); }, true);
    }, []);

    useEffect(() => {
        if (mapType !== undefined && mapType !== null && getSetting("mapType") !== mapType) setSetting("mapType", mapType);
    }, [mapType]);
    useEffect(() => {
        if (ofmStyle !== undefined && ofmStyle !== null && getSetting("ofmStyle") !== ofmStyle) setSetting("ofmStyle", ofmStyle);
    }, [ofmStyle]);
    useEffect(() => {
        if (theme !== undefined && theme !== null && getSetting("theme") !== theme) setSetting("theme", theme);
    }, [theme]);
    useEffect(() => {
        if (mapDarkTheme !== undefined && mapDarkTheme !== null && getSetting("mapDarkTheme") !== mapDarkTheme) setSetting("mapDarkTheme", mapDarkTheme);
    }, [mapDarkTheme]);

    const mapTypes = createListCollection({
        items: [
            { label: "OpenFreeMap", value: "openfreemap" },
            { label: "OpenStreetMap", value: "openstreetmap" },
        ],
    });
    const ofmStyles = createListCollection({
        items: [
            { label: "Liberty", value: "liberty" },
            { label: "Bright", value: "bright" },
        ],
    });
    const themes = createListCollection({
        items: [
            { label: "Systemowy", value: "auto", icon: <Icon path={mdiLaptop} size="1em" /> },
            { label: "Jasny", value: "light", icon: <Icon path={mdiWhiteBalanceSunny} size="1em" /> },
            { label: "Ciemny", value: "dark", icon: <Icon path={mdiWeatherNight} size="1em" /> },
        ],
    });

    return <Dialog title="Ustawienia" open={open} setOpen={(open) => { setOpen(open) }}>
                <Tabs.Root defaultValue="general">
                    <Tabs.List>
                        <Tabs.Trigger value="general">
                            <Icon path={mdiDotsGrid} size="1em" />
                            Ogólne
                        </Tabs.Trigger>
                        <Tabs.Trigger value="about">
                            <Icon path={mdiInformation} size="1em" />
                            O aplikacji
                        </Tabs.Trigger>
                    </Tabs.List>
                    <Tabs.Content value="general">
                        <Stack maxWidth="500px" width="full" gap="4" marginBottom="10px">
                            <Listbox.Root collection={mapTypes} value={mapType} onValueChange={(details) => setMapType(details.value[0])} orientation="horizontal">
                                <Listbox.Label>Rodzaj mapy</Listbox.Label>
                                <Listbox.Content>
                                    {mapTypes.items.map((item) => (
                                        <Listbox.Item item={item} key={item.value}>
                                            <Listbox.ItemText>{item.label}</Listbox.ItemText>
                                            <Listbox.ItemIndicator />
                                        </Listbox.Item>
                                    ))}
                                </Listbox.Content>
                            </Listbox.Root>
                        </Stack>

                        <Stack maxWidth="500px" width="full" gap="4" marginBottom="10px">
                            <Listbox.Root collection={ofmStyles} value={ofmStyle} onValueChange={(details) => setOfmStyle(details.value[0])} orientation="horizontal">
                                <Listbox.Label>Styl OpenFreeMap</Listbox.Label>
                                <Listbox.Content>
                                    {ofmStyles.items.map((item) => (
                                        <Listbox.Item item={item} key={item.value}>
                                            <Listbox.ItemText>{item.label}</Listbox.ItemText>
                                            <Listbox.ItemIndicator />
                                        </Listbox.Item>
                                    ))}
                                </Listbox.Content>
                            </Listbox.Root>
                        </Stack>

                        <Stack maxWidth="500px" width="full" gap="4" marginBottom="10px">
                            <Listbox.Root collection={themes} value={theme} onValueChange={(details) => setTheme(details.value[0])} orientation="horizontal">
                                <Listbox.Label>Motyw</Listbox.Label>
                                <Listbox.Content>
                                    {themes.items.map((item) => (
                                        <Listbox.Item item={item} key={item.value}>
                                            <Box color="fg.muted" flexShrink="0">
                                                {item.icon}
                                            </Box>
                                            <Listbox.ItemText>{item.label}</Listbox.ItemText>
                                            <Listbox.ItemIndicator />
                                        </Listbox.Item>
                                    ))}
                                </Listbox.Content>
                            </Listbox.Root>
                        </Stack>

                        <Stack maxWidth="500px" width="full" gap="4" marginBottom="10px">
                            <Switch.Root checked={mapDarkTheme} onCheckedChange={(e) => setMapDarkTheme(e.checked)}>
                                <Switch.HiddenInput />
                                <Switch.Control>
                                    <Switch.Thumb />
                                </Switch.Control>
                                <Switch.Label>Ciemny motyw w mapie</Switch.Label>
                            </Switch.Root>
                        </Stack>
                    </Tabs.Content>
                    <Tabs.Content value="about">
                        about
                    </Tabs.Content>
                </Tabs.Root>
            </Dialog>
}
