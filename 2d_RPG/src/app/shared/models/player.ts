export type PlayerDirection = 'up' | 'down' | 'left' | 'right';
export type PlayerAnimation = 'idle' | 'walk' | 'run' | 'attack';

export interface CharacterAnimationDefinition {
  readonly name: PlayerAnimation;
  readonly frameCount: number;
  readonly frameDurationMs: number;
  readonly row: number;
  readonly loop: boolean;
}

export interface CharacterSpriteSheet {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly directionRows: Record<PlayerDirection, number>;
  readonly animations: readonly CharacterAnimationDefinition[];
}

export interface CharacterSpriteFrame {
  readonly sourceX: number;
  readonly sourceY: number;
  readonly width: number;
  readonly height: number;
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
  directionRows: {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
  },
  animations: [
    { name: 'idle', frameCount: 2, frameDurationMs: 450, row: 0, loop: true },
    { name: 'walk', frameCount: 4, frameDurationMs: 160, row: 4, loop: true },
    { name: 'run', frameCount: 4, frameDurationMs: 90, row: 8, loop: true },
    { name: 'attack', frameCount: 3, frameDurationMs: 110, row: 12, loop: false },
  ],
};

export function getCharacterSpriteFrame(player: PlayerState): CharacterSpriteFrame {
  const definition = player.spriteSheet.animations.find((entry) => entry.name === player.animation);
  const animationRow = definition?.row ?? 0;
  const directionOffset = player.spriteSheet.directionRows[player.direction] ?? 0;

  return {
    sourceX: player.animationFrame * player.spriteSheet.frameWidth,
    sourceY: (animationRow + directionOffset) * player.spriteSheet.frameHeight,
    width: player.spriteSheet.frameWidth,
    height: player.spriteSheet.frameHeight,
  };
}
