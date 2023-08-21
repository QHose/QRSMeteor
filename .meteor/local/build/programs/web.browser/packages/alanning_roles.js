//////////////////////////////////////////////////////////////////////////
//                                                                      //
// This is a generated file. You can view the original                  //
// source in your browser if your browser supports source maps.         //
// Source maps are supported by all recent versions of Chrome, Safari,  //
// and Firefox, and by Internet Explorer 11.                            //
//                                                                      //
//////////////////////////////////////////////////////////////////////////


(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var Accounts = Package['accounts-base'].Accounts;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Mongo = Package.mongo.Mongo;
var check = Package.check.check;
var Match = Package.check.Match;

/* Package-scope variables */
var Roles;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/alanning_roles/roles_common.js                                                                 //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
;(function () {

/**
 * Provides functions related to user authorization. Compatible with built-in Meteor accounts packages.
 *
 * @module Roles
 */

/**
 * Roles collection documents consist only of an id and a role name.
 *   ex: { _id:<uuid>, name: "admin" }
 */
if (!Meteor.roles) {
  Meteor.roles = new Mongo.Collection("roles")
}

/**
 * Authorization package compatible with built-in Meteor accounts system.
 *
 * Stores user's current roles in a 'roles' field on the user object.
 *
 * @class Roles
 * @constructor
 */
if ('undefined' === typeof Roles) {
  Roles = {}
}

"use strict";

var mixingGroupAndNonGroupErrorMsg = "Roles error: Can't mix grouped and non-grouped roles for same user";

_.extend(Roles, {

  /**
   * Constant used to reference the special 'global' group that 
   * can be used to apply blanket permissions across all groups.
   *
   * @example
   *     Roles.addUsersToRoles(user, 'admin', Roles.GLOBAL_GROUP)
   *     Roles.userIsInRole(user, 'admin') // => true
   *
   *     Roles.setUserRoles(user, 'support-staff', Roles.GLOBAL_GROUP)
   *     Roles.userIsInRole(user, 'support-staff') // => true
   *     Roles.userIsInRole(user, 'admin') // => false
   *
   * @property GLOBAL_GROUP
   * @type String
   * @static
   * @final
   */
  GLOBAL_GROUP: '__global_roles__',


  /**
   * Create a new role. Whitespace will be trimmed.
   *
   * @method createRole
   * @param {String} role Name of role
   * @return {String} id of new role
   */
  createRole: function (role) {
    var id,
        match

    if (!role
        || 'string' !== typeof role
        || role.trim().length === 0) {
      return
    }

    try {
      id = Meteor.roles.insert({'name': role.trim()})
      return id
    } catch (e) {
      // (from Meteor accounts-base package, insertUserDoc func)
      // XXX string parsing sucks, maybe
      // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
      if (/E11000 duplicate key error.*(index.*roles|roles.*index).*name/.test(e.err || e.errmsg)) {
        throw new Error("Role '" + role.trim() + "' already exists.")
      }
      else {
        throw e
      }
    }
  },

  /**
   * Delete an existing role.  Will throw "Role in use" error if any users
   * are currently assigned to the target role.
   *
   * @method deleteRole
   * @param {String} role Name of role
   */
  deleteRole: function (role) {
    if (!role) return

    var foundExistingUser = Meteor.users.findOne(
                              {roles: {$in: [role]}},
                              {fields: {_id: 1}})

    if (foundExistingUser) {
      throw new Meteor.Error(403, 'Role in use')
    }

    var thisRole = Meteor.roles.findOne({name: role})
    if (thisRole) {
      Meteor.roles.remove({_id: thisRole._id})
    }
  },

  /**
   * Add users to roles. Will create roles as needed.
   *
   * NOTE: Mixing grouped and non-grouped roles for the same user
   *       is not supported and will throw an error.
   *
   * Makes 2 calls to database:
   *  1. retrieve list of all existing roles
   *  2. update users' roles
   *
   * @example
   *     Roles.addUsersToRoles(userId, 'admin')
   *     Roles.addUsersToRoles(userId, ['view-secrets'], 'example.com')
   *     Roles.addUsersToRoles([user1, user2], ['user','editor'])
   *     Roles.addUsersToRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
   *     Roles.addUsersToRoles(userId, 'admin', Roles.GLOBAL_GROUP)
   *
   * @method addUsersToRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles/permissions to add users to
   * @param {String} [group] Optional group name. If supplied, roles will be
   *                         specific to that group.  
   *                         Group names can not start with a '$' or contain
   *                         null characters.  Periods in names '.' are
   *                         automatically converted to underscores.
   *                         The special group Roles.GLOBAL_GROUP provides 
   *                         a convenient way to assign blanket roles/permissions
   *                         across all groups.  The roles/permissions in the 
   *                         Roles.GLOBAL_GROUP group will be automatically 
   *                         included in checks for any group.
   */
  addUsersToRoles: function (users, roles, group) {
    // use Template pattern to update user roles
    Roles._updateUserRoles(users, roles, group, Roles._update_$addToSet_fn)
  },

  /**
   * Set a users roles/permissions.
   *
   * @example
   *     Roles.setUserRoles(userId, 'admin')
   *     Roles.setUserRoles(userId, ['view-secrets'], 'example.com')
   *     Roles.setUserRoles([user1, user2], ['user','editor'])
   *     Roles.setUserRoles([user1, user2], ['glorious-admin', 'perform-action'], 'example.org')
   *     Roles.setUserRoles(userId, 'admin', Roles.GLOBAL_GROUP)
   *
   * @method setUserRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles/permissions to add users to
   * @param {String} [group] Optional group name. If supplied, roles will be
   *                         specific to that group.  
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   *                         The special group Roles.GLOBAL_GROUP provides 
   *                         a convenient way to assign blanket roles/permissions
   *                         across all groups.  The roles/permissions in the 
   *                         Roles.GLOBAL_GROUP group will be automatically 
   *                         included in checks for any group.
   */
  setUserRoles: function (users, roles, group) {
    // use Template pattern to update user roles
    Roles._updateUserRoles(users, roles, group, Roles._update_$set_fn)
  },

  /**
   * Remove users from roles
   *
   * @example
   *     Roles.removeUsersFromRoles(users.bob, 'admin')
   *     Roles.removeUsersFromRoles([users.bob, users.joe], ['editor'])
   *     Roles.removeUsersFromRoles([users.bob, users.joe], ['editor', 'user'])
   *     Roles.removeUsersFromRoles(users.eve, ['user'], 'group1')
   *
   * @method removeUsersFromRoles
   * @param {Array|String} users User id(s) or object(s) with an _id field
   * @param {Array|String} roles Name(s) of roles to remove users from
   * @param {String} [group] Optional. Group name. If supplied, only that
   *                         group will have roles removed.
   */
  removeUsersFromRoles: function (users, roles, group) {
    var update

    if (!users) throw new Error ("Missing 'users' param")
    if (!roles) throw new Error ("Missing 'roles' param")
    if (group) {
      if ('string' !== typeof group)
        throw new Error ("Roles error: Invalid parameter 'group'. Expected 'string' type")
      if ('$' === group[0])
        throw new Error ("Roles error: groups can not start with '$'")

      // convert any periods to underscores
      group = group.replace(/\./g, '_')
    }

    // ensure arrays
    if (!_.isArray(users)) users = [users]
    if (!_.isArray(roles)) roles = [roles]

    // ensure users is an array of user ids
    users = _.reduce(users, function (memo, user) {
      var _id
      if ('string' === typeof user) {
        memo.push(user)
      } else if ('object' === typeof user) {
        _id = user._id
        if ('string' === typeof _id) {
          memo.push(_id)
        }
      }
      return memo
    }, [])

    // update all users, remove from roles set
    
    if (group) {
      update = {$pullAll: {}}
      update.$pullAll['roles.'+group] = roles
    } else {
      update = {$pullAll: {roles: roles}}
    }

    try {
      if (Meteor.isClient) {
        // Iterate over each user to fulfill Meteor's 'one update per ID' policy
        _.each(users, function (user) {
          Meteor.users.update({_id:user}, update)
        })
      } else {
        // On the server we can leverage MongoDB's $in operator for performance
        Meteor.users.update({_id:{$in:users}}, update, {multi: true})
      }
    }
    catch (ex) {
      if (ex.name === 'MongoError' && isMongoMixError(ex.err || ex.errmsg)) {
        throw new Error (mixingGroupAndNonGroupErrorMsg)
      }

      throw ex
    }
  },

  /**
   * Check if user has specified permissions/roles
   *
   * @example
   *     // non-group usage
   *     Roles.userIsInRole(user, 'admin')
   *     Roles.userIsInRole(user, ['admin','editor'])
   *     Roles.userIsInRole(userId, 'admin')
   *     Roles.userIsInRole(userId, ['admin','editor'])
   *
   *     // per-group usage
   *     Roles.userIsInRole(user,   ['admin','editor'], 'group1')
   *     Roles.userIsInRole(userId, ['admin','editor'], 'group1')
   *     Roles.userIsInRole(userId, ['admin','editor'], Roles.GLOBAL_GROUP)
   *
   *     // this format can also be used as short-hand for Roles.GLOBAL_GROUP
   *     Roles.userIsInRole(user, 'admin')
   *    
   * @method userIsInRole
   * @param {String|Object} user User Id or actual user object
   * @param {String|Array} roles Name of role/permission or Array of 
   *                            roles/permissions to check against.  If array, 
   *                            will return true if user is in _any_ role.
   * @param {String} [group] Optional. Name of group.  If supplied, limits check
   *                         to just that group.
   *                         The user's Roles.GLOBAL_GROUP will always be checked
   *                         whether group is specified or not.  
   * @return {Boolean} true if user is in _any_ of the target roles
   */
  userIsInRole: function (user, roles, group) {
    var id,
        userRoles,
        query,
        groupQuery,
        found = false

    // ensure array to simplify code
    if (!_.isArray(roles)) {
      roles = [roles]
    }

    if (!user) return false
    if (group) {
      if ('string' !== typeof group) return false
      if ('$' === group[0]) return false

      // convert any periods to underscores
      group = group.replace(/\./g, '_')
    }
    
    if ('object' === typeof user) {
      userRoles = user.roles
      if (_.isArray(userRoles)) {
        return _.some(roles, function (role) {
          return _.contains(userRoles, role)
        })
      } else if (userRoles && 'object' === typeof userRoles) {
        // roles field is dictionary of groups
        found = _.isArray(userRoles[group]) && _.some(roles, function (role) {
          return _.contains(userRoles[group], role)
        })
        if (!found) {
          // not found in regular group or group not specified.  
          // check Roles.GLOBAL_GROUP, if it exists
          found = _.isArray(userRoles[Roles.GLOBAL_GROUP]) && _.some(roles, function (role) {
            return _.contains(userRoles[Roles.GLOBAL_GROUP], role)
          })
        }
        return found
      }

      // missing roles field, try going direct via id
      id = user._id
    } else if ('string' === typeof user) {
      id = user
    }

    if (!id) return false


    query = {_id: id, $or: []}

    // always check Roles.GLOBAL_GROUP
    groupQuery = {}
    groupQuery['roles.'+Roles.GLOBAL_GROUP] = {$in: roles}
    query.$or.push(groupQuery)

    if (group) {
      // structure of query, when group specified including Roles.GLOBAL_GROUP 
      //   {_id: id, 
      //    $or: [
      //      {'roles.group1':{$in: ['admin']}},
      //      {'roles.__global_roles__':{$in: ['admin']}}
      //    ]}
      groupQuery = {}
      groupQuery['roles.'+group] = {$in: roles}
      query.$or.push(groupQuery)
    } else {
      // structure of query, where group not specified. includes 
      // Roles.GLOBAL_GROUP 
      //   {_id: id, 
      //    $or: [
      //      {roles: {$in: ['admin']}},
      //      {'roles.__global_roles__': {$in: ['admin']}}
      //    ]}
      query.$or.push({roles: {$in: roles}})
    }

    found = Meteor.users.findOne(query, {fields: {_id: 1}})
    return found ? true : false
  },

  /**
   * Retrieve users roles
   *
   * @method getRolesForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} [group] Optional name of group to restrict roles to.
   *                         User's Roles.GLOBAL_GROUP will also be included.
   * @return {Array} Array of user's roles, unsorted.
   */
  getRolesForUser: function (user, group) {
    if (!user) return []
    if (group) {
      if ('string' !== typeof group) return []
      if ('$' === group[0]) return []

      // convert any periods to underscores
      group = group.replace(/\./g, '_')
    }

    if ('string' === typeof user) {
      user = Meteor.users.findOne(
               {_id: user},
               {fields: {roles: 1}})

    } else if ('object' !== typeof user) {
      // invalid user object
      return []
    }

    if (!user || !user.roles) return []

    if (group) {
      return _.union(user.roles[group] || [], user.roles[Roles.GLOBAL_GROUP] || [])
    }

    if (_.isArray(user.roles))
      return user.roles

    // using groups but group not specified. return global group, if exists
    return user.roles[Roles.GLOBAL_GROUP] || []
  },

  /**
   * Retrieve set of all existing roles
   *
   * @method getAllRoles
   * @return {Cursor} cursor of existing roles
   */
  getAllRoles: function () {
    return Meteor.roles.find({}, {sort: {name: 1}})
  },

  /**
   * Retrieve all users who are in target role.  
   *
   * NOTE: This is an expensive query; it performs a full collection scan
   * on the users collection since there is no index set on the 'roles' field.  
   * This is by design as most queries will specify an _id so the _id index is 
   * used automatically.
   *
   * @method getUsersInRole
   * @param {Array|String} role Name of role/permission.  If array, users 
   *                            returned will have at least one of the roles
   *                            specified but need not have _all_ roles.
   * @param {String} [group] Optional name of group to restrict roles to.
   *                         User's Roles.GLOBAL_GROUP will also be checked.
   * @param {Object} [options] Optional options which are passed directly
   *                           through to `Meteor.users.find(query, options)`
   * @return {Cursor} cursor of users in role
   */
  getUsersInRole: function (role, group, options) {
    var query,
        roles = role,
        groupQuery

    // ensure array to simplify query logic
    if (!_.isArray(roles)) roles = [roles]
    
    if (group) {
      if ('string' !== typeof group)
        throw new Error ("Roles error: Invalid parameter 'group'. Expected 'string' type")
      if ('$' === group[0])
        throw new Error ("Roles error: groups can not start with '$'")

      // convert any periods to underscores
      group = group.replace(/\./g, '_')
    }

    query = {$or: []}

    // always check Roles.GLOBAL_GROUP
    groupQuery = {}
    groupQuery['roles.'+Roles.GLOBAL_GROUP] = {$in: roles}
    query.$or.push(groupQuery)

    if (group) {
      // structure of query, when group specified including Roles.GLOBAL_GROUP 
      //   {
      //    $or: [
      //      {'roles.group1':{$in: ['admin']}},
      //      {'roles.__global_roles__':{$in: ['admin']}}
      //    ]}
      groupQuery = {}
      groupQuery['roles.'+group] = {$in: roles}
      query.$or.push(groupQuery)
    } else {
      // structure of query, where group not specified. includes 
      // Roles.GLOBAL_GROUP 
      //   {
      //    $or: [
      //      {roles: {$in: ['admin']}},
      //      {'roles.__global_roles__': {$in: ['admin']}}
      //    ]}
      query.$or.push({roles: {$in: roles}})
    }

    return Meteor.users.find(query, options);
  },  // end getUsersInRole 
  
  /**
   * Retrieve users groups, if any
   *
   * @method getGroupsForUser
   * @param {String|Object} user User Id or actual user object
   * @param {String} [role] Optional name of roles to restrict groups to.
   *
   * @return {Array} Array of user's groups, unsorted. Roles.GLOBAL_GROUP will be omitted
   */
  getGroupsForUser: function (user, role) {
    var userGroups = [];
    
    if (!user) return []
    if (role) {
      if ('string' !== typeof role) return []
      if ('$' === role[0]) return []

      // convert any periods to underscores
      role = role.replace('.', '_')
    }

    if ('string' === typeof user) {
      user = Meteor.users.findOne(
               {_id: user},
               {fields: {roles: 1}})
    
    }else if ('object' !== typeof user) {
      // invalid user object
      return []
    }

    //User has no roles or is not using groups
    if (!user || !user.roles || _.isArray(user.roles)) return []

    if (role) {
      _.each(user.roles, function(groupRoles, groupName) {
        if (_.contains(groupRoles, role) && groupName !== Roles.GLOBAL_GROUP) {
          userGroups.push(groupName);
        }
      });
      return userGroups;
    }else {
      return _.without(_.keys(user.roles), Roles.GLOBAL_GROUP);
    }

  }, //End getGroupsForUser


  /**
   * Private function 'template' that uses $set to construct an update object
   * for MongoDB.  Passed to _updateUserRoles
   *
   * @method _update_$set_fn 
   * @protected
   * @param {Array} roles
   * @param {String} [group]
   * @return {Object} update object for use in MongoDB update command
   */
  _update_$set_fn: function  (roles, group) {
    var update = {}

    if (group) {
      // roles is a key/value dict object
      update.$set = {}
      update.$set['roles.' + group] = roles
    } else {
      // roles is an array of strings
      update.$set = {roles: roles}
    }

    return update
  },  // end _update_$set_fn 

  /**
   * Private function 'template' that uses $addToSet to construct an update 
   * object for MongoDB.  Passed to _updateUserRoles
   *
   * @method _update_$addToSet_fn  
   * @protected
   * @param {Array} roles
   * @param {String} [group]
   * @return {Object} update object for use in MongoDB update command
   */
  _update_$addToSet_fn: function (roles, group) {
    var update = {}

    if (group) {
      // roles is a key/value dict object
      update.$addToSet = {}
      update.$addToSet['roles.' + group] = {$each: roles}
    } else {
      // roles is an array of strings
      update.$addToSet = {roles: {$each: roles}}
    }

    return update
  },  // end _update_$addToSet_fn 


  /**
   * Internal function that uses the Template pattern to adds or sets roles 
   * for users.
   *
   * @method _updateUserRoles
   * @protected
   * @param {Array|String} users user id(s) or object(s) with an _id field
   * @param {Array|String} roles name(s) of roles/permissions to add users to
   * @param {String} group Group name. If not null or undefined, roles will be
   *                         specific to that group.  
   *                         Group names can not start with '$'.
   *                         Periods in names '.' are automatically converted
   *                         to underscores.
   *                         The special group Roles.GLOBAL_GROUP provides 
   *                         a convenient way to assign blanket roles/permissions
   *                         across all groups.  The roles/permissions in the 
   *                         Roles.GLOBAL_GROUP group will be automatically 
   *                         included in checks for any group.
   * @param {Function} updateFactory Func which returns an update object that
   *                         will be passed to Mongo.
   *   @param {Array} roles
   *   @param {String} [group]
   */
  _updateUserRoles: function (users, roles, group, updateFactory) {
    if (!users) throw new Error ("Missing 'users' param")
    if (!roles) throw new Error ("Missing 'roles' param")
    if (group) {
      if ('string' !== typeof group)
        throw new Error ("Roles error: Invalid parameter 'group'. Expected 'string' type")
      if ('$' === group[0])
        throw new Error ("Roles error: groups can not start with '$'")

      // convert any periods to underscores
      group = group.replace(/\./g, '_')
    }

    var existingRoles,
        query,
        update

    // ensure arrays to simplify code
    if (!_.isArray(users)) users = [users]
    if (!_.isArray(roles)) roles = [roles]

    // remove invalid roles
    roles = _.reduce(roles, function (memo, role) {
      if (role
          && 'string' === typeof role
          && role.trim().length > 0) {
        memo.push(role.trim())
      }
      return memo
    }, [])

    // empty roles array is ok, since it might be a $set operation to clear roles
    //if (roles.length === 0) return

    // ensure all roles exist in 'roles' collection
    existingRoles = _.reduce(Meteor.roles.find({}).fetch(), function (memo, role) {
      memo[role.name] = true
      return memo
    }, {})
    _.each(roles, function (role) {
      if (!existingRoles[role]) {
        Roles.createRole(role)
      }
    })

    // ensure users is an array of user ids
    users = _.reduce(users, function (memo, user) {
      var _id
      if ('string' === typeof user) {
        memo.push(user)
      } else if ('object' === typeof user) {
        _id = user._id
        if ('string' === typeof _id) {
          memo.push(_id)
        }
      }
      return memo
    }, [])
    
    // update all users
    update = updateFactory(roles, group)
    
    try {
      if (Meteor.isClient) {
        // On client, iterate over each user to fulfill Meteor's 
        // 'one update per ID' policy
        _.each(users, function (user) {
          Meteor.users.update({_id: user}, update)
        })
      } else {
        // On the server we can use MongoDB's $in operator for 
        // better performance
        Meteor.users.update(
          {_id: {$in: users}},
          update,
          {multi: true})
      }
    }
    catch (ex) {
      if (ex.name === 'MongoError' && isMongoMixError(ex.err || ex.errmsg)) {
        throw new Error (mixingGroupAndNonGroupErrorMsg)
      }

      throw ex
    }
  }  // end _updateUserRoles

})  // end _.extend(Roles ...)


function isMongoMixError (errorMsg) {
  var expectedMessages = [
      'Cannot apply $addToSet modifier to non-array',
      'Cannot apply $addToSet to a non-array field',
      'Can only apply $pullAll to an array',
      'Cannot apply $pull/$pullAll modifier to non-array',
      "can't append to array using string field name",
      'to traverse the element'
      ]

  return _.some(expectedMessages, function (snippet) {
    return strContains(errorMsg, snippet)
  })
}

function strContains (haystack, needle) {
  return -1 !== haystack.indexOf(needle)
}

}());

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/alanning_roles/client/debug.js                                                                 //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
"use strict"


////////////////////////////////////////////////////////////
// Debugging helpers
//
// Run this in your browser console to turn on debugging
// for this package:
//
//   localstorage.setItem('Roles.debug', true)
//

Roles.debug = false

try {
  if (localStorage) {
    var temp = localStorage.getItem("Roles.debug")

    if ('undefined' !== typeof temp) {
      Roles.debug = !!temp
    }
  }
} catch (ex) {
  // ignore: accessing localStorage when its disabled throws
  // https://github.com/meteor/meteor/issues/5759
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/alanning_roles/client/uiHelpers.js                                                             //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
"use strict"

/**
 * Convenience functions for use on client.
 *
 * NOTE: You must restrict user actions on the server-side; any
 * client-side checks are strictly for convenience and must not be
 * trusted.
 *
 * @module UIHelpers
 */


////////////////////////////////////////////////////////////
// UI helpers
//
// Use a semi-private variable rather than declaring UI
// helpers directly so that we can unit test the helpers.
// XXX For some reason, the UI helpers are not registered 
// before the tests run.
//
Roles._uiHelpers = {

  /**
   * UI helper to check if current user is in at least one
   * of the target roles.  For use in client-side templates.
   *
   * @example
   *     {{#if isInRole 'admin'}}
   *     {{/if}}
   *
   *     {{#if isInRole 'editor,user'}}
   *     {{/if}}
   *
   *     {{#if isInRole 'editor,user' 'group1'}}
   *     {{/if}}
   *
   * @method isInRole
   * @param {String} role Name of role or comma-seperated list of roles
   * @param {String} [group] Optional, name of group to check
   * @return {Boolean} true if current user is in at least one of the target roles
   * @static
   * @for UIHelpers 
   */
  isInRole: function (role, group) {
    var user = Meteor.user(),
        comma = (role || '').indexOf(','),
        roles

    if (!user) return false
    if (!Match.test(role, String)) return false

    if (comma !== -1) {
      roles = _.reduce(role.split(','), function (memo, r) {
        if (!r || !r.trim()) {
          return memo
        }
        memo.push(r.trim())
        return memo
      }, [])
    } else {
      roles = [role]
    }

    if (Match.test(group, String)) {
      return Roles.userIsInRole(user, roles, group)
    }

    return Roles.userIsInRole(user, roles)
  }
}



////////////////////////////////////////////////////////////
// Register UI helpers
//

if (Roles.debug && console.log) {
  console.log("[roles] Roles.debug =", Roles.debug)
}

if ('undefined' !== typeof Package.blaze &&
    'undefined' !== typeof Package.blaze.Blaze &&
    'function'  === typeof Package.blaze.Blaze.registerHelper) {
  _.each(Roles._uiHelpers, function (func, name) {
    if (Roles.debug && console.log) {
      console.log("[roles] registering Blaze helper '" + name + "'")
    }
    Package.blaze.Blaze.registerHelper(name, func) 
  })
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                         //
// packages/alanning_roles/client/subscriptions.js                                                         //
//                                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                           //
"use strict"


/**
 * Subscription handle for the currently logged in user's permissions.
 *
 * NOTE: The corresponding publish function, `_roles`, depends on
 * `this.userId` so it will automatically re-run when the currently
 * logged-in user changes.
 *
 * @example
 *
 *     `Roles.subscription.ready()` // => `true` if user roles have been loaded
 *
 * @property subscription
 * @type Object
 * @for Roles
 */

Tracker.autorun(function () {
  Roles.subscription = Meteor.subscribe("_roles")
})

/////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("alanning:roles", {
  Roles: Roles
});

})();
