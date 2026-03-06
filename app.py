from flask import Flask, send_file, Response
import os

from modules.config import load_config
from modules.gtfs_functions import get_cache_path, get_current_positions, get_stops, get_trip_details, positions_sse_stream
from download_cache import download_cache
from modules.utils import get_version

def create_app(config: dict | None = None) -> Flask:
    if config is None:
        config = load_config()

    cache_path = get_cache_path(config)
    if not os.path.exists(cache_path):
        download_cache(config)

    app = Flask(__name__, static_folder="frontend/dist", static_url_path="/")

    @app.route("/")
    def index():
        return send_file("frontend/dist/index.html")

    @app.route("/api/positions")
    def current_positions():
        return get_current_positions(cache_path=cache_path)

    @app.route("/api/positions/stream")
    def current_positions_sse():
        return Response(positions_sse_stream(cache_path=cache_path), mimetype="text/event-stream")

    @app.route("/api/trips/<trip_id>")
    def trip_details(trip_id):
        info = get_trip_details(trip_id, cache_path=cache_path)
        if info is not None:
            return info
        return {}, 404

    @app.route("/api/stops")
    def all_stops():
        return get_stops(cache_path=cache_path)

    @app.route("/api/version")
    def version():
        return get_version()

    return app

def run_app():
    config = load_config()
    app = create_app(config)
    app.run(**config.get("flask", {}))

if __name__ == "__main__":
    run_app()
