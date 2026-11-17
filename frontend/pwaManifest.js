const iconSizes = [48, 72, 96, 128, 192, 384, 512, 1024];

export default {
    name: "Mapa pojazdów ZTM Poznań",
    short_name: "Mapa ZTM",
    description: "Nieoficjalna mapa pojazdów ZTM Poznań",
    theme_color: "#004400",
    background_color: "#004400",
    icons: iconSizes.map((res) => { return {
            src: `/icons/icon_x${res}.png`,
            sizes: `${res}x${res}`,
            type: "image/png",
            purpose: "any",
        }; }).concat(iconSizes.map((res) => { return {
            src: `/maskable_icons/maskable_icon_x${res}.png`,
            sizes: `${res}x${res}`,
            type: "image/png",
            purpose: "maskable",
        }; })),
    screenshots: [
        {
            src: "/screenshots/main_desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            formFactor: "wide",
            label: "Główny widok aplikacji",
        },
        {
            src: "/screenshots/main_alt_desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            formFactor: "wide",
            label: "Główny widok aplikacji (alternatywny styl mapy)",
        },
        {
            src: "/screenshots/tracking_desktop.png",
            sizes: "1920x1080",
            type: "image/png",
            formFactor: "wide",
            label: "Śledzenie pojazdu na mapie",
        },
        {
            src: "/screenshots/main_mobile.png",
            sizes: "400x900",
            type: "image/png",
            formFactor: "narrow",
            label: "Główny widok aplikacji",
        },
        {
            src: "/screenshots/main_alt_mobile.png",
            sizes: "400x900",
            type: "image/png",
            formFactor: "narrow",
            label: "Główny widok aplikacji (alternatywny styl mapy)",
        },
        {
            src: "/screenshots/tracking_mobile.png",
            sizes: "400x900",
            type: "image/png",
            formFactor: "narrow",
            label: "Śledzenie pojazdu na mapie",
        },
    ],
};
