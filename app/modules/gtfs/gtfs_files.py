from bs4 import BeautifulSoup
import requests

import datetime
import os

from .gtfs_schedule import Feed
from ..utils import get_request_headers
from ..consts import GTFS_SCHEDULE_FILES_LIST_URL, GTFS_SCHEDULE_FEED_URL, CACHE_DIRECTORY

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
    filename = get_current_gtfs_schedule_filename(files)

    path = os.path.join(CACHE_DIRECTORY, filename.replace(".zip", ".db"))

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
