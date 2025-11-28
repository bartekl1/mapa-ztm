from google.transit import gtfs_realtime_pb2
import requests
import cachetools.func

@cachetools.func.ttl_cache(ttl=1)
def get_current_positions() -> list[dict[str, str | int | float]]:
    feed = gtfs_realtime_pb2.FeedMessage()
    response = requests.get("https://www.ztm.poznan.pl/pl/dla-deweloperow/getGtfsRtFile?file=vehicle_positions.pb")
    feed.ParseFromString(response.content)
    return [{
        "route_id": entity.vehicle.trip.route_id,
        "trip_id": entity.vehicle.trip.trip_id,
        "vehicle_id": entity.vehicle.vehicle.id,
        "vehicle_label": entity.vehicle.vehicle.label,
        "latitude": entity.vehicle.position.latitude,
        "longitude": entity.vehicle.position.longitude
    } for entity in feed.entity]
