import { Injectable, computed, inject, signal } from '@angular/core';
import {
  EventCommand,
  EventRuntimeState,
  EventVariableValue,
  GameEvent,
  RunScriptCommand,
} from '../../shared/models/event';
import { EntitySystem } from '../entities/entity-system';

export interface EventScriptContext {
  readonly command: RunScriptCommand;
  readonly state: EventRuntimeState;
  setVariable(variableId: string, value: EventVariableValue): void;
  setSwitch(switchId: string, value: boolean): void;
}

export type EventScriptHandler = (context: EventScriptContext) => void | Promise<void>;

const INITIAL_STATE: EventRuntimeState = {
  runningEventId: null,
  messages: [],
  variables: {},
  switches: {},
  lastSoundId: null,
  currentMusicId: null,
  pendingTeleport: null,
  executedScripts: [],
};

@Injectable({ providedIn: 'root' })
export class EventSystem {
  private readonly entitySystem = inject(EntitySystem);
  private readonly eventsState = signal<readonly GameEvent[]>([]);
  private readonly runtimeState = signal<EventRuntimeState>(INITIAL_STATE);
  private readonly scripts = new Map<string, EventScriptHandler>();

  readonly events = computed(() => this.eventsState());
  readonly runtime = computed(() => this.runtimeState());
  readonly messages = computed(() => this.runtimeState().messages);
  readonly variables = computed(() => this.runtimeState().variables);
  readonly switches = computed(() => this.runtimeState().switches);
  readonly runningEventId = computed(() => this.runtimeState().runningEventId);

  load(events: readonly GameEvent[]): void {
    this.eventsState.set([...events]);
  }

  registerScript(scriptId: string, handler: EventScriptHandler): void {
    this.scripts.set(scriptId, handler);
  }

  get(eventId: string): GameEvent | undefined {
    return this.eventsState().find((event) => event.id === eventId);
  }

  async run(eventId: string): Promise<boolean> {
    const event = this.get(eventId);
    if (!event) return false;

    this.runtimeState.update((state) => ({ ...state, runningEventId: event.id }));
    await this.runCommands(event.commands);
    this.runtimeState.update((state) => ({ ...state, runningEventId: null }));
    return true;
  }

  setVariable(variableId: string, value: EventVariableValue): void {
    this.runtimeState.update((state) => ({
      ...state,
      variables: { ...state.variables, [variableId]: value },
    }));
  }

  setSwitch(switchId: string, value: boolean): void {
    this.runtimeState.update((state) => ({
      ...state,
      switches: { ...state.switches, [switchId]: value },
    }));
  }

  clearMessages(): void {
    this.runtimeState.update((state) => ({ ...state, messages: [] }));
  }

  private async runCommands(commands: readonly EventCommand[]): Promise<void> {
    for (const command of commands) {
      await this.runCommand(command);
    }
  }

  private async runCommand(command: EventCommand): Promise<void> {
    switch (command.type) {
      case 'show-message':
        this.runtimeState.update((state) => ({
          ...state,
          messages: [...state.messages, { speaker: command.speaker, message: command.message }],
        }));
        return;
      case 'move-npc':
        this.entitySystem.move(command.npcId, command.x, command.y);
        return;
      case 'teleport':
        this.runtimeState.update((state) => ({
          ...state,
          pendingTeleport: { mapId: command.mapId, x: command.x, y: command.y },
        }));
        return;
      case 'play-sound':
        this.runtimeState.update((state) => ({ ...state, lastSoundId: command.soundId }));
        return;
      case 'play-music':
        this.runtimeState.update((state) => ({ ...state, currentMusicId: command.musicId }));
        return;
      case 'set-variable':
        this.setVariable(command.variableId, command.value);
        return;
      case 'set-switch':
        this.setSwitch(command.switchId, command.value);
        return;
      case 'conditional-branch': {
        const actual = command.condition.variableId
          ? this.runtimeState().variables[command.condition.variableId]
          : this.runtimeState().switches[command.condition.switchId ?? ''];
        await this.runCommands(
          actual === command.condition.equals ? command.whenTrue : (command.whenFalse ?? []),
        );
        return;
      }
      case 'wait':
        await new Promise((resolve) => setTimeout(resolve, Math.max(0, command.durationMs)));
        return;
      case 'run-script': {
        await this.scripts.get(command.scriptId)?.({
          command,
          state: this.runtimeState(),
          setVariable: (variableId, value) => this.setVariable(variableId, value),
          setSwitch: (switchId, value) => this.setSwitch(switchId, value),
        });
        this.runtimeState.update((state) => ({
          ...state,
          executedScripts: [...state.executedScripts, command.scriptId],
        }));
        return;
      }
    }
  }
}
