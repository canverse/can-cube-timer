declare module 'tiny-timer' {
  export interface TinyTimerOptions {
    interval?: number;
    stopwatch?: boolean;
  }
  export default function Timer(
    options?: TinyTimerOptions
  ): NodeJS.EventEmitter;
}
