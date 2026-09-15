import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    server: {
        proxy: {
            "/ws": "ws://localhost:8000/",
        },
    },
    plugins: [react()],
});
