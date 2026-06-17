export type TerrainType = 'grass' | 'water' | 'forest' | 'mountain' | 'road' | 'sand';

export interface Tile {
  readonly id: number;
  readonly name: string;
  readonly sourceX: number;
  readonly sourceY: number;
  readonly collision: boolean;
  readonly terrain: TerrainType;
}

export interface Tileset {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly tileSize: number;
  readonly columns: number;
  readonly rows: number;
  readonly tiles: readonly Tile[];
}
