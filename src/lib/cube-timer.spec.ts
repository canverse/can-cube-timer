// tslint:disable:no-expression-statement

const fullTests = process.argv.slice(2)[0] === 'full';

function sleep(ms: number): Promise<number> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

import test from 'ava';
import CanCubeTimer, { CanCubeError } from '../lib/cube-timer';
import { TimerStatus, EventType, TickEvent } from './types';

test('That a timer get initialized correctly without any parameters passed to the constructor', t => {
  const timer = new CanCubeTimer();
  t.is(timer.configuration.interval, 100);
  t.false(timer.configuration.noInspect);
  t.is(timer.configuration.timeLimit, 10 * 60);
});

test('Correctly initializes with the supplied options', t => {
  const timer = new CanCubeTimer({
    interval: 10,
    noInspect: true,
    timeLimit: 60,
  });

  t.is(timer.configuration.interval, 10);
  t.true(timer.configuration.noInspect);
  t.is(timer.configuration.timeLimit, 60);
});

test.cb('Starts inspection correctly and calls the supplied tick handler correctly', t => {
  const timer = new CanCubeTimer();
  timer.on(EventType.Tick, ({ status }: TickEvent) => {
    t.is(status, TimerStatus.Inspecting);
    t.end();
  });
  timer.startInspection();
});

test('Throws an error if you try to call startInspection on a timer initialized with options.noInspect set to true', t => {
  const timer = new CanCubeTimer({ noInspect: true });
  t.throws(
    timer.startInspection,
    CanCubeError,
    "Tried calling 'startInspection' with 'noInspect' option set to true!",
  );
  t.is(timer.status, TimerStatus.Stopped);
});

test('Throws an error if you try to call startInspection more than once during a solve', t => {
  const timer = new CanCubeTimer();
  timer.startInspection();

  t.throws(
    timer.startInspection,
    CanCubeError,
    "Tried calling 'startInspection' more than once during a single solve!",
  );
  t.is(timer.status, TimerStatus.Stopped);
});

test('Throws an error if you try to call startInspection while the timer status is TimerStatus.Solving', t => {
  // This should not be possible to achieve using the public API
  const timer = new CanCubeTimer();
  timer.startInspection();
  // TODO: Make this a real test once you have startSolve implemented
  t.is(true, true);
  //t.is(timer.status, TimerStatus.Stopped);
});

test('With inspection enabled, starts inspection, starts solve and reports correct data', t => {
  const timer = new CanCubeTimer();

  timer.startInspection();
  timer.startSolve();
  const solveData = timer.stop();

  t.not(solveData.inspectionTime, null);
  t.is(solveData.isDNF, false);
  t.is(solveData.aborted, false);
  t.is(solveData.penalized, false);
  t.not(solveData.solveTime, null);
});

test('Abort during inspection', async t => {
  const timer = new CanCubeTimer();
  timer.startInspection();
  await sleep(1000);

  const solveInformation = timer.abort();
  t.is(solveInformation.inspectionTime, null);
  t.true(solveInformation.isDNF);
  t.true(solveInformation.aborted);
  t.false(solveInformation.penalized);
  t.is(solveInformation.solveTime, null);
});

if (fullTests) {
  test('15+ inspection with +2 second penalty, solve normal', async t => {
    t.timeout(18000);
    const timer = new CanCubeTimer();
    timer.startInspection();
    await sleep(16500);
    timer.startSolve();
    const solveData = timer.stop();

    t.true(solveData.inspectionTime > 15000);
    t.false(solveData.isDNF);
    t.false(solveData.aborted);
    t.true(solveData.penalized);
    t.not(solveData.solveTime, null);
  });

  test.cb('DNF in inspection', t => {
    t.timeout(18500);
    const timer = new CanCubeTimer();
    timer.on(EventType.SolveEnd, solveInformation => {
      t.true(solveInformation.inspectionTime === 17000);
      t.true(solveInformation.isDNF);
      t.true(solveInformation.penalized);
      t.is(solveInformation.solveTime, null);
      t.is(timer.status, TimerStatus.Stopped);
      t.end();
    });
    timer.startInspection();
  });
}
test.todo('updates the timer status correctly and calls the registered listeners properly');

test.todo('.start() method behaves properly when inspection is enabled');

test.todo('.start() method behaves properly when inspection is disabled');

test.todo('aborting a solve during the solve returns correct data');
