from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func
import io
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

# @cachetools.func.ttl_cache(ttl=60 * 10)
def download_gtfs():
    feed = Feed()
    response = requests.get(GTFS_FEED_URL)
    feed.load(io.BytesIO(response.content))
    return feed

@cachetools.func.ttl_cache(ttl=60)
def get_shape(trip_id: str, geojson: bool = False):
    feed = download_gtfs()
    shape = feed.get_shape(trip_id, reversed=geojson)
    if geojson:
        return FeatureCollection([Feature(geometry=LineString(shape))])
    return shape
