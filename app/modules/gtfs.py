from bs4 import BeautifulSoup
import requests

from typing import Any, Literal
import datetime
import os

from .gtfs_realtime import get_vehicles
from .gtfs_schedule import Feed
from .utils import get_request_headers
from .consts import GTFS_SCHEDULE_FILES_LIST_URL, GTFS_SCHEDULE_FEED_URL, VEHICLE_DICTIONARY_BOOL_KEYS, HF_LF_LE_VALUES, \
                    TRAM_ID_RANGE, BUS_ID_RANGE, CACHE_DIRECTORY

def fetch_gtfs_schedule_files_list() -> list[str]:
    try:
        response = requests.get(GTFS_SCHEDULE_FILES_LIST_URL, headers=get_request_headers())
        parser = BeautifulSoup(response.content, "html.parser")
        rows = parser.find_all("table")[1].find("tbody").find_all("tr")
        filenames = [row.find_all("td")[0].get_text(strip=True) for row in rows]
        return filenames
    except Exception:
        return []

def get_current_gtfs_schedule_filename(file_list: list[str]) -> str:
    today = datetime.date.today()
    for filename in file_list:
        try:
            start_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[0], "%Y%m%d").date()
            end_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[1], "%Y%m%d").date()
            if start_date <= today <= end_date:
                return filename
        except Exception:
            continue
    return file_list[0]

def get_gtfs_schedule_file_url(filename: str | None) -> str:
    if filename is None:
        return GTFS_SCHEDULE_FEED_URL
    return GTFS_SCHEDULE_FEED_URL + "?file=" + filename

def download_gtfs_cache(force: bool = False) -> str | None:
    if not os.path.isdir(CACHE_DIRECTORY):
        os.makedirs(CACHE_DIRECTORY)

    files = fetch_gtfs_schedule_files_list()
    filename = get_current_gtfs_schedule_filename(files).replace(".zip", ".db")

    path = os.path.join(CACHE_DIRECTORY, filename)

    if os.path.isfile(path) and not force:
        return path
    elif force:
        os.remove(path)

    feed = Feed.download(path, get_gtfs_schedule_file_url(filename))
    feed.close()

    return path

def get_cache_filename() -> str:
    files = os.listdir(CACHE_DIRECTORY)
    filename = get_current_gtfs_schedule_filename(files)
    return os.path.join(CACHE_DIRECTORY, filename)

def get_vehicle_type(vehicle_id: str | int) -> Literal["tram", "bus", "unknown"]:
    if TRAM_ID_RANGE[0] <= int(vehicle_id) <= TRAM_ID_RANGE[1]:
        return "tram"
    if BUS_ID_RANGE[0] <= int(vehicle_id) <= BUS_ID_RANGE[1]:
        return "bus"
    return "unknown"

def get_trip(trip_id: str) -> dict[str, Any] | None:
    feed = Feed(get_cache_filename())
    trip = feed.get_trip(trip_id)
    if trip is None:
        return None
    trip = dict(trip)
    if trip.get("route_id") is not None:
        route = feed.get_route(trip["route_id"]) # type: ignore
        trip["route"] = dict(route) if route is not None else None
        if trip.get("route", {}).get("agency_id") is not None:
            agency = feed.get_agency(trip["route"]["agency_id"]) # type: ignore
            trip["route"]["agency"] = dict(agency) if agency is not None else None # type: ignore
    if trip.get("shape_id") is not None:
        shape = feed.get_shape(trip["shape_id"])
        shape = [(a["shape_pt_lat"], a["shape_pt_lon"]) for a in shape]
        trip["shape"] = shape
    stops = feed.get_trip_stops(trip_id)
    stops = [dict(a) for a in stops]
    trip["stops"] = stops
    feed.close()
    return trip

def get_vehicle_details(vehicle_id: str) -> dict[str, Any] | None:
    feed = Feed(get_cache_filename())
    vehicle = feed.get_vehicle(vehicle_id)
    feed.close()
    if vehicle is None:
        vehicle = {}
    else:
        vehicle = dict(vehicle)
        for key in VEHICLE_DICTIONARY_BOOL_KEYS:
            vehicle[key] = bool(vehicle[key])
        vehicle["hf_lf_le"] = HF_LF_LE_VALUES[vehicle["hf_lf_le"]]
    vehicle["type"] = get_vehicle_type(vehicle_id)
    return vehicle
