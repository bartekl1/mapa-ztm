from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func
import io
import os
import tempfile
from geojson import LineString, Feature, FeatureCollection

from .gtfs_schedule import Feed
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

def download_gtfs_to_cache(cache_path: str) -> None:
    feed = Feed()
    response = requests.get(GTFS_FEED_URL)
    feed.load_gtfs_data(io.BytesIO(response.content))
    
    directory = os.path.dirname(cache_path) or "."
    tmp_fd, tmp_path = tempfile.mkstemp(
        prefix="gtfs_cache_",
        suffix=".tmp",
        dir=directory
    )
    os.close(tmp_fd)

    try:
        feed.save_cache(tmp_path)
        os.replace(tmp_path, cache_path)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise

def get_feed_from_cache(cache_path: str) -> Feed:
    feed = Feed()
    feed.load_cache(cache_path)
    return feed

@cachetools.func.ttl_cache(ttl=60)
def get_shape(trip_id: str, cache_path: str, geojson: bool = False):
    feed = get_feed_from_cache(cache_path)
    shape = feed.get_shape(trip_id, reversed=geojson)
    if geojson:
        return FeatureCollection([Feature(geometry=LineString(shape))])
    return shape
