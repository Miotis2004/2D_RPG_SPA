import { Injectable, computed, signal } from '@angular/core';
import { GameMap, MAP_LAYER_LABELS, MAP_LAYER_ORDER, MapCell, MapLayerKind } from '../../shared/models/map';

const DEFAULT_TILE_SIZE = 32;
const DEFAULT_MAP_WIDTH = 40;
const DEFAULT_MAP_HEIGHT = 25;

@Injectable({ providedIn: 'root' })
export class MapEditorService {
  private readonly mapState = signal<GameMap>(this.createMap('map-grasslands', 'Grasslands Field', DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT));
  private readonly activeLayerIdState = signal<MapLayerKind>('ground');

  readonly map = computed(() => this.mapState());
  readonly activeLayerId = computed(() => this.activeLayerIdState());
  readonly activeLayer = computed(() => this.mapState().layers.find((layer) => layer.id === this.activeLayerIdState()));

  createNewMap(width = DEFAULT_MAP_WIDTH, height = DEFAULT_MAP_HEIGHT): void {
    this.mapState.set(this.createMap(`map-${Date.now()}`, 'Untitled Map', width, height));
    this.activeLayerIdState.set('ground');
  }

  setActiveLayer(layerId: MapLayerKind): void {
    if (this.mapState().layers.some((layer) => layer.id === layerId)) {
      this.activeLayerIdState.set(layerId);
    }
  }

  setLayerVisibility(layerId: MapLayerKind, visible: boolean): void {
    this.mapState.update((map) => ({
      ...map,
      layers: map.layers.map((layer) => (layer.id === layerId ? { ...layer, visible } : layer)),
    }));
  }

  paintTile(column: number, row: number, tileId: number): void {
    this.updateCell(column, row, (cell) => ({ ...cell, tileId }));
  }

  eraseTile(column: number, row: number): void {
    this.updateCell(column, row, (cell) => ({ ...cell, tileId: null, collision: false }));
  }

  fill(tileId: number): void {
    const layerId = this.activeLayerIdState();
    this.mapState.update((map) => ({
      ...map,
      layers: map.layers.map((layer) =>
        layer.id === layerId ? { ...layer, cells: layer.cells.map((cell) => ({ ...cell, tileId })) } : layer,
      ),
    }));
  }

  paintRectangle(start: { readonly column: number; readonly row: number }, end: { readonly column: number; readonly row: number }, tileId: number): void {
    this.paintArea(start, end, (cell) => ({ ...cell, tileId }));
  }

  paintCircle(center: { readonly column: number; readonly row: number }, edge: { readonly column: number; readonly row: number }, tileId: number): void {
    const radius = Math.max(1, Math.hypot(edge.column - center.column, edge.row - center.row));
    this.paintMatching((column, row) => Math.hypot(column - center.column, row - center.row) <= radius, (cell) => ({ ...cell, tileId }));
  }

  toggleCollision(column: number, row: number): void {
    this.updateCell(column, row, (cell) => ({ ...cell, collision: !cell.collision }));
  }

  private updateCell(column: number, row: number, update: (cell: MapCell) => MapCell): void {
    this.paintMatching((currentColumn, currentRow) => currentColumn === column && currentRow === row, update);
  }

  private paintArea(start: { readonly column: number; readonly row: number }, end: { readonly column: number; readonly row: number }, update: (cell: MapCell) => MapCell): void {
    const minColumn = Math.min(start.column, end.column);
    const maxColumn = Math.max(start.column, end.column);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    this.paintMatching((column, row) => column >= minColumn && column <= maxColumn && row >= minRow && row <= maxRow, update);
  }

  private paintMatching(matches: (column: number, row: number) => boolean, update: (cell: MapCell) => MapCell): void {
    const layerId = this.activeLayerIdState();
    this.mapState.update((map) => ({
      ...map,
      layers: map.layers.map((layer) => {
        if (layer.id !== layerId) {
          return layer;
        }

        return {
          ...layer,
          cells: layer.cells.map((cell, index) => {
            const column = index % map.width;
            const row = Math.floor(index / map.width);
            return matches(column, row) ? update(cell) : cell;
          }),
        };
      }),
    }));
  }

  private createMap(id: string, name: string, width: number, height: number): GameMap {
    const emptyCells = Array.from({ length: width * height }, (): MapCell => ({ tileId: null, collision: false }));
    return {
      id,
      name,
      width,
      height,
      tileSize: DEFAULT_TILE_SIZE,
      layers: MAP_LAYER_ORDER.map((layerId) => ({ id: layerId, name: MAP_LAYER_LABELS[layerId], visible: true, cells: emptyCells })),
    };
  }
}
