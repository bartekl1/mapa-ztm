import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pwaManifest from "./pwaManifest.js";

export default defineConfig({
    server: {
        proxy: {
            "/ws": "ws://localhost:8000/",
        },
    },
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            workbox: {
                navigateFallbackDenylist: [
                    // /^\/api\//,
                    /^\/assets\//,
                    /^\/favicon.ico$/,
                ],
            },
            includeAssets: ["/favicon.ico"],
            manifest: pwaManifest,
        }),
    ],
});
