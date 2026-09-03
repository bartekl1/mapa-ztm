from fastapi import WebSocket, WebSocketDisconnect

from typing import Any
import time

from .consts import MAX_PING

class ConnectionManager:
    def __init__(self) -> None:
        self.clients: dict[WebSocket, float] = {}

    @property
    def clients_connected(self) -> bool:
        return len(self.clients) > 0

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.clients[websocket] = time.monotonic()

    def disconnect(self, websocket: WebSocket) -> None:
        try:
            del self.clients[websocket]
        except KeyError:
            pass

    def ping(self, websocket: WebSocket) -> None:
        self.clients[websocket] = time.monotonic()
      
    async def send_to_client(self, websocket: WebSocket, data: Any) -> None:
        if websocket not in self.clients:
            raise WebSocketDisconnect()
        await websocket.send_json(data)

    async def broadcast(self, data: Any) -> None:
        to_disconnect = []
        for connection, last_ping in self.clients.items():
            if time.monotonic() - last_ping > MAX_PING:
                to_disconnect.append(connection)
                continue
            await connection.send_json(data)

        for connection in to_disconnect:
            self.disconnect(connection)
