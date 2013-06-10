
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    component: grunt.file.readJSON('component.json'),

    clean: ['dist', 'test/tests.tap', 'test/fixture/libraries/*.js'],

    recipe: {
      options: {
        min: 'min'
      },
      main: {
        files: {
          'test/fixture/recipe': ['recipe.json']
        }
      }
    },

    concat: {
      main: {
        options: {
          banner:'/*!\n'+
                 ' * Recipe.js  Cook your javascript with recipe.js\n'+
                 ' * Author     sideroad\n'+
                 ' * License    MIT\n'+
                 ' *\n'+
                 ' * Version    <%= component.version %>\n'+
                 ' * https://github.com/sideroad/recipe/\n'+
                 ' */\n'
        },
        files: {
          'dist/recipe.unpack.js': ['lib/head.load.js', 'src/recipe.js']
        }
      }
    },

    min: {
      options: {
        report: false
      },
      main: {
        files: {
          'dist/recipe.js': ['dist/recipe.unpack.js'],
          'test/fixture/recipe/recipe.js': ['dist/recipe.unpack.js']
        }
      }
    },

    jshint: ['src/recipe.js'],

    testem: {
      options: {
        timeout: 10000
      },
      main: {
        files: {
          'test/tests.tap': ['test/target/*.html']
        }
      },
      cui: {
        options: {
          launch_in_ci: ['PhantomJS']
        },
        files: {
          'test/tests.tap': ['test/target/*.html']
        }
      }
    },

    'qunit-cov': {
      main: {
        minimum: 0.9,
        srcDir: 'test/fixture/recipe',
        depDirs: ['lib', 'test/fixture/libraries', 'test/fixture/scripts', 'test/target', 'test/lib'],
        outDir: 'cov',
        testFiles: ['test/target/*.html']
      }
    },

    plato: {
      main: {
        files: {
          'metrics': ['src/recipe.js']
        }
      }
    },

    watch: {
      scripts: {
        files: ['**/*.js'],
        tasks: ['jshint', 'testem:cui'],
        options: {
          nospawn: true,
        }
      }
    }
  });


  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-yui-compressor');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-devtools');
  grunt.loadNpmTasks('grunt-testem');
  grunt.loadNpmTasks('grunt-qunit-cov');
  grunt.loadNpmTasks('grunt-plato');
  grunt.loadNpmTasks('grunt-recipe');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['clean', 'recipe', 'jshint', 'concat', 'min', 'testem:main', 'qunit-cov', 'plato']);
  grunt.registerTask('test', ['clean', 'recipe', 'jshint', 'concat', 'min', 'testem:cui']);
  grunt.registerTask('jenkins', ['clean', 'recipe', 'jshint', 'concat', 'min', 'testem:cui', 'qunit-cov', 'plato']);

};
