const fs = require('fs');
const zip = require('zip-a-folder');
const tmp = require('tmp');
const request = require('request');
const getAppDataPath = require("appdata-path");
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const semver2Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const path = require('path');
const packagePath = process.cwd() + path.sep + 'bjspackage.json';

let cmdArgs = process.argv.slice(2);

function getEmptyPackage() {
	return {
		name: '',
		version: '1.0.0',
		description: '',
		keywords: [],
		license: 'MIT',
		username: '',
		dependencies: {}
	};
}

let package = getEmptyPackage();

loadPackage(() => {
	if (cmdArgs.length === 0) {
		showQuickHelp();
	} else {
		switch (cmdArgs[0]) {
			case 'test':
				// Or
				// const getAppDataPath = require("appdata-path");

				console.log(getAppDataPath("my-app"));
				break;
			case 'init':
				initPackage();
				break;
			case 'publish': // publish [options] { --ln } [main]
				tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
					if (err) {
						console.log('Something went wrong!', err);
						return;
					}
					let zipPath = path + '/archive.zip';
					zip.zipFolder('.', zipPath, (err) => {
						if (err) {
							console.log('Something went wrong!', err);
							return;
						}
						console.log(zipPath);
						uploadFile(zipPath, (err, httpResponse, body) => {
							if (err) {
								console.log('Something went wrong!', err);
								return;
							}
							console.log(httpResponse);
							// Manual cleanup
							cleanupCallback();
						});
					});
				});
				break;
			default:
				showQuickHelp();
		}
	}
});

function uploadFile(path, callback) {
	request.post({
		url: 'https://bjspm.croncle.com/api.php', formData: {
			action: 'UPLOAD_STANDALONE_PACKAGE',
			package: fs.createReadStream(path)
		}
	}, callback);
}

function isValidUsername(name){
	name.length !== 0 && /^[A-Za-z0-9_]{1,16}$/.test(name);
}

function isValidPackageName(name) {
	return name.length !== 0 && /^[a-z_\-]{1,241}$/.test(name);
}

function isValidPackageVersion(version) {
	return version.length !== 0 && semver2Regex.test(version);
}

function loadPackage(callback) {
	if (fs.existsSync(packagePath)) {
		fs.readFile(packagePath, 'utf8', function (err, data) {
			let obj = JSON.parse(data);
			for (let prop in obj) {
				package[prop] = obj[prop];
			}
			callback();
		});
	} else {
		callback();
	}
}

function initPackage() {
	console.log(`
This utility will walk you through creating a bjspackage.json file.
Press ^C at any time to quit.
`);

	let newPackage = getEmptyPackage();
	newPackage.keywords = null;

	let writePackage = (obj) => {
		let json = JSON.stringify(obj, undefined, 1);
		console.log('About to write to ' + packagePath);
		console.log();
		console.log(json);
		console.log();
		readline.question(`Is this OK? (yes) `, (answer) => {
			let _answer = answer.toLowerCase();
			if (['', 'y', 'yes'].indexOf(_answer) !== -1) {
				fs.writeFile(packagePath, json, 'utf8', function (err) {
					if (err) {
						console.log('Something went wrong!', err);
						return;
					}
					process.exit();
				});
			}
		});
	};

	let askQuestion = () => {
		if (newPackage.name.length === 0) {
			let hasDefault = package.name.length !== 0;
			readline.question(`package name: ${hasDefault ? `(${package.name})` : ''}`, (name) => {
				if (hasDefault && name.length === 0) {
					if (isValidPackageName(package.name)) {
						newPackage.name = package.name;
						console.log();
					} else {
						console.log('Invalid package name (/^[a-z_\-]{1,241}$/)\n');
					}
				} else {
					if (isValidPackageName(name)) {
						newPackage.name = name;
						console.log();
					} else {
						console.log('Invalid package name (/^[a-z_\-]{1,241}$/)\n');
					}
				}
				askQuestion();
			});
		}
		if (newPackage.version.length === 0) {
			let hasDefault = package.version.length !== 0;
			readline.question(`version: ${hasDefault ? `(${package.version})` : ''}`, (version) => {
				if (hasDefault && version.length === 0) {
					if (isValidPackageVersion(package.version)) {
						newPackage.version = package.version;
						console.log();
					} else {
						console.log('Invalid package version, must follow SemVer 2.0\n');
					}
				} else {
					if (isValidPackageVersion(version)) {
						newPackage.version = version;
						console.log();
					} else {
						console.log('Invalid package version, must follow SemVer 2.0\n');
					}
				}
				askQuestion();
			});
		}
		if (newPackage.description.length === 0) {
			let hasDefault = package.description.length !== 0;
			readline.question(`description (optional): ${ hasDefault ? `(${package.description})` : ''}`, (description) => {
				if (hasDefault && description.length === 0) {
					newPackage.description = package.description;
				} else {
					newPackage.description = description;
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.keywords === null) {
			let hasDefault = package.keywords.length !== 0;
			readline.question(`keywords (optional): ${hasDefault ? `(${JSON.stringify(package.keywords)})` : ''}`, (keywords) => {
				if(hasDefault && keywords.length === 0){
					newPackage.keywords = package.keywords;
				} else {
					newPackage.keywords = keywords.replace(/\,/g, ' ').replace(/  /g, ' ').split(' ');
					if(newPackage.keywords[0].length === 0){
						newPackage.keywords.length = 0;
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.license.length === 0) {
			let hasDefault = package.license.length !== 0;
			readline.question(`license: ${hasDefault ? `(${package.license})` : ''}`, (license) => {
				if(hasDefault && license.length === 0){
					newPackage.license = package.license;
				} else {
					newPackage.license = license;
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.username.length === 0) {
			let hasDefault = package.username.length !== 0;
			readline.question(`your croncle.com username (optional): ${hasDefault ? `(${package.username})` : ''}`, (username) => {
				if(hasDefault && username.length === 0){
					if(isValidUsername(package.username)){
						newPackage.username = package.username;
					} else {
						console.log('Invalid username (/^[A-Za-z0-9_]{1,16}$/)\n');
					}
				} else {
					if(isValidUsername(username)){
						newPackage.username = username;
					} else {
						console.log('Invalid username (/^[A-Za-z0-9_]{1,16}$/)\n');
					}
				}
				writePackage(newPackage);
				package = newPackage;
			});
		}
	}
	askQuestion();
}

function showQuickHelp() {
	console.log(`
Usage: bjspm <command>

where <command> is one of:
    install, uninstall, publish, login, version
`);
	process.exit();
}