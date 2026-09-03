#### For tests

from modules.gtfs import get_current_gtfs_schedule_file_url, Feed
import os

if os.path.isfile("cache.db"):
    os.remove("cache.db")
feed = Feed.download("cache.db", get_current_gtfs_schedule_file_url())
feed.close()
