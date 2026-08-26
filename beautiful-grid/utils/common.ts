const freeGlobal = typeof global === 'object' && global !== null && (global as any).Object === Object && global;
const freeSelf = typeof self === 'object' && self !== null && (self as any).Object === Object && self;
/** Used as a reference to the global object. */
const root = freeGlobal || freeSelf || Function('return this')();

// https://github.com/lodash/lodash/blob/master/isObject.js
export function isObject(value: any) {
  const type = typeof value;
  return value != null && (type === 'object' || type === 'function');
}

export function debounce(func: any, wait: any, options?: any) {
  let lastArgs: any, lastThis: any, maxWait: any, result: any, timerId: any, lastCallTime: any;

  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;

  // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
  const useRAF = !wait && wait !== 0 && typeof root.requestAnimationFrame === 'function';

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }
  wait = +wait || 0;
  if (isObject(options)) {
    leading = Boolean(options.leading);
    maxing = 'maxWait' in options;
    maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait;
    trailing = 'trailing' in options ? Boolean(options.trailing) : trailing;
  }

  function invokeFunc(time: any) {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function startTimer(pendingFunc: any, startTimerWait: any) {
    if (useRAF) {
      return root.requestAnimationFrame(pendingFunc);
    }
    return setTimeout(pendingFunc, startTimerWait);
  }

  function cancelTimer(id: any) {
    if (useRAF) {
      return root.cancelAnimationFrame(id);
    }
    clearTimeout(id);
  }

  function leadingEdge(time: any) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = startTimer(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: any) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }

  function shouldInvoke(time: any) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (
      lastCallTime === undefined ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxing && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = startTimer(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: any) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      cancelTimer(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(Date.now());
  }

  function pending() {
    return timerId !== undefined;
  }

  const debounced: any = function (...args: any[]) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = Function('return this')();
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = startTimer(timerExpired, wait);
    }
    return result;
  };

  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;

  return debounced;
}

export function throttle(func: any, wait: any, options?: any) {
  let leading = true;
  let trailing = true;

  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }
  if (isObject(options)) {
    leading = 'leading' in options ? Boolean(options.leading) : leading;
    trailing = 'trailing' in options ? Boolean(options.trailing) : trailing;
  }
  return debounce(func, wait, {
    leading: leading,
    maxWait: wait,
    trailing: trailing,
  });
}
