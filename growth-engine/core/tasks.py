from core.celery_app import celery_app
from celery.schedules import crontab

@celery_app.task(name="test_growth_engine_task")
def test_task(word: str) -> str:
    """A simple test task to ensure Celery is working."""
    return f"Test task completed successfully: {word}"

# Schedule periodic tasks (e.g., daily runs)
celery_app.conf.beat_schedule = {
    # 'daily-seo-analysis': {
    #     'task': 'run_daily_seo_analysis',
    #     'schedule': crontab(hour=2, minute=0), # Run at 2:00 AM PST
    # },
    # 'daily-social-posts': {
    #     'task': 'run_daily_social_posts',
    #     'schedule': crontab(hour=8, minute=0), # Run at 8:00 AM PST
    # },
}
