#!/usr/bin/env python3
"""
Create a viral Hindi story video by combining scene images with narration audio.
Output: A ready-to-upload MP4 video for YouTube.
"""

from moviepy import (
    ImageClip, AudioFileClip, CompositeVideoClip, TextClip,
    concatenate_videoclips, ColorClip
)
import os

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
IMG_DIR = os.path.join(BASE_DIR, "images")
OUTPUT_PATH = os.path.join(BASE_DIR, "FINAL_VIDEO_auto_wale_ka_beta.mp4")

# Font paths
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

# Video settings
VIDEO_WIDTH = 1920
VIDEO_HEIGHT = 1080
FPS = 24
BG_COLOR = (10, 10, 10)

# Scene definitions
scenes = [
    {
        "image": "scene1_school_morning.jpg",
        "audio": "scene1_opening.mp3",
        "subtitle": "Subah ke 5 baje... Auto wale ka beta school jaata hai"
    },
    {
        "image": "scene2_studying_streetlight.jpg",
        "audio": "scene2_struggle.mp3",
        "subtitle": "Fati vardi, purani kitabein... Par aankhon mein ek sapna tha"
    },
    {
        "image": "scene3_father_auto_rain.jpg",
        "audio": "scene3_father.mp3",
        "subtitle": "\"Beta, meri thakan teri kamyabi se mit jayegi\""
    },
    {
        "image": "scene4_hardwork_night.jpg",
        "audio": "scene4_hardwork.mp3",
        "subtitle": "Jab sab sote, wo jaagta... Har mushkil ko haraya"
    },
    {
        "image": "scene5_ias_result.jpg",
        "audio": "scene5_result.mp3",
        "subtitle": "IAS ka result aaya... Raju ne poore zile mein TOP kiya!"
    },
    {
        "image": "scene6_father_office_gate.jpg",
        "audio": "scene6_climax.mp3",
        "subtitle": "\"Papa, aapki thakan... Aaj mit gayi\" <3"
    },
    {
        "image": "scene7_inspirational_end.jpg",
        "audio": "scene7_closing.mp3",
        "subtitle": "Garibi kabhi haar nahi hoti | LIKE * SHARE * SUBSCRIBE"
    },
]


def make_text_overlay(text, font_size=38, color='white', duration=5, width=None):
    """Create a text clip using full font path."""
    if width is None:
        width = VIDEO_WIDTH - 200
    try:
        txt = TextClip(
            text=text,
            font_size=font_size,
            color=color,
            font=FONT_BOLD if font_size > 50 else FONT_REGULAR,
            text_align="center",
            size=(width, None),
            method="caption",
        ).with_duration(duration)
        return txt
    except Exception as e:
        print(f"    TextClip error: {e}")
        return None


def create_scene_clip(scene_data, scene_num):
    """Create a single scene with image, audio, and subtitles."""
    audio_path = os.path.join(AUDIO_DIR, scene_data["audio"])
    img_path = os.path.join(IMG_DIR, scene_data["image"])
    
    # Load audio - use exact audio duration for the clip
    audio = AudioFileClip(audio_path)
    duration = audio.duration  # Match exactly
    
    # Create image clip
    img_clip = ImageClip(img_path).with_duration(duration)
    
    # Scale to fill frame
    img_w, img_h = img_clip.size
    scale = max(VIDEO_WIDTH / img_w, VIDEO_HEIGHT / img_h) * 1.05
    new_w = int(img_w * scale)
    new_h = int(img_h * scale)
    
    img_clip = img_clip.resized((new_w, new_h))
    img_clip = img_clip.with_position(("center", "center"))
    
    # Create subtitle bar
    bar_height = 140
    bar = ColorClip(
        size=(VIDEO_WIDTH, bar_height),
        color=(0, 0, 0)
    ).with_opacity(0.75).with_duration(duration).with_position(("center", VIDEO_HEIGHT - bar_height - 30))
    
    # Create subtitle text
    txt = make_text_overlay(
        scene_data["subtitle"],
        font_size=34,
        color='white',
        duration=duration,
        width=VIDEO_WIDTH - 100
    )
    
    # Build layers
    layers = [img_clip, bar]
    if txt:
        txt = txt.with_position(("center", VIDEO_HEIGHT - bar_height + 20))
        layers.append(txt)
    
    # Scene number indicator (top-left)
    try:
        scene_label = TextClip(
            text=f"Scene {scene_num}/7",
            font_size=20,
            color='#888888',
            font=FONT_REGULAR,
        ).with_duration(duration).with_position((30, 30))
        layers.append(scene_label)
    except:
        pass
    
    scene_clip = CompositeVideoClip(layers, size=(VIDEO_WIDTH, VIDEO_HEIGHT))
    scene_clip = scene_clip.with_audio(audio)
    scene_clip = scene_clip.with_duration(duration)
    
    return scene_clip


