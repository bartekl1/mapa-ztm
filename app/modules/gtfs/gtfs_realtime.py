from google.transit import gtfs_realtime_pb2
import requests

from typing import Any

from ..consts import GTFS_REALTIME_FEED_URL
from ..utils import get_request_headers
from .gtfs_utils import get_vehicle_type, get_vehicle_bearing

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
                "type": get_vehicle_type(entity.vehicle.vehicle.id),
            },
            "coords": {
                "latitude": lat,
                "longitude": lon,
                "bearing": get_vehicle_bearing(round(lat, 6), round(lon, 6), entity.vehicle.trip.trip_id),
            },
            "current_stop_sequence": entity.vehicle.current_stop_sequence,
        }
        vehicles[entity.vehicle.vehicle.id] = vehicle
    return vehicles
