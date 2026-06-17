export type MapLayerKind = 'ground' | 'decoration' | 'collision' | 'roof' | 'above-player';

export interface MapCell {
  readonly tileId: number | null;
  readonly collision: boolean;
}

export interface MapLayer {
  readonly id: MapLayerKind;
  readonly name: string;
  readonly visible: boolean;
  readonly cells: readonly MapCell[];
}

export interface GameMap {
  readonly id: string;
  readonly name: string;
  readonly width: number;
  readonly height: number;
  readonly tileSize: number;
  readonly layers: readonly MapLayer[];
}

export const MAP_LAYER_ORDER: readonly MapLayerKind[] = [
  'ground',
  'decoration',
  'collision',
  'roof',
  'above-player',
];

export const MAP_LAYER_LABELS: Record<MapLayerKind, string> = {
  ground: 'Ground',
  decoration: 'Decoration',
  collision: 'Collision',
  roof: 'Roof',
  'above-player': 'Above Player',
};
