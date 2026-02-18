from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func
import io
import os
import tempfile
from geojson import LineString, Feature, FeatureCollection
from bs4 import BeautifulSoup
import datetime
import math

from .gtfs_schedule import Feed
from .consts import GTFS_RT_FEED_URL, GTFS_FEED_URL, GTFS_FILES_LIST_URL
from .utils import get_request_headers

def get_cache_path(config: dict) -> str:
    path = config.get("gtfs_cache_path", "cache/gtfs_cache.db")
    directory = os.path.split(path)[0]
    if directory != "" and not os.path.isdir(directory):
        os.makedirs(directory)
    return path

def get_route_type(type_enum: int):
    types = {0: "tram", 3: "bus"}
    return types[type_enum] if type_enum in types else "unknown"

@cachetools.func.ttl_cache(ttl=1)
def get_current_positions(cache_path: str, routes_info: bool = False, bearings: bool = False) -> list[dict[str, str | int | float]]:
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get(GTFS_RT_FEED_URL, headers=get_request_headers())
    feed.ParseFromString(response.content)
    res = []
    for entity in feed.entity:
        lat, lon = entity.vehicle.position.latitude, entity.vehicle.position.longitude
        row = {
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
        if routes_info:
            info = get_route_info_by_trip(entity.vehicle.trip.trip_id, cache_path=cache_path)
            if info is not None:
                row["route"] = {
                    "id": info["route_id"],
                    "type": get_route_type(info["route_type"]),
                }
            else:
                row["route"] = {"id": None, "type": None}
        if bearings:
            shape = get_shape(entity.vehicle.trip.trip_id, cache_path=cache_path)
            if len(shape) > 1:
                points = [(((plat - lat) ** 2 + (plon - lon) ** 2) ** (1/2), i, (plat, plon)) for i, (plat, plon) in enumerate(shape)]
                points.sort()
                points2 = [(points[0][1], points[0][2]), (points[1][1], points[1][2])]
                points2.sort()
                lat1, lon1 = points2[0][1]
                lat2, lon2 = points2[1][1]
                lat1, lon1, lat2, lon2 = math.radians(lat1), math.radians(lon1), math.radians(lat2), math.radians(lon2)
                y = math.sin(lon2 - lon1) * math.cos(lat2)
                x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(lon2 - lon1)
                theta = math.atan2(y, x)
                brng = (theta*180/math.pi + 360) % 360
                row["bearing"] = brng
            else:
                row["bearing"] = None
        res.append(row)
    return res

def get_gtfs_files_list() -> list[str]:
    response = requests.get(GTFS_FILES_LIST_URL, headers=get_request_headers())
    parser = BeautifulSoup(response.content, "html.parser")
    rows = parser.find_all("table")[1].find("tbody").find_all("tr")
    filenames = [row.find_all("td")[0].get_text(strip=True) for row in rows]
    return filenames

def get_current_gtfs_filename() -> str:
    today = datetime.date.today()
    for filename in get_gtfs_files_list():
        try:
            start_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[0], "%Y%m%d").date()
            end_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[1], "%Y%m%d").date()
            if start_date <= today <= end_date:
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
    response = requests.get(get_current_gtfs_file_url(), headers=get_request_headers())
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
    feed.close()
    if geojson:
        return FeatureCollection([Feature(geometry=LineString(shape))])
    return shape

@cachetools.func.ttl_cache(ttl=60)
def get_route_info_by_trip(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    info = feed.get_route_info_by_trip(trip_id)
    feed.close()
    return info

@cachetools.func.ttl_cache(ttl=60)
def get_stops_on_trip(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    stops = feed.get_stops_on_trip(trip_id)
    feed.close()
    return stops

@cachetools.func.ttl_cache(ttl=60)
def get_stops(cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    stops = feed.get_stops()
    feed.close()
    return stops 

@cachetools.func.ttl_cache(ttl=60)
def get_trip_details(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    trip = feed.get_full_trip_info(trip_id)
    if trip is None:
        return None
    trip = dict(trip)
    route = feed.get_full_route_info(trip["route_id"])
    trip["route"] = dict(route) if route is not None else None
    agency = feed.get_full_agency_info(trip["route"]["agency_id"])
    trip["route"]["agency"] = dict(agency) if agency is not None else None
    feed.close()
    return trip
