# can-cube-timer
Simple Rubik's Cube timer


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
Incoming tomorrow
