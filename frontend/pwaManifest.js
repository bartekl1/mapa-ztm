const iconSizes = [48, 72, 96, 128, 192, 384, 512, 1024];

export default {
    name: "Mapa pojazdów ZTM Poznań",
    short_name: "Mapa ZTM",
    description: "Mapa pojazdów ZTM Poznań",
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
};
