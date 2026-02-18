from modules.config import load_config
from modules.gtfs_functions import download_gtfs_to_cache, get_cache_path

def download_cache(config: dict) -> None:
    cache_path = get_cache_path(config)
    download_gtfs_to_cache(cache_path)

if __name__ == "__main__":
    config = load_config()
    download_cache(config)
