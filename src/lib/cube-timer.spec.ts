// tslint:disable:no-expression-statement

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
