import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameEvent } from '../../shared/models/event';
import { EntitySystem } from '../entities/entity-system';
import { EventSystem } from './event-system';

describe('EventSystem', () => {
  let entitySystem: EntitySystem;
  let eventSystem: EventSystem;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EntitySystem, EventSystem] });
    entitySystem = TestBed.inject(EntitySystem);
    eventSystem = TestBed.inject(EventSystem);
  });

  it('runs dialogue, variable, switch, audio, teleport, and npc movement commands', async () => {
    entitySystem.spawn({ id: 'npc-guard', name: 'Guard', type: 'npc', x: 1, y: 1 });
    eventSystem.load([
      {
        id: 'event-gate',
        name: 'Open Gate',
        trigger: 'action',
        commands: [
          { id: 'message-1', type: 'show-message', speaker: 'Guard', message: 'Opening the gate.' },
          { id: 'variable-1', type: 'set-variable', variableId: 'gold', value: 25 },
          { id: 'switch-1', type: 'set-switch', switchId: 'gateOpen', value: true },
          { id: 'move-1', type: 'move-npc', npcId: 'npc-guard', x: 4, y: 5 },
          { id: 'sound-1', type: 'play-sound', soundId: 'gate-open' },
          { id: 'music-1', type: 'play-music', musicId: 'town-theme' },
          { id: 'teleport-1', type: 'teleport', mapId: 'map-town', x: 8, y: 9 },
        ],
      },
    ]);

    await expect(eventSystem.run('event-gate')).resolves.toBe(true);

    expect(eventSystem.messages()).toEqual([{ speaker: 'Guard', message: 'Opening the gate.' }]);
    expect(eventSystem.variables()['gold']).toBe(25);
    expect(eventSystem.switches()['gateOpen']).toBe(true);
    expect(entitySystem.get('npc-guard')?.x).toBe(4);
    expect(entitySystem.get('npc-guard')?.y).toBe(5);
    expect(eventSystem.runtime().lastSoundId).toBe('gate-open');
    expect(eventSystem.runtime().currentMusicId).toBe('town-theme');
    expect(eventSystem.runtime().pendingTeleport).toEqual({ mapId: 'map-town', x: 8, y: 9 });
    expect(eventSystem.runningEventId()).toBeNull();
  });

  it('supports conditionals, waits, and registered script commands', async () => {
    vi.useFakeTimers();
    eventSystem.setSwitch('hasKey', true);
    eventSystem.registerScript('grant-reward', ({ setVariable, command }) => {
      setVariable('reward', command.args?.['item'] ?? 'none');
    });
    const event: GameEvent = {
      id: 'event-chest',
      name: 'Treasure Chest',
      trigger: 'action',
      commands: [
        {
          id: 'branch-1',
          type: 'conditional-branch',
          condition: { switchId: 'hasKey', equals: true },
          whenTrue: [
            { id: 'message-open', type: 'show-message', message: 'The chest opens.' },
            { id: 'wait-1', type: 'wait', durationMs: 250 },
            {
              id: 'script-1',
              type: 'run-script',
              scriptId: 'grant-reward',
              args: { item: 'potion' },
            },
          ],
          whenFalse: [{ id: 'message-locked', type: 'show-message', message: 'Locked.' }],
        },
      ],
    };
    eventSystem.load([event]);

    const run = eventSystem.run('event-chest');
    await vi.advanceTimersByTimeAsync(250);
    await run;
    vi.useRealTimers();

    expect(eventSystem.messages()).toEqual([{ speaker: undefined, message: 'The chest opens.' }]);
    expect(eventSystem.variables()['reward']).toBe('potion');
    expect(eventSystem.runtime().executedScripts).toEqual(['grant-reward']);
  });
});
