import { Injectable, computed, signal } from '@angular/core';
import { CollisionSystem } from '../collision/collision-system';
import { GameMap } from '../../shared/models/map';
import { Tileset } from '../../shared/models/tile';
import { DEFAULT_CHARACTER_SPRITE_SHEET, PlayerDirection, PlayerState } from '../../shared/models/player';

const DIRECTION_VECTORS: Record<PlayerDirection, { readonly column: number; readonly row: number }> = {
  up: { column: 0, row: -1 },
  down: { column: 0, row: 1 },
  left: { column: -1, row: 0 },
  right: { column: 1, row: 0 },
};

const KEY_DIRECTIONS: Record<string, PlayerDirection | undefined> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

@Injectable({ providedIn: 'root' })
export class PlayerSystem {
  private readonly pressedKeys = new Set<string>();
  private animationElapsedMs = 0;
  private readonly playerState = signal<PlayerState>({
    id: 'player-hero',
    name: 'Hero',
    column: 2,
    row: 2,
    x: 2,
    y: 2,
    direction: 'down',
    animation: 'idle',
    speedTilesPerSecond: 4,
    runMultiplier: 1.8,
    moving: false,
    running: false,
    animationFrame: 0,
    spriteSheet: DEFAULT_CHARACTER_SPRITE_SHEET,
  });

  readonly player = computed(() => this.playerState());
  readonly status = computed(() => {
    const player = this.playerState();
    const action = player.running ? 'Running' : player.moving ? 'Walking' : 'Idle';
    return `${action} ${player.direction} @ ${player.column}, ${player.row}`;
  });

  constructor(private readonly collisionSystem: CollisionSystem) {}

  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.isPlayerKey(event)) return false;
    this.pressedKeys.add(event.code);
    return true;
  }

  handleKeyUp(event: KeyboardEvent): boolean {
    if (!this.isPlayerKey(event)) return false;
    this.pressedKeys.delete(event.code);
    return true;
  }

  update(deltaMs: number, gameMap: GameMap, tilesets: readonly Tileset[]): void {
    const direction = this.currentDirection();
    const running = this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');

    if (!direction) {
      this.updateAnimation(deltaMs, false, running);
      return;
    }

    const current = this.playerState();
    const vector = DIRECTION_VECTORS[direction];
    const speed = current.speedTilesPerSecond * (running ? current.runMultiplier : 1);
    const nextX = current.x + vector.column * speed * (deltaMs / 1000);
    const nextY = current.y + vector.row * speed * (deltaMs / 1000);
    const target = { column: Math.round(nextX), row: Math.round(nextY) };

    if (this.collisionSystem.canMove(gameMap, target, tilesets)) {
      this.playerState.update((player) => ({
        ...player,
        x: nextX,
        y: nextY,
        column: target.column,
        row: target.row,
        direction,
        moving: true,
        running,
        animation: running ? 'run' : 'walk',
      }));
    } else {
      this.playerState.update((player) => ({ ...player, direction, moving: false, running: false, animation: 'idle' }));
    }

    this.updateAnimation(deltaMs, true, running);
  }

  resetTo(column: number, row: number): void {
    this.pressedKeys.clear();
    this.playerState.update((player) => ({ ...player, column, row, x: column, y: row, moving: false, running: false, animation: 'idle', animationFrame: 0 }));
  }

  private updateAnimation(deltaMs: number, moving: boolean, running: boolean): void {
    const animation = moving ? (running ? 'run' : 'walk') : 'idle';
    const definition = this.playerState().spriteSheet.animations.find((entry) => entry.name === animation);
    if (!definition) return;
    this.animationElapsedMs += deltaMs;
    if (this.animationElapsedMs >= definition.frameDurationMs) {
      this.animationElapsedMs = 0;
      this.playerState.update((player) => ({ ...player, moving, running, animation, animationFrame: (player.animationFrame + 1) % definition.frameCount }));
    } else {
      this.playerState.update((player) => ({ ...player, moving, running, animation }));
    }
  }

  private currentDirection(): PlayerDirection | undefined {
    return ['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD']
      .map((code) => (this.pressedKeys.has(code) ? KEY_DIRECTIONS[code] : undefined))
      .find((direction): direction is PlayerDirection => Boolean(direction));
  }

  private isPlayerKey(event: KeyboardEvent): boolean {
    return Boolean(KEY_DIRECTIONS[event.code]) || event.code === 'ShiftLeft' || event.code === 'ShiftRight';
  }
}
