import { CollisionSystem } from './collision-system';
import { GameMap, MapCell } from '../../shared/models/map';
import { Tileset } from '../../shared/models/tile';

function createMap(cell: MapCell = { tileId: null, collision: false }): GameMap {
  return {
    id: 'test-map',
    name: 'Test Map',
    width: 3,
    height: 3,
    tileSize: 32,
    layers: [
      {
        id: 'ground',
        name: 'Ground',
        visible: true,
        cells: Array.from({ length: 9 }, () => ({ ...cell })),
      },
    ],
    collisionObjects: [
      { id: 'crate', name: 'Crate', column: 1, row: 0, width: 1, height: 1, blocksMovement: true },
    ],
    npcs: [
      { id: 'npc', name: 'NPC', column: 0, row: 1, width: 1, height: 1, blocksMovement: true },
    ],
    entities: [],
    specialRegions: [
      {
        id: 'lava',
        name: 'Lava',
        column: 2,
        row: 2,
        width: 1,
        height: 1,
        blocksMovement: true,
        tag: 'hazard',
      },
    ],
  };
}

const blockingTileset: Tileset = {
  id: 'tileset',
  name: 'Tileset',
  imageUrl: '',
  imageWidth: 32,
  imageHeight: 32,
  tileSize: 32,
  columns: 1,
  rows: 1,
  tiles: [{ id: 0, name: 'Wall', sourceX: 0, sourceY: 0, collision: true, terrain: 'mountain' }],
};

describe('CollisionSystem', () => {
  const collisionSystem = new CollisionSystem();

  it('allows movement into open map tiles', () => {
    expect(collisionSystem.canMove(createMap(), { column: 2, row: 0 })).toBe(true);
  });

  it('blocks movement outside map bounds', () => {
    const result = collisionSystem.validateMovement(createMap(), { column: -1, row: 0 });
    expect(result.valid).toBe(false);
    expect(result.hits[0].source).toBe('bounds');
  });

  it('blocks movement for painted collision, object, npc, region, and tileset metadata', () => {
    const map = createMap();
    const paintedCollisionMap = {
      ...map,
      layers: [
        {
          ...map.layers[0],
          cells: map.layers[0].cells.map((cell, index) =>
            index === 0 ? { ...cell, collision: true } : cell,
          ),
        },
      ],
    };
    const tilesetCollisionMap = {
      ...map,
      layers: [
        {
          ...map.layers[0],
          cells: map.layers[0].cells.map((cell, index) =>
            index === 5 ? { ...cell, tileId: 0 } : cell,
          ),
        },
      ],
    };

    expect(
      collisionSystem.validateMovement(paintedCollisionMap, { column: 0, row: 0 }).hits[0].source,
    ).toBe('tile');
    expect(collisionSystem.validateMovement(map, { column: 1, row: 0 }).hits[0].source).toBe(
      'object',
    );
    expect(collisionSystem.validateMovement(map, { column: 0, row: 1 }).hits[0].source).toBe('npc');
    const entityMap = {
      ...map,
      entities: [
        {
          id: 'monster',
          name: 'Monster',
          type: 'monster' as const,
          x: 2,
          y: 0,
          width: 1,
          height: 1,
          blocksMovement: true,
          tags: [],
        },
      ],
    };

    expect(collisionSystem.validateMovement(map, { column: 2, row: 2 }).hits[0].source).toBe(
      'region',
    );
    expect(collisionSystem.validateMovement(entityMap, { column: 2, row: 0 }).hits[0].source).toBe(
      'entity',
    );
    expect(
      collisionSystem.validateMovement(tilesetCollisionMap, { column: 2, row: 1 }, [
        blockingTileset,
      ]).hits[0].source,
    ).toBe('tile');
  });
});
