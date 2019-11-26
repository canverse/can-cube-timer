declare module 'tiny-timer' {
  interface TinyTimerOptions {
    stopwatch?: boolean;
    interval?: number;
  }

  export enum TinyTimerStatus {
    Running = 'running',
    Paused = 'paused',
    Stopped = 'stopped'
  }

  export default class Timer extends NodeJS.EventEmitter {
    constructor(options?: TinyTimerOptions);
    on(event: string | symbol, listener: (...args: any[]) => void): this;
    start(duration: number, interval?: number): void;
    stop(): void;
    pause(): void;
    resume(): void;
    time: number;
    status: TinyTimerStatus;
    duration: number;
  }
}
