import sqlite3
import typing
import zipfile
import csv
import io
import os

class Feed:
    def _create_db(self) -> None:
        self.db = sqlite3.connect(":memory:")
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

        cur.execute("CREATE INDEX idx_shapes_shape_id ON shapes(shape_id);")

        self.db.commit()
    
    def load_gtfs_data(self, file: typing.BinaryIO) -> None:
        self._create_db()
        with zipfile.ZipFile(file) as file:
            cur = self.db.cursor()
            for name in file.namelist():
                with file.open(name) as f:
                    reader = csv.reader(io.TextIOWrapper(f, "utf-8-sig"))
                    header = next(reader)
                    columns = ", ".join(header)
                    placeholders = ", ".join("?" * len(header))
                    table_name = os.path.splitext(name)[0]
                    cur.executemany(
                        f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})",
                        reader
                    )
            self.db.commit()
    
    def load_cache(self, path: str, as_classes: bool = False) -> None:
        self.db = sqlite3.connect(path)
        if as_classes:
            self.db.row_factory = sqlite3.Row
    
    def save_cache(self, path: str) -> None:
        cache_db = sqlite3.connect(path)
        try:
            self.db.backup(cache_db)
            cache_db.commit()
        finally:
            cache_db.close()
    
    def close(self) -> None:
        self.db.close()
    
    def get_shape(self, trip_id: str, reversed: bool = False):
        cur = self.db.cursor()
        cur.execute(f"""
            SELECT {'shapes.shape_pt_lat, shapes.shape_pt_lon' if not reversed else 'shapes.shape_pt_lon, shapes.shape_pt_lat'}
            FROM shapes
            JOIN trips ON shapes.shape_id = trips.shape_id
            WHERE trips.trip_id = ?
            ORDER BY shapes.shape_pt_sequence ASC;
        """, (trip_id, ))
        return cur.fetchall()
    
    def get_route_info_by_trip(self, trip_id: str):
        cur = self.db.cursor()
        cur.execute("""
            SELECT trips.trip_id, routes.route_id, routes.route_type
            FROM routes
            JOIN trips ON routes.route_id = trips.route_id
            WHERE trips.trip_id = ?
            LIMIT 1;
        """, (trip_id, ))
        res = cur.fetchall()
        return res[0] if len(res) > 0 else None
    
    def get_stops_on_trip(self, trip_id: str):
        cur = self.db.cursor()
        cur.execute("""
            SELECT stops.stop_id, stop_times.departure_time, stops.stop_name, stops.stop_code, stops.stop_lat, stops.stop_lon, stops.zone_id, stop_times.stop_sequence, stop_times.pickup_type, stop_times.drop_off_type
            FROM stop_times
            JOIN stops ON stops.stop_id = stop_times.stop_id
            WHERE stop_times.trip_id = ?
            ORDER BY stop_times.stop_sequence ASC;
        """, (trip_id, ))
        return cur.fetchall()
    
    def get_stops(self):
        cur = self.db.cursor()
        cur.execute("SELECT stop_id, stop_code, stop_name, stop_lat, stop_lon, zone_id FROM stops;")
        return cur.fetchall()
