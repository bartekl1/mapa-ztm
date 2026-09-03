from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from contextlib import asynccontextmanager
from json import JSONDecodeError
import asyncio

from modules.websocket import ConnectionManager
from modules.gtfs import get_vehicles
from modules.utils import get_project_details

manager = ConnectionManager()

async def websocket_broadcast():
    while True:
        try:
            if manager.clients_connected:
                vehicles = get_vehicles()
                await manager.broadcast(vehicles)
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
    await manager.send_to_client(websocket, get_project_details())

    try:
        while True:
            try:
                data = await websocket.receive_json()
                msg = data.get("msg") if isinstance(data, dict) else None
                manager.ping(websocket)
                match msg:
                    case "test":
                        await manager.send_to_client(websocket, {"msg": "test response"})
                    case "trip":
                        ...
            except JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(e)
