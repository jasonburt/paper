# Origami Trail - Game Spec

## Overview
Origami creatures run/fly across the screen and the player shoots them to score points. Inspired by Duck Hunt and Oregon Trail.

## Core Mechanics
- **Creatures**: Origami animals move across the screen in patterns (running, flying, hopping)
- **Shooting**: Player clicks/taps to shoot at creatures
- **Waves**: Increasingly difficult waves with faster/smaller creatures
- **Environment**: Rocks, trees, and obstacles that creatures can hide behind

## Scoring
- Points per creature hit (varies by difficulty of creature)
- Combo multiplier for consecutive hits
- Time bonus for clearing waves quickly
- High score leaderboard per Paper Crew room

## Creature Types
- **Runners**: Move across ground (origami dogs, dinosaurs, rabbits)
- **Flyers**: Move through air (origami birds, butterflies, dragons)
- **Hoppers**: Jump unpredictably (origami frogs, kangaroos)

## Environment
- Scrolling background (paper-textured landscape)
- Foreground obstacles (paper trees, rocks) that block shots
- Day/night cycle across waves

## Origami Integration
- Players scan their own origami creatures to add to the game
- Scanned creatures become targets with auto-generated movement based on creature type
- Rare/custom creatures worth bonus points

## Technical Notes
- Phaser tweens and paths for creature movement
- Sprite animation from scanned origami (simple limb segmentation)
- Hit detection via Phaser input + physics overlap
