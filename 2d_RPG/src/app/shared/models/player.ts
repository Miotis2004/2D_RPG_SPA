export type PlayerDirection = 'up' | 'down' | 'left' | 'right';
export type PlayerAnimation = 'idle' | 'walk' | 'run' | 'attack';

export interface CharacterAnimationDefinition {
  readonly name: PlayerAnimation;
  readonly frameCount: number;
  readonly frameDurationMs: number;
}

export interface CharacterSpriteSheet {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly animations: readonly CharacterAnimationDefinition[];
}

export interface PlayerState {
  readonly id: string;
  readonly name: string;
  readonly column: number;
  readonly row: number;
  readonly x: number;
  readonly y: number;
  readonly direction: PlayerDirection;
  readonly animation: PlayerAnimation;
  readonly speedTilesPerSecond: number;
  readonly runMultiplier: number;
  readonly moving: boolean;
  readonly running: boolean;
  readonly animationFrame: number;
  readonly spriteSheet: CharacterSpriteSheet;
}

export const DEFAULT_CHARACTER_SPRITE_SHEET: CharacterSpriteSheet = {
  id: 'hero-basic-spritesheet',
  name: 'Basic Hero',
  imageUrl: 'generated://basic-hero',
  frameWidth: 32,
  frameHeight: 32,
  animations: [
    { name: 'idle', frameCount: 2, frameDurationMs: 450 },
    { name: 'walk', frameCount: 4, frameDurationMs: 160 },
    { name: 'run', frameCount: 4, frameDurationMs: 90 },
    { name: 'attack', frameCount: 3, frameDurationMs: 110 },
  ],
};
