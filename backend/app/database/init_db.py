from app.database.models import Base
from app.database.seed import seed_demo_data
from app.database.session import SessionLocal, engine


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
