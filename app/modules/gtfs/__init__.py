from typing import Any

from .gtfs_realtime import get_vehicles
from .gtfs_files import download_gtfs_cache, get_cache_filename
from .gtfs_schedule import Feed
from .gtfs_utils import get_vehicle_type
from ..consts import VEHICLE_DICTIONARY_BOOL_KEYS, HF_LF_LE_VALUES

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
