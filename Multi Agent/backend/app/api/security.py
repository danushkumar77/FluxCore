import time
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict
import jwt
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from pydantic import BaseModel, Field
from app.core.config import get_settings

logger = logging.getLogger("FluxCore.Security")

security_bearer = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-FluxCore-API-Key", auto_error=False)

# Custom token representation
class UserTokenPayload(BaseModel):
    sub: str = Field(..., description="User ID or Username")
    role: str = Field(..., description="RBAC Role: Administrator, GridOperator, MaintenanceEngineer, EnergyAnalyst, Viewer")
    permissions: List[str] = Field(default_factory=list)
    exp: Optional[int] = None

# Role Permission Mapping
ROLE_PERMISSIONS: Dict[str, List[str]] = {
    "Administrator": ["*:*", "grid:write", "grid:read", "market:write", "market:read", "admin:write"],
    "Grid Operator": ["grid:write", "grid:read", "market:read", "alerts:write"],
    "Maintenance Engineer": ["grid:read", "maintenance:write", "alerts:write"],
    "Energy Analyst": ["grid:read", "market:read", "forecast:write"],
    "Viewer": ["grid:read", "market:read"]
}

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    if expires_delta:
        expire_timestamp = int(time.time() + expires_delta.total_seconds())
    else:
        expire_timestamp = int(time.time() + settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    to_encode.update({"exp": expire_timestamp})
    # Map role to permissions automatically if not present
    role = to_encode.get("role", "Viewer")
    to_encode["permissions"] = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["Viewer"])
    
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[UserTokenPayload]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return UserTokenPayload(**payload)
    except jwt.PyJWTError as e:
        logger.error(f"JWT Verification failure: {e}")
        return None

# Dependency to get current user payload from token
def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    api_key: Optional[str] = Depends(api_key_header)
) -> UserTokenPayload:
    # 1. Check API Key
    if api_key:
        # Simple enterprise API key validation (mocked for foundation)
        if api_key == "fluxcore-admin-key-2026":
            return UserTokenPayload(sub="api_key_client", role="Administrator", permissions=ROLE_PERMISSIONS["Administrator"])
        elif api_key == "fluxcore-operator-key":
            return UserTokenPayload(sub="api_key_client", role="Grid Operator", permissions=ROLE_PERMISSIONS["Grid Operator"])

    # 2. Check JWT
    if not credentials:
        # Secure default: block unauthenticated requests
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token or API key is missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    user_payload = verify_token(token)
    if not user_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user_payload

# RBAC Verification helper
class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: UserTokenPayload = Depends(get_current_user)) -> UserTokenPayload:
        if current_user.role not in self.allowed_roles and current_user.role != "Administrator":
            logger.warning(f"Access Denied for user {current_user.sub} (Role: {current_user.role}). Required roles: {self.allowed_roles}")
            # Audit log security breach attempt
            self.write_audit_log(current_user.sub, "ACCESS_DENIED", f"User attempted restricted action. Role: {current_user.role}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action forbidden: Insufficient permissions"
            )
        return current_user

    def write_audit_log(self, user: str, action: str, details: str):
        audit_record = {
            "timestamp": datetime.utcnow().isoformat(),
            "actor": user,
            "action": action,
            "details": details,
            "status": "UNAUTHORIZED"
        }
        logger.warning(f"AUDIT TRAIL: {audit_record}")

# Secure WebSocket auth helper
def authenticate_websocket_query(token: Optional[str]) -> Optional[UserTokenPayload]:
    if not token:
        return None
    return verify_token(token)
