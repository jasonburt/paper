# Origami Scanner - Tool Spec

## Overview
Tool for scanning/uploading origami photos and transforming them into game-ready sprites with basic animation.

## Pipeline

### 1. Image Capture
- Upload photo or use device camera
- Crop tool to isolate the origami from background

### 2. Background Removal
- Remove background from photo (white/solid bg makes this easier)
- Edge detection to get clean silhouette
- Options: client-side (canvas manipulation) or API (remove.bg style)

### 3. Sprite Generation
- Clean cutout becomes the base sprite
- Apply paper texture overlay to normalize visual style
- Generate sprite at multiple sizes for game use

### 4. Animation Rigging (Simple)
- **Auto-segmentation**: Detect limbs/wings/legs by analyzing the silhouette shape
- **Pivot points**: Place joints at narrow connection points
- **Tween animation**: Rock/rotate segments for basic movement:
  - Legs: alternate rotation for walking
  - Wings: up/down rotation for flying
  - Head: slight bob
- This is NOT skeletal animation - just simple segment rotation via Phaser tweens

### 5. Creature Classification
- User tags creature type: runner, flyer, hopper
- Type determines movement pattern in games
- User names their creature

## Output Format
```
{
  "name": "Paper Dragon",
  "type": "flyer",
  "sprite": "base64 or path to processed image",
  "segments": [
    { "name": "body", "bounds": [x, y, w, h], "pivot": [px, py] },
    { "name": "left_wing", "bounds": [...], "pivot": [...], "animation": "flap" },
    { "name": "right_wing", "bounds": [...], "pivot": [...], "animation": "flap" }
  ]
}
```

## Technical Approach
- Canvas API for image processing (crop, background removal)
- Simple contour analysis for segment detection
- Phaser.GameObjects.Container to group segments
- Phaser tweens for animation per segment
