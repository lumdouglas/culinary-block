from core.celery_app import celery_app
from core.modules.content.claude_client import MockClaudeClient
import logging

logger = logging.getLogger(__name__)

@celery_app.task(name="outreach.generate_cold_email_sequence")
def generate_cold_email_sequence():
    """
    Simulates scraping local business directories (Apify), 
    verifying emails (MillionVerifier), and drafting a sequence for outreach.
    """
    logger.info("Starting Outreach Agent Cycle...")
    
    # Mock output from an Apify scraper of Yelp 'Caterers San Jose'
    scraped_leads = [
        {"name": "Local Spice Co.", "email": "hello@localspice.com", "verified": True, "type": "caterer"},
        {"name": "Artisan Breads", "email": "info@artisan.co", "verified": True, "type": "baker"}
    ]
    
    claude = MockClaudeClient()
    drafts = []
    
    for lead in scraped_leads:
        sequence = claude.generate_email_sequence(persona=lead["type"], goal="scale production without huge overhead")
        drafts.append({
            "lead": lead["name"],
            "email": lead["email"],
            "sequence": sequence
        })
        
    logger.info(f"Drafted cold outreach sequences for {len(scraped_leads)} verified local leads.")
    return drafts
