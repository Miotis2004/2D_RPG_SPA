import { Injectable, computed, signal } from '@angular/core';
import { Entity, EntityQuery, EntitySpawnRequest, EntityType } from '../../shared/models/entity';

const BLOCKING_ENTITY_TYPES = new Set<EntityType>(['npc', 'monster', 'vehicle']);

@Injectable({ providedIn: 'root' })
export class EntitySystem {
  private readonly entitiesState = signal<readonly Entity[]>([]);

  readonly entities = computed(() => this.entitiesState());
  readonly npcs = computed(() => this.find({ type: 'npc' }));
  readonly monsters = computed(() => this.find({ type: 'monster' }));
  readonly items = computed(() => this.find({ type: 'item' }));
  readonly triggers = computed(() => this.find({ type: 'trigger' }));
  readonly vehicles = computed(() => this.find({ type: 'vehicle' }));
  readonly blockingEntities = computed(() => this.find({ blocksMovement: true }));

  load(entities: readonly Entity[]): void {
    this.entitiesState.set([...entities]);
  }

  spawn(request: EntitySpawnRequest): Entity {
    const entity: Entity = {
      id: request.id ?? `${request.type}-${crypto.randomUUID()}`,
      name: request.name,
      type: request.type,
      x: request.x,
      y: request.y,
      width: request.width ?? 1,
      height: request.height ?? 1,
      blocksMovement: request.blocksMovement ?? BLOCKING_ENTITY_TYPES.has(request.type),
      tags: request.tags ?? [],
      metadata: request.metadata,
    };

    this.entitiesState.update((entities) => [...entities, entity]);
    return entity;
  }

  upsert(entity: Entity): void {
    this.entitiesState.update((entities) =>
      entities.some((entry) => entry.id === entity.id)
        ? entities.map((entry) => (entry.id === entity.id ? entity : entry))
        : [...entities, entity],
    );
  }

  move(entityId: string, x: number, y: number): Entity | undefined {
    const entity = this.get(entityId);
    if (!entity) return undefined;
    const moved = { ...entity, x, y };
    this.upsert(moved);
    return moved;
  }

  remove(entityId: string): boolean {
    const exists = Boolean(this.get(entityId));
    if (exists) {
      this.entitiesState.update((entities) => entities.filter((entity) => entity.id !== entityId));
    }
    return exists;
  }

  get(entityId: string): Entity | undefined {
    return this.entitiesState().find((entity) => entity.id === entityId);
  }

  find(query: EntityQuery = {}): readonly Entity[] {
    return this.entitiesState().filter((entity) => {
      if (query.type && entity.type !== query.type) return false;
      if (query.tag && !entity.tags.includes(query.tag)) return false;
      if (query.blocksMovement !== undefined && entity.blocksMovement !== query.blocksMovement)
        return false;
      return true;
    });
  }
}
