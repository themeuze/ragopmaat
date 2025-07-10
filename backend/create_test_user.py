#!/usr/bin/env python3
"""
Script om een test gebruiker toe te voegen aan de database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from db import engine, Base
from models import User
from auth import get_password_hash

def create_test_user():
    """Maak een test gebruiker aan"""
    
    # Maak database tabellen aan als ze nog niet bestaan
    Base.metadata.create_all(bind=engine)
    
    # Maak database sessie
    db = Session(engine)
    
    try:
        # Check of gebruiker al bestaat
        existing_user = db.query(User).filter(
            (User.email == "mdirks@gmail.com") | (User.username == "mdirks")
        ).first()
        
        if existing_user:
            print("❌ Gebruiker bestaat al!")
            print(f"   Email: {existing_user.email}")
            print(f"   Username: {existing_user.username}")
            print(f"   Tier: {existing_user.tier}")
            return
        
        # Hash het wachtwoord
        hashed_password = get_password_hash("M@zzel0211")
        
        # Maak nieuwe gebruiker
        new_user = User(
            username="mdirks",
            email="mdirks@gmail.com",
            hashed_password=hashed_password,
            tier="premium"  # Premium tier voor test gebruiker
        )
        
        # Voeg toe aan database
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print("✅ Test gebruiker succesvol aangemaakt!")
        print(f"   Email: {new_user.email}")
        print(f"   Username: {new_user.username}")
        print(f"   Tier: {new_user.tier}")
        print(f"   ID: {new_user.id}")
        print("\n🔑 Login gegevens:")
        print("   Email: mdirks@gmail.com")
        print("   Wachtwoord: M@zzel0211")
        
    except Exception as e:
        print(f"❌ Fout bij aanmaken gebruiker: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user() 
