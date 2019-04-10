var rfc = require("node-rfc");
var fs = require("fs");

module.exports = function(grunt) {

	var abapApplicationName = 'z_generic_ui5';
	var abapApplicationDesc = 'test';
	var abapPackage = 'Z_TEST_VIVEK';
	var jobURL = '';
	var nexusSnapshotRepoURL = '';

	var webAppDir = "webapp";
	var targetDir = "target";
	var tmpDir = targetDir + "/tmp";
	var tmpDirDbg = targetDir + "/tmp-dbg";
	var zipFileSuffix = "-opt-static-abap.zip";
	var preloadPrefix = "nw/epm/refapps/ext/shop";
	var nexusGroupId = "com.yourcompany";

	// Global Variables

	var tmpDirDbg = 'tmp';
	var zipFileSuffix = "-opt-static-abap.zip";
	var ctsDataFile = targetDir + "/CTS_Data.txt";
	var nexusGroupId = "com.yourcompany";

	// Project configuration.
	var abapConn = {
		user: 'i077837',
		passwd: 'Initial9',
		ashost: 'https://mo-efd2fefa7.mo.sap.corp:6300',
		sysnr: 00,
		client: 001
	};
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),

		uploadToABAP: {
			options: {
				conn: abapConn,
				zipFile: targetDir + "/<%= pkg.name %>" + zipFileSuffix,
				zipFileURL: nexusSnapshotRepoURL + "/" + nexusGroupId.replace(/\./g, "/") +
					"/<%= pkg.name %>/<%= pkg.version %>-SNAPSHOT/<%= pkg.name %>-<%= pkg.version %>-SNAPSHOT.zip",
				codePage: "UTF8"
			}
		},

		clean: {
			build: [targetDir]
		},
		encoding: {
			options: {
				encoding: "UTF8"
			},
			files: {
				src: [webAppDir + "/**/*.js", webAppDir + "/**/*.css",
					webAppDir + "/**/*.xml", webAppDir + "/**/*.json",
					webAppDir + "/**/*.html", webAppDir + "/**/*.properties"
				]
			}
		},
		eslint: {
			options: {
				configFile: ".eslintrc.json"
			},
			target: [webAppDir + "/**/*.js"]
		},
		copy: {
			copyToDbg: {
				files: [{
					expand: true,
					src: "**/*.js",
					dest: tmpDirDbg,
					cwd: webAppDir,
					filter: function(filepath) {
						// prevent js from localService to be copied
						return !filepath.match(new RegExp(webAppDir + "(\\/|\\\\)localService", "gi"));
					}
				}, {
					expand: true,
					src: "**/*.css",
					dest: tmpDirDbg,
					cwd: webAppDir
				}]
			},
			copyToTmp: {
				files: [{
					expand: true,
					src: "**/*.js",
					dest: tmpDir,
					cwd: webAppDir,
					filter: function(filepath) {
						// prevent js from localService to be copied
						return !filepath.match(new RegExp(webAppDir + "(\\/|\\\\)localService", "gi"));
					}
				}, {
					expand: true,
					src: "**/*.css",
					dest: tmpDir,
					cwd: webAppDir
				}, {
					expand: true,
					src: "localService/metadata.xml",
					dest: tmpDir,
					cwd: webAppDir
				}, {
					expand: true,
					src: "**/*",
					dest: tmpDir,
					cwd: webAppDir,
					filter: function(filepath) {
						// prevent js and css files and contents of webapp/test from being copied
						return !filepath.match(new RegExp("(" + webAppDir +
							"(\\/|\\\\)test|${webAppDir}(\\/|\\\\)localService|\\.js$|\\.css$|\\test.html$)", "gi"));
					}
				}]
			},
			copyDbgToTmp: {
				files: [{
					expand: true,
					src: "**/*.js",
					dest: tmpDir,
					cwd: tmpDirDbg,
					rename: function(dest, src) {
						return dest + "/" + src.replace(/((\.view|\.fragment|\.controller)?\.js)/, "-dbg$1");
					}
				}, {
					expand: true,
					src: "**/*.css",
					dest: tmpDir,
					cwd: tmpDirDbg,
					rename: function(dest, src) {
						return dest + "/" + src.replace(".css", "-dbg.css");
					}
				}]
			}
		},
		uglify: {
			uglifyTmp: {
				files: [{
					expand: true,
					src: "**/*.js",
					dest: tmpDir,
					cwd: webAppDir,
					filter: function(filepath) {
						// prevent js from localService to be copied
						return !filepath.match(new RegExp(webAppDir + "(\\/|\\\\)localService", "gi"));
					}
				}]
			},
			uglifyPreload: {
				files: [{
					expand: true,
					src: tmpDir + "/Component-preload.js"
				}]
			}
		},
		cssmin: {
			build: {
				files: [{
					expand: true,
					src: "**/*.css",
					dest: tmpDir,
					cwd: webAppDir
				}]
			}
		},
		openui5_preload: {
			preloadDbg: {
				options: {
					resources: {
						cwd: tmpDirDbg,
						src: ["**/*.js"],
						prefix: preloadPrefix
					},
					compress: false,
					dest: tmpDirDbg
				},
				components: true
			},
			preloadTmp: {
				options: {
					resources: {
						cwd: tmpDir,
						src: ["**/*.js"],
						prefix: preloadPrefix
					},
					compress: false,
					dest: tmpDir
				},
				components: true
			}
		},

		zip: {
			build: {
				cwd: tmpDir,
				src: tmpDir + "/**/*",
				dest: targetDir + "/<%= pkg.name %>" + zipFileSuffix
			}
		}
	});

	var rfcConnect = function(functionModule, importParameters, gruntContext) {
		return new Promise(function(resolve, reject) {
			var conn = gruntContext.options().conn;
			var client = new rfc.Client(conn);

			grunt.log.writeln("RFC client lib version:", client.getVersion());

			client.connect(function(err) {
				if (err) { // check for login/connection errors
					grunt.log.errorlns("could not connect to server", err);
					return reject();
				}
				// invoke remote enabled ABAP function module
				grunt.log.writeln("Invoking function module", functionModule);
				client.invoke(functionModule,
					importParameters,
					function(err, res) {
						if (err) { // check for errors (e.g. wrong parameters)
							grunt.log.errorlns("Error invoking", functionModule, err);
							return reject();
						}
						client.close();
						grunt.log.writeln("Messages:", res.EV_LOG_MESSAGES);
						return resolve(res);
					});
			});
		});
	};

	grunt.registerTask("uploadToABAP", "Uploads the application to the ABAP System", function(transportRequest) {
		grunt.log.writeln("Uploading to ABAP");
		if (!transportRequest) {
			if (!fs.existsSync(ctsDataFile)) {
				grunt.log.errorlns("No Transport request specified. Pass one explicitly or run createTransportRequest first.");
				return (false);
			}
			transportRequest = JSON.parse(fs.readFileSync(ctsDataFile, {
				encoding: "utf8"
			})).REQUESTID;
		}
		grunt.log.writeln("Transport request:", transportRequest);
		var url = "";
		if (!(typeof this.options().zipFile === "undefined") && fs.existsSync(this.options().zipFile)) {
			url = jobURL + "/ws/" + this.options().zipFile;
		} else {
			url = this.options().zipFileURL;
		}
		var importParameters = {
			IV_URL: url,
			IV_SAPUI5_APPLICATION_NAME: abapApplicationName,
			IV_SAPUI5_APPLICATION_DESC: abapApplicationDesc,
			IV_PACKAGE: abapPackage,
			IV_WORKBENCH_REQUEST: transportRequest,
			IV_TEST_MODE: "-",
			IV_EXTERNAL_CODE_PAGE: this.options().codePage
		};
		var done = this.async();
		grunt.log.writeln("Uploading application from", url);
		rfcConnect("/UI5/UI5_REPOSITORY_LOAD_HTTP", importParameters, this)
			.then(
				function(returnValue) {
					if (returnValue.EV_SUCCESS == "E" || returnValue.EV_SUCCESS == "W") {
						grunt.log.errorlns("Error invoking", "/UI5/UI5_REPOSITORY_LOAD_HTTP");
						grunt.log.errorlns("Message Id:", returnValue.EV_MSG_ID);
						grunt.log.errorlns("Message No:", returnValue.EV_MSG_NO);
						grunt.log.errorlns("Messages:", returnValue.EV_LOG_MESSAGES);
						done(false);
						return;
					}
					grunt.log.writeln("Application uploaded.");
					done();
				},
				function() {
					done(false);
				});
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-encoding");
	grunt.loadNpmTasks("grunt-zip");
	grunt.loadNpmTasks("grunt-openui5");
	grunt.loadNpmTasks("grunt-eslint");

	grunt.registerTask("default", ["clean", "copy:copyToDbg", "openui5_preload:preloadDbg", "copy:copyToTmp",
		"uglify:uglifyTmp", "cssmin", "openui5_preload:preloadTmp", "copy:copyDbgToTmp",
		"uglify:uglifyPreload"
	]);
	grunt.registerTask("createZip", ["zip"]);

};