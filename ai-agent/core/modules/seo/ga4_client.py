import random
from typing import List, Dict

class MockGA4Client:
    """
    A mock GA4 client to simulate data retrieval for the autonomous agent.
    When the user adds API keys, this will be swapped for the actual Google Analytics Data API.
    """
    def __init__(self, property_id: str):
        self.property_id = property_id

    def get_top_search_terms(self, days: int = 7) -> List[Dict]:
        """Simulates fetching top search terms driving traffic."""
        return [
            {"term": "commercial kitchen rental san jose", "clicks": random.randint(50, 200), "conversions": random.randint(1, 5)},
            {"term": "caterer prep space bay area", "clicks": random.randint(30, 100), "conversions": random.randint(0, 3)},
            {"term": "revent rack oven rental", "clicks": random.randint(20, 80), "conversions": random.randint(1, 4)},
            {"term": "santa clara deh catering permit requirements", "clicks": random.randint(100, 300), "conversions": random.randint(5, 15)}
        ]

    def get_device_breakdown(self) -> Dict:
        """Simulates fetching mobile vs desktop usage."""
        return {
            "mobile_percent": 68,
            "desktop_percent": 32
        }
