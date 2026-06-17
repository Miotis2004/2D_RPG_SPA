export type EntityType = 'npc' | 'monster' | 'item' | 'trigger' | 'vehicle';

export interface Entity {
  readonly id: string;
  readonly name: string;
  readonly type: EntityType;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly blocksMovement: boolean;
  readonly tags: readonly string[];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface EntitySpawnRequest {
  readonly id?: string;
  readonly name: string;
  readonly type: EntityType;
  readonly x: number;
  readonly y: number;
  readonly width?: number;
  readonly height?: number;
  readonly blocksMovement?: boolean;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, string | number | boolean>>;
}

export interface EntityQuery {
  readonly type?: EntityType;
  readonly tag?: string;
  readonly blocksMovement?: boolean;
}

export function entityToCollisionArea(entity: Entity): {
  readonly id: string;
  readonly name: string;
  readonly column: number;
  readonly row: number;
  readonly width: number;
  readonly height: number;
  readonly blocksMovement: boolean;
} {
  return {
    id: entity.id,
    name: entity.name,
    column: Math.round(entity.x),
    row: Math.round(entity.y),
    width: entity.width,
    height: entity.height,
    blocksMovement: entity.blocksMovement,
  };
}
