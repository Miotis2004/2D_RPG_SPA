import { Injectable, computed, signal } from '@angular/core';
import { CollisionSystem } from '../collision/collision-system';
import { GameMap } from '../../shared/models/map';
import { Tileset } from '../../shared/models/tile';
import { DEFAULT_CHARACTER_SPRITE_SHEET, PlayerAnimation, PlayerDirection, PlayerState } from '../../shared/models/player';

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

const DIRECTION_PRIORITY = ['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'] as const;

@Injectable({ providedIn: 'root' })
export class PlayerSystem {
  private readonly pressedKeys = new Set<string>();
  private animationElapsedMs = 0;
  private attackQueued = false;
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
    const action = player.animation === 'attack' ? 'Attacking' : player.running ? 'Running' : player.moving ? 'Walking' : 'Idle';
    return `${action} ${player.direction} @ ${player.column}, ${player.row}`;
  });

  constructor(private readonly collisionSystem: CollisionSystem) {}

  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.isPlayerKey(event)) return false;
    if (event.code === 'Space') {
      this.attackQueued = true;
      return true;
    }
    this.pressedKeys.add(event.code);
    return true;
  }

  handleKeyUp(event: KeyboardEvent): boolean {
    if (!this.isPlayerKey(event)) return false;
    this.pressedKeys.delete(event.code);
    return true;
  }

  update(deltaMs: number, gameMap: GameMap, tilesets: readonly Tileset[]): void {
    if (this.attackQueued && this.playerState().animation !== 'attack') {
      this.attackQueued = false;
      this.startAnimation('attack', false, false);
      return;
    }

    if (this.playerState().animation === 'attack') {
      this.updateAnimation(deltaMs, 'attack', false, false);
      return;
    }

    const direction = this.currentDirection();
    const running = this.pressedKeys.has('ShiftLeft') || this.pressedKeys.has('ShiftRight');

    if (!direction) {
      this.updateAnimation(deltaMs, 'idle', false, running);
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
      }));
      this.updateAnimation(deltaMs, running ? 'run' : 'walk', true, running);
    } else {
      this.playerState.update((player) => ({ ...player, direction }));
      this.updateAnimation(deltaMs, 'idle', false, false);
    }
  }

  resetTo(column: number, row: number): void {
    this.pressedKeys.clear();
    this.attackQueued = false;
    this.animationElapsedMs = 0;
    this.playerState.update((player) => ({ ...player, column, row, x: column, y: row, moving: false, running: false, animation: 'idle', animationFrame: 0 }));
  }

  private startAnimation(animation: PlayerAnimation, moving: boolean, running: boolean): void {
    this.animationElapsedMs = 0;
    this.playerState.update((player) => ({ ...player, moving, running, animation, animationFrame: 0 }));
  }

  private updateAnimation(deltaMs: number, animation: PlayerAnimation, moving: boolean, running: boolean): void {
    const current = this.playerState();
    const definition = current.spriteSheet.animations.find((entry) => entry.name === animation);
    if (!definition) return;

    if (current.animation !== animation) {
      this.startAnimation(animation, moving, running);
      return;
    }

    this.animationElapsedMs += deltaMs;
    if (this.animationElapsedMs < definition.frameDurationMs) {
      this.playerState.update((player) => ({ ...player, moving, running, animation }));
      return;
    }

    this.animationElapsedMs %= definition.frameDurationMs;
    const nextFrame = current.animationFrame + 1;
    if (!definition.loop && nextFrame >= definition.frameCount) {
      this.startAnimation('idle', false, false);
      return;
    }

    this.playerState.update((player) => ({ ...player, moving, running, animation, animationFrame: nextFrame % definition.frameCount }));
  }

  private currentDirection(): PlayerDirection | undefined {
    return DIRECTION_PRIORITY.map((code) => (this.pressedKeys.has(code) ? KEY_DIRECTIONS[code] : undefined)).find(
      (direction): direction is PlayerDirection => Boolean(direction),
    );
  }

  private isPlayerKey(event: KeyboardEvent): boolean {
    return Boolean(KEY_DIRECTIONS[event.code]) || event.code === 'ShiftLeft' || event.code === 'ShiftRight' || event.code === 'Space';
  }
}
