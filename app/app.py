from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from contextlib import asynccontextmanager
from zoneinfo import ZoneInfo
from json import JSONDecodeError
import asyncio

from modules.websocket import ConnectionManager, websocket_broadcast_task
from modules.gtfs import get_trip, get_vehicle_details, download_gtfs_cache
from modules.utils import get_project_details, get_arg
from modules.consts import TIMEZONE

TZ = ZoneInfo(TIMEZONE)

manager = ConnectionManager()
scheduler = AsyncIOScheduler(timezone=TZ)

@asynccontextmanager
async def lifespan(app: FastAPI):
    download_gtfs_cache()
    scheduler.add_job(
        download_gtfs_cache,
        trigger=CronTrigger(
            hour=0,
            minute=5,
            timezone=TZ,
        ),
        id="gtfs_update",
        replace_existing=True,
        coalesce=True,
        max_instances=1,
        misfire_grace_time=3600,
    )
    scheduler.start()

    broadcast_task = asyncio.create_task(websocket_broadcast_task(manager))

    yield

    if broadcast_task:
        broadcast_task.cancel()
        try:
            await broadcast_task
        except asyncio.CancelledError:
            pass

    scheduler.shutdown(wait=True)

app = FastAPI(lifespan=lifespan)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    welcome_message = get_project_details()
    welcome_message["msg"] = "welcome"
    await manager.send_to_client(websocket, welcome_message)

    try:
        while True:
            try:
                data = await websocket.receive_json()
                msg = get_arg(data, "msg")
                manager.ping(websocket)
                match msg:
                    case "test":
                        await manager.send_to_client(websocket, {"msg": "test response"})
                    case "trip":
                        trip_id = get_arg(data, "trip_id")
                        trip = get_trip(trip_id)
                        await manager.send_to_client(websocket, {"msg": "trip", "trip_id": trip_id, "trip": trip})
                    case "vehicle":
                        vehicle_id = get_arg(data, "vehicle_id")
                        vehicle = get_vehicle_details(vehicle_id)
                        await manager.send_to_client(websocket, {"msg": "vehicle", "vehicle_id": vehicle_id, "vehicle": vehicle})
            except JSONDecodeError:
                pass
            except RuntimeError as e2:
                if str(e2) != 'Cannot call "receive" once a disconnect message has been received.':
                    raise e2
            except WebSocketDisconnect as e2:
                raise e2
            except Exception as e2:
                print(e2.__class__.__name__, repr(e2), str(e2))
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(e)
