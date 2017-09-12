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
var Promise, RESINOS_VERSION_REGEX, _, deviceTypesUtil, errors, findCallback, getImgMakerHelper, getOsModel, isDevelopmentVersion, notFoundResponse, once, onlyIf, partition, ref, reject, semver, treatAsMissingApplication;

Promise = require('bluebird');

reject = require('lodash/reject');

once = require('lodash/once');

partition = require('lodash/partition');

semver = require('resin-semver');

_ = require('lodash');

errors = require('resin-errors');

ref = require('../util'), onlyIf = ref.onlyIf, getImgMakerHelper = ref.getImgMakerHelper, findCallback = ref.findCallback, notFoundResponse = ref.notFoundResponse, treatAsMissingApplication = ref.treatAsMissingApplication, deviceTypesUtil = ref.deviceTypes, isDevelopmentVersion = ref.isDevelopmentVersion;

RESINOS_VERSION_REGEX = /v?\d+\.\d+\.\d+(\.rev\d+)?((\-|\+).+)?/;

getOsModel = function(deps, opts) {
  var apiUrl, applicationModel, configModel, deviceImageUrl, exports, getDeviceTypes, getDownloadSize, getOsVersions, imageMakerUrl, imgMakerHelper, isBrowser, isValidDeviceType, normalizeVersion, request;
  request = deps.request;
  apiUrl = opts.apiUrl, isBrowser = opts.isBrowser, imageMakerUrl = opts.imageMakerUrl;
  imgMakerHelper = getImgMakerHelper(imageMakerUrl, request);
  configModel = once(function() {
    return require('./config')(deps, opts);
  });
  applicationModel = once(function() {
    return require('./application')(deps, opts);
  });
  getDeviceTypes = once(function() {
    return configModel().getDeviceTypes();
  });
  isValidDeviceType = function(deviceType) {
    return getDeviceTypes().then(function(types) {
      return !!deviceTypesUtil.findBySlug(types, deviceType);
    });
  };
  getDownloadSize = imgMakerHelper.buildApiRequester({
    buildUrl: function(arg) {
      var deviceType, version;
      deviceType = arg.deviceType, version = arg.version;
      return "/size_estimate?deviceType=" + deviceType + "&version=" + version;
    },
    postProcess: function(arg) {
      var body;
      body = arg.body;
      return body.size;
    }
  });
  getOsVersions = imgMakerHelper.buildApiRequester({
    buildUrl: function(arg) {
      var deviceType;
      deviceType = arg.deviceType;
      return "/image/" + deviceType + "/versions";
    },
    postProcess: function(arg) {
      var latest, potentialRecommendedVersions, recommended, ref1, versions;
      ref1 = arg.body, versions = ref1.versions, latest = ref1.latest;
      versions.sort(semver.rcompare);
      potentialRecommendedVersions = reject(versions, function(version) {
        return semver.prerelease(version) || isDevelopmentVersion(version);
      });
      recommended = (potentialRecommendedVersions != null ? potentialRecommendedVersions[0] : void 0) || null;
      return {
        versions: versions,
        recommended: recommended,
        latest: latest,
        "default": recommended || latest
      };
    }
  });
  normalizeVersion = function(v) {
    var vNormalized;
    if (!v) {
      throw new Error("Invalid version: " + v);
    }
    if (v === 'latest') {
      return v;
    }
    vNormalized = v[0] === 'v' ? v.substring(1) : v;
    if (!RESINOS_VERSION_REGEX.test(vNormalized)) {
      throw new Error("Invalid semver version: " + v);
    }
    return vNormalized;
  };
  deviceImageUrl = function(deviceType, version) {
    return "/image/" + deviceType + "/?version=" + (encodeURIComponent(version));
  };
  exports = {};
  exports._getMaxSatisfyingVersion = function(versionOrRange, osVersions) {
    if (versionOrRange === 'default' || versionOrRange === 'latest' || versionOrRange === 'recommended') {
      return osVersions[versionOrRange];
    }
    return semver.maxSatisfying(osVersions, versionOrRange);
  };

  /**
  	 * @summary Get OS download size estimate
  	 * @name getDownloadSize
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 * @description **Note!** Currently only the raw (uncompressed) size is reported.
  	 *
  	 * @param {String} deviceType - device type slug
  	 * @param {String} [version] - semver-compatible version or 'latest', defaults to 'latest'.
  	 * The version **must** be the exact version number.
  	 * @fulfil {Number} - OS image download size, in bytes.
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.getDownloadSize('raspberry-pi').then(function(size) {
  	 * 	console.log('The OS download size for raspberry-pi', size);
  	 * });
  	 *
  	 * resin.models.os.getDownloadSize('raspberry-pi', function(error, size) {
  	 * 	if (error) throw error;
  	 * 	console.log('The OS download size for raspberry-pi', size);
  	 * });
   */
  exports.getDownloadSize = function(deviceType, version, callback) {
    if (version == null) {
      version = 'latest';
    }
    callback = findCallback(arguments);
    return isValidDeviceType(deviceType).then(function(isValid) {
      if (!isValid) {
        throw new errors.ResinInvalidDeviceType('No such device type');
      }
      return getDownloadSize(deviceType, version);
    }).asCallback(callback);
  };

  /**
  	 * @summary Get OS supported versions
  	 * @name getSupportedVersions
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 *
  	 * @param {String} deviceType - device type slug
  	 * @fulfil {Object} - the versions information, of the following structure:
  	 * * versions - an array of strings,
  	 * containing exact version numbers supported by the current environment
  	 * * recommended - the recommended version, i.e. the most recent version
  	 * that is _not_ pre-release, can be `null`
  	 * * latest - the most recent version, including pre-releases
  	 * * default - recommended (if available) or latest otherwise
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.getSupportedVersions('raspberry-pi').then(function(osVersions) {
  	 * 	console.log('Supported OS versions for raspberry-pi', osVersions);
  	 * });
  	 *
  	 * resin.models.os.getSupportedVersions('raspberry-pi', function(error, osVersions) {
  	 * 	if (error) throw error;
  	 * 	console.log('Supported OS versions for raspberry-pi', osVersions);
  	 * });
   */
  exports.getSupportedVersions = function(deviceType, callback) {
    callback = findCallback(arguments);
    return isValidDeviceType(deviceType).then(function(isValid) {
      if (!isValid) {
        throw new errors.ResinInvalidDeviceType('No such device type');
      }
      return getOsVersions(deviceType);
    }).asCallback(callback);
  };

  /**
  	 * @summary Get the max OS version satisfying the given range
  	 * @name getMaxSatisfyingVersion
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 *
  	 * @param {String} deviceType - device type slug
  	 * @param {String} versionOrRange - can be one of
  	 * * the exact version number,
  	 * in which case it is returned if the version is supported,
  	 * or `null` is returned otherwise,
  	 * * a [semver](https://www.npmjs.com/package/semver)-compatible
  	 * range specification, in which case the most recent satisfying version is returned
  	 * if it exists, or `null` is returned,
  	 * * `'latest'` in which case the most recent version is returned, including pre-releases,
  	 * * `'recommended'` in which case the recommended version is returned, i.e. the most
  	 * recent version excluding pre-releases, which can be `null` if only pre-release versions
  	 * are available,
  	 * * `'default'` in which case the recommended version is returned if available,
  	 * or `latest` is returned otherwise.
  	 * Defaults to `'latest'`.
  	 * @fulfil {String|null} - the version number, or `null` if no matching versions are found
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.getSupportedVersions('raspberry-pi').then(function(osVersions) {
  	 * 	console.log('Supported OS versions for raspberry-pi', osVersions);
  	 * });
  	 *
  	 * resin.models.os.getSupportedVersions('raspberry-pi', function(error, osVersions) {
  	 * 	if (error) throw error;
  	 * 	console.log('Supported OS versions for raspberry-pi', osVersions);
  	 * });
   */
  exports.getMaxSatisfyingVersion = function(deviceType, versionOrRange, callback) {
    if (versionOrRange == null) {
      versionOrRange = 'latest';
    }
    callback = findCallback(arguments);
    return isValidDeviceType(deviceType).then(function(isValid) {
      if (!isValid) {
        throw new errors.ResinInvalidDeviceType('No such device type');
      }
      return exports.getSupportedVersions(deviceType);
    }).then(function(osVersions) {
      return exports._getMaxSatisfyingVersion(versionOrRange, osVersions);
    }).asCallback(callback);
  };

  /**
  	 * @summary Get the OS image last modified date
  	 * @name getLastModified
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 *
  	 * @param {String} deviceType - device type slug
  	 * @param {String} [version] - semver-compatible version or 'latest', defaults to 'latest'.
  	 * Unsupported (unpublished) version will result in rejection.
  	 * The version **must** be the exact version number.
  	 * To resolve the semver-compatible range use `resin.model.os.getMaxSatisfyingVersion`.
  	 * @fulfil {Date} - last modified date
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.getLastModified('raspberry-pi').then(function(date) {
  	 * 	console.log('The raspberry-pi image was last modified in ' + date);
  	 * });
  	 *
  	 * resin.models.os.getLastModified('raspberrypi3', '2.0.0').then(function(date) {
  	 * 	console.log('The raspberry-pi image was last modified in ' + date);
  	 * });
  	 *
  	 * resin.models.os.getLastModified('raspberry-pi', function(error, date) {
  	 * 	if (error) throw error;
  	 * 	console.log('The raspberry-pi image was last modified in ' + date);
  	 * });
   */
  exports.getLastModified = function(deviceType, version, callback) {
    if (version == null) {
      version = 'latest';
    }
    callback = findCallback(arguments);
    return isValidDeviceType(deviceType).then(function(isValid) {
      if (!isValid) {
        throw new errors.ResinInvalidDeviceType('No such device type');
      }
      return normalizeVersion(version);
    }).then(function(version) {
      return imgMakerHelper.request({
        method: 'HEAD',
        url: deviceImageUrl(deviceType, version)
      });
    })["catch"](notFoundResponse, function() {
      throw new Error('No such version for the device type');
    }).then(function(response) {
      return new Date(response.headers.get('last-modified'));
    }).asCallback(callback);
  };

  /**
  	 * @summary Download an OS image
  	 * @name download
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 *
  	 * @param {String} deviceType - device type slug
  	 * @param {String} [version] - semver-compatible version or 'latest', defaults to 'latest'
  	 * Unsupported (unpublished) version will result in rejection.
  	 * The version **must** be the exact version number.
  	 * To resolve the semver-compatible range use `resin.model.os.getMaxSatisfyingVersion`.
  	 * @fulfil {ReadableStream} - download stream
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.download('raspberry-pi').then(function(stream) {
  	 * 	stream.pipe(fs.createWriteStream('foo/bar/image.img'));
  	 * });
  	 *
  	 * resin.models.os.download('raspberry-pi', function(error, stream) {
  	 * 	if (error) throw error;
  	 * 	stream.pipe(fs.createWriteStream('foo/bar/image.img'));
  	 * });
   */
  exports.download = onlyIf(!isBrowser)(function(deviceType, version, callback) {
    if (version == null) {
      version = 'latest';
    }
    callback = findCallback(arguments);
    return isValidDeviceType(deviceType).then(function(isValid) {
      if (!isValid) {
        throw new errors.ResinInvalidDeviceType('No such device type');
      }
      return normalizeVersion(version);
    }).then(function(version) {
      return imgMakerHelper.stream({
        url: deviceImageUrl(deviceType, version)
      });
    })["catch"](notFoundResponse, function() {
      throw new Error('No such version for the device type');
    }).asCallback(callback);
  });

  /**
  	 * @summary Get an applications config.json
  	 * @name getConfig
  	 * @public
  	 * @function
  	 * @memberof resin.models.os
  	 *
  	 * @param {String|Number} nameOrId - application name (string) or id (number).
  	 * @param {Object} [options={}] - OS configuration options to use.
  	 * @param {String} [options.network='ethernet'] - The network type that
  	 * the device will use, one of 'ethernet' or 'wifi'.
  	 * @param {Number} [options.appUpdatePollInterval] - How often the OS checks
  	 * for updates, in minutes.
  	 * @param {String} [options.wifiKey] - The key for the wifi network the
  	 * device will connect to.
  	 * @param {String} [options.wifiSsid] - The ssid for the wifi network the
  	 * device will connect to.
  	 * @param {String} [options.ip] - static ip address.
  	 * @param {String} [options.gateway] - static ip gateway.
  	 * @param {String} [options.netmask] - static ip netmask.
  	 * @param {String} [options.version] - The OS version of the image.
  	 * @fulfil {Object} - application configuration as a JSON object.
  	 * @returns {Promise}
  	 *
  	 * @example
  	 * resin.models.os.getConfig('MyApp').then(function(config) {
  	 * 	fs.writeFile('foo/bar/config.json', JSON.stringify(config));
  	 * });
  	 *
  	 * resin.models.os.getConfig(123).then(function(config) {
  	 * 	fs.writeFile('foo/bar/config.json', JSON.stringify(config));
  	 * });
  	 *
  	 * resin.models.os.getConfig('MyApp', function(error, config) {
  	 * 	if (error) throw error;
  	 * 	fs.writeFile('foo/bar/config.json', JSON.stringify(config));
  	 * });
   */
  exports.getConfig = function(nameOrId, options, callback) {
    var defaultOpts;
    if (options == null) {
      options = {};
    }
    callback = findCallback(arguments);
    defaultOpts = {
      network: 'ethernet'
    };
    _.defaults(options, defaultOpts);
    return applicationModel()._getId(nameOrId).then(function(applicationId) {
      return request.send({
        method: 'POST',
        url: '/download-config',
        baseUrl: apiUrl,
        body: _.assign(options, {
          appId: applicationId
        })
      });
    }).get('body')["catch"](notFoundResponse, treatAsMissingApplication(nameOrId)).asCallback(callback);
  };
  return exports;
};

module.exports = getOsModel;
