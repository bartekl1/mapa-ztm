from cachetools.func import lfu_cache

from typing import Literal

from .gtfs_files import get_cache_filename
from .gtfs_schedule import Feed
from ..consts import TRAM_ID_RANGE, BUS_ID_RANGE, TRIP_SHAPE_CACHE_MAX_SIZE, VEHICLE_BEARING_CACHE_MAX_SIZE
from ..utils import distance, bearing

def get_vehicle_type(vehicle_id: str | int) -> Literal["tram", "bus", "unknown"]:
    if TRAM_ID_RANGE[0] <= int(vehicle_id) <= TRAM_ID_RANGE[1]:
        return "tram"
    if BUS_ID_RANGE[0] <= int(vehicle_id) <= BUS_ID_RANGE[1]:
        return "bus"
    return "unknown"

@lfu_cache(maxsize=TRIP_SHAPE_CACHE_MAX_SIZE)
def _get_trip_shape(trip_id: str) -> list:
    feed = Feed(get_cache_filename())
    shape = feed.get_shape_points_for_trip(trip_id)
    feed.close()
    return shape

@lfu_cache(maxsize=VEHICLE_BEARING_CACHE_MAX_SIZE)
def get_vehicle_bearing(lat: int | float, lon: int | float, trip_id: str) -> float | None:
    shape = _get_trip_shape(trip_id)
    brng = None
    if len(shape) > 1:
        points = [(distance(lat, lon, row["shape_pt_lat"], row["shape_pt_lon"]), i, (row["shape_pt_lat"], row["shape_pt_lon"])) for i, (row) in enumerate(shape)]
        points.sort()
        points2 = [(points[0][1], points[0][2]), (points[1][1], points[1][2])]
        points2.sort()
        lat1, lon1 = points2[0][1]
        lat2, lon2 = points2[1][1]
        brng = bearing(lat1, lon1, lat2, lon2)
    return brng
