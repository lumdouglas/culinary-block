import os

class MockClaudeClient:
    """
    A mock Claude client to simulate content generation for the autonomous agent.
    When the user adds their Anthropic API key, this will utilize the anthropic SDK.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("CLAUDE_API_KEY", "")

    def generate_social_post(self, platform: str, topic: str, style_guide: str) -> str:
        """Simulates generating a social media post using Claude."""
        if platform == "twitter" or platform == "x":
            return (
                f"Tired of applying for a health permit in Santa Clara? 😩\n\n"
                f"Most caterers wait 3 months just to get rejected on a technicality.\n\n"
                f"Our AI Permit Wizard fills it out perfectly in 5 minutes.\n\n"
                f"Get certified and start cooking ⬇️\n"
                f"culinaryblock.com/apply"
            )
        elif platform == "linkedin":
            return (
                f"We just helped a local San Jose baker scale from 10 hours a week to over 100 hours a month.\n\n"
                f"The secret wasn't working harder. It was accessing the right equipment: Revent rack ovens.\n\n"
                f"Our facility at Culinary Block provides the infrastructure to scale your food business without the $200k overhead.\n\n"
                f"Join the waitlist to secure your commercial spot ⬇️"
            )
        return "Generic post content."

    def generate_email_sequence(self, persona: str, goal: str) -> list[dict]:
        """Simulates creating an email sequence for a lead."""
        return [
            {
                "subject": f"Welcome to Culinary Block! (Resources for {persona}s)",
                "body": f"Hey there, thanks for joining the waitlist. As a {persona}, we know how hard it is to {goal}..."
            },
            {
                "subject": f"How we help {persona}s scale",
                "body": "Did you know that utilizing our Walk-in freezers can help you batch prep..."
            }
        ]
