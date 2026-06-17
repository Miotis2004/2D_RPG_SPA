export type EventCommandType =
  | 'show-message'
  | 'move-npc'
  | 'teleport'
  | 'play-sound'
  | 'play-music'
  | 'set-variable'
  | 'set-switch'
  | 'conditional-branch'
  | 'wait'
  | 'run-script';

export type EventVariableValue = string | number | boolean;

export interface EventCondition {
  readonly variableId?: string;
  readonly switchId?: string;
  readonly equals: EventVariableValue;
}

interface BaseEventCommand {
  readonly id: string;
  readonly type: EventCommandType;
}

export interface ShowMessageCommand extends BaseEventCommand {
  readonly type: 'show-message';
  readonly speaker?: string;
  readonly message: string;
}

export interface MoveNpcCommand extends BaseEventCommand {
  readonly type: 'move-npc';
  readonly npcId: string;
  readonly x: number;
  readonly y: number;
}

export interface TeleportCommand extends BaseEventCommand {
  readonly type: 'teleport';
  readonly mapId: string;
  readonly x: number;
  readonly y: number;
}

export interface PlaySoundCommand extends BaseEventCommand {
  readonly type: 'play-sound';
  readonly soundId: string;
}

export interface PlayMusicCommand extends BaseEventCommand {
  readonly type: 'play-music';
  readonly musicId: string;
  readonly loop?: boolean;
}

export interface SetVariableCommand extends BaseEventCommand {
  readonly type: 'set-variable';
  readonly variableId: string;
  readonly value: EventVariableValue;
}

export interface SetSwitchCommand extends BaseEventCommand {
  readonly type: 'set-switch';
  readonly switchId: string;
  readonly value: boolean;
}

export interface ConditionalBranchCommand extends BaseEventCommand {
  readonly type: 'conditional-branch';
  readonly condition: EventCondition;
  readonly whenTrue: readonly EventCommand[];
  readonly whenFalse?: readonly EventCommand[];
}

export interface WaitCommand extends BaseEventCommand {
  readonly type: 'wait';
  readonly durationMs: number;
}

export interface RunScriptCommand extends BaseEventCommand {
  readonly type: 'run-script';
  readonly scriptId: string;
  readonly args?: Readonly<Record<string, EventVariableValue>>;
}

export type EventCommand =
  | ShowMessageCommand
  | MoveNpcCommand
  | TeleportCommand
  | PlaySoundCommand
  | PlayMusicCommand
  | SetVariableCommand
  | SetSwitchCommand
  | ConditionalBranchCommand
  | WaitCommand
  | RunScriptCommand;

export interface GameEvent {
  readonly id: string;
  readonly name: string;
  readonly trigger: 'action' | 'touch' | 'autorun';
  readonly commands: readonly EventCommand[];
}

export interface EventMessage {
  readonly speaker?: string;
  readonly message: string;
}

export interface TeleportRequest {
  readonly mapId: string;
  readonly x: number;
  readonly y: number;
}

export interface EventRuntimeState {
  readonly runningEventId: string | null;
  readonly messages: readonly EventMessage[];
  readonly variables: Readonly<Record<string, EventVariableValue>>;
  readonly switches: Readonly<Record<string, boolean>>;
  readonly lastSoundId: string | null;
  readonly currentMusicId: string | null;
  readonly pendingTeleport: TeleportRequest | null;
  readonly executedScripts: readonly string[];
}
