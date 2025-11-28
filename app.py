from flask import Flask

from modules.config import load_config
from modules.gtfs import get_current_positions

app = Flask(__name__)

@app.route("/api/positions")
def current_positions():
    return get_current_positions()

if __name__ == "__main__":
    config = load_config()
    app.run(**config.get("flask", {}))
