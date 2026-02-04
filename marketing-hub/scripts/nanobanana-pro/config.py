"""
Configuration for Gemini Image Generator (NanoBanana Pro)
Centralized settings for browser automation and data storage
"""

from pathlib import Path

# Paths - relative to marketing-hub project
SKILL_ROOT = Path(__file__).parent
DATA_DIR = SKILL_ROOT / "data"
BROWSER_PROFILE_DIR = DATA_DIR / "browser_profile"
STATE_FILE = DATA_DIR / "state.json"
AUTH_INFO_FILE = DATA_DIR / "auth_info.json"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "public" / "uploads" / "ai-generated"

# Browser settings
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

BROWSER_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--disable-web-security",
]

# URLs
GEMINI_URL = "https://gemini.google.com/"
NANOBANANA_URL = "https://aistudio.google.com/generate-images"

# Timeouts (in seconds)
DEFAULT_TIMEOUT = 180
AUTH_TIMEOUT = 600  # 10 minutes for authentication

# Stealth settings
TYPING_WPM_MIN = 160
TYPING_WPM_MAX = 240
