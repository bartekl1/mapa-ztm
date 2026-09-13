GTFS_REALTIME_FEED_URL = "https://www.ztm.poznan.pl/pl/dla-deweloperow/getGtfsRtFile?file=vehicle_positions.pb"
GTFS_SCHEDULE_FEED_URL = "https://www.ztm.poznan.pl/pl/dla-deweloperow/getGTFSFile"
GTFS_SCHEDULE_FILES_LIST_URL = "https://www.ztm.poznan.pl/otwarte-dane/gtfsfiles/"
VEHICLE_DICTIONARY_URL = "https://www.ztm.poznan.pl/pl/dla-deweloperow/getGtfsRtFile?file=vehicle_dictionary.csv"

GTFS_SCHEDULE_TABLE_NAMES = {"agency", "stops", "routes", "trips", "stop_times", "calendar", "calendar_dates", "shapes", "feed_info"}

VEHICLE_DICTIONARY_BOOL_KEYS = {"ramp", "air_conditioner", "place_for_transp_bicycles", "voice_announcement_sys", "ticket_machine", "ticket_sales_by_the_driver", "usb_charger"}
HF_LF_LE_VALUES = {0: "hf", 1: "lf", 2: "le"}
TRAM_ID_RANGE = (0, 999)
BUS_ID_RANGE = (1000, 9999)

MAX_PING = 120

CACHE_DIRECTORY = "cache"
