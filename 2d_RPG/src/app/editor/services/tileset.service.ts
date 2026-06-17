import { Injectable, computed, signal } from '@angular/core';
import { TerrainType, Tile, Tileset } from '../../shared/models/tile';

const DEFAULT_TILE_SIZE = 32;
const TERRAIN_SEQUENCE: readonly TerrainType[] = ['grass', 'water', 'forest', 'mountain', 'road', 'sand'];

@Injectable({ providedIn: 'root' })
export class TilesetService {
  private readonly tilesetsState = signal<readonly Tileset[]>([
    this.createTileset({
      id: 'grasslands-tileset',
      name: 'Grasslands',
      imageUrl: '',
      imageWidth: 256,
      imageHeight: 128,
      tileSize: DEFAULT_TILE_SIZE,
    }),
  ]);
  private readonly selectedTilesetIdState = signal('grasslands-tileset');
  private readonly selectedTileIdState = signal(0);

  readonly tilesets = computed(() => this.tilesetsState());
  readonly selectedTilesetId = computed(() => this.selectedTilesetIdState());
  readonly selectedTileId = computed(() => this.selectedTileIdState());
  readonly selectedTileset = computed(() =>
    this.tilesetsState().find((tileset) => tileset.id === this.selectedTilesetIdState()) ?? this.tilesetsState()[0],
  );
  readonly selectedTile = computed(() =>
    this.selectedTileset()?.tiles.find((tile) => tile.id === this.selectedTileIdState()) ??
    this.selectedTileset()?.tiles[0],
  );

  async importPng(file: File, tileSize = DEFAULT_TILE_SIZE): Promise<Tileset> {
    if (file.type !== 'image/png') {
      throw new Error('Only PNG tilesets are supported.');
    }

    const imageUrl = URL.createObjectURL(file);
    const dimensions = await this.readImageDimensions(imageUrl);
    const tileset = this.createTileset({
      id: `${file.name.replace(/\.png$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      name: file.name.replace(/\.png$/i, ''),
      imageUrl,
      imageWidth: dimensions.width,
      imageHeight: dimensions.height,
      tileSize,
    });

    this.tilesetsState.update((tilesets) => [...tilesets, tileset]);
    this.selectTileset(tileset.id);
    return tileset;
  }

  selectTileset(id: string): void {
    const tileset = this.tilesetsState().find((entry) => entry.id === id);
    if (!tileset) {
      return;
    }

    this.selectedTilesetIdState.set(id);
    this.selectedTileIdState.set(tileset.tiles[0]?.id ?? 0);
  }

  selectTile(id: number): void {
    if (this.selectedTileset()?.tiles.some((tile) => tile.id === id)) {
      this.selectedTileIdState.set(id);
    }
  }

  toggleSelectedTileCollision(): void {
    this.updateSelectedTile((tile) => ({ ...tile, collision: !tile.collision }));
  }

  paintSelectedTileTerrain(terrain: TerrainType): void {
    this.updateSelectedTile((tile) => ({ ...tile, terrain }));
  }

  private updateSelectedTile(update: (tile: Tile) => Tile): void {
    const tilesetId = this.selectedTilesetIdState();
    const tileId = this.selectedTileIdState();
    this.tilesetsState.update((tilesets) =>
      tilesets.map((tileset) =>
        tileset.id === tilesetId
          ? { ...tileset, tiles: tileset.tiles.map((tile) => (tile.id === tileId ? update(tile) : tile)) }
          : tileset,
      ),
    );
  }

  private createTileset(options: {
    readonly id: string;
    readonly name: string;
    readonly imageUrl: string;
    readonly imageWidth: number;
    readonly imageHeight: number;
    readonly tileSize: number;
  }): Tileset {
    const columns = Math.max(1, Math.floor(options.imageWidth / options.tileSize));
    const rows = Math.max(1, Math.floor(options.imageHeight / options.tileSize));
    const tiles = Array.from({ length: columns * rows }, (_, id): Tile => ({
      id,
      name: `Tile ${id + 1}`,
      sourceX: (id % columns) * options.tileSize,
      sourceY: Math.floor(id / columns) * options.tileSize,
      collision: false,
      terrain: TERRAIN_SEQUENCE[id % TERRAIN_SEQUENCE.length],
    }));

    return { ...options, columns, rows, tiles };
  }

  private readImageDimensions(imageUrl: string): Promise<{ readonly width: number; readonly height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Unable to read PNG dimensions.'));
      image.src = imageUrl;
    });
  }
}
