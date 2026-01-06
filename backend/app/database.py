from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

# Handle both PostgreSQL and SQLite
if settings.database_url.startswith("postgres://"):
    # Railway uses postgres:// but SQLAlchemy needs postgresql://
    database_url = settings.database_url.replace("postgres://", "postgresql://", 1)
else:
    database_url = settings.database_url

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    # SQLite specific settings
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from app.models import episode  # noqa
    Base.metadata.create_all(bind=engine)
