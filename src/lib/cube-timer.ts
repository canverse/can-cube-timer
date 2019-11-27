import { EventEmitter } from 'events';
import TinyTimer from 'tiny-timer';
import {
  EventType,
  ISolveEndEvent,
  Options,
  TinyTimerStatus,
  PenaltyType,
  TimerStatus
} from './types';

export class CanCubeError extends Error {
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface InternalOptions {
  interval: number;
  noInspect: boolean;
  timeLimit: number;
}

export default class CanCubeTimer extends EventEmitter {
  private inspectionTimer: TinyTimer | undefined;
  private solveTimer: TinyTimer;
  public readonly options: InternalOptions;

  private solveInformation: ISolveEndEvent | null = null;

  private inspectionTimerTickHandleCount = 0;
  private tickIntervalId?: NodeJS.Timer;

  constructor(
    options: Options | undefined = {
      interval: 100,
      noInspect: false,
      timeLimit: 10 * 60
    }
  ) {
    super();
    this.options = {
      interval: options.interval ? options.interval : 100,
      noInspect: options.noInspect ? options.noInspect : false,
      timeLimit: options.timeLimit ? options.timeLimit : 10 * 60
    };

    if (!this.options.noInspect) {
      this.inspectionTimer = new TinyTimer();
    }
    this.solveTimer = new TinyTimer({
      stopwatch: true,
      interval: this.options.timeLimit! + 1000 // We don't need it to tick. TODO: Do we even need it?
    });

    this.initInternalTimers();
  }

  private startTicking = () => {
    if (!this.tickIntervalId) {
      this.tick();
      this.tickIntervalId = setInterval(this.tick, this.options.interval!);
    }
  };

  private tick = () => {
    this.emit(EventType.Tick, {
      status: this.status,
      time:
        this.status === TimerStatus.Inspecting
          ? this.inspectionTimer!.time
          : this.solveTimer.time
    });
  };

  private emitInspectionWarning() {
    this.inspectionTimerTickHandleCount++;
    this.emit(EventType.InspectionWarning, {
      timeRemaining: this.inspectionTimer!.time - 2000
    });
  }

  private onInspectionTick = (time: number) => {
    if (time < 10000 && this.inspectionTimerTickHandleCount === 0) {
      this.emitInspectionWarning();
    } else if (time < 5000 && this.inspectionTimerTickHandleCount === 1) {
      this.emitInspectionWarning();
    } else if (time < 2000 && this.inspectionTimerTickHandleCount === 2) {
      this.inspectionTimerTickHandleCount++;
      this.solveInformation!.penalized = true;
      this.emit(EventType.Penalty, { type: PenaltyType.PlusTwo });
    }
  };

  private initInternalTimers = () => {
    if (!this.options.noInspect) {
      this.inspectionTimer!.on('tick', this.onInspectionTick);

      this.inspectionTimer!.on('done', () => {
        this.solveInformation!.inspectionTime = 17000;
        this.stopWithDNF();
      });

      this.solveTimer.on('done', () => {
        this.solveInformation!.solveTime = this.options.timeLimit!;
      });
    }
  };

  private resetSolveInformation = () => {
    this.solveInformation = {
      inspectionTime: null,
      isDNF: false,
      aborted: false,
      penalized: false,
      solveTime: null
    };
  };

  private stopInternalTimers = () => {
    !this.options.noInspect && this.inspectionTimer!.stop();
    this.solveTimer.stop();
  };

  private resetTimer = () => {
    clearInterval(this.tickIntervalId!);
    this.resetSolveInformation();
    this.stopInternalTimers();
    this.inspectionTimerTickHandleCount = 0;
  };

  private stopWithDNF = () => {
    this.solveInformation!.isDNF = true;
    return this.stop();
  };

  public abort = () => {
    this.solveInformation!.aborted = true;
    return this.stopWithDNF();
  };

  public stop = () => {
    if (this.status === TimerStatus.Stopped) {
      this.throwError("Tried calling 'stop' when the timer is already stopped");
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

  private throwError = (message: string) => {
    this.resetTimer(); // Reset everything before we throw
    throw new CanCubeError(message);
  };

  public startInspection = () => {
    if (this.options.noInspect) {
      this.throwError(
        "Tried calling 'startInspection' with 'noInspect' option set to true!"
      );
    }

    if (this.inspectionTimer!.status === TinyTimerStatus.Running) {
      this.throwError(
        "Tried calling 'startInspection' more than once during a single solve!"
      );
    }

    if (this.status === TimerStatus.Solving) {
      this.throwError(
        "Tried calling 'startInspection' while in the 'Solving' phase!"
      );
    }

    this.emit(EventType.StatusChange, TimerStatus.Inspecting);
    this.resetSolveInformation();

    this.inspectionTimer!.start(17000); // This will run for at most 15 + 2;
    this.startTicking();
  };

  public startSolve = () => {
    if (this.solveTimer.status === TinyTimerStatus.Running) {
      throw new CanCubeError(
        "Tried calling 'startSolve' while in the 'Solving' phase!"
      );
    }

    if (!this.options.noInspect && this.status === TimerStatus.Inspecting) {
      this.solveInformation!.inspectionTime =
        17000 - this.inspectionTimer!.time;
      this.inspectionTimer!.stop();
      this.emit(EventType.StatusChange, TimerStatus.Solving);
    }

    this.solveTimer.start(this.options.timeLimit! * 1000);
  };

  get status(): TimerStatus {
    if (
      !this.options.noInspect &&
      this.inspectionTimer!.status === TinyTimerStatus.Running
    ) {
      return TimerStatus.Inspecting;
    }

    if (this.solveTimer.status === TinyTimerStatus.Running) {
      return TimerStatus.Solving;
    }

    return TimerStatus.Stopped;
  }
}
