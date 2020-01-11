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

let cmdArgs = process.argv.slice(2);

if(cmdArgs.length === 0){
	showQuickHelp();
} else {
	switch(cmdArgs[0]){
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
				if (err){
					console.log('Something went wrong!', err);
					return;
				}
				let zipPath = path + '/archive.zip';
				zip.zipFolder('.', zipPath, (err) => {
					if(err) {
						console.log('Something went wrong!', err);
						return;
					}
					console.log(zipPath);
					uploadFile(zipPath, (err, httpResponse, body) => {
						if(err) {
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

function uploadFile(path, callback){
	request.post({ url:'https://bjspm.croncle.com/api.php', formData: {
		action: 'UPLOAD_PACKAGE',
		package: fs.createReadStream(path)
	}}, callback);
}

function isValidPackageName(name){
	return /^[a-z0-9]+$/.test(name);
}

function isValidPackageVersion(version){
	return semver2Regex.test(version);
}

function initPackage(){
let package = {
	name: '',
	version: '',
	description: '',
	keywords: null,
	license: '',
	username: ''
};
console.log(`
This utility will walk you through creating a bjspackage.json file.
Press ^C at any time to quit.
`);

let writePackage = (obj) => {
	let json = JSON.stringify(obj, undefined, 1);
	let targetPath = process.cwd() + path.sep + 'bjspackage.json';
	console.log('About to write to ' + targetPath);
	console.log();
	console.log(json);
	console.log();
	readline.question(`Is this OK? (yes) `, (answer) => {
		let _answer = answer.toLowerCase();
		if(['', 'y', 'yes'].indexOf(answer) !== -1){
			fs.writeFile(targetPath, json, 'utf8', function (err) {
				if(err) {
					console.log('Something went wrong!', err);
					return;
				}
				process.exit();
			});
		}
	});
};

let askQuestion = () => {
	if(package.name.length === 0){
		readline.question(`package name: `, (name) => {
			if(isValidPackageName(name)){
				package.name = name;
				console.log();
			} else {
				console.log('Invalid package name.\n');
			}
			askQuestion();
		});
	}
	if(package.version.length === 0){
		readline.question(`version: (1.0.0)`, (version) => {
			if(version === ''){
				package.version = '1.0.0';
				console.log();
			} else {
				if(isValidPackageVersion(version)){
					package.version = version;
					console.log();
				} else {
					console.log('Invalid package version, must follow SemVer 2.0\n');
				}
			}
			askQuestion();
		});
	}
	if(package.description.length === 0){
		readline.question(`description: `, (description) => {
			package.description = description;
			console.log();
			askQuestion();
		});
	}
	if(package.keywords === null){
		readline.question(`keywords: `, (keywords) => {
			package.keywords = keywords.replace(/\,/g, ' ').replace(/  /g, ' ').split(' ');
			console.log();
			askQuestion();
		});
	}
	if(package.license.length === 0){
		readline.question(`license: `, (license) => {
			package.license = license;
			console.log();
			askQuestion();
		});
	}
	if(package.username.length === 0){
		readline.question(`your croncle.com username: `, (username) => {
			package.username = username;
			writePackage(package);
		});
	}
}
askQuestion();
}

function showQuickHelp(){
console.log(`
Usage: bjspm <command>

where <command> is one of:
    install, uninstall, publish, login, version
`);
	process.exit();
}