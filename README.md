# Siege Pulse

A strategic turn-based board game where players control units to capture a central tower.

## Game Overview

Siege Pulse is a tactical game played on a 5x5 grid. Each player controls three different types of units, each with unique abilities. The goal is to either eliminate all enemy units or control the central tower for two consecutive turns.

## How to Play

1. Open `index.html` in a web browser to start the game
2. Players take turns moving their units and attacking opponent units
3. Click on one of your units to select it, then click on an adjacent square to move
4. Different units have different attack patterns:
   - **Blaster** (circle): Attacks adjacent squares
   - **Shield** (square): Protects adjacent friendly units
   - **Launcher** (triangle): Attacks in straight lines up to 3 squares away

## Game Mechanics

### Movement
- Units can move one square horizontally or vertically (not diagonally)
- Units cannot move through other units

### Tower Control
- The central tower is located in the middle of the board
- To control the tower, a player must have at least one unit adjacent to it
- The opponent must not have any units adjacent to the tower
- Control the tower for 2 consecutive turns to win

### Unit Types
1. **Blaster** (Circle)
   - Can attack enemy units in adjacent squares
   - Good for close combat

2. **Shield** (Square)
   - Protects all friendly units in adjacent squares
   - Protected units cannot be damaged by attacks
   - Essential for defense

3. **Launcher** (Triangle)
   - Can attack in straight lines (horizontally or vertically)
   - Range of up to 3 squares
   - Good for long-range attacks

### Win Conditions
- Eliminate all enemy units
- Control the central tower for 2 consecutive turns

## Development

This game is built using:
- HTML5
- CSS3
- JavaScript
- p5.js library for graphics and interaction

## Tips for Playing

- Keep your Shield unit alive to protect your other units
- Position your Launcher for maximum range advantage
- Control the center of the board to gain access to the tower
- Remember to press 'R' to restart the game after a win 
