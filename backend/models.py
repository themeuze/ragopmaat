from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from db import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    tier = Column(String, default="basic")  # basic, premium, white_label
    role = Column(String, default="user")  # user, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    trial_start_date = Column(DateTime)
    trial_end_date = Column(DateTime)
    is_trial_active = Column(Boolean, default=False)
    
    documents = relationship("Document", back_populates="owner")
    queries = relationship("Query", back_populates="user")

    def start_trial(self):
        """Start een 14-daagse trial periode"""
        self.trial_start_date = datetime.utcnow()
        self.trial_end_date = self.trial_start_date + timedelta(days=14)
        self.is_trial_active = True
        # Tijdens trial krijgen ze premium functionaliteit
        self.tier = "premium"

    def is_in_trial(self):
        """Check of gebruiker nog in trial periode zit"""
        if not self.is_trial_active or not self.trial_end_date:
            return False
        return datetime.utcnow() < self.trial_end_date

    def days_left_in_trial(self):
        """Aantal dagen resterend in trial"""
        if not self.is_in_trial():
            return 0
        remaining = self.trial_end_date - datetime.utcnow()
        return max(0, remaining.days)

    def get_effective_tier(self):
        """Krijg de effectieve tier (trial = premium functionaliteit)"""
        if self.is_in_trial():
            return "premium"  # Trial gebruikers krijgen premium functionaliteit
        return self.tier

    def get_tier_limits(self):
        """Krijg de limieten voor de huidige tier"""
        effective_tier = self.get_effective_tier()
        
        if effective_tier == "premium" or effective_tier == "white_label":
            return {
                "documents": float('inf'),  # Unlimited
                "queries_per_day": float('inf'),  # Unlimited
                "features": ["Onbeperkte documenten", "Onbeperkte vragen", "Premium AI modellen", "Prioriteit support"]
            }
        elif effective_tier == "basic":
            return {
                "documents": 50,
                "queries_per_day": 100,
                "features": ["50 documenten", "100 vragen per dag", "Basis AI modellen", "E-mail support"]
            }
        else:  # Fallback
            return {
                "documents": 10,
                "queries_per_day": 20,
                "features": ["10 documenten", "20 vragen per dag", "Basis functionaliteit"]
            }

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    original_filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    file_type = Column(String)  # pdf, docx, md
    user_id = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    is_processed = Column(Boolean, default=False)
    chunk_count = Column(Integer, default=0)
    
    owner = relationship("User", back_populates="documents")

class Query(Base):
    __tablename__ = "queries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    question = Column(Text)
    answer = Column(Text)
    sources = Column(Text)  # JSON string van bronnen
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="queries") 