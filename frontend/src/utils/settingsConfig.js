export default {
    mapType: {
        default: "openfreemap",
        validOptions: ["openfreemap", "openstreetmap"],
    },
    ofmStyle: {
        default: "liberty",
        validOptions: ["liberty", "bright"],
    },
    startPos: {
        default: [52.40, 16.96, 13],
    },
    theme: {
        default: "auto",
        validOptions: ["auto", "light", "dark"],
    },
    mapDarkTheme: {
        default: true,
    },
};
