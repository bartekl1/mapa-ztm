from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func
import io
import os
import tempfile
from bs4 import BeautifulSoup
import datetime
import math
import time
import json

from .gtfs_schedule import Feed
from .consts import GTFS_RT_FEED_URL, GTFS_FEED_URL, GTFS_FILES_LIST_URL
from .utils import get_request_headers

def get_cache_path(config: dict) -> str:
    path = config.get("gtfs_cache_path", "cache/gtfs_cache.db")
    directory = os.path.split(path)[0]
    if directory != "" and not os.path.isdir(directory):
        os.makedirs(directory)
    return path

def get_route_type(type_enum: int) -> str:
    types = {0: "tram", 3: "bus"}
    return types[type_enum] if type_enum in types else "unknown"

def get_stop_type(drop_off_type: int, pickup_type: int) -> str:
    if drop_off_type == 0 and pickup_type == 0:
        return "normal"
    elif drop_off_type == 3 and pickup_type == 3:
        return "request"
    elif drop_off_type == 1 and pickup_type == 0:
        return "starting"
    elif drop_off_type == 0 and pickup_type == 1:
        return "final"
    else:
        return "unknown"

def get_stop_time(time: str) -> str:
    hour = int(time.split(":")[0])
    hour %= 24
    minutes = int(time.split(":")[1])
    return f"{hour:02}:{minutes:02}"

@cachetools.func.ttl_cache(ttl=1)
def get_current_positions(cache_path: str) -> list[dict[str, str | int | float]]:
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
            "coordinates": (lat, lon),
            "current_stop_sequence": entity.vehicle.current_stop_sequence,
        }
        info = get_route_info_by_trip(entity.vehicle.trip.trip_id, cache_path=cache_path)
        if info is not None:
            row["route"] = {
                "id": info["route_id"],
                "type": get_route_type(info["route_type"]),
            }
        else:
            row["route"] = {"id": None, "type": None}
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
            row["direction"] = round(brng, 2)
        else:
            row["direction"] = None
        res.append(row)
    return res

def positions_sse_stream(cache_path):
    while True:
        yield f"data: {json.dumps(get_current_positions(cache_path=cache_path))}\n\n"
        time.sleep(5)

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
def get_shape(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path)
    shape = feed.get_shape(trip_id)
    feed.close()
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

    res = []
    for stop in stops:
        res.append({
            "id": stop["stop_id"],
            "code": stop["stop_code"],
            "name": stop["stop_name"],
            "coordinates": (stop["stop_lat"], stop["stop_lon"]),
            "zone": stop["zone_id"],
        })

    return res 

@cachetools.func.ttl_cache(ttl=60)
def get_trip_details(trip_id: str, cache_path: str):
    feed = get_feed_from_cache(cache_path, as_classes=True)
    trip = feed.get_full_trip_info(trip_id)
    if trip is None:
        return None
    trip = dict(trip)
    route = feed.get_full_route_info(trip["route_id"])
    route = dict(route) if route is not None else None
    agency = feed.get_full_agency_info(route["agency_id"]) if route is not None else None
    agency = dict(agency) if agency is not None else None
    shape = feed.get_shape(trip_id)
    stops = feed.get_stops_on_trip(trip_id)
    feed.close()

    details = {
        "route": {
            "id": trip["route_id"],
        },
        "trip": {
            "id": trip["trip_id"],
            "headsign": trip["trip_headsign"],
        },
        "shape": {
            "id": "4562"
        },
        "agency": {},
        "stops": [],
    }
    if route is not None:
        details["agency"]["id"] = route["agency_id"]
        details["route"]["short_name"] = route["route_short_name"]
        details["route"]["long_name"] = route["route_long_name"]
        details["route"]["description"] = route["route_desc"]
        details["route"]["type"] = get_route_type(route["route_type"])
    if agency is not None:
        details["agency"]["name"] = agency["agency_name"]
        details["agency"]["url"] = agency["agency_url"]
        details["agency"]["phone"] = agency["agency_phone"]
    if shape is not None:
        details["shape"]["shape"] = [(point[0], point[1]) for point in shape]
    if stops is not None:
        for stop in stops:
            details["stops"].append({
                "id": stop["stop_id"],
                "code": stop["stop_code"],
                "name": stop["stop_name"],
                "coordinates": (stop["stop_lat"], stop["stop_lon"]),
                "sequence": stop["stop_sequence"],
                "zone": stop["zone_id"],
                "type": get_stop_type(stop["drop_off_type"], stop["pickup_type"]),
                "time": get_stop_time(stop["departure_time"]),
            })

    return details
