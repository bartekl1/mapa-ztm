from google.transit import gtfs_realtime_pb2
import requests

from typing import Any

from .consts import GTFS_REALTIME_FEED_URL
from .utils import get_request_headers

def get_vehicles() -> dict[str, dict[str, Any]]:
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get(GTFS_REALTIME_FEED_URL, headers=get_request_headers())
    feed.ParseFromString(response.content)
    vehicles = {}
    for entity in feed.entity:
        lat, lon = entity.vehicle.position.latitude, entity.vehicle.position.longitude
        vehicle = {
            "trip": {
                "id": entity.vehicle.trip.trip_id,
            },
            "vehicle": {
                "id": entity.vehicle.vehicle.id,
                "label": entity.vehicle.vehicle.label,
            },
            "coords": {
                "latitude": lat,
                "longitude": lon,
            },
            "current_stop_sequence": entity.vehicle.current_stop_sequence,
        }
        vehicles[entity.vehicle.vehicle.id] = vehicle
    return vehicles
