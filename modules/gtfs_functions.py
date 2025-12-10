from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func
import io
import os
import tempfile
from geojson import LineString, Feature, FeatureCollection
from bs4 import BeautifulSoup
import datetime

from .gtfs_schedule import Feed
from .consts import GTFS_RT_FEED_URL, GTFS_FEED_URL, GTFS_FILES_LIST_URL

def get_route_type(type_enum: int):
    types = {0: "tram", 3: "bus"}
    return types[type_enum] if type_enum in types else "unknown"

@cachetools.func.ttl_cache(ttl=1)
def get_current_positions(cache_path: str, routes_info: bool = True) -> list[dict[str, str | int | float]]:
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get(GTFS_RT_FEED_URL)
    feed.ParseFromString(response.content)
    res = []
    for entity in feed.entity:
        row = {
            "trip": {
                "id": entity.vehicle.trip.trip_id,
            },
            "vehicle": {
                "id": entity.vehicle.vehicle.id,
                "label": entity.vehicle.vehicle.label,
            },
            "coords": {
                "latitude": entity.vehicle.position.latitude,
                "longitude": entity.vehicle.position.longitude,
            },
            "current_stop_sequence": entity.vehicle.current_stop_sequence,
        }
        if routes_info:
            info = get_route_info_by_trip(entity.vehicle.trip.trip_id, cache_path=cache_path)
            if info is not None:
                row["route"] = {
                    "id": info["route_id"],
                    "type": get_route_type(info["route_type"]),
                }
            else:
                row["route"] = {"id": None, "type": None}
        res.append(row)
    return res

def get_gtfs_files_list() -> list[str]:
    response = requests.get(GTFS_FILES_LIST_URL)
    parser = BeautifulSoup(response.content, "html.parser")
    rows = parser.find_all("table")[1].find("tbody").find_all("tr")
    filenames = [row.find_all("td")[0].get_text(strip=True) for row in rows]
    return filenames

def get_current_gtfs_filename() -> str:
    now = datetime.datetime.now()
    for filename in get_gtfs_files_list():
        try:
            start_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[0], "%Y%m%d")
            end_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[1], "%Y%m%d")
            if start_date <= now <= end_date:
                return filename
        except Exception:
            continue

def get_current_gtfs_file_url() -> str:
    try:
        filename = get_current_gtfs_filename()
        if filename is None:
            raise
        return GTFS_FEED_URL + "?file=" + filename
    except Exception:
        return GTFS_FEED_URL

def download_gtfs_to_cache(cache_path: str) -> None:
    feed = Feed()
    response = requests.get(get_current_gtfs_file_url())
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

def get_feed_from_cache(cache_path: str, as_classes: bool = False) -> Feed:
    feed = Feed()
    feed.load_cache(cache_path, as_classes=as_classes)
    return feed

@cachetools.func.ttl_cache(ttl=60)
def get_shape(trip_id: str, cache_path: str, geojson: bool = False):
    feed = get_feed_from_cache(cache_path)
    shape = feed.get_shape(trip_id, reversed=geojson)
    if geojson:
        return FeatureCollection([Feature(geometry=LineString(shape))])
    return shape

@cachetools.func.ttl_cache(ttl=60)
def get_route_info_by_trip(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    return feed.get_route_info_by_trip(trip_id)

@cachetools.func.ttl_cache(ttl=60)
def get_stops_on_trip(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    return feed.get_stops_on_trip(trip_id)