def create_title_card():
    """Opening title card."""
    duration = 3.5
    bg = ColorClip(size=(VIDEO_WIDTH, VIDEO_HEIGHT), color=BG_COLOR).with_duration(duration)
    
    title = make_text_overlay("AUTO WALE KA BETA", font_size=72, color='#FFD700', duration=duration)
    subtitle = make_text_overlay("Ek Sacchi Prernadayak Kahani", font_size=36, color='white', duration=duration)
    tagline = make_text_overlay("Based on Real Struggles of Every Indian Father & Son", font_size=24, color='#AAAAAA', duration=duration)
    
    layers = [bg]
    if title:
        title = title.with_position(("center", VIDEO_HEIGHT // 2 - 100))
        layers.append(title)
    if subtitle:
        subtitle = subtitle.with_position(("center", VIDEO_HEIGHT // 2 + 10))
        layers.append(subtitle)
    if tagline:
        tagline = tagline.with_position(("center", VIDEO_HEIGHT // 2 + 80))
        layers.append(tagline)
    
    return CompositeVideoClip(layers, size=(VIDEO_WIDTH, VIDEO_HEIGHT)).with_duration(duration)


def create_end_card():
    """Closing end card."""
    duration = 5.0
    bg = ColorClip(size=(VIDEO_WIDTH, VIDEO_HEIGHT), color=BG_COLOR).with_duration(duration)
    
    thanks = make_text_overlay("DHANYAVAD!", font_size=64, color='#FFD700', duration=duration)
    cta = make_text_overlay("LIKE  |  SHARE  |  SUBSCRIBE", font_size=42, color='white', duration=duration)
    comment = make_text_overlay("Comment: Papa I love you <3", font_size=28, color='#AAAAAA', duration=duration)
    
    layers = [bg]
    if thanks:
        thanks = thanks.with_position(("center", VIDEO_HEIGHT // 2 - 100))
        layers.append(thanks)
    if cta:
        cta = cta.with_position(("center", VIDEO_HEIGHT // 2 + 10))
        layers.append(cta)
    if comment:
        comment = comment.with_position(("center", VIDEO_HEIGHT // 2 + 80))
        layers.append(comment)
    
    return CompositeVideoClip(layers, size=(VIDEO_WIDTH, VIDEO_HEIGHT)).with_duration(duration)


def main():
    print("=" * 60)
    print("  CREATING VIRAL HINDI VIDEO: Auto Wale Ka Beta")
    print("=" * 60)
    
    all_clips = []
    
    # Title card
    print("\n[1/9] Creating title card...")
    all_clips.append(create_title_card())
    print("  Done!")
    
    # Story scenes
    for i, scene in enumerate(scenes, 1):
        print(f"\n[{i+1}/9] Creating Scene {i}/7: {scene['audio']}...")
        clip = create_scene_clip(scene, i)
        all_clips.append(clip)
        print(f"  Duration: {clip.duration:.1f}s")
    
    # End card
    print(f"\n[9/9] Creating end card...")
    all_clips.append(create_end_card())
    print("  Done!")
    
    # Concatenate
    print("\n--- Joining all clips ---")
    final_video = concatenate_videoclips(all_clips, method="compose")
    total = final_video.duration
    print(f"Total duration: {total:.1f}s ({total/60:.1f} min)")
    
    # Export
    print(f"\n--- Rendering video ---")
    final_video.write_videofile(
        OUTPUT_PATH,
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        audio_bitrate="192k",
        preset="medium",
        threads=4,
        logger="bar"
    )
    
    file_size = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    
    print("\n" + "=" * 60)
    print("  VIDEO CREATED SUCCESSFULLY!")
    print(f"  File: {OUTPUT_PATH}")
    print(f"  Size: {file_size:.1f} MB")
    print(f"  Duration: {total:.1f}s ({total/60:.1f} min)")
    print(f"  Resolution: {VIDEO_WIDTH}x{VIDEO_HEIGHT}")
    print("=" * 60)


if __name__ == "__main__":
    main()
