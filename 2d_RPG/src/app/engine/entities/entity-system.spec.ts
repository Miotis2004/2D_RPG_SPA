import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { EntitySystem } from './entity-system';

describe('EntitySystem', () => {
  let entitySystem: EntitySystem;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EntitySystem] });
    entitySystem = TestBed.inject(EntitySystem);
  });

  it('spawns typed entities with sensible blocking defaults', () => {
    const npc = entitySystem.spawn({ id: 'npc-guard', name: 'Guard', type: 'npc', x: 4, y: 5 });
    const item = entitySystem.spawn({
      id: 'item-potion',
      name: 'Potion',
      type: 'item',
      x: 2,
      y: 3,
    });

    expect(npc.blocksMovement).toBe(true);
    expect(item.blocksMovement).toBe(false);
    expect(entitySystem.npcs()).toEqual([npc]);
    expect(entitySystem.items()).toEqual([item]);
  });

  it('moves, upserts, removes, and queries entities', () => {
    entitySystem.load([
      {
        id: 'monster-slime',
        name: 'Slime',
        type: 'monster',
        x: 1,
        y: 1,
        width: 1,
        height: 1,
        blocksMovement: true,
        tags: ['forest'],
      },
    ]);

    expect(entitySystem.move('monster-slime', 3, 4)?.x).toBe(3);
    entitySystem.upsert({
      id: 'trigger-door',
      name: 'Door Trigger',
      type: 'trigger',
      x: 8,
      y: 2,
      width: 1,
      height: 1,
      blocksMovement: false,
      tags: ['door'],
    });

    expect(entitySystem.find({ tag: 'door' })).toHaveLength(1);
    expect(entitySystem.blockingEntities()).toHaveLength(1);
    expect(entitySystem.remove('monster-slime')).toBe(true);
    expect(entitySystem.monsters()).toHaveLength(0);
  });
});
