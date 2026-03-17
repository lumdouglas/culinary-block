from core.celery_app import celery_app
from core.modules.content.claude_client import MockClaudeClient
import logging

logger = logging.getLogger(__name__)

CODY_SCHNEIDER_STYLE_PROMPT = """
Write a short, punchy social media post. Use the 'Pain -> Solution' framework.
Hook the reader immediately. Explain the pain of a traditional commercial kitchen.
Present Culinary Block as the solution (specifically mentioning Revent Ovens, Health Dept Certs, or the AI Permit Wizard).
End with a strong CTA to the culinaryblock.com waitlist.
"""

@celery_app.task(name="content.generate_daily_socials")
def generate_daily_socials():
    """
    Daily task that generates social media hooks.
    """
    logger.info("Generating Daily Social Content...")
    
    claude = MockClaudeClient()
    
    # 1. Generate X Post
    x_post = claude.generate_social_post(
        platform="x", 
        topic="AI Catering Permit Wizard vs Manual DEH Application", 
        style_guide=CODY_SCHNEIDER_STYLE_PROMPT
    )
    
    # 2. Generate LinkedIn Post
    linkedin_post = claude.generate_social_post(
        platform="linkedin", 
        topic="Baker scaling operations using Revent Ovens", 
        style_guide=CODY_SCHNEIDER_STYLE_PROMPT
    )
    
    # 3. Save to Database for human review via the React Dashboard
    # db.add(SocialDraft(platform="x", content=x_post, status="pending_approval"))
    # db.add(SocialDraft(platform="linkedin", content=linkedin_post, status="pending_approval"))
    
    logger.info("Successfully generated social content drafts for review.")
    return {"x_post": x_post, "linkedin_post": linkedin_post}
