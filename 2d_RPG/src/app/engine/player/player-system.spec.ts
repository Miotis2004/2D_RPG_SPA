import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { CollisionSystem } from '../collision/collision-system';
import { PlayerSystem } from './player-system';
import { GameMap } from '../../shared/models/map';

function createMap(): GameMap {
  return {
    id: 'test-map',
    name: 'Test Map',
    width: 6,
    height: 6,
    tileSize: 32,
    layers: [
      {
        id: 'ground',
        name: 'Ground',
        visible: true,
        cells: Array.from({ length: 36 }, () => ({ tileId: null, collision: false })),
      },
    ],
    collisionObjects: [{ id: 'rock', name: 'Rock', column: 3, row: 2, width: 1, height: 1, blocksMovement: true }],
    npcs: [],
    specialRegions: [],
  };
}

describe('PlayerSystem', () => {
  let playerSystem: PlayerSystem;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [CollisionSystem, PlayerSystem] });
    playerSystem = TestBed.inject(PlayerSystem);
    playerSystem.resetTo(2, 2);
  });

  it('walks in cardinal directions from keyboard input', () => {
    playerSystem.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
    playerSystem.update(250, createMap(), []);

    expect(playerSystem.player().direction).toBe('down');
    expect(playerSystem.player().moving).toBe(true);
    expect(playerSystem.player().row).toBe(3);
  });

  it('uses the run animation while shift is held', () => {
    playerSystem.handleKeyDown(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
    playerSystem.handleKeyDown(new KeyboardEvent('keydown', { code: 'KeyS' }));
    playerSystem.update(250, createMap(), []);

    expect(playerSystem.player().running).toBe(true);
    expect(playerSystem.player().animation).toBe('run');
  });

  it('stops movement when collision blocks the destination', () => {
    playerSystem.handleKeyDown(new KeyboardEvent('keydown', { code: 'ArrowRight' }));
    playerSystem.update(250, createMap(), []);

    expect(playerSystem.player().column).toBe(2);
    expect(playerSystem.player().moving).toBe(false);
    expect(playerSystem.player().animation).toBe('idle');
  });
});
