"use strict";

var util = require("util")
  , APIEndpoint = require("../api-endpoint")
  , buildTypeLocator = require("../locators/build-type-locator")
  , vcsRootLocator = require("../locators/vcs-root")
  ;


function getBuildConfiguration() {
  return new APIEndpoint()
    .get()
    .uri("buildTypes/{locator}")
    .pureJson()
    .locator({name: "locator", validator: buildTypeLocator});
}

function pauseBuildConfiguration() {
  return new APIEndpoint()
    .put()
    .uri("buildTypes/{locator}/paused")
    .locator({name: "locator", validator: buildTypeLocator})
    .payload(pausePayload)
    .postProcess(function (str) {
      return {paused: str == "true"};
    });
}

function isPaused() {
  return new APIEndpoint()
    .get()
    .uri("buildTypes/{locator}/paused")
    .locator({name: "locator", validator: buildTypeLocator})
    .postProcess(function (str) {
      return {paused: str == "true"};
    });
}

function getVcsRootEntries() {
  return new APIEndpoint()
    .get()
    .uri("buildTypes/{locator}/vcs-root-entries")
    .acceptJson()
    .locator({name: "locator", validator: buildTypeLocator})
    .postProcess(vcsRootEntries)
    ;
}

function addVcsRootEntry() {
  return new APIEndpoint()
    .post()
    .uri("buildTypes/{locator}/vcs-root-entries")
    .locator({name: "locator", validator: buildTypeLocator})
    .pureJson()
    .payload(vcsRootPayload)
    .postProcess(attachVcsRootResult)
    ;
}

function removeVcsRootEntry() {
  return new APIEndpoint()
    .delete()
    .uri("buildTypes/{locator}/vcs-root-entries/{vcsRootIdLocator}")
    .statusCode(204)
    .locator({name: "locator", validator: buildTypeLocator})
    .locator({name: "vcsRootIdLocator", validator: vcsRootIdLocator})
    .postProcess(returnTrue)
    .errorHandler(missingVcsRootHandler)
    ;
}

function createBuildConfiguration() {
  return new APIEndpoint()
    .post()
    .uri("buildTypes")
    .pureJson()
    ;
}

function deleteBuildConfiguration() {
  return new APIEndpoint()
    .delete()
    .uri("buildTypes/{locator}")
    .locator({name: "locator", validator: buildTypeLocator})
    .statusCode(204)
    .postProcess(returnTrue)
    .errorHandler(missingBuildConfigurationHandler)
    ;
}

module.exports = {
  getBuildConfiguration: getBuildConfiguration(),
  pause: pauseBuildConfiguration(),
  isPaused: isPaused(),
  getVcsRoots: getVcsRootEntries(),
  addVcsRoot: addVcsRootEntry(),
  removeVcsRoot: removeVcsRootEntry(),
  createBuildConfiguration: createBuildConfiguration(),
  deleteBuildConfiguration: deleteBuildConfiguration()
};


function pausePayload(data) {
  return {
    body: util.format("%s", data.paused),
    type: "text/plain"
  }
}

function vcsRootPayload(data) {
  return {
    body: {
      "vcs-root": {
        id: data.id
      }
    },
    type: "application/json"
  };
}

function vcsRootEntries(data) {
  var result = {};

  if (data && data["vcs-root-entry"]) {
    data["vcs-root-entry"].forEach(function (vcsRoot) {
      result[vcsRoot.id] = {
        id: vcsRoot.id,
        checkoutRules: vcsRoot["checkoutRules"] || []
      }
    });
  }

  return result;
}

function attachVcsRootResult(data) {
  var result = false;

  if (data && data.id) {
    result = true;
  }
  return result;
}

function vcsRootIdLocator(data) {
  var locator = vcsRootLocator(data);

  return {
    getLocatorValue: function() {
      return locator.getLocatorId();
    }
  }
}

function missingVcsRootHandler(err) {
  if (/Status Code, 404/.test(err.message)) {
    throw new Error("VCS Root is not attached");
  } else {
    throw err;
  }
}

function missingBuildConfigurationHandler(err) {
  if (/Status Code, 404/.test(err.message)) {
    throw new Error("BuildCOnfiguration")
  } else {
    throw err;
  }
}

function returnTrue() {
  return true;
}