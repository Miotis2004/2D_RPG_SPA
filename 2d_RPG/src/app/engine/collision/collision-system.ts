import { Injectable } from '@angular/core';
import { CollisionHit, CollisionObject, CollisionRegion, GridPosition, MovementValidationResult } from '../../shared/models/collision';
import { GameMap, MapCell } from '../../shared/models/map';
import { Tileset } from '../../shared/models/tile';

@Injectable({ providedIn: 'root' })
export class CollisionSystem {
  validateMovement(
    gameMap: GameMap,
    target: GridPosition,
    tilesets: readonly Tileset[] = [],
    actorSize: { readonly width: number; readonly height: number } = { width: 1, height: 1 },
  ): MovementValidationResult {
    const occupiedTiles = this.getOccupiedTiles(target, actorSize);
    const hits: CollisionHit[] = [];

    for (const position of occupiedTiles) {
      if (!this.isInsideMap(gameMap, position)) {
        hits.push({ source: 'bounds', id: 'map-bounds', name: 'Map bounds', position });
        continue;
      }

      const tileHit = this.findTileCollision(gameMap, position, tilesets);
      if (tileHit) {
        hits.push(tileHit);
      }
    }

    hits.push(...this.findEntityHits('object', gameMap.collisionObjects, occupiedTiles));
    hits.push(...this.findEntityHits('npc', gameMap.npcs, occupiedTiles));
    hits.push(...this.findRegionHits(gameMap.specialRegions, occupiedTiles));

    return {
      valid: hits.length === 0,
      target,
      hits,
    };
  }

  canMove(
    gameMap: GameMap,
    target: GridPosition,
    tilesets: readonly Tileset[] = [],
    actorSize: { readonly width: number; readonly height: number } = { width: 1, height: 1 },
  ): boolean {
    return this.validateMovement(gameMap, target, tilesets, actorSize).valid;
  }

  isBlocked(gameMap: GameMap, position: GridPosition, tilesets: readonly Tileset[] = []): boolean {
    return !this.canMove(gameMap, position, tilesets);
  }

  private findTileCollision(gameMap: GameMap, position: GridPosition, tilesets: readonly Tileset[]): CollisionHit | undefined {
    for (const layer of gameMap.layers) {
      const cell = layer.cells[position.row * gameMap.width + position.column] as MapCell | undefined;
      if (!cell) {
        continue;
      }

      if (cell.collision || (cell.tileId !== null && this.tileBlocksMovement(cell.tileId, tilesets))) {
        return {
          source: 'tile',
          id: `${layer.id}:${position.column},${position.row}`,
          name: `${layer.name} collision`,
          position,
        };
      }
    }

    return undefined;
  }

  private tileBlocksMovement(tileId: number, tilesets: readonly Tileset[]): boolean {
    return tilesets.some((tileset) => tileset.tiles.some((tile) => tile.id === tileId && tile.collision));
  }

  private findEntityHits(
    source: 'object' | 'npc',
    entities: readonly CollisionObject[],
    positions: readonly GridPosition[],
  ): CollisionHit[] {
    return entities
      .filter((entity) => entity.blocksMovement)
      .flatMap((entity) =>
        positions
          .filter((position) => this.intersectsArea(position, entity))
          .map((position) => ({ source, id: entity.id, name: entity.name, position })),
      );
  }

  private findRegionHits(regions: readonly CollisionRegion[], positions: readonly GridPosition[]): CollisionHit[] {
    return regions
      .filter((region) => region.blocksMovement)
      .flatMap((region) =>
        positions
          .filter((position) => this.intersectsArea(position, region))
          .map((position) => ({ source: 'region' as const, id: region.id, name: region.name, position })),
      );
  }

  private getOccupiedTiles(position: GridPosition, size: { readonly width: number; readonly height: number }): readonly GridPosition[] {
    const width = Math.max(1, Math.ceil(size.width));
    const height = Math.max(1, Math.ceil(size.height));
    return Array.from({ length: width * height }, (_, index) => ({
      column: position.column + (index % width),
      row: position.row + Math.floor(index / width),
    }));
  }

  private isInsideMap(gameMap: GameMap, position: GridPosition): boolean {
    return position.column >= 0 && position.row >= 0 && position.column < gameMap.width && position.row < gameMap.height;
  }

  private intersectsArea(position: GridPosition, area: { readonly column: number; readonly row: number; readonly width: number; readonly height: number }): boolean {
    return position.column >= area.column && position.row >= area.row && position.column < area.column + area.width && position.row < area.row + area.height;
  }
}
