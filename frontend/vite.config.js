import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

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
    ],
});
