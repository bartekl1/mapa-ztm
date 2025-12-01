from flask import Flask, request

from modules.config import load_config
from modules.gtfs_functions import get_current_positions, get_shape

app = Flask(__name__)

@app.route("/api/positions")
def current_positions():
    return get_current_positions()

@app.route("/api/shapes/<trip_id>")
def trip_shape(trip_id):
    geojson = request.args.get("geojson") is not None
    return get_shape(trip_id, geojson=geojson)

if __name__ == "__main__":
    config = load_config()
    app.run(**config.get("flask", {}))
