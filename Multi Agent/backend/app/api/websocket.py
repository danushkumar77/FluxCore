import logging
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from app.api.security import authenticate_websocket_query

logger = logging.getLogger("FluxCore.WebSocketManager")

class WebSocketConnectionManager:
    def __init__(self):
        # Maps subscription room (e.g., 'telemetry', 'alerts', 'agent_states') -> Set of WebSocket connections
        self.rooms: Dict[str, Set[WebSocket]] = {
            "telemetry": set(),
            "alerts": set(),
            "agent_states": set(),
            "decisions": set()
        }
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, token: Optional[str] = None):
        """Accept connection, authenticate, and register."""
        await websocket.accept()
        
        # Verify JWT handshake
        if token:
            payload = authenticate_websocket_query(token)
            if not payload:
                logger.warning("Rejected WebSocket connection: Invalid JWT Token.")
                await websocket.close(code=4003)  # Forbidden
                return
            logger.info(f"WebSocket client authenticated: {payload.sub} (Role: {payload.role})")
        else:
            logger.info("WebSocket client connected (Anonymous Mode).")

        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        """Unregister connection and clean up subscriptions."""
        self.active_connections.remove(websocket)
        for room_connections in self.rooms.values():
            room_connections.discard(websocket)
        logger.info("WebSocket client disconnected.")

    def subscribe(self, websocket: WebSocket, room: str):
        """Registers a connection to a specific subscription room."""
        if room in self.rooms:
            self.rooms[room].add(websocket)
            logger.info(f"WebSocket subscribed to channel: {room}")
        else:
            logger.warning(f"Attempted subscription to invalid room: {room}")

    def unsubscribe(self, websocket: WebSocket, room: str):
        if room in self.rooms:
            self.rooms[room].discard(websocket)
            logger.info(f"WebSocket unsubscribed from channel: {room}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send personal WS message: {e}")

    async def broadcast_to_room(self, room: str, message: dict):
        """Streams a payload to all connections subscribed to the target room."""
        if room not in self.rooms:
            return
        
        connections = self.rooms[room]
        if not connections:
            return
            
        logger.debug(f"Broadcasting WS message to room '{room}' (Active listeners: {len(connections)})")
        
        # Send concurrently to avoid blocking
        await asyncio.gather(
            *[self._safe_send(ws, message) for ws in list(connections)],
            return_exceptions=True
        )

    async def _safe_send(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_json(message)
        except Exception:
            # Auto-cleanup if connection died
            self.disconnect(websocket)

# Global instance for DI
websocket_manager = WebSocketConnectionManager()
