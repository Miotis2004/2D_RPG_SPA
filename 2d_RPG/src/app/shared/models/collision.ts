export type CollisionSource = 'bounds' | 'tile' | 'object' | 'npc' | 'region';

export interface GridPosition {
  readonly column: number;
  readonly row: number;
}

export interface CollisionObject {
  readonly id: string;
  readonly name: string;
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
  readonly blocksMovement: boolean;
}

export interface CollisionRegion {
  readonly id: string;
  readonly name: string;
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
  readonly blocksMovement: boolean;
  readonly tag: string;
}

export interface CollisionHit {
  readonly source: CollisionSource;
  readonly id: string;
  readonly name: string;
  readonly position: GridPosition;
}

export interface MovementValidationResult {
  readonly valid: boolean;
  readonly target: GridPosition;
  readonly hits: readonly CollisionHit[];
}
