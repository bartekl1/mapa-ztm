import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { VitePWA } from "vite-plugin-pwa";
import pwaManifest from "./pwaManifest";

export default defineConfig({
    server: {
        proxy: {
            "/api": "http://localhost:5000/",
        },
    },
    plugins: [
        viteStaticCopy({
            targets: [
                {
                    src: "node_modules/@shoelace-style/shoelace/dist/assets/icons/*.svg",
                    dest: "assets/shoelace/assets/icons",
                },
            ],
        }),
        VitePWA({
            registerType: "autoUpdate",
            workbox: {
                navigateFallbackDenylist: [
                    /^\/api\//,
                    /^\/assets\//,
                    /^\/favicon.ico$/,
                ],
            },
            includeAssets: ["/favicon.ico"],
            manifest: pwaManifest,
        }),
    ],
});
