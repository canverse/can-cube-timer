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
  inspectionTime: number;
  isDNF: boolean;
  penalized: boolean;
  solveTime: number;
}

interface Options {
  interval?: number;
  noInspect?: boolean;
  timeLimit?: number;
}

export class CanCubeTimer extends EventEmitter {
  private solvePhase: SolvePhase;
  private inspectionTimer: EventEmitter;
  private solveTimer: EventEmitter;
  private options: Options;

  constructor(
    options: Options = {
      interval = 100,
      noInspect = false,
      timeLimit = 10 * 60
    }
  ) {
    super();
    this.options = options;
    this.inspectionTimer = new TinyTimer({ interval: options.interval });
    this.solveTimer = new TinyTimer({
      interval: options.interval,
      stopwatch: true
    });
  }
}
