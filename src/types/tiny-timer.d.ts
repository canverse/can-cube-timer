declare module 'tiny-timer' {
  type Status = 'running' | 'paused' | 'stopped';

  interface TinyTimerOptions {
    stopwatch?: boolean;
    interval?: number;
  }

  class Timer extends NodeJS.EventEmitter {
    constructor(options?: TinyTimerOptions);
    start(duration: number, interval?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    time: number;
    duration: number;
    status: Status;
  }

  export = Timer;
}
