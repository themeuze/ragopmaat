#!/usr/bin/env python3
"""
Script om een admin gebruiker aan te maken voor RAG Op Maat
"""

from db import SessionLocal
from models import User
from auth import get_password_hash
from datetime import datetime

def create_admin_user():
    db = SessionLocal()
    
    try:
        # Check of admin al bestaat
        existing_admin = db.query(User).filter(User.email == "admin@ragopmaat.nl").first()
        
        if existing_admin:
            print("✅ Admin gebruiker bestaat al:")
            print(f"   Email: {existing_admin.email}")
            print(f"   Username: {existing_admin.username}")
            print(f"   Role: {existing_admin.role}")
            print(f"   Tier: {existing_admin.tier}")
            print(f"   Status: {'Actief' if existing_admin.is_active else 'Inactief'}")
            
            if existing_admin.is_trial_active:
                print(f"   Trial: Actief ({existing_admin.days_left_in_trial()} dagen over)")
            else:
                print("   Trial: Niet actief")
            
            return
        
        # Maak nieuwe admin gebruiker
        admin_user = User(
            email="admin@ragopmaat.nl",
            username="admin",
            hashed_password=get_password_hash("Admin123!"),
            role="admin",
            tier="premium",  # Admin krijgt premium toegang
            is_active=True,
            created_at=datetime.utcnow()
        )
        
        # Start trial voor admin
        admin_user.start_trial()
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin gebruiker succesvol aangemaakt!")
        print(f"   Email: {admin_user.email}")
        print(f"   Username: {admin_user.username}")
        print(f"   Wachtwoord: Admin123!")
        print(f"   Role: {admin_user.role}")
        print(f"   Tier: {admin_user.tier}")
        print(f"   Trial: Actief ({admin_user.days_left_in_trial()} dagen)")
        print(f"   Status: Actief")
        
    except Exception as e:
        print(f"❌ Fout bij aanmaken admin gebruiker: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user() 