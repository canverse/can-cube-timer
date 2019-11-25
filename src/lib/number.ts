import { EventEmitter } from 'events';
import * as TinyTimer from 'tiny-timer';
/**
 * Multiplies a value by 2. (Also a full example of Typedoc's functionality.)
 *
 * ### Example (es module)
 * ```js
 * import { double } from 'typescript-starter'
 * console.log(double(4))
 * // => 8
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var double = require('typescript-starter').double;
 * console.log(double(4))
 * // => 8
 * ```
 *
 * @param value   Comment describing the `value` parameter.
 * @returns       Comment describing the return type.
 * @anotherNote   Some other value.
 */
export function double(value: number): number {
  return value * 2;
}

/**
 * Raise the value of the first parameter to the power of the second using the es7 `**` operator.
 *
 * ### Example (es module)
 * ```js
 * import { power } from 'typescript-starter'
 * console.log(power(2,3))
 * // => 8
 * ```
 *
 * ### Example (commonjs)
 * ```js
 * var power = require('typescript-starter').power;
 * console.log(power(2,3))
 * // => 8
 * ```
 */
export function power(base: number, exponent: number): number {
  // This is a proposed es7 operator, which should be transpiled by Typescript
  return base ** exponent;
}

enum TimerStatus {
  Running = 'RUNNING',
  Stopped = 'STOPPED'
}

enum SolvePhase {
  Inspecting = 'INSPECTING',
  Solving = 'SOLVING'
}

enum EventType {
  InspectionWarning = 'inspectionWarning',
  Penalty = 'penalty',
  Tick = 'tick',
  Done = 'done'
}

enum PenaltyType {
  PlusTwo = 'PENALTY_PLUS_TWO',
  DNF = 'PENALTY_DNF'
}

interface IPenaltyEvent {
  type: PenaltyType;
}

interface IInspectionWarningEvent {
  timeRemaining: number;
}

interface ITickEvent {
  phase: SolvePhase;
  timer: number;
}

interface ISolveEndEvent {
  inspectionTime?: number;
  isDNF: boolean;
  penalized: boolean;
  solveTime?: number;
}

interface Options {
  interval: number;
  noInspect: boolean;
  timeLimit: number;
}

enum TinyTimerStatus {
  Running = 'running',
  Paused = 'paused',
  Stopped = 'stopped'
}

export class CanCubeError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CanCubeTimer extends EventEmitter {
  private solvePhase: SolvePhase | null;
  private inspectionTimer: EventEmitter;
  private solveTimer: EventEmitter;
  private options: Options;

  private solveInformation: ISolveEndEvent | null;

  private inspectionTimerTickHandleCount = 0;

  constructor(
    options: Options = {
      interval: 100,
      noInspect: false,
      timeLimit: 10 * 60
    }
  ) {
    super();
    this.options = options;
  }

  private emitInspectionWarning() {
    this.inspectionTimerTickHandleCount++;
    this.emit(EventType.InspectionWarning, {
      timeRemaining: 15 - this.inspectionTimer.time
    });
  }

  private onInspectionTick = time => {
    if (time > 8000 && this.inspectionTimerTickHandleCount === 0) {
      this.emitInspectionWarning();
    } else if (time > 12000 && this.inspectionTimerTickHandleCount === 1) {
      this.emitInspectionWarning();
    } else if (time > 15000 && this.inspectionTimerTickHandleCount === 2) {
      // emit the +2 penalty
      this.emit(EventType.Penalty, { type: PenaltyType.PlusTwo });
    }
  };

  private initInternalTimers() {
    this.inspectionTimer = new TinyTimer();
    this.inspectionTimer.on('tick', this.onInspectionTick());

    this.inpectionTimer.on('done', () => {
      // emit DNF and solve end.
    });

    this.solveTimer = new TinyTimer({
      stopwatch: true,
      interval: this.options.timeLimit + 1000 // We don't need the tick event from tiny-timer at all.
    });

    this.solveTimer.on('done', () => {
      // emit DNF and solve end.
    });
  }

  private resetSolveInformation() {
    this.solveInformation = {
      inspectionTime: null,
      isDNF: false,
      penalized: false,
      solveTime: null
    };
  }

  public startInspection() {
    if (this.options.noInspect) {
      throw new CanCubeError(
        "Tried calling 'startInspection' with 'noInspect' option set to true!"
      );
    }

    if (this.inspectionTimer.status === TinyTimerStatus.Running) {
      throw new CanCubeError(
        "Tried calling 'startInspection' more than once during a single solve!"
      );
    }

    if (this.solvePhase === SolvePhase.Solving) {
      throw new CanCubeError(
        "Tried calling 'startInspection' while in the 'Solving' phase!"
      );
    }

    if (this.solveInformation === null) {
      this.resetSolveInformation();
    }

    this.inspectionTimer.start(17000); // This will run for at most 15 + 2;
  }

  public startSolve() {
    if (this.solveTimer.status === TinyTimerStatus.Running) {
      throw new CanCubeError(
        "Tried calling 'startSolve' while in the 'Solving' phase!"
      );
    }

    if (this.solvePhase === SolvePhase.Inspecting) {
      this.solveInformation.inspectionTime = this.inspectionTimer.time;
      this.inspectionTimer.stop();
    }

    this.solveTimer.start(this.options.timeLimit);
  }
}
