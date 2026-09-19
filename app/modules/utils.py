import requests
import cachetools.func

from typing import Any
import tomllib
import math

from .consts import EARTH_RADIUS

def get_pyproject() -> dict:
    with open("pyproject.toml", "rb") as file:
        toml = tomllib.load(file)
    return toml

@cachetools.func.lru_cache()
def get_project_details() -> dict[str, str]:
    pyproject = get_pyproject()
    return {
        "name": pyproject.get("project", {}).get("name"),
        "version": pyproject.get("project", {}).get("version"),
        "homepage": pyproject.get("project", {}).get("urls", {}).get("homepage")
    }

@cachetools.func.lru_cache()
def get_user_agent() -> str:
    project = get_project_details()
    library = requests.utils.default_user_agent()
    return f"{project['name']}/{project['version']} (+{project['homepage']}) {library}"

@cachetools.func.lru_cache()
def get_request_headers() -> dict[str, str]:
    return {
        "User-Agent": get_user_agent()
    }

def get_arg(data: Any, key: str) -> Any:
    return data.get(key) if isinstance(data, dict) else None

def distance(lat1: int | float, lon1: int | float, lat2: int | float, lon2: int | float) -> float:
    # https://www.movable-type.co.uk/scripts/latlong.html
    delta_lat = math.radians(lat2-lat1)
    delta_lon = math.radians(lon2-lon1)
    lat1, lat2 = math.radians(lat1), math.radians(lat2)

    a = math.sin(delta_lat/2) * math.sin(delta_lat/2) + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon/2) * math.sin(delta_lon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    d = EARTH_RADIUS * c

    return d

def bearing(lat1: int | float, lon1: int | float, lat2: int | float, lon2: int | float) -> float:
    # https://www.movable-type.co.uk/scripts/latlong.html
    lat1, lon1, lat2, lon2 = math.radians(lat1), math.radians(lon1), math.radians(lat2), math.radians(lon2)

    y = math.sin(lon2-lon1) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(lon2-lon1)
    theta = math.atan2(y, x)
    brng = (theta*180/math.pi + 360) % 360

    return brng
