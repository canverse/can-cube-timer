# can-cube-timer
Simple Rubik's Cube timer


# TODO
* More events for timer status change and solve phase change
* Think more on the constructor api. should it be exposing all of that functionality
* should there be a constructor overload without the opts object?
* Should it return a promise when you call start that will be resolved when the solve ends?
this would be useful but also feels like doing too many things


```javascript
import canCubeTimer, { SOLVING, INSPECTING } from 'can-cube-timer';

const inSeconds = ms => ms / 1000;

// See the full documentation for other options
const timer = canCubeTimer({
  onInspectionWarning: timeRemaining => console.log(`You have ${inSeconds(timeRemaining)} seconds remaining!`),
  onPenalty: (isDNF, timeRemaining) => isDNF ? 
    console.log('Maximum allowed time elapsed. Marking as DNF') :
    console.log(`15 seconds past, +2 second penalty, ${timeRemaining} seconds remaining until inspection end`,
  onTick: (phase, time, timeRemaining) => {
    console.log(`Currently ${phase === SOLVING : 'solv' ? 'inspect'}ing!`);
    console.log(`Current time is ${inSeconds(time)}`);
    
    // timeRemaining will be null if phase is SOLVING
    console.log(`Inspection time remaining ${timeRemaining}`);
  },
  onDone: ({ inspectionTime, isDNF, penalized, solveTime }) => {
    // see api documentation on solveTime
    console.log(```
      Inspection Time: ${inSeconds(inspectionTime)}
      DNF: ${isDNF}
      Penalized: ${isPenalized}
      Solve time: ${inSeconds(solveTime)}
    ```);
  }
});


timer.start();

// ...
const inspectionPeek = timer.peek();
console.log(`Timer status: ${inspectionPeek.status}`);
console.log(`Timer phase: ${inspectionPeek.phase}`);
console.log(`Current time: ${inspectionPeek.time}`); // This is the current time of the current phase.`);
console.log(`Total time: ${inspectionTime.totalTime}`); // time since the .start() call

const inspectionStats = timer.startSolve(); // See the documentation on .start() and .startSolve();
// TODO: console.logs for inspectionStats
// ...

const solvePeek = timer.status();

console.log(`Timer status: ${solvePeek.status}`);
console.log(`Timer phase: ${solvePeek.phase}`);
console.log(`Current time: ${solvePeek.time}`); // This is the current time of the current phase.`);
console.log(`Total time: ${solvePeek.totalTime}`); // time since the .start() call


const solve = timer.stop(); // timer.stop() returns the same value as the 'done' event listeners


```

## API

### Exported Types and Constants
Typescript typing files are provided with the library.


#### `TimerStatus`
These are the possible values that `timer.status` can have.
```typescript
enum TimerStatus = {
  Running = "RUNNING",
  Stopped = "STOPPED",
}
```

#### `SolvePhase`
```typescript
enum SolvePhase = {
  Inspecting = "INSPECTING",
  Solving = "SOLVING",
}
```

#### Event Types
A timer instance emits certain events and lets you subscribe to those event. Event handlers you register
with the timer will be called with the `event` objects described here.

```typescript
enum EventTypes = {
  InspectionWarning = "inspectionWarning",
  Penalty = "penalty",
  Tick = "tick",
  Done = "done",
}
```

##### `inspectionWarning` event and the `IInspectionWarningEvent` inteface
WCA rules state that during the 15 seconds of inspection time, the referee will first give a warning at 8 seconds
and another warning at 12 seconds. These warnings are expressed as objects implementing the `IInspectionWarningEvent`
interface.

```typescript
interface IInspectionWarningEvent {
  timeRemaining: number;
}
```

__Event properties__
* `timeRemaining` is the time remaining on the inspectiong timer in `milliseconds`

##### `penalty` event and the `IPenaltyEvent` interface
The total inspection time allowed by the WCA is `15 + 2` seconds. If the competitor hasn't started their solve by the
end of the initial 15 seconds, the solve is penalized by 2 seconds. If by the end of the total 17 seconds, the solve
still hasn't started, the solve is marked DNF.

(TODO: This looks clumsy, two fields that are mutually exclusive fields. Make them constants and just send the penalty
type with the event)

```typescript
enum PenaltyType {
  PlusTwo = "PENALTY_PLUS_TWO";
  DNF = "PENALTY_DNF";
};

