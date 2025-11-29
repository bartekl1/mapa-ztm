from google.transit import gtfs_realtime_pb2
import gtfs_kit
import requests
import cachetools.func
import tempfile

from .consts import GTFS_RT_FEED_URL, GTFS_FEED_URL

@cachetools.func.ttl_cache(ttl=1)
def get_current_positions() -> list[dict[str, str | int | float]]:
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get(GTFS_RT_FEED_URL)
    feed.ParseFromString(response.content)
    return [{
        "route_id": entity.vehicle.trip.route_id,
        "trip_id": entity.vehicle.trip.trip_id,
        "vehicle_id": entity.vehicle.vehicle.id,
        "vehicle_label": entity.vehicle.vehicle.label,
        "latitude": entity.vehicle.position.latitude,
        "longitude": entity.vehicle.position.longitude
    } for entity in feed.entity]

@cachetools.func.ttl_cache(ttl=60 * 10)
def download_gtfs():
    with tempfile.NamedTemporaryFile(delete=False, delete_on_close=True) as file:
        response = requests.get(GTFS_FEED_URL)
        file.write(response.content)
        file.seek(0)
        feed = gtfs_kit.read_feed(file.name, dist_units="m")
        file.close()
    return feed

@cachetools.func.ttl_cache(ttl=60)
def get_shape(trip_id: str):
    feed = download_gtfs()
    return feed.trips_to_geojson([trip_id])
