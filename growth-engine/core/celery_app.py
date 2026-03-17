from celery import Celery
from core.config import settings
import os

# Create Celery instance
celery_app = Celery(
    "growth_engine_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["core.tasks"]
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Los_Angeles",
    enable_utc=True,
)
