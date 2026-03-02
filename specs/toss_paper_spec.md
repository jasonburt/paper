# Toss Paper - Game Spec

## Overview
Paper airplane throwing competition where players take turns throwing planes and placing obstacles.

## Core Mechanics
- **Throw**: Player aims and throws a paper airplane using drag-and-release (angle + power)
- **Obstacle Placement**: After throwing, the player places one obstacle on the field for the next player
- **Compounding Difficulty**: Obstacles accumulate with each turn, making later throws harder
- **Async Play**: Players take turns asynchronously within a Paper Crew room

## Scoring
- Distance-based scoring (further = more points)
- Bonus points for trick shots (through gaps, close calls with obstacles)
- High score leaderboard per Paper Crew room

## Physics
- Wind simulation (random per throw)
- Gravity arc on the airplane
- Collision detection with obstacles

## Obstacle Types
- Paper walls (blocks path)
- Paper fans (wind gusts)
- Crumpled paper balls (bouncy collision)

## Origami Integration
- Players can scan their own paper airplane designs to use as their throwing plane
- Custom plane skins from scanned origami

## Technical Notes
- Phaser Arcade physics for throw trajectory
- Async turns stored in SQLite (player_id, throw_data, obstacle_data)
- Replay system to watch previous throws
