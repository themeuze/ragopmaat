from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import timedelta
from db import get_db
from models import User
from dependencies import get_current_user
from auth import get_password_hash, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"
    tier: str = "basic"  # Default naar basic
    is_active: bool = True
    start_trial: bool = False

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    tier: str
    is_active: bool
    trial_start_date: str | None
    trial_end_date: str | None
    is_trial_active: bool
    days_left_in_trial: int
    created_at: str
    effective_tier: str  # Toon effectieve tier (trial = premium)

    model_config = {
        "from_attributes": True
    }

class TrialUpdate(BaseModel):
    days: int = 14

# Helper: check admin
async def get_current_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """Registreer een nieuwe gebruiker"""
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        tier=user.tier,
        is_active=user.is_active
    )
    
    # Start trial voor nieuwe gebruikers (14 dagen premium functionaliteit)
    db_user.start_trial()
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "tier": db_user.tier,
        "is_active": db_user.is_active,
        "trial_start_date": db_user.trial_start_date.isoformat() if db_user.trial_start_date else None,
        "trial_end_date": db_user.trial_end_date.isoformat() if db_user.trial_end_date else None,
        "is_trial_active": db_user.is_trial_active,
        "days_left_in_trial": db_user.days_left_in_trial(),
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
        "effective_tier": db_user.get_effective_tier()
    }

@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login gebruiker met email en genereer JWT token"""
    # Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Authenticate user
    if not authenticate_user(db, user.username, user_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Haal informatie op over de huidige gebruiker"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "tier": current_user.tier,
        "is_active": current_user.is_active,
        "trial_start_date": current_user.trial_start_date.isoformat() if current_user.trial_start_date else None,
        "trial_end_date": current_user.trial_end_date.isoformat() if current_user.trial_end_date else None,
        "is_trial_active": current_user.is_trial_active,
        "days_left_in_trial": current_user.days_left_in_trial(),
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
        "effective_tier": current_user.get_effective_tier()
    }

# --- ADMIN ENDPOINTS ---
@router.get("/users", response_model=list[UserOut])
def list_users(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "tier": user.tier,
            "is_active": user.is_active,
            "trial_start_date": user.trial_start_date.isoformat() if user.trial_start_date else None,
            "trial_end_date": user.trial_end_date.isoformat() if user.trial_end_date else None,
            "is_trial_active": user.is_trial_active,
            "days_left_in_trial": user.days_left_in_trial(),
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "effective_tier": user.get_effective_tier()
        }
        for user in users
    ]

@router.post("/users", response_model=UserOut)
def create_user_admin(user: UserCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        tier=user.tier,
        is_active=user.is_active
    )
    
    # Start trial if requested
    if user.start_trial:
        db_user.start_trial()
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "tier": db_user.tier,
        "is_active": db_user.is_active,
        "trial_start_date": db_user.trial_start_date.isoformat() if db_user.trial_start_date else None,
        "trial_end_date": db_user.trial_end_date.isoformat() if db_user.trial_end_date else None,
        "is_trial_active": db_user.is_trial_active,
        "days_left_in_trial": db_user.days_left_in_trial(),
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None,
        "effective_tier": db_user.get_effective_tier()
    }

@router.put("/users/{user_id}", response_model=UserOut)
def update_user_admin(user_id: int, user: UserCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db_user.username = user.username
    db_user.email = user.email
    db_user.role = user.role
    db_user.tier = user.tier
    db_user.is_active = user.is_active
    if user.password:
        db_user.hashed_password = get_password_hash(user.password)
    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "tier": db_user.tier,
        "is_active": db_user.is_active,
        "trial_start_date": db_user.trial_start_date.isoformat() if db_user.trial_start_date else None,
        "trial_end_date": db_user.trial_end_date.isoformat() if db_user.trial_end_date else None,
        "is_trial_active": db_user.is_trial_active,
        "days_left_in_trial": db_user.days_left_in_trial(),
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None
    }

@router.post("/users/{user_id}/trial", response_model=UserOut)
def start_user_trial(user_id: int, trial_data: TrialUpdate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Start of verleng trial voor een gebruiker"""
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from datetime import datetime, timedelta
    
    # Start nieuwe trial
    db_user.trial_start_date = datetime.utcnow()
    db_user.trial_end_date = db_user.trial_start_date + timedelta(days=trial_data.days)
    db_user.is_trial_active = True
    db_user.tier = "trial"
    
    db.commit()
    db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "tier": db_user.tier,
        "is_active": db_user.is_active,
        "trial_start_date": db_user.trial_start_date.isoformat() if db_user.trial_start_date else None,
        "trial_end_date": db_user.trial_end_date.isoformat() if db_user.trial_end_date else None,
        "is_trial_active": db_user.is_trial_active,
        "days_left_in_trial": db_user.days_left_in_trial(),
        "created_at": db_user.created_at.isoformat() if db_user.created_at else None
    }

@router.delete("/users/{user_id}", response_model=dict)
def delete_user_admin(user_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"} 