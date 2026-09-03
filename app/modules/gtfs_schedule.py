import requests

from typing import BinaryIO, IO
import sqlite3
import zipfile
import csv
import io
import os

from .consts import GTFS_SCHEDULE_TABLE_NAMES, VEHICLE_DICTIONARY_URL
from .utils import get_request_headers

class Feed:
    def __init__(self, filename: str) -> None:
        self.db = sqlite3.connect(filename)
        self.db.row_factory = sqlite3.Row

    def _create_db(self) -> None:
        cur = self.db.cursor()

        cur.execute("""
            CREATE TABLE agency(
                agency_id TEXT PRIMARY KEY,
                agency_name TEXT,
                agency_url TEXT,
                agency_timezone TEXT,
                agency_lang TEXT,
                agency_phone TEXT
            );
        """)
        cur.execute("""
            CREATE TABLE stops(
                stop_id TEXT PRIMARY KEY,
                stop_code TEXT,
                stop_name TEXT,
                stop_lat REAL,
                stop_lon REAL,
                zone_id TEXT
            );
        """)
        cur.execute("""
            CREATE TABLE routes(
                route_id TEXT PRIMARY KEY,
                agency_id TEXT,
                route_short_name TEXT,
                route_long_name TEXT,
                route_desc TEXT,
                route_type INTEGER,
                route_color TEXT,
                route_text_color TEXT,
                FOREIGN KEY (agency_id) REFERENCES agency(agency_id)
            );
        """)
        cur.execute("""
            CREATE TABLE trips(
                route_id TEXT,
                service_id TEXT,
                trip_id TEXT PRIMARY KEY,
                trip_headsign TEXT,
                direction_id INTEGER,
                shape_id TEXT,
                wheelchair_accessible INTEGER,
                brigade TEXT,
                FOREIGN KEY (route_id) REFERENCES routes(route_id),
                FOREIGN KEY (service_id) REFERENCES calendar(service_id),
                FOREIGN KEY (shape_id) REFERENCES shapes(shape_id)
            );
        """)
        cur.execute("""
            CREATE TABLE stop_times(
                trip_id TEXT,
                arrival_time TEXT,
                departure_time TEXT,
                stop_id TEXT,
                stop_sequence INTEGER,
                stop_headsign TEXT,
                pickup_type INTEGER,
                drop_off_type INTEGER,
                FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
                FOREIGN KEY (stop_id) REFERENCES stops(stop_id)
            );        
        """)
        cur.execute("""
            CREATE TABLE calendar(
                service_id TEXT PRIMARY KEY,
                monday INTEGER,
                tuesday INTEGER,
                wednesday INTEGER,
                thursday INTEGER,
                friday INTEGER,
                saturday INTEGER,
                sunday INTEGER,
                start_date TEXT,
                end_date TEXT
            );
        """)
        cur.execute("""
            CREATE TABLE calendar_dates(
                service_id TEXT,
                date TEXT,
                exception_type INTEGER,
                FOREIGN KEY (service_id) REFERENCES calendar(service_id)
            );
        """)
        cur.execute("""
            CREATE TABLE shapes(
                shape_id TEXT,
                shape_pt_lat REAL,
                shape_pt_lon REAL,
                shape_pt_sequence INTEGER
            );
        """)
        cur.execute("""
            CREATE TABLE feed_info(
                feed_publisher_name TEXT,
                feed_publisher_url TEXT,
                feed_lang TEXT,
                feed_start_date TEXT,
                feed_end_date TEXT
            );
        """)

        cur.execute("""
            CREATE TABLE vehicles(
                vehicle TEXT PRIMARY KEY,
                ramp INTEGER,
                hf_lf_le INTEGER,
                air_conditioner INTEGER,
                place_for_transp_bicycles INTEGER,
                voice_announcement_sys INTEGER,
                ticket_machine INTEGER,
                ticket_sales_by_the_driver INTEGER,
                usb_charger INTEGER
            );
        """)

        self.db.commit()

    def _load_csv_file(self, table_name: str, file: IO) -> None:
        cur = self.db.cursor()
        reader = csv.reader(io.TextIOWrapper(file, "utf-8-sig"))
        header = next(reader)
        columns = ", ".join(header)
        placeholders = ", ".join("?" * len(header))
        cur.executemany(
            f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})",
            reader
        )
        self.db.commit()

    def _load_gtfs_data(self, gtfs_file: BinaryIO) -> None:
        with zipfile.ZipFile(gtfs_file) as file:
            for name in file.namelist():
                table_name = os.path.splitext(name)[0].lower()
                if table_name in GTFS_SCHEDULE_TABLE_NAMES:
                    with file.open(name) as f:
                      self._load_csv_file(table_name, f)  
    
    def close(self) -> None:
        self.db.close()

    @classmethod
    def download(cls, filename: str, url: str) -> Feed:
        feed = cls(filename)
        feed._create_db()
        gtfs_req = requests.get(url, headers=get_request_headers())
        feed._load_gtfs_data(io.BytesIO(gtfs_req.content))
        vehicle_dict_req = requests.get(VEHICLE_DICTIONARY_URL, headers=get_request_headers())
        feed._load_csv_file("vehicles", io.BytesIO(vehicle_dict_req.content))
        return feed

    def get_trip(self, trip_id: str) -> sqlite3.Row | None:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM trips WHERE trip_id = ? LIMIT 1;", (trip_id, ))
        return cur.fetchone()

    def get_route(self, route_id: str) -> sqlite3.Row | None:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM routes WHERE route_id = ? LIMIT 1;", (route_id, ))
        return cur.fetchone()

    def get_agency(self, agency_id: str) -> sqlite3.Row | None:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM agency WHERE agency_id = ? LIMIT 1;", (agency_id, ))
        return cur.fetchone()

    def get_shape(self, shape_id: str) -> list[sqlite3.Row]:
        cur = self.db.cursor()
        cur.execute("SELECT * FROM shapes WHERE shape_id = ? ORDER BY shapes.shape_pt_sequence ASC;", (shape_id, ))
        return cur.fetchall()

    def get_trip_stops(self, trip_id: str) -> list[sqlite3.Row]:
        cur = self.db.cursor()
        cur.execute("""
            SELECT *
            FROM stop_times
            JOIN stops ON stops.stop_id = stop_times.stop_id
            WHERE stop_times.trip_id = ?
            ORDER BY stop_times.stop_sequence ASC;
        """, (trip_id, ))
        return cur.fetchall()
