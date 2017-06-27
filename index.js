'use strict';

var path = require('path');
var Promise = require('promise');
var properties = require ('properties');
var options = {
  path: true,
  variables: true,
  sections: true,
  namespaces: true
};

var readPath = Promise.denodeify(require('glob'));
var readFile = Promise.denodeify(properties.parse);

function parseFile(filename) {
  var tokens = path.basename(filename, path.extname(filename)).split('_');
  return readFile(filename, options)
    .then(function (result) {
      return {
        language: tokens[1] || 'en',
        keyValues: result || {}
      };
    });
}

module.exports = function (source) {
  var self = this;
  var callback = this.async();
  var conf = JSON.parse(source);
  var propertiesPath = path.resolve(conf.path);

  readPath(propertiesPath, 'utf-8')
    .then(function (files) {
      return Promise.all(files.map(function (file) {
        self.addDependency(file);
        return parseFile(file);
      }));
    })
    .then(function (result) {
      var locales = {};
      result.forEach(function (item) {
        if (!locales[item.language]) {
          locales[item.language] = {'app': {}};
        }
        locales[item.language]['app'] = item.keyValues;
      });
      return locales;
    }).nodeify(callback);
};