//jscs:disable jsDoc

var rewriteRulesSnippet = require('grunt-connect-rewrite/lib/utils').rewriteRequest;
var selenium = require('selenium-standalone');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-regex-check');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-connect-rewrite');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.loadNpmTasks('grunt-exec');

    var gruntOptions = {
        skipTests: (process.env.GRUNT_SKIP_TESTS || false) === 'true'
    };

    console.log(gruntOptions);

    /******************************************
     * GRUNT INIT
     ******************************************/

    grunt.initConfig({
        fileConfigOptions: {
            prodHtml: [ 'target/website/index.html', 'target/website/**/*.html', '!target/website/utilities/libraries/**/' ],
            prodFiles: [ 'target/website/**/*.html', 'target/website/**/*.js', '!target/website/utilities/libraries/**/' ]
        },
        /**
         * CHECKSTYLE
         */
        jshint: {
            options: {
                jshintrc: 'config/.jshintrc',
                ignores: [ 'src/main/web/utilities/libraries/**/*.js', 'src/test/web/testUtilities/**/*.js' ],
                globals: {
                    module: true
                },
                reporter:'jslint',
                reporterOutput: 'target/jshint.xml'
            },
            files: [ 'Gruntfile.js', 'src/main/web/**/*.js', 'src/test/web/**/*.js',
                '!src/main/web/utilities/libraries/**/*.js', '!src/test/web/**/*.js', '!src/main/web/sketching/srl/objects/**/*.js' ]
        },
        jscs: {
            src: '<%= jshint.files %>',
            options: {
                config: 'config/jscs.conf.jscsrc',
                reporterOutput: 'target/jscsReport.txt',
                maxErrors: 1000
            }
        },
        /*
         * This module is used to check the existence or the lack of existance of a pattern in the given files
         */
        'regex-check': {
            head: {
                files: {
                    src: [ 'src/main/web/**/*.html', 'src/test/web/**/*.html', '!src/main/web/utilities/libraries/**/*.html',
                        'src/main/web/utilities/libraries/**/*Include.html' ]
                },
                options: {
                    // This looks for the head tag <head>
                    pattern: /<head(\s|(.*lang=.*))*>/g,
                    failIfMissing: true
                }
            }
        },
        /**
         * JSDOC
         */
        jsdoc: {
            dist: {
                src: '<%= jshint.files %>',
                options: {
                    destination: 'doc'
                }
            }
        },
        /**
         * Directory Creation
         */
        mkdir: {
            all: {
                options: {
                    create: [ 'target/unitTest', 'target/screenshots' ]
                }
            }
        },

        /**
         * BUILDERS
         */
        exec: {
            build_proto: {
                cmd: function() {
                    var protoPath = 'src/main/resources/protobuf';
                    var inputFiles = [ protoPath + '/**/*.proto' ];
                    var protoFiles = grunt.file.expand(inputFiles);
                    var jsFiles = grunt.file.expandMapping(protoFiles, 'bower_components/generated_proto', { flatten: true, ext: '.js' });
                    var command = '';
                    console.log('protofiles: ', protoFiles);
                    for (var i = 0; i < protoFiles.length; i++) {
                        grunt.log.write('cimpiling protofile ' + protoFiles[i]);
                        grunt.log.write('');
                        var jsFile = jsFiles[i].dest;
                        command+= '"./node_modules/.bin/pbjs" ' + protoFiles[i] + ' --source=proto' +
                            ' --dependency="protobufjs"' +
                            ' --target=amd --path=src/main/resources/protobuf > ' + jsFile + ' & ';
                    }
                    console.log(command);
                    return command + 'echo "' + command + '"';
                }
            }
        },

        /**
         * UNIT TESTS AND SERVER
         */
        connect: {
            options: {
                port: 9001,
                hostname: 'localhost',
                debug: false
            },
            rules: [
               { from: '^/src/(?!test)(.*)$', to: '/src/main/web/$1' },
               { from: '^/test(.*)$', to: '/src/test/web$1', redirect: 'permanent' },
               { from: '^/other(.*)$', to: '/src/main/resources/other/$1' },
               { from: '^/images(.*)$', to: '/src/main/resources/images/$1' },
            //   { from: '^/bower_components(.*)$', to: 'bower_components$1' }
            ],
            development: {
                options: {
                    middleware: function(connect, options) {
                        var middlewares = [];

                        // RewriteRules support
                        middlewares.push(rewriteRulesSnippet);

                        if (!Array.isArray(options.base)) {
                            options.base = [ options.base ];
                        }

                        var directory = options.directory || options.base[options.base.length - 1];
                        options.base.forEach(function(base) {
                            // Serve static files.
                            middlewares.push(connect.static(base));
                        });

                        // Make directory browse-able.
                        middlewares.push(connect.directory(directory));

                        return middlewares;
                    }
                }
            }
        },
        webdriver: {
            unit: {
                options: {
                    specs: [
                        'src/test/web/**/*Test.html'
                        // Test.html
                    ]
                },
                specs: [
                    'src/test/web/**/*Test.html'
                    // Test.html
                ],
                configFile: 'config/test/wdio.conf.js'
            }
        },
        'seleniumStandalone': {
            run: {

            }
        },
        'seleniumKill': {
            run: {

            }
        },
        /**
         * BUILDERS
         */
        babel: {
            options: {
                sourceMap: true
            },
            all: {
                files: [
                    {
                        expand: true,
                        src: [ 'target/website/src/main/web/**/*.js', '!target/website/src/main/web/utilities/libraries/**/*.js' ],
                        dest: '.'
                    }
                ]
            }
        },
        copy: {
            main: {
                files: [
                    {
                        // copies the website files used in production for prod use
                        expand: true,
                        src: [ '**' ],
                        dest: 'target/website/',
                        cwd: 'src/main/web'
                    }
                ]
            },
            /**
             * copies the babel polyfill into the bower_components folder
             */
            babel: {
                files: [
                    {
                        expand: false,
                        src: [ 'node_modules/babel-core/browser-polyfill.js' ],
                        dest: 'bower_components/babel-polyfill/browser-polyfill.js',
                        filter: 'isFile'
                    },
                    {
                        expand: false,
                        src: [ 'bower_components/babel-polyfill/.bower.json' ],
                        dest: 'bower_components/babel-polyfill/bower.json',
                        filter: 'isFile'
                    }
                ]
            }
        },
        replace: {
            bowerSlash: {
                src: '<%= fileConfigOptions.prodFiles %>',
                overwrite: true,
                replacements: [
                    {
                        // looks for the bower_components url in scripts and replaces it with a /
                        from: /(['"])[\/]src[\/]/g,
                        to: '$1/bower_components/'
                    }
                ]
            }
        }
    });

    /******************************************
     * UTILITIES
     ******************************************/

    function printTaskGroup() {
        grunt.log.write('\n===========\n=========== Running task group ' + grunt.task.current.name + ' ===========\n===========\n');
    }

    /******************************************
     * TASK WORKFLOW SETUP
     ******************************************/

    // sets up tasks related to creating documentation
    grunt.registerTask('documentation', function() {
        printTaskGroup();
        grunt.task.run([
            'jsdoc'
        ]);
    });

    // Sets up tasks related to setting the system for the rest of the tasks.
    grunt.registerTask('setup', function() {
        printTaskGroup();
        grunt.task.run([
            'mkdir'
        ]);
    });

    // sets up tasks needed before any checking happens.  (which in this case is changing proto files)
    grunt.registerTask('install', function() {
        printTaskGroup();
        grunt.task.run([
            'exec:build_proto'
        ]);
    });

    // sets up tasks related to checkstyle
    grunt.registerTask('checkstyle', function() {
        printTaskGroup();
        grunt.task.run([
            'jscs',
            'jshint',
            'regex-check'
        ]);
    });

    // sets up tasks related to building the production website
    grunt.registerTask('build', function() {
        printTaskGroup();
        grunt.task.run([
            'setupProd',
            'bower'
        ]);
    });
    // Sets up tasks related to setting up the production website.
    grunt.registerTask('setupProd', function() {
        printTaskGroup();
        grunt.task.run([
            'copy:main'
        ]);
    });

    // sets up tasks related to loading up bower
    grunt.registerTask('bower', function() {
        printTaskGroup();
        grunt.task.run([
            'replace:bowerSlash'
        ]);
    });

    /******************************************
     * TASK WORKFLOW RUNNING
     ******************************************/

    // 'test'  wait till browsers are better supported
    grunt.registerTask('default', [ 'install', 'checkstyle', 'documentation', 'setup', 'build' ]);
};
