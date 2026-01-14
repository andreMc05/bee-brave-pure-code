# Bee Brave - Developer Knowledge Base

This folder contains documentation and learnings from developing the Bee Brave game. It serves as a reference to avoid re-evaluating the codebase repeatedly.

## Contents

- `architecture.md` - Overall game architecture and file structure
- `bees.md` - Bee system (regular bees, hunter bees, animations)
- `game-state.md` - Game state management, variables, and flow
- `rendering.md` - Drawing and rendering system
- `combat.md` - Combat mechanics, weapons, and damage system
- `config-reference.md` - All game constants and their values

## Quick Reference

### Game Overview
Bee Brave is a canvas-based HTML5 game where the player defends a beehive from various threats. The player controls a character that can move and shoot, while bees forage for resources and can become aggressive.

### Tech Stack
- Pure JavaScript (no frameworks)
- HTML5 Canvas for rendering
- CSS for UI styling
- No build system - runs directly in browser

### Key Entry Points
- `index.html` - Main game file, contains UI and script imports
- `js/game.js` - Main game loop and initialization
- `js/draw.js` - All rendering functions
- `js/bees.js` - Bee behavior and management
