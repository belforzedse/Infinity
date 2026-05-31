'use strict';

/** CI/Docker: ensure webpack exits after admin build (no watch / open workers). */
module.exports = (config) => {
  config.watch = false;
  config.devtool = false;
  config.stats = 'errors-warnings';
  return config;
};
