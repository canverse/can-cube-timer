export enum TimerStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED',
  Inspecting = 'INSPECTING',
  Solving = 'SOLVING',
}

export enum EventType {
  StatusChange = 'statusChange',
  InspectionWarning = 'inspectionWarning',
  Penalty = 'penalty',
  Tick = 'tick',
  SolveEnd = 'solveEnd',
}

export enum PenaltyType {
  PlusTwo = 'PENALTY_PLUS_TWO',
  DNF = 'PENALTY_DNF',
}

export interface PenaltyEvent {
  type: PenaltyType;
}

export interface InspectionWarningEvent {
  timeRemaining: number;
}

export interface TickEvent {
  status: TimerStatus;
  time: number;
}

export interface TimerConfiguration {
  interval: number;
  noInspect: boolean;
  timeLimit: number;
}

export interface SolveEndEvent {
  inspectionTime: number | null;
  isDNF: boolean;
  aborted: boolean | null;
  penalized: boolean;
  solveTime: number | null;
}

export interface Options {
  interval?: number;
  noInspect?: boolean;
  timeLimit?: number;
}

export enum TinyTimerStatus {
  Running = 'running',
  Paused = 'paused',
  Stopped = 'stopped',
}
