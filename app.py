from flask import Flask, request, send_file
import os

from modules.config import load_config
from modules.gtfs_functions import get_current_positions, get_shape, get_route_info_by_trip, get_stops_on_trip, get_stops
from save_cache import save_cache

def create_app(config: dict) -> Flask:
    cache_path = config.get("gtfs_cache_path", "gtfs_cache.db")
    app = Flask(__name__, static_folder="frontend/dist", static_url_path="/")

    @app.route("/")
    def index():
        return send_file("frontend/dist/index.html")

    @app.route("/api/positions")
    def current_positions():
        routes_info = request.args.get("routes_info") is not None
        bearings = request.args.get("bearings") is not None
        return get_current_positions(cache_path=cache_path, routes_info=routes_info, bearings=bearings)

    @app.route("/api/trips/<trip_id>/shape")
    def trip_shape(trip_id):
        geojson = request.args.get("geojson") is not None
        return get_shape(trip_id, geojson=geojson, cache_path=cache_path)

    @app.route("/api/trips/<trip_id>/route")
    def route_info(trip_id):
        info = dict(get_route_info_by_trip(trip_id, cache_path=cache_path))
        return info

    @app.route("/api/trips/<trip_id>/stops")
    def stops_on_trip(trip_id):
        stops = get_stops_on_trip(trip_id, cache_path=cache_path)
        stops = [dict(stop) for stop in stops]
        return stops
    
    @app.route("/api/stops")
    def all_stops():
        stops = get_stops(cache_path=cache_path)
        stops = [dict(stop) for stop in stops]
        return stops
    
    return app

def run_app():
    config = load_config()
    if not os.path.exists(config.get("gtfs_cache_path", "gtfs_cache.db")):
        save_cache(config)
    app = create_app(config)
    app.run(**config.get("flask", {}))

if __name__ == "__main__":
    run_app()
