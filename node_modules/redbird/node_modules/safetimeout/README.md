[![Build Status](https://secure.travis-ci.org/JamesMGreene/node-safetimeout.png?branch=master)](https://travis-ci.org/JamesMGreene/node-safetimeout)

# node-safetimeout

## DEPRECATION WARNING

**WARNING!**  This module should be considered deprecated.  If you are seeking this functionality, I recommend utilizing the nearly equivalent [`safe-timers`](https://www.npmjs.com/package/safe-timers) module instead.

---

## Overview

A Node.js module that wraps `setTimeout`, `clearTimeout`, `setInterval`, and `clearInterval` to safely operate on delays greater than the max 32-bit integer (`2147483647`) but less than `Number.MAX_VALUE` (approximately `1.79E+308`). Of course, you can use these safe versions of the functions for delays that are less than the max 32-bit integer, too.

That said, if you need to run a `setTimeout` or `setInterval` with a delay greater than 24.85 days, you may want to rethink your strategy to begin with. This module was mostly made to prove a point. :smirk:

Please note that, for use as the "delay" with `setTimeout` and `setInterval`, JavaScript engines typically
treat the numeric values of `-Infinity`, `-0`, `NaN`, `0`, and `Infinity` as `0` (though they are also typically executed in the order listed). This module does not handle any of those values, and so the behavior will match the underlying behavior of Node.

Also, please note that JavaScript engines typically:
 - treat numerical values greater than `Number.MAX_VALUE` as `Infinity` (`Number.POSITIVE_INFINITY`), and
 - treat numerical values less than `-Number.MAX_VALUE` as `-Infinity` (`Number.NEGATIVE_INFINITY`).


## Setup

```sh
npm install safetimeout
```


## Usage

```js
var safe = require('safetimeout');

var timeoutId = safe.setTimeout(console.log.bind(console, 'timeout fired'), Number.MAX_VALUE);
safe.clearTimeout(timeoutId);

var intervalId = safe.setInterval(console.log.bind(console, 'interval fired'), Number.MAX_VALUE);
safe.clearInterval(intervalId);
```


## Tests

Note that there are no unit tests because any real test would need to run for about 25 days.
I am fairly confident that Travis-CI would auto-kill the build long before then... likely
within 1 hour.
