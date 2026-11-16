#!/usr/bin/env python3
"""
四季の籤詩・謐夜塔羅 - Gemini API (Lyria 3.5) 背景音樂生成腳本
使用官方 google-genai SDK 呼叫 Lyria 音樂生成模型，生成專屬的高品質環境純音樂。
"""

import os
import sys
import base64
from pathlib import Path

# 載入環境變數（支援 ~/.env 或本專案目錄下的 .env）
try:
    from dotenv import load_dotenv
    home_env = Path.home() / ".env"
    if home_env.exists():
        load_dotenv(dotenv_path=home_env)
    local_env = Path(__file__).resolve().parent.parent / ".env"
    if local_env.exists():
        load_dotenv(dotenv_path=local_env)
except ImportError:
    pass

try:
    from google import genai
except ImportError:
    print("請先安裝官方 SDK: pip install google-genai")
    sys.exit(1)

# 四季音樂 Prompt 定義
SEASON_MUSIC_PROMPTS = {
    "spring-piano": {
        "filename": "spring-piano.mp3",
        "description": "春・初綻（晨露與鋼琴獨奏）",
        "prompt": (
            "A serene, cinematic, modern classical solo piano piece. Morning dew gently dripping from cherry blossom petals. "
            "Delicate, minimalist acoustic piano melodies with warm acoustic reverb and peaceful emotional resonance. "
            "Soft touch, gentle tempo, loopable ambient atmosphere."
        )
    },
    "summer-night": {
        "filename": "summer-night.mp3",
        "description": "夏・仲夜（仲夜微風與大提琴）",
        "prompt": (
            "Deep, contemplative ambient chamber music. A resonant warm cello solo layered with gentle midnight breeze, "
            "distant starlight bell harmonics, and subtle nocturnal atmospheric pad. Ethereal, tranquil, and romantic."
        )
    },
    "autumn-rain": {
        "filename": "autumn-rain.mp3",
        "description": "秋・暮光（暮光與細雨聲）",
        "prompt": (
            "An intimate acoustic soundscape. Gentle rain gently falling outside the window at amber sunset. "
            "Warm nylon guitar and soft piano chords, soothing raindrops on glass, warm nostalgic resonance, calm and reflective."
        )
    },
    "winter-silence": {
        "filename": "winter-silence.mp3",
        "description": "冬・初雪（初雪與空靈環境音）",
        "prompt": (
            "Pure, crystalline ambient silence and first snowfall. High-frequency singing glass bowls, ethereal frosty harmonics, "
            "delicate ice crystal bell tones, and a deep soothing sub-bass drone. Meditative, expansive, and peaceful."
        )
    }
}

def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("未檢測到 GEMINI_API_KEY 環境變數。")
        print("請先設定金鑰（例：export GEMINI_API_KEY=\"your_key\" 或存於 ~/.env）。")
        print("前往獲取 API Key: https://aistudio.google.com/docs/api-key")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    output_dir = Path(__file__).resolve().parent.parent / "assets" / "audio"
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=== 四季の籤詩・謐夜塔羅 - Gemini API 音樂生成 ===")
    
    for key, info in SEASON_MUSIC_PROMPTS.items():
        dest_path = output_dir / info["filename"]
        print(f"\n正在生成：{info['description']}...")
        print(f"Prompt: {info['prompt']}")

        try:
            interaction = client.interactions.create(
                model="lyria-3.5",  # 或 lyria-3-clip-preview
                input=info["prompt"]
            )

            if hasattr(interaction, "output_audio") and interaction.output_audio:
                audio_data = base64.b64decode(interaction.output_audio.data)
                with open(dest_path, "wb") as f:
                    f.write(audio_data)
                print(f"成功儲存至: {dest_path} ({len(audio_data) / 1024:.1f} KB)")
            else:
                print(f"警告：模型未回傳音訊資料，狀態: {getattr(interaction, 'status', '未知')}")
        except Exception as e:
            print(f"生成失敗: {type(e).__name__} - {e}")

    print("\n所有季節音樂處理完成！")

if __name__ == "__main__":
    main()
