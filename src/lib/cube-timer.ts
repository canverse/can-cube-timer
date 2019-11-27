import { EventEmitter } from 'events';
import TinyTimer from 'tiny-timer';
import {
  EventType,
  SolveEndEvent,
  Options,
  TinyTimerStatus,
  PenaltyType,
  TimerStatus,
  TimerConfiguration,
} from './types';

export class CanCubeError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const defaultConfig = {
  interval: 100,
  noInspect: false,
  timeLimit: 10 * 60,
};
export default class CanCubeTimer extends EventEmitter {
  private inspectionTimer: TinyTimer | undefined;
  private solveTimer: TinyTimer;
  private solveInformation: SolveEndEvent | null = null;
  private inspectionTimerTickHandleCount = 0;
  private tickIntervalId?: NodeJS.Timer;

  public readonly configuration: TimerConfiguration;

  constructor(options: Options | undefined = {}) {
    super();

    // TODO: If I use the following commented line ava starts failing
    // this.configuration = Object.assign(defaultConfig, options);
    // The tests fail if they are ran in parallel but not in sequence.
    // That is interesting and I would like to know why
    this.configuration = {
      ...defaultConfig,
      ...options,
    };

    if (!this.configuration.noInspect) {
      this.inspectionTimer = new TinyTimer();
    }
    this.solveTimer = new TinyTimer({
      stopwatch: true,
      interval: this.configuration.timeLimit + 1000, // We don't need it to tick. TODO: Do we even need it?
    });

    this.initInternalTimers();
  }

  private startTicking = (): void => {
    if (!this.tickIntervalId) {
      this.tick();
      this.tickIntervalId = setInterval(this.tick, this.configuration.interval);
    }
  };

  private tick = (): void => {
    this.emit(EventType.Tick, {
      status: this.status,
      time:
        this.status === TimerStatus.Inspecting ? this.inspectionTimer.time : this.solveTimer.time,
    });
  };

  private emitInspectionWarning(): void {
    this.inspectionTimerTickHandleCount++;
    this.emit(EventType.InspectionWarning, {
      timeRemaining: this.inspectionTimer.time - 2000,
    });
  }

  private onInspectionTick = (time: number): void => {
    if (time < 10000 && this.inspectionTimerTickHandleCount === 0) {
      this.emitInspectionWarning();
    } else if (time < 5000 && this.inspectionTimerTickHandleCount === 1) {
      this.emitInspectionWarning();
    } else if (time < 2000 && this.inspectionTimerTickHandleCount === 2) {
      this.inspectionTimerTickHandleCount++;
      this.solveInformation.penalized = true;
      this.emit(EventType.Penalty, { type: PenaltyType.PlusTwo });
    }
  };

  private initInternalTimers = (): void => {
    if (!this.configuration.noInspect) {
      this.inspectionTimer.on('tick', this.onInspectionTick);

      this.inspectionTimer.on('done', () => {
        this.solveInformation.inspectionTime = 17000;
        this.stopWithDNF();
      });

      this.solveTimer.on('done', () => {
        this.solveInformation.solveTime = this.configuration.timeLimit;
      });
    }
  };

  private resetSolveInformation = (): void => {
    this.solveInformation = {
      inspectionTime: null,
      isDNF: false,
      aborted: false,
      penalized: false,
      solveTime: null,
    };
  };

  private stopInternalTimers = (): void => {
    !this.configuration.noInspect && this.inspectionTimer.stop();
    this.solveTimer.stop();
  };

  private resetTimer = (): void => {
    clearInterval(this.tickIntervalId);
    this.resetSolveInformation();
    this.stopInternalTimers();
    this.inspectionTimerTickHandleCount = 0;
  };

  private stopWithDNF = (): SolveEndEvent | null => {
    this.solveInformation.isDNF = true;
    return this.stop();
  };

  public abort = (): SolveEndEvent | null => {
    this.solveInformation.aborted = true;
    return this.stopWithDNF();
  };

  public stop = (): SolveEndEvent | null => {
    if (this.status === TimerStatus.Stopped) {
      console.warn("Tried calling 'stop' when the timer is already stopped");
      return null;
    }

    const solveEndInfo = Object.assign({}, this.solveInformation);
    if (this.status === TimerStatus.Solving) {
      solveEndInfo.solveTime = this.solveTimer.time;
    }

    this.emit(EventType.SolveEnd, solveEndInfo);
    this.emit(EventType.StatusChange, TimerStatus.Stopped);
    this.resetTimer();
    return solveEndInfo;
  };

  private throwError = (message: string): void => {
    this.resetTimer(); // Reset everything before we throw
    throw new CanCubeError(message);
  };

  public startInspection = (): void => {
    if (this.configuration.noInspect) {
      this.throwError("Tried calling 'startInspection' with 'noInspect' option set to true!");
    }

    if (this.inspectionTimer.status === TinyTimerStatus.Running) {
      this.throwError("Tried calling 'startInspection' more than once during a single solve!");
    }

    if (this.status === TimerStatus.Solving) {
      this.throwError("Tried calling 'startInspection' while in the 'Solving' phase!");
    }

    this.emit(EventType.StatusChange, TimerStatus.Inspecting);
    this.resetSolveInformation();

    this.inspectionTimer.start(17000); // This will run for at most 15 + 2;
    this.startTicking();
  };

  public startSolve = (): void => {
    if (this.solveTimer.status === TinyTimerStatus.Running) {
      throw new CanCubeError("Tried calling 'startSolve' while in the 'Solving' phase!");
    }

    if (!this.configuration.noInspect && this.status === TimerStatus.Inspecting) {
      this.solveInformation.inspectionTime = 17000 - this.inspectionTimer.time;
      this.inspectionTimer.stop();
      this.emit(EventType.StatusChange, TimerStatus.Solving);
    }

    this.solveTimer.start(this.configuration.timeLimit * 1000);
  };

  get status(): TimerStatus {
    if (!this.configuration.noInspect && this.inspectionTimer.status === TinyTimerStatus.Running) {
      return TimerStatus.Inspecting;
    }

    if (this.solveTimer.status === TinyTimerStatus.Running) {
      return TimerStatus.Solving;
    }

    return TimerStatus.Stopped;
  }
}
