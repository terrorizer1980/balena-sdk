// Generated by CoffeeScript 1.12.5

/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
var LOCKED_STATUS_CODE, Promise, assign, errors, filter, findCallback, forEach, getApplicationModel, isArray, isEmpty, isId, mergePineOptions, normalizeDeviceOsVersion, notFoundResponse, once, ref, size, treatAsMissingApplication;

Promise = require('bluebird');

once = require('lodash/once');

assign = require('lodash/assign');

forEach = require('lodash/forEach');

isArray = require('lodash/isArray');

isEmpty = require('lodash/isEmpty');

filter = require('lodash/filter');

size = require('lodash/size');

errors = require('resin-errors');

ref = require('../util'), isId = ref.isId, findCallback = ref.findCallback, mergePineOptions = ref.mergePineOptions, notFoundResponse = ref.notFoundResponse, treatAsMissingApplication = ref.treatAsMissingApplication, LOCKED_STATUS_CODE = ref.LOCKED_STATUS_CODE;

normalizeDeviceOsVersion = require('../util/device-os-version').normalizeDeviceOsVersion;

getApplicationModel = function(deps, opts) {
  var apiUrl, deviceModel, exports, getId, normalizeApplication, pine, request, token;
  request = deps.request, token = deps.token, pine = deps.pine;
  apiUrl = opts.apiUrl;
  deviceModel = once(function() {
    return require('./device')(deps, opts);
  });
  exports = {};
  getId = function(nameOrId) {
    return Promise["try"](function() {
      if (isId(nameOrId)) {
        return nameOrId;
      } else {
        return exports.get(nameOrId, {
          select: 'id'
        }).get('id');
      }
    });
  };
  exports._getId = getId;
  normalizeApplication = function(application) {
    if (isArray(application.device)) {
      forEach(application.device, function(device) {
        return normalizeDeviceOsVersion(device);
      });
    }
    return application;
  };

  /**
  	 * @summary Get all applications
  	 * @name getAll
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {Object} [options={}] - extra pine options to use
  	 * @fulfil {Object[]} - applications
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.getAll().then(function(applications) {
  	 * 	console.log(applications);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.getAll(function(error, applications) {
  	 * 	if (error) throw error;
  	 * 	console.log(applications);
  	 * });
   */
  exports.getAll = function(options, callback) {
    if (options == null) {
      options = {};
    }
    callback = findCallback(arguments);
    return token.getUserId().then(function(userId) {
      return pine.get({
        resource: 'application',
        options: mergePineOptions({
          orderby: 'app_name asc',
          expand: 'device',
          filter: {
            user: userId
          }
        }, options)
      });
    }).map(function(application) {
      var ref1;
      application.online_devices = filter(application.device, {
        is_online: true
      }).length;
      application.devices_length = ((ref1 = application.device) != null ? ref1.length : void 0) || 0;
      normalizeApplication(application);
      return application;
    }).asCallback(callback);
  };

  /**
  	 * @summary Get a single application
  	 * @name get
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @param {Object} [options={}] - extra pine options to use
  	 * @fulfil {Object} - application
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.get('MyApp').then(function(application) {
  	 * 	console.log(application);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.get(123).then(function(application) {
  	 * 	console.log(application);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.get('MyApp', function(error, application) {
  	 * 	if (error) throw error;
  	 * 	console.log(application);
  	 * });
   */
  exports.get = function(nameOrId, options, callback) {
    if (options == null) {
      options = {};
    }
    callback = findCallback(arguments);
    return Promise["try"](function() {
      if (nameOrId == null) {
        throw new errors.ResinApplicationNotFound(nameOrId);
      }
      if (isId(nameOrId)) {
        return pine.get({
          resource: 'application',
          id: nameOrId,
          options: mergePineOptions({}, options)
        }).tap(function(application) {
          if (application == null) {
            throw new errors.ResinApplicationNotFound(nameOrId);
          }
        });
      } else {
        return pine.get({
          resource: 'application',
          options: mergePineOptions({
            filter: {
              app_name: nameOrId
            }
          }, options)
        }).tap(function(applications) {
          if (isEmpty(applications)) {
            throw new errors.ResinApplicationNotFound(nameOrId);
          }
          if (size(applications) > 1) {
            throw new errors.ResinAmbiguousApplication(nameOrId);
          }
        }).get(0);
      }
    }).tap(normalizeApplication).asCallback(callback);
  };

  /**
  	 * @summary Get a single application using the appname and owner's username
  	 * @name getAppWithOwner
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String} appName - application name
  	 * @param {String} owner - The owner's username
  	 * @param {Object} [options={}] - extra pine options to use
  	 * @fulfil {Object} - application
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.getAppWithOwner('MyApp', 'MyUser').then(function(application) {
  	 * 	console.log(application);
  	 * });
   */
  exports.getAppWithOwner = function(appName, owner, options, callback) {
    if (options == null) {
      options = {};
    }
    callback = findCallback(arguments);
    appName = appName.toLowerCase();
    owner = owner.toLowerCase();
    return pine.get({
      resource: 'application',
      options: mergePineOptions({
        filter: {
          $eq: [
            {
              $tolower: {
                $: 'app_name'
              }
            }, appName
          ]
        },
        expand: {
          user: {
            $filter: {
              $eq: [
                {
                  $tolower: {
                    $: 'username'
                  }
                }, owner
              ]
            },
            $select: 'id'
          }
        }
      }, options)
    }).tap(function(applications) {
      if (isEmpty(applications)) {
        throw new errors.ResinApplicationNotFound(owner + "/" + appName);
      }
      if (size(applications) > 1) {
        throw new errors.ResinAmbiguousApplication(owner + "/" + appName);
      }
    }).get(0).tap(normalizeApplication).asCallback(callback);
  };

  /**
  	 * @summary Check if an application exists
  	 * @name has
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @fulfil {Boolean} - has application
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.has('MyApp').then(function(hasApp) {
  	 * 	console.log(hasApp);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.has(123).then(function(hasApp) {
  	 * 	console.log(hasApp);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.has('MyApp', function(error, hasApp) {
  	 * 	if (error) throw error;
  	 * 	console.log(hasApp);
  	 * });
   */
  exports.has = function(nameOrId, callback) {
    return exports.get(nameOrId, {
      select: []
    })["return"](true)["catch"](errors.ResinApplicationNotFound, function() {
      return false;
    }).asCallback(callback);
  };

  /**
  	 * @summary Check if the user has any applications
  	 * @name hasAny
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @fulfil {Boolean} - has any applications
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.hasAny().then(function(hasAny) {
  	 * 	console.log('Has any?', hasAny);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.hasAny(function(error, hasAny) {
  	 * 	if (error) throw error;
  	 * 	console.log('Has any?', hasAny);
  	 * });
   */
  exports.hasAny = function(callback) {
    return exports.getAll().then(function(applications) {
      return !isEmpty(applications);
    }).asCallback(callback);
  };

  /**
  	 * @summary Get a single application by id
  	 * @name getById
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 * @deprecated .get() now accepts application ids directly
  	 *
  	 * @param {(Number|String)} id - application id
  	 * @fulfil {Object} - application
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.getById(89).then(function(application) {
  	 * 	console.log(application);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.getById(89, function(error, application) {
  	 * 	if (error) throw error;
  	 * 	console.log(application);
  	 * });
   */
  exports.getById = function(id, callback) {
    return pine.get({
      resource: 'application',
      id: id
    }).tap(function(application) {
      if (application == null) {
        throw new errors.ResinApplicationNotFound(id);
      }
      return normalizeApplication(application);
    }).asCallback(callback);
  };

  /**
  	 * @summary Create an application
  	 * @name create
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String} name - application name
  	 * @param {String} deviceType - device type slug
  	 * @param {(Number|String)} [parentNameOrId] - parent application name or id
  	 *
  	 * @fulfil {Object} - application
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.create('My App', 'raspberry-pi').then(function(application) {
  	 * 	console.log(application);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.create('My App', 'raspberry-pi', 'ParentApp').then(function(application) {
  	 * 	console.log(application);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.create('My App', 'raspberry-pi', function(error, application) {
  	 * 	if (error) throw error;
  	 * 	console.log(application);
  	 * });
   */
  exports.create = function(name, deviceType, parentNameOrId, callback) {
    var deviceSlugPromise, parentAppPromise;
    callback = findCallback(arguments);
    parentAppPromise = parentNameOrId ? exports.get(parentNameOrId, {
      select: ['id']
    }) : Promise.resolve();
    deviceSlugPromise = deviceModel().getDeviceSlug(deviceType).tap(function(deviceSlug) {
      if (deviceSlug == null) {
        throw new errors.ResinInvalidDeviceType(deviceType);
      }
    });
    return Promise.all([deviceSlugPromise, parentAppPromise]).then(function(arg) {
      var deviceSlug, extraOptions, parentApplication;
      deviceSlug = arg[0], parentApplication = arg[1];
      extraOptions = parentApplication ? {
        application: parentApplication.id
      } : {};
      return pine.post({
        resource: 'application',
        body: assign({
          app_name: name,
          device_type: deviceSlug
        }, extraOptions)
      });
    }).asCallback(callback);
  };

  /**
  	 * @summary Remove application
  	 * @name remove
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.remove('MyApp');
  	 *
  	 * @example
  	 * resin.models.application.remove(123);
  	 *
  	 * @example
  	 * resin.models.application.remove('MyApp', function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.remove = function(nameOrId, callback) {
    return getId(nameOrId).then(function(applicationId) {
      return pine["delete"]({
        resource: 'application',
        id: applicationId
      });
    })["catch"](notFoundResponse, treatAsMissingApplication(nameOrId)).asCallback(callback);
  };

  /**
  	 * @summary Restart application
  	 * @name restart
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.restart('MyApp');
  	 *
  	 * @example
  	 * resin.models.application.restart(123);
  	 *
  	 * @example
  	 * resin.models.application.restart('MyApp', function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.restart = function(nameOrId, callback) {
    return getId(nameOrId).then(function(applicationId) {
      return request.send({
        method: 'POST',
        url: "/application/" + applicationId + "/restart",
        baseUrl: apiUrl
      });
    })["return"](void 0)["catch"](notFoundResponse, treatAsMissingApplication(nameOrId)).asCallback(callback);
  };

  /**
  	 * @summary Generate an API key for a specific application
  	 * @name generateApiKey
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @fulfil {String} - api key
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.generateApiKey('MyApp').then(function(apiKey) {
  	 * 	console.log(apiKey);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.generateApiKey(123).then(function(apiKey) {
  	 * 	console.log(apiKey);
  	 * });
  	 *
  	 * @example
  	 * resin.models.application.generateApiKey('MyApp', function(error, apiKey) {
  	 * 	if (error) throw error;
  	 * 	console.log(apiKey);
  	 * });
   */
  exports.generateApiKey = function(nameOrId, callback) {
    return exports.get(nameOrId, {
      select: 'id'
    }).then(function(arg) {
      var id;
      id = arg.id;
      return request.send({
        method: 'POST',
        url: "/application/" + id + "/generate-api-key",
        baseUrl: apiUrl
      });
    }).get('body').asCallback(callback);
  };

  /**
  	 * @summary Purge devices by application id
  	 * @name purge
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {Number} appId - application id
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.purge(123);
  	 *
  	 * @example
  	 * resin.models.application.purge(123, function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.purge = function(appId, callback) {
    return request.send({
      method: 'POST',
      url: '/supervisor/v1/purge',
      baseUrl: apiUrl,
      body: {
        appId: appId,
        data: {
          appId: "" + appId
        }
      }
    })["catch"](function(err) {
      if (err.statusCode === LOCKED_STATUS_CODE) {
        throw new errors.ResinSupervisorLockedError();
      }
      throw err;
    }).asCallback(callback);
  };

  /**
  	 * @summary Shutdown devices by application id
  	 * @name shutdown
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {Number} appId - application id
  	 * @param {Object} [options] - options
  	 * @param {Boolean} [options.force=false] - override update lock
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.shutdown(123);
  	 *
  	 * @example
  	 * resin.models.application.shutdown(123, function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.shutdown = function(appId, options, callback) {
    if (options == null) {
      options = {};
    }
    return request.send({
      method: 'POST',
      url: '/supervisor/v1/shutdown',
      baseUrl: apiUrl,
      body: {
        appId: appId,
        data: {
          force: Boolean(options.force)
        }
      }
    })["catch"](function(err) {
      if (err.statusCode === LOCKED_STATUS_CODE) {
        throw new errors.ResinSupervisorLockedError();
      }
      throw err;
    }).asCallback(callback);
  };

  /**
  	 * @summary Reboot devices by application id
  	 * @name reboot
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {Number} appId - application id
  	 * @param {Object} [options] - options
  	 * @param {Boolean} [options.force=false] - override update lock
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.reboot(123);
  	 *
  	 * @example
  	 * resin.models.application.reboot(123, function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.reboot = function(appId, options, callback) {
    if (options == null) {
      options = {};
    }
    return request.send({
      method: 'POST',
      url: '/supervisor/v1/reboot',
      baseUrl: apiUrl,
      body: {
        appId: appId,
        data: {
          force: Boolean(options.force)
        }
      }
    })["catch"](function(err) {
      if (err.statusCode === LOCKED_STATUS_CODE) {
        throw new errors.ResinSupervisorLockedError();
      }
      throw err;
    }).asCallback(callback);
  };

  /**
  	 * @summary Get an API key for a specific application
  	 * @name getApiKey
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @fulfil {String} - api key
  	 * @returns {Promise}
  	 *
  	 * @deprecated Use generateApiKey instead
  	 * @see {@link resin.models.application.generateApiKey}
   */
  exports.getApiKey = exports.generateApiKey;

  /**
  	 * @summary Enable device urls for all devices that belong to an application
  	 * @name enableDeviceUrls
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.enableDeviceUrls('MyApp');
  	 *
  	 * @example
  	 * resin.models.application.enableDeviceUrls(123);
  	 *
  	 * @example
  	 * resin.models.device.enableDeviceUrls('MyApp', function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.enableDeviceUrls = function(nameOrId, callback) {
    return exports.get(nameOrId, {
      select: 'id'
    }).then(function(arg) {
      var id;
      id = arg.id;
      return pine.patch({
        resource: 'device',
        body: {
          is_web_accessible: true
        },
        options: {
          filter: {
            application: id
          }
        }
      });
    }).asCallback(callback);
  };

  /**
  	 * @summary Disable device urls for all devices that belong to an application
  	 * @name disableDeviceUrls
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.disableDeviceUrls('MyApp');
  	 *
  	 * @example
  	 * resin.models.application.disableDeviceUrls(123);
  	 *
  	 * @example
  	 * resin.models.device.disableDeviceUrls('MyApp', function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.disableDeviceUrls = function(nameOrId, callback) {
    return exports.get(nameOrId, {
      select: 'id'
    }).then(function(arg) {
      var id;
      id = arg.id;
      return pine.patch({
        resource: 'device',
        body: {
          is_web_accessible: false
        },
        options: {
          filter: {
            application: id
          }
        }
      });
    }).asCallback(callback);
  };

  /**
  	 * @summary Grant support access to an application until a specified time
  	 * @name grantSupportAccess
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @param {Number} expiryTimestamp - a timestamp in ms for when the support access will expire
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.grantSupportAccess('MyApp', Date.now() + 3600 * 1000);
  	 *
  	 * @example
  	 * resin.models.application.grantSupportAccess(123, Date.now() + 3600 * 1000);
  	 *
  	 * @example
  	 * resin.models.application.grantSupportAccess('MyApp', Date.now() + 3600 * 1000, function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.grantSupportAccess = function(nameOrId, expiryTimestamp, callback) {
    if ((expiryTimestamp == null) || expiryTimestamp <= Date.now()) {
      throw new errors.ResinInvalidParameterError('expiryTimestamp', expiryTimestamp);
    }
    return getId(nameOrId).then(function(applicationId) {
      return pine.patch({
        resource: 'application',
        id: applicationId,
        body: {
          support_expiry_date: expiryTimestamp
        }
      });
    })["catch"](notFoundResponse, treatAsMissingApplication(nameOrId)).asCallback(callback);
  };

  /**
  	 * @summary Revoke support access to an application
  	 * @name revokeSupportAccess
  	 * @public
  	 * @function
  	 * @memberof resin.models.application
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number)
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.application.revokeSupportAccess('MyApp');
  	 *
  	 * @example
  	 * resin.models.application.revokeSupportAccess(123);
  	 *
  	 * @example
  	 * resin.models.application.revokeSupportAccess('MyApp', function(error) {
  	 * 	if (error) throw error;
  	 * });
   */
  exports.revokeSupportAccess = function(nameOrId, callback) {
    return getId(nameOrId).then(function(applicationId) {
      return pine.patch({
        resource: 'application',
        id: applicationId,
        body: {
          support_expiry_date: null
        }
      });
    })["catch"](notFoundResponse, treatAsMissingApplication(nameOrId)).asCallback(callback);
  };
  return exports;
};

module.exports = getApplicationModel;
