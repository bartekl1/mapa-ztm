from flask import Flask

from modules.config import load_config
from modules.gtfs import get_current_positions, get_shape

app = Flask(__name__)

@app.route("/api/positions")
def current_positions():
    return get_current_positions()

@app.route("/api/shapes/<trip_id>")
def trip_shape(trip_id):
    return get_shape(trip_id)
    # return ""

if __name__ == "__main__":
    config = load_config()
    app.run(**config.get("flask", {}))
