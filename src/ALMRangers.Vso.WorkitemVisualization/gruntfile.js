/// <binding AfterBuild='exec:package' />
/*
This file in the main entry point for defining grunt tasks and using grunt plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkID=513275&clcid=0x409
*/
module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        exec: {
            package: {
                command: "tfx extension create --manifest-globs vss-extension.json",
                stdout: true,
                stderr: true
            },
            publish: {
                command: "tfx extension publish  --manifest-globs vss-extension.json --publisher #mypublisher# --token #token#",
                stdout: true,
                stderr: true
            }
        },
        ts: {
            options: {
                "target": "es5",
                "module": "amd",
                "outDir": "app/js",
                "sourceMap": true}
            ,
            default : {
                src: ["app/ts/*.ts", "!node_modules/**/*.ts"]
            }
        },
        
        jasmine: {
            src: ["scripts/**/*.js", "sdk/**/*.js"],
            specs: "test/**/*[sS]pec.js",
            helpers: "test/helpers/*.js"
        }, 
        uglify: {
            options: {
                mangle: true
            },
            my_target: {
                files: {
                    'app/js/WorkItemVisualization.js': ['app/js/WorkItemVisualization.concat.js']
                }
            }
            
        },
        concat: {
            options: {
                stripBanners: true,
                process: function (src, filepath) {
                    var modName = filepath.substring(filepath.indexOf("/app/js"));
                    modName = modName.substring(0, filepath.indexOf(".js"));
                    return src.replace('define(', 'define("' + modName + '", ');
                },

            },
            dist: {
                src: [
                "app/js/AddEditHighlightDialog.js",
                "app/js/AnnotationForm.js",
                "app/js/FindWitDialog.js",
                "app/js/LegendGrid.js",
                "app/js/LegendMenu.js",
                "app/js/MainMenu.js",
                "app/js/PrintGraph.js",
                "app/js/TelemetryClient.js",
                "app/js/VsoStoreService.js",
                "app/js/WorkItemVisualizationGrpah.js",
                "app/js/WorkItemVisualization.js",
                "app/js/WorkItemVisualizationApp.js",
                ],
                dest: 'app/js/WorkItemVisualization.concat.js'

            }
        }

    });

    grunt.loadNpmTasks("grunt-exec");
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-jasmine");
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    

};