#!/usr/bin/env python3
"""
NanoBanana Pro 画像生成APIラッパー
Next.js APIから呼び出されるエントリーポイント

Usage:
    python generate.py --prompt "Your prompt here"

Output (JSON):
    {"success": true, "url": "/uploads/ai-generated/xxx.png", "filename": "xxx.png"}
    {"success": false, "error": "Error message"}
"""

import sys
import json
import argparse
from pathlib import Path
from nanoid import generate as nanoid_generate

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from config import DATA_DIR, OUTPUT_DIR, STATE_FILE
from image_generator import generate_image, check_authenticated


def main():
    parser = argparse.ArgumentParser(description="NanoBanana Pro Image Generator")
    parser.add_argument("--prompt", required=True, help="Image generation prompt")
    parser.add_argument("--timeout", type=int, default=180, help="Timeout in seconds")
    args = parser.parse_args()

    # Ensure directories exist
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Check authentication
    if not check_authenticated():
        result = {
            "success": False,
            "error": "未認証です。先にNanoBanana Proの認証を行ってください。",
            "auth_required": True
        }
        print(json.dumps(result, ensure_ascii=False))
        return 1

    # Generate unique filename
    try:
        from nanoid import generate
        filename = f"{generate(size=12)}.png"
    except ImportError:
        import uuid
        filename = f"{uuid.uuid4().hex[:12]}.png"

    output_path = OUTPUT_DIR / filename

    # Generate image (headless mode)
    success = generate_image(
        prompt=args.prompt,
        output_path=str(output_path),
        show_browser=False,
        timeout=args.timeout
    )

    if success and output_path.exists():
        # Return relative URL for web access
        relative_url = f"/uploads/ai-generated/{filename}"
        result = {
            "success": True,
            "url": relative_url,
            "filename": filename,
            "prompt": args.prompt
        }
    else:
        result = {
            "success": False,
            "error": "画像生成に失敗しました。プロンプトを変更して再試行してください。"
        }

    print(json.dumps(result, ensure_ascii=False))
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