interface IPenaltyEvent {
  type: PenaltyType
}
```
__Event properties__
* `type`: what are you supposed to write here if you have the interface and enum definition above?!


##### `tick` event and `ITickEvent` interface
```typescript
interface ITickEvent {
  phase: SolvePhase;
  time: number
}
```

__Event properties__
* `phase` is the current phase of the solve.
* `time` is the elapsed time since the last `status` change. Basically, this is the either the current inspection time
or the current solve time.

Note: If you have set `options.noInspect` to true, all `tick` events will have the phase `SolvePhase.Solving`.

#### `done` event and the `ISolveEndEvent` interface
(TODO: the interface name and the event name don't match. Then again I want this to be as thin a wrapper around `tiny-timer`
as possible)

This event will be emitted as a result of any of the following:
* calling `timer.stop()`
* calling `timer.abort()`
* not calling either of the above methods within `options.timeLimit` if `options.timeLimit` wasn't set to `0` during
initialization.

```typescript
interface ISolveEndEvent {
  inspectionTime: number;
  isDNF: boolean;
  penalized: boolean;
  solveTime: number;
}
```

__Event properties__
* `inspectionTime`: total inspection time for the solve in `milliseconds`.
* `isDNF`: `true` if a solve wasn't started before the total 17 seconds of inspection time or if `timer.abort()` was
called.
* `penalized`: will be `true` if this solve was penalized during the inspection phase.
* `solveTime`: the actual solve time in `milliseconds`


### Methods
#### constructor
```javascript
cubeTimer = new canCubeTimer({
  interval: 100,
  noInspect: false,
  timeLimit: 10 * 60,
  // event handlers
  onInspectionWarning: (timeRemaining) => {},
  onPenalty: (isDNF, timeRemaining) => {},
  onTick: (status, time, timeRemaining) => {},
  onDone: ({ inspectionTime, isDNF, penalized, solveTime }) => {},
})
```

Create a new timer instance. All options are optional. `can-cube-timer` instances are `EventEmitter`s.


__Arguments__
* `interval`: refresh interval in `milliseconds`.
* `noInspect`: disable inspection. Calling the `start` method will directly start the timer
  in with `status` set to `SOLVING`.
* `timeLimit`: the time limit for a solve in `seconds`. WCA default is 10 minutes. Set to `0` to disable

The remaining options `onInspectionWarning`, `onPenalty`, `onStateChange`, `onTick` and `onDone` are just another way of attaching
event listeners to the various events. 
Since a `CanCubeTimer` is an `EventEmitter`, so you can always add event listeners like:
```javascript
const timer = new canCubeTimer();
timer.on('inspectionWarning', () => {});
timer.on('penalty', () => {});
timer.on('tick', () => {});
timer.on('done', () => {});
```


#### start
Start the timer. This is meant to be a convenience method that you can call on a timer instance. Depending on the current
status of the timer, it will either start the inspection or the solve. 

If you try to call `start` on a timer that is already in the `SolvePhase.Solving` status an error will be thrown.
(TODO: Error definition)

_Disclaimer_
This is a stateful method that either calls the `startInspection` or the `startSolve` method. It is meant to make it possible
to write code that is less verbose.
It also lets you write code that is (in my opinion) fragile. It is better to use the more explicit methods.

If you try to call this method more than twice during a solve, an error will be thrown.
(TODO: Error defnition. Should be more specific than the previous one)

#### startInspection
Starts the inspection.

An error will be thrown
* if you try to call it more than once during a solve
* if you try to call it on a timer that was created with `options.noInspect` set to `true`
* if you try to call it on a timer that is in the `SolvePhase.Solving` phase


#### startSolve
Starts the actual solve. If you try to call it more than once an error will be thrown.

#### stop(): ISolveEndEvent
Stops the solve. An `EventTypes.Done` event will be emitted and the same event that is passed to registered event listeners
will be returned.

#### abort(): ISolveEndEvent
(TODO: Should there be a separate event for this?)
Aborts a solve. It stops the timer but the emitted `ISolveEndEvent` event object will have the `isDNF` field set to `true`

