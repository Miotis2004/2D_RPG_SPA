import { Container, Graphics } from 'pixi.js';
import { GameMap, MapLayerKind } from '../../shared/models/map';
import { Viewport } from './viewport';

const TILE_COLORS = [
  0x2f9e44, 0x1c7ed6, 0x37b24d, 0x868e96, 0xcc8f2f, 0xf59f00, 0x7048e8, 0xe64980,
];
const LAYER_ALPHA: Record<MapLayerKind, number> = {
  ground: 1,
  decoration: 0.78,
  collision: 0.42,
  roof: 0.58,
  'above-player': 0.72,
};

export class MapRenderer {
  readonly container = new Container();
  private readonly layerGraphics = new Map<MapLayerKind, Graphics>();

  render(gameMap: GameMap, viewport: Viewport): number {
    this.container.position.set(
      -viewport.bounds.left * viewport.cameraState.zoom,
      -viewport.bounds.top * viewport.cameraState.zoom,
    );
    this.container.scale.set(viewport.cameraState.zoom);

    const startColumn = Math.max(0, Math.floor(viewport.bounds.left / gameMap.tileSize) - 1);
    const endColumn = Math.min(
      gameMap.width - 1,
      Math.ceil(viewport.bounds.right / gameMap.tileSize) + 1,
    );
    const startRow = Math.max(0, Math.floor(viewport.bounds.top / gameMap.tileSize) - 1);
    const endRow = Math.min(
      gameMap.height - 1,
      Math.ceil(viewport.bounds.bottom / gameMap.tileSize) + 1,
    );
    let visibleTiles = 0;

    for (const layer of gameMap.layers) {
      const graphics = this.getLayerGraphics(layer.id);
      graphics.clear();
      graphics.visible = layer.visible;
      if (!layer.visible) {
        continue;
      }

      for (let row = startRow; row <= endRow; row++) {
        for (let column = startColumn; column <= endColumn; column++) {
          const cell = layer.cells[row * gameMap.width + column];
          if (!cell || (cell.tileId === null && !cell.collision)) {
            continue;
          }

          visibleTiles++;
          const x = column * gameMap.tileSize;
          const y = row * gameMap.tileSize;
          if (cell.tileId !== null) {
            graphics.rect(x, y, gameMap.tileSize, gameMap.tileSize).fill({
              color: TILE_COLORS[cell.tileId % TILE_COLORS.length],
              alpha: LAYER_ALPHA[layer.id],
            });
          }
          if (cell.collision) {
            graphics
              .rect(x + 4, y + 4, gameMap.tileSize - 8, gameMap.tileSize - 8)
              .fill({ color: 0xd00000, alpha: 0.48 });
          }
        }
      }
    }

    visibleTiles += this.renderCollisionActors(gameMap, viewport);

    return visibleTiles;
  }

  private renderCollisionActors(gameMap: GameMap, viewport: Viewport): number {
    const graphics = this.getLayerGraphics('collision');
    let visibleActors = 0;
    const drawArea = (
      area: {
        readonly column: number;
        readonly row: number;
        readonly width: number;
        readonly height: number;
      },
      color: number,
      alpha: number,
    ) => {
      const x = area.column * gameMap.tileSize;
      const y = area.row * gameMap.tileSize;
      const width = area.width * gameMap.tileSize;
      const height = area.height * gameMap.tileSize;
      if (
        x + width < viewport.bounds.left ||
        y + height < viewport.bounds.top ||
        x > viewport.bounds.right ||
        y > viewport.bounds.bottom
      ) {
        return;
      }

      visibleActors++;
      graphics.rect(x + 2, y + 2, width - 4, height - 4).fill({ color, alpha });
    };

    for (const object of gameMap.collisionObjects) {
      if (object.blocksMovement) drawArea(object, 0x7b2cbf, 0.45);
    }
    for (const npc of gameMap.npcs) {
      if (npc.blocksMovement) drawArea(npc, 0xf76707, 0.45);
    }
    for (const entity of gameMap.entities) {
      drawArea(
        {
          column: Math.round(entity.x),
          row: Math.round(entity.y),
          width: entity.width,
          height: entity.height,
        },
        this.entityColor(entity.type),
        entity.blocksMovement ? 0.52 : 0.32,
      );
    }
    for (const region of gameMap.specialRegions) {
      if (region.blocksMovement) drawArea(region, 0x0c8599, 0.34);
    }

    return visibleActors;
  }

  private entityColor(type: string): number {
    switch (type) {
      case 'npc':
        return 0xf76707;
      case 'monster':
        return 0xd6336c;
      case 'item':
        return 0xffd43b;
      case 'trigger':
        return 0x20c997;
      case 'vehicle':
        return 0x339af0;
      default:
        return 0xffffff;
    }
  }

  private getLayerGraphics(layerId: MapLayerKind): Graphics {
    let graphics = this.layerGraphics.get(layerId);
    if (!graphics) {
      graphics = new Graphics();
      graphics.label = layerId;
      this.layerGraphics.set(layerId, graphics);
      this.container.addChild(graphics);
    }
    return graphics;
  }
}
