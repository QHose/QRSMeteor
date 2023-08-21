(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var DiffSequence;

var require = meteorInstall({"node_modules":{"meteor":{"diff-sequence":{"diff.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                 //
// packages/diff-sequence/diff.js                                                                  //
//                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                   //
module.export({
  DiffSequence: () => DiffSequence
});
const DiffSequence = {};
const hasOwn = Object.prototype.hasOwnProperty;

function isObjEmpty(obj) {
  for (let key in Object(obj)) {
    if (hasOwn.call(obj, key)) {
      return false;
    }
  }

  return true;
} // ordered: bool.
// old_results and new_results: collections of documents.
//    if ordered, they are arrays.
//    if unordered, they are IdMaps


DiffSequence.diffQueryChanges = function (ordered, oldResults, newResults, observer, options) {
  if (ordered) DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);else DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);
};

DiffSequence.diffQueryUnorderedChanges = function (oldResults, newResults, observer, options) {
  options = options || {};
  var projectionFn = options.projectionFn || EJSON.clone;

  if (observer.movedBefore) {
    throw new Error("_diffQueryUnordered called with a movedBefore observer!");
  }

  newResults.forEach(function (newDoc, id) {
    var oldDoc = oldResults.get(id);

    if (oldDoc) {
      if (observer.changed && !EJSON.equals(oldDoc, newDoc)) {
        var projectedNew = projectionFn(newDoc);
        var projectedOld = projectionFn(oldDoc);
        var changedFields = DiffSequence.makeChangedFields(projectedNew, projectedOld);

        if (!isObjEmpty(changedFields)) {
          observer.changed(id, changedFields);
        }
      }
    } else if (observer.added) {
      var fields = projectionFn(newDoc);
      delete fields._id;
      observer.added(newDoc._id, fields);
    }
  });

  if (observer.removed) {
    oldResults.forEach(function (oldDoc, id) {
      if (!newResults.has(id)) observer.removed(id);
    });
  }
};

DiffSequence.diffQueryOrderedChanges = function (old_results, new_results, observer, options) {
  options = options || {};
  var projectionFn = options.projectionFn || EJSON.clone;
  var new_presence_of_id = {};
  new_results.forEach(function (doc) {
    if (new_presence_of_id[doc._id]) Meteor._debug("Duplicate _id in new_results");
    new_presence_of_id[doc._id] = true;
  });
  var old_index_of_id = {};
  old_results.forEach(function (doc, i) {
    if (doc._id in old_index_of_id) Meteor._debug("Duplicate _id in old_results");
    old_index_of_id[doc._id] = i;
  }); // ALGORITHM:
  //
  // To determine which docs should be considered "moved" (and which
  // merely change position because of other docs moving) we run
  // a "longest common subsequence" (LCS) algorithm.  The LCS of the
  // old doc IDs and the new doc IDs gives the docs that should NOT be
  // considered moved.
  // To actually call the appropriate callbacks to get from the old state to the
  // new state:
  // First, we call removed() on all the items that only appear in the old
  // state.
  // Then, once we have the items that should not move, we walk through the new
  // results array group-by-group, where a "group" is a set of items that have
  // moved, anchored on the end by an item that should not move.  One by one, we
  // move each of those elements into place "before" the anchoring end-of-group
  // item, and fire changed events on them if necessary.  Then we fire a changed
  // event on the anchor, and move on to the next group.  There is always at
  // least one group; the last group is anchored by a virtual "null" id at the
  // end.
  // Asymptotically: O(N k) where k is number of ops, or potentially
  // O(N log N) if inner loop of LCS were made to be binary search.
  //////// LCS (longest common sequence, with respect to _id)
  // (see Wikipedia article on Longest Increasing Subsequence,
  // where the LIS is taken of the sequence of old indices of the
  // docs in new_results)
  //
  // unmoved: the output of the algorithm; members of the LCS,
  // in the form of indices into new_results

  var unmoved = []; // max_seq_len: length of LCS found so far

  var max_seq_len = 0; // seq_ends[i]: the index into new_results of the last doc in a
  // common subsequence of length of i+1 <= max_seq_len

  var N = new_results.length;
  var seq_ends = new Array(N); // ptrs:  the common subsequence ending with new_results[n] extends
  // a common subsequence ending with new_results[ptr[n]], unless
  // ptr[n] is -1.

  var ptrs = new Array(N); // virtual sequence of old indices of new results

  var old_idx_seq = function (i_new) {
    return old_index_of_id[new_results[i_new]._id];
  }; // for each item in new_results, use it to extend a common subsequence
  // of length j <= max_seq_len


  for (var i = 0; i < N; i++) {
    if (old_index_of_id[new_results[i]._id] !== undefined) {
      var j = max_seq_len; // this inner loop would traditionally be a binary search,
      // but scanning backwards we will likely find a subseq to extend
      // pretty soon, bounded for example by the total number of ops.
      // If this were to be changed to a binary search, we'd still want
      // to scan backwards a bit as an optimization.

      while (j > 0) {
        if (old_idx_seq(seq_ends[j - 1]) < old_idx_seq(i)) break;
        j--;
      }

      ptrs[i] = j === 0 ? -1 : seq_ends[j - 1];
      seq_ends[j] = i;
      if (j + 1 > max_seq_len) max_seq_len = j + 1;
    }
  } // pull out the LCS/LIS into unmoved


  var idx = max_seq_len === 0 ? -1 : seq_ends[max_seq_len - 1];

  while (idx >= 0) {
    unmoved.push(idx);
    idx = ptrs[idx];
  } // the unmoved item list is built backwards, so fix that


  unmoved.reverse(); // the last group is always anchored by the end of the result list, which is
  // an id of "null"

  unmoved.push(new_results.length);
  old_results.forEach(function (doc) {
    if (!new_presence_of_id[doc._id]) observer.removed && observer.removed(doc._id);
  }); // for each group of things in the new_results that is anchored by an unmoved
  // element, iterate through the things before it.

  var startOfGroup = 0;
  unmoved.forEach(function (endOfGroup) {
    var groupId = new_results[endOfGroup] ? new_results[endOfGroup]._id : null;
    var oldDoc, newDoc, fields, projectedNew, projectedOld;

    for (var i = startOfGroup; i < endOfGroup; i++) {
      newDoc = new_results[i];

      if (!hasOwn.call(old_index_of_id, newDoc._id)) {
        fields = projectionFn(newDoc);
        delete fields._id;
        observer.addedBefore && observer.addedBefore(newDoc._id, fields, groupId);
        observer.added && observer.added(newDoc._id, fields);
      } else {
        // moved
        oldDoc = old_results[old_index_of_id[newDoc._id]];
        projectedNew = projectionFn(newDoc);
        projectedOld = projectionFn(oldDoc);
        fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);

        if (!isObjEmpty(fields)) {
          observer.changed && observer.changed(newDoc._id, fields);
        }

        observer.movedBefore && observer.movedBefore(newDoc._id, groupId);
      }
    }

    if (groupId) {
      newDoc = new_results[endOfGroup];
      oldDoc = old_results[old_index_of_id[newDoc._id]];
      projectedNew = projectionFn(newDoc);
      projectedOld = projectionFn(oldDoc);
      fields = DiffSequence.makeChangedFields(projectedNew, projectedOld);

      if (!isObjEmpty(fields)) {
        observer.changed && observer.changed(newDoc._id, fields);
      }
    }

    startOfGroup = endOfGroup + 1;
  });
}; // General helper for diff-ing two objects.
// callbacks is an object like so:
// { leftOnly: function (key, leftValue) {...},
//   rightOnly: function (key, rightValue) {...},
//   both: function (key, leftValue, rightValue) {...},
// }


DiffSequence.diffObjects = function (left, right, callbacks) {
  Object.keys(left).forEach(key => {
    const leftValue = left[key];

    if (hasOwn.call(right, key)) {
      callbacks.both && callbacks.both(key, leftValue, right[key]);
    } else {
      callbacks.leftOnly && callbacks.leftOnly(key, leftValue);
    }
  });

  if (callbacks.rightOnly) {
    Object.keys(right).forEach(key => {
      const rightValue = right[key];

      if (!hasOwn.call(left, key)) {
        callbacks.rightOnly(key, rightValue);
      }
    });
  }
};

DiffSequence.makeChangedFields = function (newDoc, oldDoc) {
  var fields = {};
  DiffSequence.diffObjects(oldDoc, newDoc, {
    leftOnly: function (key, value) {
      fields[key] = undefined;
    },
    rightOnly: function (key, value) {
      fields[key] = value;
    },
    both: function (key, leftValue, rightValue) {
      if (!EJSON.equals(leftValue, rightValue)) fields[key] = rightValue;
    }
  });
  return fields;
};

DiffSequence.applyChanges = function (doc, changeFields) {
  Object.keys(changeFields).forEach(key => {
    const value = changeFields[key];

    if (typeof value === "undefined") {
      delete doc[key];
    } else {
      doc[key] = value;
    }
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
var exports = require("/node_modules/meteor/diff-sequence/diff.js");

/* Exports */
Package._define("diff-sequence", exports, {
  DiffSequence: DiffSequence
});

})();

//# sourceURL=meteor://💻app/packages/diff-sequence.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvZGlmZi1zZXF1ZW5jZS9kaWZmLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsIkRpZmZTZXF1ZW5jZSIsImhhc093biIsIk9iamVjdCIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiaXNPYmpFbXB0eSIsIm9iaiIsImtleSIsImNhbGwiLCJkaWZmUXVlcnlDaGFuZ2VzIiwib3JkZXJlZCIsIm9sZFJlc3VsdHMiLCJuZXdSZXN1bHRzIiwib2JzZXJ2ZXIiLCJvcHRpb25zIiwiZGlmZlF1ZXJ5T3JkZXJlZENoYW5nZXMiLCJkaWZmUXVlcnlVbm9yZGVyZWRDaGFuZ2VzIiwicHJvamVjdGlvbkZuIiwiRUpTT04iLCJjbG9uZSIsIm1vdmVkQmVmb3JlIiwiRXJyb3IiLCJmb3JFYWNoIiwibmV3RG9jIiwiaWQiLCJvbGREb2MiLCJnZXQiLCJjaGFuZ2VkIiwiZXF1YWxzIiwicHJvamVjdGVkTmV3IiwicHJvamVjdGVkT2xkIiwiY2hhbmdlZEZpZWxkcyIsIm1ha2VDaGFuZ2VkRmllbGRzIiwiYWRkZWQiLCJmaWVsZHMiLCJfaWQiLCJyZW1vdmVkIiwiaGFzIiwib2xkX3Jlc3VsdHMiLCJuZXdfcmVzdWx0cyIsIm5ld19wcmVzZW5jZV9vZl9pZCIsImRvYyIsIk1ldGVvciIsIl9kZWJ1ZyIsIm9sZF9pbmRleF9vZl9pZCIsImkiLCJ1bm1vdmVkIiwibWF4X3NlcV9sZW4iLCJOIiwibGVuZ3RoIiwic2VxX2VuZHMiLCJBcnJheSIsInB0cnMiLCJvbGRfaWR4X3NlcSIsImlfbmV3IiwidW5kZWZpbmVkIiwiaiIsImlkeCIsInB1c2giLCJyZXZlcnNlIiwic3RhcnRPZkdyb3VwIiwiZW5kT2ZHcm91cCIsImdyb3VwSWQiLCJhZGRlZEJlZm9yZSIsImRpZmZPYmplY3RzIiwibGVmdCIsInJpZ2h0IiwiY2FsbGJhY2tzIiwia2V5cyIsImxlZnRWYWx1ZSIsImJvdGgiLCJsZWZ0T25seSIsInJpZ2h0T25s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dEQsT0FBMUIsQ0FBa0NmLE9BQU87QUFDdkMsVUFBTW1FLFFBQVFFLGFBQWFyRSxHQUFiLENBQWQ7O0FBQ0EsUUFBSSxPQUFPbUUsS0FBUCxLQUFpQixXQUFyQixFQUFrQztBQUNoQyxhQUFPakMsSUFBSWxDLEdBQUosQ0FBUDtBQUNELEtBRkQsTUFFTztBQUNMa0MsVUFBSWxDLEdBQUosSUFBV21FLEtBQVg7QUFDRDtBQUNGLEdBUEQ7QUFRRCxDQVRELEMiLCJmaWxlIjoiL3BhY2thZ2VzL2RpZmYtc2VxdWVuY2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgRGlmZlNlcXVlbmNlID0ge307XG5cbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmZ1bmN0aW9uIGlzT2JqRW1wdHkob2JqKSB7XG4gIGZvciAobGV0IGtleSBpbiBPYmplY3Qob2JqKSkge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIG9yZGVyZWQ6IGJvb2wuXG4vLyBvbGRfcmVzdWx0cyBhbmQgbmV3X3Jlc3VsdHM6IGNvbGxlY3Rpb25zIG9mIGRvY3VtZW50cy5cbi8vICAgIGlmIG9yZGVyZWQsIHRoZXkgYXJlIGFycmF5cy5cbi8vICAgIGlmIHVub3JkZXJlZCwgdGhleSBhcmUgSWRNYXBzXG5EaWZmU2VxdWVuY2UuZGlmZlF1ZXJ5Q2hhbmdlcyA9IGZ1bmN0aW9uIChvcmRlcmVkLCBvbGRSZXN1bHRzLCBuZXdSZXN1bHRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLCBvcHRpb25zKSB7XG4gIGlmIChvcmRlcmVkKVxuICAgIERpZmZTZXF1ZW5jZS5kaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyhcbiAgICAgIG9sZFJlc3VsdHMsIG5ld1Jlc3VsdHMsIG9ic2VydmVyLCBvcHRpb25zKTtcbiAgZWxzZVxuICAgIERpZmZTZXF1ZW5jZS5kaWZmUXVlcnlVbm9yZGVyZWRDaGFuZ2VzKFxuICAgICAgb2xkUmVzdWx0cywgbmV3UmVzdWx0cywgb2JzZXJ2ZXIsIG9wdGlvbnMpO1xufTtcblxuRGlmZlNlcXVlbmNlLmRpZmZRdWVyeVVub3JkZXJlZENoYW5nZXMgPSBmdW5jdGlvbiAob2xkUmVzdWx0cywgbmV3UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYnNlcnZlciwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHByb2plY3Rpb25GbiA9IG9wdGlvbnMucHJvamVjdGlvbkZuIHx8IEVKU09OLmNsb25lO1xuXG4gIGlmIChvYnNlcnZlci5tb3ZlZEJlZm9yZSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIl9kaWZmUXVlcnlVbm9yZGVyZWQgY2FsbGVkIHdpdGggYSBtb3ZlZEJlZm9yZSBvYnNlcnZlciFcIik7XG4gIH1cblxuICBuZXdSZXN1bHRzLmZvckVhY2goZnVuY3Rpb24gKG5ld0RvYywgaWQpIHtcbiAgICB2YXIgb2xkRG9jID0gb2xkUmVzdWx0cy5nZXQoaWQpO1xuICAgIGlmIChvbGREb2MpIHtcbiAgICAgIGlmIChvYnNlcnZlci5jaGFuZ2VkICYmICFFSlNPTi5lcXVhbHMob2xkRG9jLCBuZXdEb2MpKSB7XG4gICAgICAgIHZhciBwcm9qZWN0ZWROZXcgPSBwcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgICAgdmFyIHByb2plY3RlZE9sZCA9IHByb2plY3Rpb25GbihvbGREb2MpO1xuICAgICAgICB2YXIgY2hhbmdlZEZpZWxkcyA9XG4gICAgICAgICAgICAgIERpZmZTZXF1ZW5jZS5tYWtlQ2hhbmdlZEZpZWxkcyhwcm9qZWN0ZWROZXcsIHByb2plY3RlZE9sZCk7XG4gICAgICAgIGlmICghIGlzT2JqRW1wdHkoY2hhbmdlZEZpZWxkcykpIHtcbiAgICAgICAgICBvYnNlcnZlci5jaGFuZ2VkKGlkLCBjaGFuZ2VkRmllbGRzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob2JzZXJ2ZXIuYWRkZWQpIHtcbiAgICAgIHZhciBmaWVsZHMgPSBwcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgIGRlbGV0ZSBmaWVsZHMuX2lkO1xuICAgICAgb2JzZXJ2ZXIuYWRkZWQobmV3RG9jLl9pZCwgZmllbGRzKTtcbiAgICB9XG4gIH0pO1xuXG4gIGlmIChvYnNlcnZlci5yZW1vdmVkKSB7XG4gICAgb2xkUmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChvbGREb2MsIGlkKSB7XG4gICAgICBpZiAoIW5ld1Jlc3VsdHMuaGFzKGlkKSlcbiAgICAgICAgb2JzZXJ2ZXIucmVtb3ZlZChpZCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbkRpZmZTZXF1ZW5jZS5kaWZmUXVlcnlPcmRlcmVkQ2hhbmdlcyA9IGZ1bmN0aW9uIChvbGRfcmVzdWx0cywgbmV3X3Jlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ic2VydmVyLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB2YXIgcHJvamVjdGlvbkZuID0gb3B0aW9ucy5wcm9qZWN0aW9uRm4gfHwgRUpTT04uY2xvbmU7XG5cbiAgdmFyIG5ld19wcmVzZW5jZV9vZl9pZCA9IHt9O1xuICBuZXdfcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChkb2MpIHtcbiAgICBpZiAobmV3X3ByZXNlbmNlX29mX2lkW2RvYy5faWRdKVxuICAgICAgTWV0ZW9yLl9kZWJ1ZyhcIkR1cGxpY2F0ZSBfaWQgaW4gbmV3X3Jlc3VsdHNcIik7XG4gICAgbmV3X3ByZXNlbmNlX29mX2lkW2RvYy5faWRdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgdmFyIG9sZF9pbmRleF9vZl9pZCA9IHt9O1xuICBvbGRfcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChkb2MsIGkpIHtcbiAgICBpZiAoZG9jLl9pZCBpbiBvbGRfaW5kZXhfb2ZfaWQpXG4gICAgICBNZXRlb3IuX2RlYnVnKFwiRHVwbGljYXRlIF9pZCBpbiBvbGRfcmVzdWx0c1wiKTtcbiAgICBvbGRfaW5kZXhfb2ZfaWRbZG9jLl9pZF0gPSBpO1xuICB9KTtcblxuICAvLyBBTEdPUklUSE06XG4gIC8vXG4gIC8vIFRvIGRldGVybWluZSB3aGljaCBkb2NzIHNob3VsZCBiZSBjb25zaWRlcmVkIFwibW92ZWRcIiAoYW5kIHdoaWNoXG4gIC8vIG1lcmVseSBjaGFuZ2UgcG9zaXRpb24gYmVjYXVzZSBvZiBvdGhlciBkb2NzIG1vdmluZykgd2UgcnVuXG4gIC8vIGEgXCJsb25nZXN0IGNvbW1vbiBzdWJzZXF1ZW5jZVwiIChMQ1MpIGFsZ29yaXRobS4gIFRoZSBMQ1Mgb2YgdGhlXG4gIC8vIG9sZCBkb2MgSURzIGFuZCB0aGUgbmV3IGRvYyBJRHMgZ2l2ZXMgdGhlIGRvY3MgdGhhdCBzaG91bGQgTk9UIGJlXG4gIC8vIGNvbnNpZGVyZWQgbW92ZWQuXG5cbiAgLy8gVG8gYWN0dWFsbHkgY2FsbCB0aGUgYXBwcm9wcmlhdGUgY2FsbGJhY2tzIHRvIGdldCBmcm9tIHRoZSBvbGQgc3RhdGUgdG8gdGhlXG4gIC8vIG5ldyBzdGF0ZTpcblxuICAvLyBGaXJzdCwgd2UgY2FsbCByZW1vdmVkKCkgb24gYWxsIHRoZSBpdGVtcyB0aGF0IG9ubHkgYXBwZWFyIGluIHRoZSBvbGRcbiAgLy8gc3RhdGUuXG5cbiAgLy8gVGhlbiwgb25jZSB3ZSBoYXZlIHRoZSBpdGVtcyB0aGF0IHNob3VsZCBub3QgbW92ZSwgd2Ugd2FsayB0aHJvdWdoIHRoZSBuZXdcbiAgLy8gcmVzdWx0cyBhcnJheSBncm91cC1ieS1ncm91cCwgd2hlcmUgYSBcImdyb3VwXCIgaXMgYSBzZXQgb2YgaXRlbXMgdGhhdCBoYXZlXG4gIC8vIG1vdmVkLCBhbmNob3JlZCBvbiB0aGUgZW5kIGJ5IGFuIGl0ZW0gdGhhdCBzaG91bGQgbm90IG1vdmUuICBPbmUgYnkgb25lLCB3ZVxuICAvLyBtb3ZlIGVhY2ggb2YgdGhvc2UgZWxlbWVudHMgaW50byBwbGFjZSBcImJlZm9yZVwiIHRoZSBhbmNob3JpbmcgZW5kLW9mLWdyb3VwXG4gIC8vIGl0ZW0sIGFuZCBmaXJlIGNoYW5nZWQgZXZlbnRzIG9uIHRoZW0gaWYgbmVjZXNzYXJ5LiAgVGhlbiB3ZSBmaXJlIGEgY2hhbmdlZFxuICAvLyBldmVudCBvbiB0aGUgYW5jaG9yLCBhbmQgbW92ZSBvbiB0byB0aGUgbmV4dCBncm91cC4gIFRoZXJlIGlzIGFsd2F5cyBhdFxuICAvLyBsZWFzdCBvbmUgZ3JvdXA7IHRoZSBsYXN0IGdyb3VwIGlzIGFuY2hvcmVkIGJ5IGEgdmlydHVhbCBcIm51bGxcIiBpZCBhdCB0aGVcbiAgLy8gZW5kLlxuXG4gIC8vIEFzeW1wdG90aWNhbGx5OiBPKE4gaykgd2hlcmUgayBpcyBudW1iZXIgb2Ygb3BzLCBvciBwb3RlbnRpYWxseVxuICAvLyBPKE4gbG9nIE4pIGlmIGlubmVyIGxvb3Agb2YgTENTIHdlcmUgbWFkZSB0byBiZSBiaW5hcnkgc2VhcmNoLlxuXG5cbiAgLy8vLy8vLy8gTENTIChsb25nZXN0IGNvbW1vbiBzZXF1ZW5jZSwgd2l0aCByZXNwZWN0IHRvIF9pZClcbiAgLy8gKHNlZSBXaWtpcGVkaWEgYXJ0aWNsZSBvbiBMb25nZXN0IEluY3JlYXNpbmcgU3Vic2VxdWVuY2UsXG4gIC8vIHdoZXJlIHRoZSBMSVMgaXMgdGFrZW4gb2YgdGhlIHNlcXVlbmNlIG9mIG9sZCBpbmRpY2VzIG9mIHRoZVxuICAvLyBkb2NzIGluIG5ld19yZXN1bHRzKVxuICAvL1xuICAvLyB1bm1vdmVkOiB0aGUgb3V0cHV0IG9mIHRoZSBhbGdvcml0aG07IG1lbWJlcnMgb2YgdGhlIExDUyxcbiAgLy8gaW4gdGhlIGZvcm0gb2YgaW5kaWNlcyBpbnRvIG5ld19yZXN1bHRzXG4gIHZhciB1bm1vdmVkID0gW107XG4gIC8vIG1heF9zZXFfbGVuOiBsZW5ndGggb2YgTENTIGZvdW5kIHNvIGZhclxuICB2YXIgbWF4X3NlcV9sZW4gPSAwO1xuICAvLyBzZXFfZW5kc1tpXTogdGhlIGluZGV4IGludG8gbmV3X3Jlc3VsdHMgb2YgdGhlIGxhc3QgZG9jIGluIGFcbiAgLy8gY29tbW9uIHN1YnNlcXVlbmNlIG9mIGxlbmd0aCBvZiBpKzEgPD0gbWF4X3NlcV9sZW5cbiAgdmFyIE4gPSBuZXdfcmVzdWx0cy5sZW5ndGg7XG4gIHZhciBzZXFfZW5kcyA9IG5ldyBBcnJheShOKTtcbiAgLy8gcHRyczogIHRoZSBjb21tb24gc3Vic2VxdWVuY2UgZW5kaW5nIHdpdGggbmV3X3Jlc3VsdHNbbl0gZXh0ZW5kc1xuICAvLyBhIGNvbW1vbiBzdWJzZXF1ZW5jZSBlbmRpbmcgd2l0aCBuZXdfcmVzdWx0c1twdHJbbl1dLCB1bmxlc3NcbiAgLy8gcHRyW25dIGlzIC0xLlxuICB2YXIgcHRycyA9IG5ldyBBcnJheShOKTtcbiAgLy8gdmlydHVhbCBzZXF1ZW5jZSBvZiBvbGQgaW5kaWNlcyBvZiBuZXcgcmVzdWx0c1xuICB2YXIgb2xkX2lkeF9zZXEgPSBmdW5jdGlvbihpX25ldykge1xuICAgIHJldHVybiBvbGRfaW5kZXhfb2ZfaWRbbmV3X3Jlc3VsdHNbaV9uZXddLl9pZF07XG4gIH07XG4gIC8vIGZvciBlYWNoIGl0ZW0gaW4gbmV3X3Jlc3VsdHMsIHVzZSBpdCB0byBleHRlbmQgYSBjb21tb24gc3Vic2VxdWVuY2VcbiAgLy8gb2YgbGVuZ3RoIGogPD0gbWF4X3NlcV9sZW5cbiAgZm9yKHZhciBpPTA7IGk8TjsgaSsrKSB7XG4gICAgaWYgKG9sZF9pbmRleF9vZl9pZFtuZXdfcmVzdWx0c1tpXS5faWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHZhciBqID0gbWF4X3NlcV9sZW47XG4gICAgICAvLyB0aGlzIGlubmVyIGxvb3Agd291bGQgdHJhZGl0aW9uYWxseSBiZSBhIGJpbmFyeSBzZWFyY2gsXG4gICAgICAvLyBidXQgc2Nhbm5pbmcgYmFja3dhcmRzIHdlIHdpbGwgbGlrZWx5IGZpbmQgYSBzdWJzZXEgdG8gZXh0ZW5kXG4gICAgICAvLyBwcmV0dHkgc29vbiwgYm91bmRlZCBmb3IgZXhhbXBsZSBieSB0aGUgdG90YWwgbnVtYmVyIG9mIG9wcy5cbiAgICAgIC8vIElmIHRoaXMgd2VyZSB0byBiZSBjaGFuZ2VkIHRvIGEgYmluYXJ5IHNlYXJjaCwgd2UnZCBzdGlsbCB3YW50XG4gICAgICAvLyB0byBzY2FuIGJhY2t3YXJkcyBhIGJpdCBhcyBhbiBvcHRpbWl6YXRpb24uXG4gICAgICB3aGlsZSAoaiA+IDApIHtcbiAgICAgICAgaWYgKG9sZF9pZHhfc2VxKHNlcV9lbmRzW2otMV0pIDwgb2xkX2lkeF9zZXEoaSkpXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGotLTtcbiAgICAgIH1cblxuICAgICAgcHRyc1tpXSA9IChqID09PSAwID8gLTEgOiBzZXFfZW5kc1tqLTFdKTtcbiAgICAgIHNlcV9lbmRzW2pdID0gaTtcbiAgICAgIGlmIChqKzEgPiBtYXhfc2VxX2xlbilcbiAgICAgICAgbWF4X3NlcV9sZW4gPSBqKzE7XG4gICAgfVxuICB9XG5cbiAgLy8gcHVsbCBvdXQgdGhlIExDUy9MSVMgaW50byB1bm1vdmVkXG4gIHZhciBpZHggPSAobWF4X3NlcV9sZW4gPT09IDAgPyAtMSA6IHNlcV9lbmRzW21heF9zZXFfbGVuLTFdKTtcbiAgd2hpbGUgKGlkeCA+PSAwKSB7XG4gICAgdW5tb3ZlZC5wdXNoKGlkeCk7XG4gICAgaWR4ID0gcHRyc1tpZHhdO1xuICB9XG4gIC8vIHRoZSB1bm1vdmVkIGl0ZW0gbGlzdCBpcyBidWlsdCBiYWNrd2FyZHMsIHNvIGZpeCB0aGF0XG4gIHVubW92ZWQucmV2ZXJzZSgpO1xuXG4gIC8vIHRoZSBsYXN0IGdyb3VwIGlzIGFsd2F5cyBhbmNob3JlZCBieSB0aGUgZW5kIG9mIHRoZSByZXN1bHQgbGlzdCwgd2hpY2ggaXNcbiAgLy8gYW4gaWQgb2YgXCJudWxsXCJcbiAgdW5tb3ZlZC5wdXNoKG5ld19yZXN1bHRzLmxlbmd0aCk7XG5cbiAgb2xkX3Jlc3VsdHMuZm9yRWFjaChmdW5jdGlvbiAoZG9jKSB7XG4gICAgaWYgKCFuZXdfcHJlc2VuY2Vfb2ZfaWRbZG9jLl9pZF0pXG4gICAgICBvYnNlcnZlci5yZW1vdmVkICYmIG9ic2VydmVyLnJlbW92ZWQoZG9jLl9pZCk7XG4gIH0pO1xuXG4gIC8vIGZvciBlYWNoIGdyb3VwIG9mIHRoaW5ncyBpbiB0aGUgbmV3X3Jlc3VsdHMgdGhhdCBpcyBhbmNob3JlZCBieSBhbiB1bm1vdmVkXG4gIC8vIGVsZW1lbnQsIGl0ZXJhdGUgdGhyb3VnaCB0aGUgdGhpbmdzIGJlZm9yZSBpdC5cbiAgdmFyIHN0YXJ0T2ZHcm91cCA9IDA7XG4gIHVubW92ZWQuZm9yRWFjaChmdW5jdGlvbiAoZW5kT2ZHcm91cCkge1xuICAgIHZhciBncm91cElkID0gbmV3X3Jlc3VsdHNbZW5kT2ZHcm91cF0gPyBuZXdfcmVzdWx0c1tlbmRPZkdyb3VwXS5faWQgOiBudWxsO1xuICAgIHZhciBvbGREb2MsIG5ld0RvYywgZmllbGRzLCBwcm9qZWN0ZWROZXcsIHByb2plY3RlZE9sZDtcbiAgICBmb3IgKHZhciBpID0gc3RhcnRPZkdyb3VwOyBpIDwgZW5kT2ZHcm91cDsgaSsrKSB7XG4gICAgICBuZXdEb2MgPSBuZXdfcmVzdWx0c1tpXTtcbiAgICAgIGlmICghaGFzT3duLmNhbGwob2xkX2luZGV4X29mX2lkLCBuZXdEb2MuX2lkKSkge1xuICAgICAgICBmaWVsZHMgPSBwcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgICAgZGVsZXRlIGZpZWxkcy5faWQ7XG4gICAgICAgIG9ic2VydmVyLmFkZGVkQmVmb3JlICYmIG9ic2VydmVyLmFkZGVkQmVmb3JlKG5ld0RvYy5faWQsIGZpZWxkcywgZ3JvdXBJZCk7XG4gICAgICAgIG9ic2VydmVyLmFkZGVkICYmIG9ic2VydmVyLmFkZGVkKG5ld0RvYy5faWQsIGZpZWxkcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBtb3ZlZFxuICAgICAgICBvbGREb2MgPSBvbGRfcmVzdWx0c1tvbGRfaW5kZXhfb2ZfaWRbbmV3RG9jLl9pZF1dO1xuICAgICAgICBwcm9qZWN0ZWROZXcgPSBwcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgICAgcHJvamVjdGVkT2xkID0gcHJvamVjdGlvbkZuKG9sZERvYyk7XG4gICAgICAgIGZpZWxkcyA9IERpZmZTZXF1ZW5jZS5tYWtlQ2hhbmdlZEZpZWxkcyhwcm9qZWN0ZWROZXcsIHByb2plY3RlZE9sZCk7XG4gICAgICAgIGlmICghaXNPYmpFbXB0eShmaWVsZHMpKSB7XG4gICAgICAgICAgb2JzZXJ2ZXIuY2hhbmdlZCAmJiBvYnNlcnZlci5jaGFuZ2VkKG5ld0RvYy5faWQsIGZpZWxkcyk7XG4gICAgICAgIH1cbiAgICAgICAgb2JzZXJ2ZXIubW92ZWRCZWZvcmUgJiYgb2JzZXJ2ZXIubW92ZWRCZWZvcmUobmV3RG9jLl9pZCwgZ3JvdXBJZCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChncm91cElkKSB7XG4gICAgICBuZXdEb2MgPSBuZXdfcmVzdWx0c1tlbmRPZkdyb3VwXTtcbiAgICAgIG9sZERvYyA9IG9sZF9yZXN1bHRzW29sZF9pbmRleF9vZl9pZFtuZXdEb2MuX2lkXV07XG4gICAgICBwcm9qZWN0ZWROZXcgPSBwcm9qZWN0aW9uRm4obmV3RG9jKTtcbiAgICAgIHByb2plY3RlZE9sZCA9IHByb2plY3Rpb25GbihvbGREb2MpO1xuICAgICAgZmllbGRzID0gRGlmZlNlcXVlbmNlLm1ha2VDaGFuZ2VkRmllbGRzKHByb2plY3RlZE5ldywgcHJvamVjdGVkT2xkKTtcbiAgICAgIGlmICghaXNPYmpFbXB0eShmaWVsZHMpKSB7XG4gICAgICAgIG9ic2VydmVyLmNoYW5nZWQgJiYgb2JzZXJ2ZXIuY2hhbmdlZChuZXdEb2MuX2lkLCBmaWVsZHMpO1xuICAgICAgfVxuICAgIH1cbiAgICBzdGFydE9mR3JvdXAgPSBlbmRPZkdyb3VwKzE7XG4gIH0pO1xuXG5cbn07XG5cblxuLy8gR2VuZXJhbCBoZWxwZXIgZm9yIGRpZmYtaW5nIHR3byBvYmplY3RzLlxuLy8gY2FsbGJhY2tzIGlzIGFuIG9iamVjdCBsaWtlIHNvOlxuLy8geyBsZWZ0T25seTogZnVuY3Rpb24gKGtleSwgbGVmdFZhbHVlKSB7Li4ufSxcbi8vICAgcmlnaHRPbmx5OiBmdW5jdGlvbiAoa2V5LCByaWdodFZhbHVlKSB7Li4ufSxcbi8vICAgYm90aDogZnVuY3Rpb24gKGtleSwgbGVmdFZhbHVlLCByaWdodFZhbHVlKSB7Li4ufSxcbi8vIH1cbkRpZmZTZXF1ZW5jZS5kaWZmT2JqZWN0cyA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCwgY2FsbGJhY2tzKSB7XG4gIE9iamVjdC5rZXlzKGxlZnQpLmZvckVhY2goa2V5ID0+IHtcbiAgICBjb25zdCBsZWZ0VmFsdWUgPSBsZWZ0W2tleV07XG4gICAgaWYgKGhhc093bi5jYWxsKHJpZ2h0LCBrZXkpKSB7XG4gICAgICBjYWxsYmFja3MuYm90aCAmJiBjYWxsYmFja3MuYm90aChrZXksIGxlZnRWYWx1ZSwgcmlnaHRba2V5XSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNhbGxiYWNrcy5sZWZ0T25seSAmJiBjYWxsYmFja3MubGVmdE9ubHkoa2V5LCBsZWZ0VmFsdWUpO1xuICAgIH1cbiAgfSk7XG5cbiAgaWYgKGNhbGxiYWNrcy5yaWdodE9ubHkpIHtcbiAgICBPYmplY3Qua2V5cyhyaWdodCkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgY29uc3QgcmlnaHRWYWx1ZSA9IHJpZ2h0W2tleV07XG4gICAgICBpZiAoISBoYXNPd24uY2FsbChsZWZ0LCBrZXkpKSB7XG4gICAgICAgIGNhbGxiYWNrcy5yaWdodE9ubHkoa2V5LCByaWdodFZhbHVlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufTtcblxuXG5EaWZmU2VxdWVuY2UubWFrZUNoYW5nZWRGaWVsZHMgPSBmdW5jdGlvbiAobmV3RG9jLCBvbGREb2MpIHtcbiAgdmFyIGZpZWxkcyA9IHt9O1xuICBEaWZmU2VxdWVuY2UuZGlmZk9iamVjdHMob2xkRG9jLCBuZXdEb2MsIHtcbiAgICBsZWZ0T25seTogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgIGZpZWxkc1trZXldID0gdW5kZWZpbmVkO1xuICAgIH0sXG4gICAgcmlnaHRPbmx5OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgZmllbGRzW2tleV0gPSB2YWx1ZTtcbiAgICB9LFxuICAgIGJvdGg6IGZ1bmN0aW9uIChrZXksIGxlZnRWYWx1ZSwgcmlnaHRWYWx1ZSkge1xuICAgICAgaWYgKCFFSlNPTi5lcXVhbHMobGVmdFZhbHVlLCByaWdodFZhbHVlKSlcbiAgICAgICAgZmllbGRzW2tleV0gPSByaWdodFZhbHVlO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBmaWVsZHM7XG59O1xuXG5EaWZmU2VxdWVuY2UuYXBwbHlDaGFuZ2VzID0gZnVuY3Rpb24gKGRvYywgY2hhbmdlRmllbGRzKSB7XG4gIE9iamVjdC5rZXlzKGNoYW5nZUZpZWxkcykuZm9yRWFjaChrZXkgPT4ge1xuICAgIGNvbnN0IHZhbHVlID0gY2hhbmdlRmllbGRzW2tleV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgZGVsZXRlIGRvY1trZXldO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2Nba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfSk7XG59O1xuXG4iXX0=
