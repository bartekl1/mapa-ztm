import { Tabs, Listbox, Stack, createListCollection, Switch, Box, NumberInput, Field, Group, Button } from "@chakra-ui/react";
import { useState, useEffect } from "react";

import { Icon } from "@mdi/react";
import { mdiDelete, mdiDotsGrid, mdiInformation, mdiLaptop, mdiMap, mdiWeatherNight, mdiWhiteBalanceSunny } from "@mdi/js";

import Dialog from "./Dialog";
import { addChangeListener, getSetting, removeSetting, setSetting } from "../utils/userSettings";

export default function SettingsDialog({ open, setOpen, storage }) {
    const [mapType, setMapType] = useState();
    const [ofmStyle, setOfmStyle] = useState();
    const [theme, setTheme] = useState();
    const [mapDarkTheme, setMapDarkTheme] = useState();
    const [mapStartPosLat, setMapStartPosLat] = useState();
    const [mapStartPosLon, setMapStartPosLon] = useState();
    const [mapStartPosZoom, setMapStartPosZoom] = useState();

    useEffect(() => {
        addChangeListener("mapType", (e) => { if (e.newValue !== mapType) setMapType(e.newValue); }, true);
        addChangeListener("ofmStyle", (e) => { if (e.newValue !== ofmStyle) setOfmStyle(e.newValue); }, true);
        addChangeListener("theme", (e) => { if (e.newValue !== theme) setTheme(e.newValue); }, true);
        addChangeListener("mapDarkTheme", (e) => { if (e.newValue !== mapDarkTheme) setMapDarkTheme(e.newValue); }, true);
        addChangeListener("startPos", (e) => {
            if (e.newValue[0] !== mapStartPosLat) setMapStartPosLat(e.newValue[0]);
            if (e.newValue[1] !== mapStartPosLon) setMapStartPosLon(e.newValue[1]);
            if (e.newValue[2] !== mapStartPosZoom) setMapStartPosZoom(e.newValue[2]);
        }, true);
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
    useEffect(() => {
        const oldValue = getSetting("startPos");
        const newValue = Array.from(oldValue);
        if (mapStartPosLat !== undefined && mapStartPosLat !== null && mapStartPosLat !== "" && newValue[0] !== mapStartPosLat) newValue[0] = parseFloat(mapStartPosLat);
        if (mapStartPosLon !== undefined && mapStartPosLon !== null && mapStartPosLon !== "" && newValue[1] !== mapStartPosLon) newValue[1] = parseFloat(mapStartPosLon);
        if (mapStartPosZoom !== undefined && mapStartPosZoom !== null && mapStartPosZoom !== "" && newValue[2] !== mapStartPosZoom) newValue[2] = parseInt(mapStartPosZoom);
        if (oldValue[0] !== newValue[0] || oldValue[1] !== newValue[1] || oldValue[2] !== newValue[2]) setSetting("startPos", newValue);
    }, [mapStartPosLat, mapStartPosLon, mapStartPosZoom]);

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
                        <Stack maxWidth="800px" width="full">
                            <Stack width="full" gap="4" marginBottom="10px">
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

                            <Stack width="full" gap="4" marginBottom="10px">
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

                            <Stack gap="4" marginBottom="10px">
                                <Field.Root>
                                    <Field.Label>Pozycja startowa mapy</Field.Label>
                                    <Group attached width="full">
                                        <Field.Root>
                                            <Field.Label>Szer. geo.</Field.Label>
                                            <NumberInput.Root width="full" value={mapStartPosLat} onValueChange={(e) => setMapStartPosLat(e.value)} min={52.101} max={52.644} step={0.0001}>
                                                <NumberInput.Input roundedRight="0" />
                                            </NumberInput.Root>
                                        </Field.Root>
                                        <Field.Root>
                                            <Field.Label>Dł. geo.</Field.Label>
                                            <NumberInput.Root width="full" value={mapStartPosLon} onValueChange={(e) => setMapStartPosLon(e.value)} min={16.516} max={17.216} step={0.0001}>
                                                <NumberInput.Input roundedLeft="0" roundedRight="0" />
                                            </NumberInput.Root>
                                        </Field.Root>
                                        <Field.Root>
                                            <Field.Label>Pow.</Field.Label>
                                            <NumberInput.Root width="full" value={mapStartPosZoom} onValueChange={(e) => setMapStartPosZoom(e.value)} min={4} max={19} step={1}>
                                                <NumberInput.Input roundedLeft="0" />
                                            </NumberInput.Root>
                                        </Field.Root>
                                    </Group>
                                </Field.Root>
                                <Group marginTop="-10px">
                                    <Button maxWidth="fit-content" size="xs" variant="outline" colorPalette="cyan" onClick={() => { storage.setValue("setStartPosFromMap"); }}>
                                        <Icon path={mdiMap} size="1.3em" />
                                        Użyj aktualnej pozycji z mapy
                                    </Button>
                                    <Button maxWidth="fit-content" size="xs" variant="outline" colorPalette="red" onClick={() => { removeSetting("startPos"); }}>
                                        <Icon path={mdiDelete} size="1.3em" />
                                        Resetuj wartość
                                    </Button>
                                </Group>
                            </Stack>

                            <Stack width="full" gap="4" marginBottom="10px">
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

                            <Stack width="full" gap="4" marginBottom="10px">
                                <Switch.Root checked={mapDarkTheme} onCheckedChange={(e) => setMapDarkTheme(e.checked)}>
                                    <Switch.HiddenInput />
                                    <Switch.Control>
                                        <Switch.Thumb />
                                    </Switch.Control>
                                    <Switch.Label>Ciemny motyw w mapie</Switch.Label>
                                </Switch.Root>
                            </Stack>
                        </Stack>
                    </Tabs.Content>
                    <Tabs.Content value="about">
                        about
                    </Tabs.Content>
                </Tabs.Root>
            </Dialog>
}
