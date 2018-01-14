"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Task configuration.
    jshint: {
      options: {
        jshintrc: true
      },
      all: ["*.js"]
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-jshint");

  // Default task.
  grunt.registerTask("default", ["jshint"]);

  // Travis CI task.
  grunt.registerTask("travis", ["jshint"]);

};
