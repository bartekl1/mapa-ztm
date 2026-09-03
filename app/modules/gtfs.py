from bs4 import BeautifulSoup
import requests

from typing import Any
import datetime
import os

from .gtfs_realtime import get_vehicles
from .gtfs_schedule import Feed
from .utils import get_request_headers
from .consts import GTFS_SCHEDULE_FILES_LIST_URL, GTFS_SCHEDULE_FEED_URL

def get_gtfs_schedule_files_list() -> list[str]:
    response = requests.get(GTFS_SCHEDULE_FILES_LIST_URL, headers=get_request_headers())
    parser = BeautifulSoup(response.content, "html.parser")
    rows = parser.find_all("table")[1].find("tbody").find_all("tr")
    filenames = [row.find_all("td")[0].get_text(strip=True) for row in rows]
    return filenames

def get_current_gtfs_schedule_filename() -> str | None:
    today = datetime.date.today()
    for filename in get_gtfs_schedule_files_list():
        try:
            start_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[0], "%Y%m%d").date()
            end_date = datetime.datetime.strptime(os.path.splitext(filename)[0].split("_")[1], "%Y%m%d").date()
            if start_date <= today <= end_date:
                return filename
        except Exception:
            continue

def get_current_gtfs_schedule_file_url() -> str:
    try:
        filename = get_current_gtfs_schedule_filename()
        if filename is None:
            raise
        return GTFS_SCHEDULE_FEED_URL + "?file=" + filename
    except Exception:
        return GTFS_SCHEDULE_FEED_URL

def get_cache_name() -> str:           #### For testing
    return "cache.db"

def get_trip(trip_id: str) -> dict[str, Any] | None:
    feed = Feed(get_cache_name())
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
