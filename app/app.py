from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from contextlib import asynccontextmanager
from json import JSONDecodeError
from pprint import pprint
import asyncio

from modules.websocket import ConnectionManager
from modules.gtfs import get_vehicles, get_trip, get_vehicle_details
from modules.utils import get_project_details, get_arg

manager = ConnectionManager()

async def websocket_broadcast():
    while True:
        try:
            if manager.clients_connected:
                vehicles = get_vehicles()
                await manager.broadcast({"msg": "vehicles", "vehicles": vehicles})
        except asyncio.CancelledError:
            raise

        await asyncio.sleep(3)

@asynccontextmanager
async def lifespan(app: FastAPI):
    periodic_task = asyncio.create_task(websocket_broadcast())
    yield
    if periodic_task:
        periodic_task.cancel()
        try:
            await periodic_task
        except asyncio.CancelledError:
            pass

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
