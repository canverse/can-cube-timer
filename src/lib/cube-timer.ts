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

export default class CanCubeTimer extends EventEmitter {
  private inspectionTimer: TinyTimer | undefined;
  private solveTimer: TinyTimer;
  public readonly options: Options;

  private solveInformation: ISolveEndEvent | null = null;

  private inspectionTimerTickHandleCount = 0;
  private timeoutId?: NodeJS.Timeout;

  constructor(
    options: Options | undefined = {
      interval: 100,
      noInspect: false,
      timeLimit: 10 * 60
    }
  ) {
    super();
    this.options = options;

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
    if (!this.timeoutId) {
      this.tick();
      this.timeoutId = setInterval(this.tick, this.options.interval!);
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
      timeRemaining: 15 - this.inspectionTimer!.time
    });
  }

  private onInspectionTick = (time: number) => {
    if (time > 8000 && this.inspectionTimerTickHandleCount === 0) {
      this.emitInspectionWarning();
    } else if (time > 12000 && this.inspectionTimerTickHandleCount === 1) {
      this.emitInspectionWarning();
    } else if (time > 15000 && this.inspectionTimerTickHandleCount === 2) {
      // emit the +2 penalty
      this.emit(EventType.Penalty, { type: PenaltyType.PlusTwo });
    }
  };

  private initInternalTimers = () => {
    if (!this.options.noInspect) {
      this.inspectionTimer!.on('tick', this.onInspectionTick);

      this.inspectionTimer!.on('done', () => {
        // emit DNF and solve end.
      });
    }

    this.solveTimer.on('done', () => {
      // emit DNF and solve end.
    });
  };

  private resetSolveInformation = () => {
    this.solveInformation = {
      inspectionTime: null,
      isDNF: false,
      penalized: false,
      solveTime: null
    };
  };

  private stopInternalTimers = () => {
    !this.options.noInspect && this.inspectionTimer!.stop();
    this.solveTimer.stop();
  };

  private resetTimer = () => {
    this.resetSolveInformation();
    this.stopInternalTimers();
    this.inspectionTimerTickHandleCount = 0;
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

    if (this.status === TimerStatus.Inspecting) {
      this.solveInformation!.inspectionTime = this.inspectionTimer!.time;
      this.inspectionTimer!.stop();
    }

    this.solveTimer.start(this.options.timeLimit!);
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
