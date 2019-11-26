export enum TimerStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Inspecting = 'INSPECTING',
  Solving = 'SOLVING'
}

export enum EventType {
  InspectionWarning = 'inspectionWarning',
  Penalty = 'penalty',
  Tick = 'tick',
  Done = 'done'
}

export enum PenaltyType {
  PlusTwo = 'PENALTY_PLUS_TWO',
  DNF = 'PENALTY_DNF'
}

export interface IPenaltyEvent {
  type: PenaltyType;
}

export interface IInspectionWarningEvent {
  timeRemaining: number;
}

export interface ITickEvent {
  status: TimerStatus;
  timer: number;
}

export interface ISolveEndEvent {
  inspectionTime?: number | null;
  isDNF: boolean;
  penalized: boolean;
  solveTime?: number | null;
}

export interface Options {
  interval?: number;
  noInspect?: boolean;
  timeLimit?: number;
}

export enum TinyTimerStatus {
  Running = 'running',
  Paused = 'paused',
  Stopped = 'stopped'
}
