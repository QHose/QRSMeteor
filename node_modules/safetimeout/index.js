"use strict";

// Max timeout value for `setTimeout`
var MAX_INT32 = 2147483647;

var currentId = 1;
var activeIds = {};


function runAtDate(internalId, func, date) {
  var now = Date.now();
  var then = date.getTime();
  var diff = Math.max((then - now), 0);
  var realId;
  if (diff > MAX_INT32) {
    realId = setTimeout(function() {
      runAtDate(internalId, func, date);
    }, MAX_INT32);
  }
  else {
    realId = setTimeout(func, diff);
  }

  activeIds["" + internalId] = {
    id: realId,
    type: "timeout"
  };
}

function runLongTimeout(internalId, func, delay) {
  runAtDate(internalId, func, new Date(Date.now() + delay));
}

function runLongInterval(internalId, func, delay) {
  var intervalFunc = function() {
    func();
    runLongInterval(internalId, func, delay);
  };
  runAtDate(internalId, intervalFunc, new Date(Date.now() + delay));
}

function delayCanBeHandledNormally(delay) {
  return (
    typeof delay !== "number" ||
    (
      (delay < MAX_INT32 && delay > -MAX_INT32) ||
      isNaN(delay) ||
      delay === Infinity ||
      delay === -Infinity
    )
  );
}

function safeClear(internalId) {
  if (typeof internalId === "string") {
    internalId = parseInt(internalId, 10);
  }
  // Only accept numerical ID values within the expected range
  if (
    typeof internalId !== "number" ||
    isNaN(internalId) ||
    internalId === Infinity ||
    internalId === -Infinity ||
    internalId < 1 ||
    internalId >= currentId
  ) {
    return;
  }

  var o = activeIds["" + internalId];
  if (o != null && typeof o.id === "string" && o.id) {
    if (o.type === "interval") {
      clearInterval(o.id);
    }
    else {
      clearTimeout(o.id);
    }
    delete activeIds["" + internalId];
  }
}


function safeSetTimeout(func, delay) {
  var internalId = currentId++;
  if (delayCanBeHandledNormally(delay)) {
    var selfCleaningFunc = function() {
      func();
      safeClear(internalId);
    };
    var realId = setTimeout(selfCleaningFunc, delay);

    activeIds["" + internalId] = {
      id: realId,
      type: "timeout"
    };
  }
  else {
    runLongTimeout(internalId, func, delay);
  }
  return internalId;
}

function safeSetInterval(func, delay) {
  var internalId = currentId++;
  if (delayCanBeHandledNormally(delay)) {
    var realId = setInterval(func, delay);

    activeIds["" + internalId] = {
      id: realId,
      type: "interval"
    };
  }
  else {
    runLongInterval(internalId, func, delay);
  }
  return internalId;
}

// Export the API
module.exports = {
  setTimeout: safeSetTimeout,
  clearTimeout: safeClear,
  setInterval: safeSetInterval,
  clearInterval: safeClear
};
