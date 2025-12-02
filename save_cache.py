from modules.config import load_config
from modules.gtfs_functions import download_gtfs_to_cache

def save_cache(config: dict) -> None:
    cache_path = config.get("gtfs_cache_path", "gtfs_cache.db")
    download_gtfs_to_cache(cache_path)

if __name__ == "__main__":
    config = load_config()
    save_cache(config)
