declare module 'tiny-timer' {
  type Status = 'running' | 'paused' | 'stopped';

  interface TinyTimerOptions {
    stopwatch?: boolean;
    interval?: number;
  }

  interface Test {
    start(duration: number, interval?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    time: number;
    duration: number;
    status: Status;
  }
  class Timer extends NodeJS.EventEmitter implements Test {
    constructor(opts?: TinyTimerOptions);

    on(event: string | symbol, listener: (...args: any[]) => void): this;
    start(duration: number, interval?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    time: number;
    duration: number;
    status: Status;
  }

  export default Timer;
}
