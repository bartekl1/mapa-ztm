import settingsConfig from "./settingsConfig";

export function getSetting(key) {
    const lsValue = JSON.parse(localStorage.getItem(key));
    if (lsValue === null || lsValue === undefined || !(settingsConfig[key]?.validOptions ?? []).includes(lsValue)) return settingsConfig[key]?.default;
    return lsValue;
}

export function setSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("settingChange", { detail: {key: key} }));
}

export function removeSetting(key) {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent("settingChange", { detail: {key: key} }));
}

export function addChangeListener(key, handler, start = false) {
    const internalHandler = (event) => {
        const changedKey = event.type === "settingChange" ? event.detail.key : event.key;
        if (changedKey === key) {
            const newValue = getSetting(key);
            handler({key: key, newValue: newValue});
        }
    }
    window.addEventListener("settingChange", internalHandler);
    window.addEventListener("storage", internalHandler);
    if (start) internalHandler({type: "manual", key: key});
}
