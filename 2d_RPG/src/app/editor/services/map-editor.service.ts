import { Injectable, computed, signal } from '@angular/core';
import { CollisionObject, CollisionRegion } from '../../shared/models/collision';
import { Entity } from '../../shared/models/entity';
import {
  GameMap,
  MAP_LAYER_LABELS,
  MAP_LAYER_ORDER,
  MapCell,
  MapLayerKind,
} from '../../shared/models/map';

const DEFAULT_TILE_SIZE = 32;
const DEFAULT_MAP_WIDTH = 40;
const DEFAULT_MAP_HEIGHT = 25;

@Injectable({ providedIn: 'root' })
export class MapEditorService {
  private readonly mapState = signal<GameMap>(
    this.createMap('map-grasslands', 'Grasslands Field', DEFAULT_MAP_WIDTH, DEFAULT_MAP_HEIGHT),
  );
  private readonly activeLayerIdState = signal<MapLayerKind>('ground');

  readonly map = computed(() => this.mapState());
  readonly activeLayerId = computed(() => this.activeLayerIdState());
  readonly activeLayer = computed(() =>
    this.mapState().layers.find((layer) => layer.id === this.activeLayerIdState()),
  );
  readonly collisionSummary = computed(() => {
    const map = this.mapState();
    const collisionTiles = map.layers.reduce(
      (total, layer) => total + layer.cells.filter((cell) => cell.collision).length,
      0,
    );
    return {
      collisionTiles,
      blockingObjects: map.collisionObjects.filter((object) => object.blocksMovement).length,
      blockingNpcs: map.npcs.filter((npc) => npc.blocksMovement).length,
      blockingEntities: map.entities.filter((entity) => entity.blocksMovement).length,
      totalEntities: map.entities.length,
      blockingRegions: map.specialRegions.filter((region) => region.blocksMovement).length,
    };
  });

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
        layer.id === layerId
          ? { ...layer, cells: layer.cells.map((cell) => ({ ...cell, tileId })) }
          : layer,
      ),
    }));
  }

  paintRectangle(
    start: { readonly column: number; readonly row: number },
    end: { readonly column: number; readonly row: number },
    tileId: number,
  ): void {
    this.paintArea(start, end, (cell) => ({ ...cell, tileId }));
  }

  paintCircle(
    center: { readonly column: number; readonly row: number },
    edge: { readonly column: number; readonly row: number },
    tileId: number,
  ): void {
    const radius = Math.max(1, Math.hypot(edge.column - center.column, edge.row - center.row));
    this.paintMatching(
      (column, row) => Math.hypot(column - center.column, row - center.row) <= radius,
      (cell) => ({ ...cell, tileId }),
    );
  }

  toggleCollision(column: number, row: number): void {
    this.updateCell(column, row, (cell) => ({ ...cell, collision: !cell.collision }));
  }

  upsertCollisionObject(object: CollisionObject): void {
    this.mapState.update((map) => ({
      ...map,
      collisionObjects: this.upsertById(map.collisionObjects, object),
    }));
  }

  upsertNpcCollision(npc: CollisionObject): void {
    this.mapState.update((map) => ({
      ...map,
      npcs: this.upsertById(map.npcs, npc),
    }));
  }

  upsertEntity(entity: Entity): void {
    this.mapState.update((map) => ({
      ...map,
      entities: this.upsertById(map.entities, entity),
      npcs:
        entity.type === 'npc'
          ? this.upsertById(map.npcs, {
              id: entity.id,
              name: entity.name,
              column: Math.round(entity.x),
              row: Math.round(entity.y),
              width: entity.width,
              height: entity.height,
              blocksMovement: entity.blocksMovement,
            })
          : map.npcs,
    }));
  }

  upsertSpecialRegion(region: CollisionRegion): void {
    this.mapState.update((map) => ({
      ...map,
      specialRegions: this.upsertById(map.specialRegions, region),
    }));
  }

  private upsertById<T extends { readonly id: string }>(
    items: readonly T[],
    item: T,
  ): readonly T[] {
    return items.some((entry) => entry.id === item.id)
      ? items.map((entry) => (entry.id === item.id ? item : entry))
      : [...items, item];
  }

  private updateCell(column: number, row: number, update: (cell: MapCell) => MapCell): void {
    this.paintMatching(
      (currentColumn, currentRow) => currentColumn === column && currentRow === row,
      update,
    );
  }

  private paintArea(
    start: { readonly column: number; readonly row: number },
    end: { readonly column: number; readonly row: number },
    update: (cell: MapCell) => MapCell,
  ): void {
    const minColumn = Math.min(start.column, end.column);
    const maxColumn = Math.max(start.column, end.column);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    this.paintMatching(
      (column, row) => column >= minColumn && column <= maxColumn && row >= minRow && row <= maxRow,
      update,
    );
  }

  private paintMatching(
    matches: (column: number, row: number) => boolean,
    update: (cell: MapCell) => MapCell,
  ): void {
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
    const createEmptyCells = () =>
      Array.from({ length: width * height }, (): MapCell => ({ tileId: null, collision: false }));
    return {
      id,
      name,
      width,
      height,
      tileSize: DEFAULT_TILE_SIZE,
      layers: MAP_LAYER_ORDER.map((layerId) => ({
        id: layerId,
        name: MAP_LAYER_LABELS[layerId],
        visible: true,
        cells: createEmptyCells(),
      })),
      collisionObjects: [
        {
          id: 'boulder-1',
          name: 'Boulder',
          column: 8,
          row: 7,
          width: 2,
          height: 2,
          blocksMovement: true,
        },
      ],
      npcs: [
        {
          id: 'npc-guard',
          name: 'Village Guard',
          column: 14,
          row: 10,
          width: 1,
          height: 1,
          blocksMovement: true,
        },
      ],
      events: [
        {
          id: 'event-bridge',
          name: 'Lower Bridge',
          trigger: 'action',
          commands: [
            {
              id: 'message-guard',
              type: 'show-message',
              speaker: 'Village Guard',
              message: 'The bridge is safe now. I will open the route.',
            },
            { id: 'switch-bridge', type: 'set-switch', switchId: 'bridgeLowered', value: true },
            { id: 'move-guard', type: 'move-npc', npcId: 'npc-guard', x: 15, y: 10 },
            { id: 'sound-bridge', type: 'play-sound', soundId: 'bridge-lower' },
          ],
        },
        {
          id: 'event-raft',
          name: 'Board Raft',
          trigger: 'touch',
          commands: [
            { id: 'music-river', type: 'play-music', musicId: 'river-theme', loop: true },
            { id: 'teleport-river', type: 'teleport', mapId: 'map-river', x: 4, y: 12 },
          ],
        },
      ],
      entities: [
        {
          id: 'npc-guard',
          name: 'Village Guard',
          type: 'npc',
          x: 14,
          y: 10,
          width: 1,
          height: 1,
          blocksMovement: true,
          tags: ['town'],
        },
        {
          id: 'monster-slime',
          name: 'Green Slime',
          type: 'monster',
          x: 18,
          y: 12,
          width: 1,
          height: 1,
          blocksMovement: true,
          tags: ['grasslands'],
        },
        {
          id: 'item-potion',
          name: 'Potion',
          type: 'item',
          x: 11,
          y: 6,
          width: 1,
          height: 1,
          blocksMovement: false,
          tags: ['pickup'],
        },
        {
          id: 'trigger-bridge',
          name: 'Bridge Event',
          type: 'trigger',
          x: 22,
          y: 9,
          width: 2,
          height: 1,
          blocksMovement: false,
          tags: ['event'],
        },
        {
          id: 'vehicle-raft',
          name: 'Raft',
          type: 'vehicle',
          x: 24,
          y: 5,
          width: 2,
          height: 1,
          blocksMovement: true,
          tags: ['water'],
        },
      ],
      specialRegions: [
        {
          id: 'deep-water',
          name: 'Deep Water',
          column: 20,
          row: 4,
          width: 5,
          height: 3,
          blocksMovement: true,
          tag: 'water',
        },
      ],
    };
  }
}
