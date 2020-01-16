#!/usr/bin/env node

const fs = require('fs');
const archiver = require('archiver');
const tmp = require('tmp');
const request = require('request');
const getAppDataPath = require("appdata-path");
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const Minimatch = require('minimatch').Minimatch;
const semver2Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const path = require('path');
const packagePath = process.cwd() + path.sep + 'bjspackage.json';
const ignoresPaths = [
	process.cwd() + path.sep + '.bjspmignore',
	process.cwd() + path.sep + '.gitignore',
];
const appDataPath = getAppDataPath('BJSPM');
const authTokenStore = appDataPath + path.sep + 'authTokenStore.json';
const API_STATUS = {
	OK: 1,
	ERR: 2
}
const UPLOAD_MODE = {
	DEFAULT: 0,
	USER: 1,
	NAMED: 2,
	UNNAMED: 3
}
const licences = ['', '0BSD', 'AAL', 'Abstyles', 'Adobe-2006', 'Adobe-Glyph', 'ADSL', 'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AFL-3.0', 'Afmparse', 'AGPL-1.0-only', 'AGPL-1.0-or-later', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'Aladdin', 'AMDPLPA', 'AML', 'AMPAS', 'ANTLR-PD', 'Apache-1.0', 'Apache-1.1', 'Apache-2.0', 'APAFML', 'APL-1.0', 'APSL-1.0', 'APSL-1.1', 'APSL-1.2', 'APSL-2.0', 'Artistic-1.0', 'Artistic-1.0-cl8', 'Artistic-1.0-Perl', 'Artistic-2.0', 'Bahyph', 'Barr', 'Beerware', 'BitTorrent-1.0', 'BitTorrent-1.1', 'blessing', 'BlueOak-1.0.0', 'Borceux', 'BSD-1-Clause', 'BSD-2-Clause', 'BSD-2-Clause-FreeBSD', 'BSD-2-Clause-NetBSD', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'BSD-3-Clause-Attribution', 'BSD-3-Clause-Clear', 'BSD-3-Clause-LBNL', 'BSD-3-Clause-No-Nuclear-License', 'BSD-3-Clause-No-Nuclear-License-2014', 'BSD-3-Clause-No-Nuclear-Warranty', 'BSD-3-Clause-Open-MPI', 'BSD-4-Clause', 'BSD-4-Clause-UC', 'BSD-Protection', 'BSD-Source-Code', 'BSL-1.0', 'bzip2-1.0.5', 'bzip2-1.0.6', 'Caldera', 'CATOSL-1.1', 'CC-BY-1.0', 'CC-BY-2.0', 'CC-BY-2.5', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-NC-1.0', 'CC-BY-NC-2.0', 'CC-BY-NC-2.5', 'CC-BY-NC-3.0', 'CC-BY-NC-4.0', 'CC-BY-NC-ND-1.0', 'CC-BY-NC-ND-2.0', 'CC-BY-NC-ND-2.5', 'CC-BY-NC-ND-3.0', 'CC-BY-NC-ND-4.0', 'CC-BY-NC-SA-1.0', 'CC-BY-NC-SA-2.0', 'CC-BY-NC-SA-2.5', 'CC-BY-NC-SA-3.0', 'CC-BY-NC-SA-4.0', 'CC-BY-ND-1.0', 'CC-BY-ND-2.0', 'CC-BY-ND-2.5', 'CC-BY-ND-3.0', 'CC-BY-ND-4.0', 'CC-BY-SA-1.0', 'CC-BY-SA-2.0', 'CC-BY-SA-2.5', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'CC-PDDC', 'CC0-1.0', 'CDDL-1.0', 'CDDL-1.1', 'CDLA-Permissive-1.0', 'CDLA-Sharing-1.0', 'CECILL-1.0', 'CECILL-1.1', 'CECILL-2.0', 'CECILL-2.1', 'CECILL-B', 'CECILL-C', 'CERN-OHL-1.1', 'CERN-OHL-1.2', 'ClArtistic', 'CNRI-Jython', 'CNRI-Python', 'CNRI-Python-GPL-Compatible', 'Condor-1.1', 'copyleft-next-0.3.0', 'copyleft-next-0.3.1', 'CPAL-1.0', 'CPL-1.0', 'CPOL-1.02', 'Crossword', 'CrystalStacker', 'CUA-OPL-1.0', 'Cube', 'curl', 'D-FSL-1.0', 'diffmark', 'DOC', 'Dotseqn', 'DSDP', 'dvipdfm', 'ECL-1.0', 'ECL-2.0', 'EFL-1.0', 'EFL-2.0', 'eGenix', 'Entessa', 'EPL-1.0', 'EPL-2.0', 'ErlPL-1.1', 'etalab-2.0', 'EUDatagrid', 'EUPL-1.0', 'EUPL-1.1', 'EUPL-1.2', 'Eurosym', 'Fair', 'Frameworx-1.0', 'FreeImage', 'FSFAP', 'FSFUL', 'FSFULLR', 'FTL', 'GFDL-1.1-only', 'GFDL-1.1-or-later', 'GFDL-1.2-only', 'GFDL-1.2-or-later', 'GFDL-1.3-only', 'GFDL-1.3-or-later', 'Giftware', 'GL2PS', 'Glide', 'Glulxe', 'gnuplot', 'GPL-1.0-only', 'GPL-1.0-or-later', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later', 'gSOAP-1.3b', 'HaskellReport', 'HPND', 'HPND-sell-variant', 'IBM-pibs', 'ICU', 'IJG', 'ImageMagick', 'iMatix', 'Imlib2', 'Info-ZIP', 'Intel', 'Intel-ACPI', 'Interbase-1.0', 'IPA', 'IPL-1.0', 'ISC', 'JasPer-2.0', 'JPNIC', 'JSON', 'LAL-1.2', 'LAL-1.3', 'Latex2e', 'Leptonica', 'LGPL-2.0-only', 'LGPL-2.0-or-later', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later', 'LGPLLR', 'Libpng', 'libpng-2.0', 'libtiff', 'LiLiQ-P-1.1', 'LiLiQ-R-1.1', 'LiLiQ-Rplus-1.1', 'Linux-OpenIB', 'LPL-1.0', 'LPL-1.02', 'LPPL-1.0', 'LPPL-1.1', 'LPPL-1.2', 'LPPL-1.3a', 'LPPL-1.3c', 'MakeIndex', 'MirOS', 'MIT', 'MIT-0', 'MIT-advertising', 'MIT-CMU', 'MIT-enna', 'MIT-feh', 'MITNFA', 'Motosoto', 'mpich2', 'MPL-1.0', 'MPL-1.1', 'MPL-2.0', 'MPL-2.0-no-copyleft-exception', 'MS-PL', 'MS-RL', 'MTLL', 'MulanPSL-1.0', 'Multics', 'Mup', 'NASA-1.3', 'Naumen', 'NBPL-1.0', 'NCSA', 'Net-SNMP', 'NetCDF', 'Newsletr', 'NGPL', 'NLOD-1.0', 'NLPL', 'Nokia', 'NOSL', 'Noweb', 'NPL-1.0', 'NPL-1.1', 'NPOSL-3.0', 'NRL', 'NTP', 'OCCT-PL', 'OCLC-2.0', 'ODbL-1.0', 'ODC-By-1.0', 'OFL-1.0', 'OFL-1.1', 'OGL-Canada-2.0', 'OGL-UK-1.0', 'OGL-UK-2.0', 'OGL-UK-3.0', 'OGTSL', 'OLDAP-1.1', 'OLDAP-1.2', 'OLDAP-1.3', 'OLDAP-1.4', 'OLDAP-2.0', 'OLDAP-2.0.1', 'OLDAP-2.1', 'OLDAP-2.2', 'OLDAP-2.2.1', 'OLDAP-2.2.2', 'OLDAP-2.3', 'OLDAP-2.4', 'OLDAP-2.5', 'OLDAP-2.6', 'OLDAP-2.7', 'OLDAP-2.8', 'OML', 'OpenSSL', 'OPL-1.0', 'OSET-PL-2.1', 'OSL-1.0', 'OSL-1.1', 'OSL-2.0', 'OSL-2.1', 'OSL-3.0', 'Parity-6.0.0', 'PDDL-1.0', 'PHP-3.0', 'PHP-3.01', 'Plexus', 'PostgreSQL', 'psfrag', 'psutils', 'Python-2.0', 'Qhull', 'QPL-1.0', 'Rdisc', 'RHeCos-1.1', 'RPL-1.1', 'RPL-1.5', 'RPSL-1.0', 'RSA-MD', 'RSCPL', 'Ruby', 'SAX-PD', 'Saxpath', 'SCEA', 'Sendmail', 'Sendmail-8.23', 'SGI-B-1.0', 'SGI-B-1.1', 'SGI-B-2.0', 'SHL-0.5', 'SHL-0.51', 'SimPL-2.0', 'SISSL', 'SISSL-1.2', 'Sleepycat', 'SMLNJ', 'SMPPL', 'SNIA', 'Spencer-86', 'Spencer-94', 'Spencer-99', 'SPL-1.0', 'SSH-OpenSSH', 'SSH-short', 'SSPL-1.0', 'SugarCRM-1.1.3', 'SWL', 'TAPR-OHL-1.0', 'TCL', 'TCP-wrappers', 'TMate', 'TORQUE-1.1', 'TOSL', 'TU-Berlin-1.0', 'TU-Berlin-2.0', 'UCL-1.0', 'Unicode-DFS-2015', 'Unicode-DFS-2016', 'Unicode-TOU', 'Unlicense', 'UPL-1.0', 'Vim', 'VOSTROM', 'VSL-1.0', 'W3C', 'W3C-19980720', 'W3C-20150513', 'Watcom-1.0', 'Wsuipa', 'WTFPL', 'X11', 'Xerox', 'XFree86-1.1', 'xinetd', 'Xnet', 'xpp', 'XSkat', 'YPL-1.0', 'YPL-1.1', 'Zed', 'Zend-2.0', 'Zimbra-1.3', 'Zimbra-1.4', 'Zlib', 'zlib-acknowledgement', 'ZPL-1.1', 'ZPL-2.0', 'ZPL-2.1'];
const defaultIgnores = ['.*.swp', '._*', '.DS_Store', '.git', '.hg', '.npmrc', '.lock-wscript', '.svn', '.wafpickle-*', 'config.gypi', 'CVS', 'npm-debug.log'];
const defaultIgnoreGlobs = [];
const panickMsg = 'Something went wrong!';

for(let ignoreGlob of defaultIgnores){
	defaultIgnoreGlobs.push(new Minimatch(ignoreGlob));
}

let ignores = defaultIgnores;
let ignoreGlobs = [];

if (!fs.existsSync(appDataPath)) {
	fs.mkdirSync(appDataPath);
}

let authTokens = {};
let cmdArgs = process.argv.slice(2);

function getEmptyPackage() {
	var zip = new JSZip();
	zip.folder()
	return {
		name: '',
		version: '',
		description: '',
		keywords: null,
		license: '',
		username: '',
		dependencies: {}
	};
}

function getDefaultPackage() {
	return {
		name: '',
		version: '1.0.0',
		description: '',
		keywords: [],
		license: '',
		username: '',
		dependencies: {}
	};
}

let package = getDefaultPackage();

loadPackage(() => {
	loadAuthTokens(() => {
		if (cmdArgs.length === 0) {
			showQuickHelp();
		} else {
			switch (cmdArgs[0]) {
				case 'init':
					initPackage();
					break;
				case 'publish':
					if (!isValidPackage()) {
						console.log('This package has an invalid configuration; run "bjspm init" to fix this.');
						process.exit();
					}
					zipPackage((zipPath) => {
						let uploadMode = UPLOAD_MODE.DEFAULT;
						if (cmdArgs[1] !== undefined) {
							switch (cmdArgs[1].toLocaleLowerCase()) {
								case 'user':
									if (package.username.length === 0) {
										console.log('This package is not configured properly to be a user package; run "bjspm init" to fix this.');
										process.exit();
									} else {
										uploadMode = UPLOAD_MODE.USER;
									}
									break;
								case 'named':
									if (package.username.length === 0) {
										console.log('This package is not configured properly to be a named package; run "bjspm init" to fix this.');
										process.exit();
									} else {
										uploadMode = UPLOAD_MODE.NAMED;
									}
									break;
								case 'unnamed':
									uploadMode = UPLOAD_MODE.UNNAMED;
									break;
							}
						}
						let uploadCallback = (err, httpResponse, body) => {
							if (err) {
								console.log(panickMsg, err);
								process.exit();
							}
							try {
								let obj = JSON.parse(body);

								switch (obj.status) {
									case API_STATUS.OK:
										console.log('Package published, id: ' + obj.packageId);
										console.log();
										process.exit();
										break;
									case API_STATUS.ERR:
										if (obj.error === 'Authentication failed') {
											authTokens[package.username] = undefined;
											getAuthToken(package.username, (authToken) => {
												uploadPackage(zipPath, authToken, uploadMode, uploadCallback);
											});
										} else {
											console.log('Server error: ' + obj.error);
											process.exit();
										}
										break;
								}
							} catch (e) {
								console.log(body);
								process.exit();
							}
							// Manual cleanup
							cleanupCallback();
						};
						if (package.username.length !== 0) {
							getAuthToken(package.username, (authToken) => {
								uploadPackage(zipPath, authToken, uploadMode, uploadCallback);
							});
						} else {
							uploadPackage(zipPath, '', uploadMode, uploadCallback);
						}
					});
					break;
				default:
					showQuickHelp();
			}
		}
	});
});

function uploadPackage(path, authToken, mode = UPLOAD_MODE.DEFAULT, callback) {
	let _authToken = authToken;
	let _name = package.name;

	switch (mode) {
		case UPLOAD_MODE.NAMED:
			_authToken = '';
			break;
		case UPLOAD_MODE.UNNAMED:
			_authToken = '';
			_name = '';
			break;
	}
	request.post({
		url: 'https://bjspm.croncle.com/api.php', formData: {
			action: 'UPLOAD_PACKAGE',
			authToken: _authToken,
			package: fs.createReadStream(path),
			name: _name,
			version: package.version,
			description: package.description,
			keywords: package.keywords.join(','),
			license: package.license
		}
	}, callback);
}

function isValidLicense(name) {
	return licences.indexOf(name) !== -1;
}

function isValidUsername(name) {
	return /^[A-Za-z0-9_]{1,16}$/.test(name);
}

function isValidPackageName(name) {
	return /^[a-z_\-]{1,241}$/.test(name);
}

function isValidPackageVersion(version) {
	return semver2Regex.test(version);
}

function isValidPackageDescription(description) {
	return description.length < 65536;
}

function isValidPackage() {
	if (package.username.length !== 0) { // user package
		return isValidPackageName(package.name) &&
			isValidPackageVersion(package.version) &&
			isValidPackageDescription(package.description) &&
			isValidLicense(package.license);
	} else if (package.name.length !== 0) { // named standalone package
		return isValidPackageName(package.name) &&
			isValidPackageDescription(package.description) &&
			isValidLicense(package.license);
	} else { // unnamed standalone package
		return isValidPackageDescription(package.description) &&
			isValidLicense(package.license);
	}
}

function zipPackage(callback) {
	tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
		if (err) {
			console.log(panickMsg, err);
			process.exit();
		}
		loadIgnores(() => {
			let zipPath = path + '/archive.zip';
			var output = fs.createWriteStream(zipPath);
			var archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});
			archive.pipe(output);

			let entries = getDirectoryEntries('.');
			outer:
			for (let entry of entries) {
				for(let ignoreGlob of ignoreGlobs){
					if(ignoreGlob.match(entry.path)){
						console.log(`Skipping file "${ entry.path }"`);
						continue outer;
					}
				}
				archive.file("./" + entry.path, { name: entry.path });
			}
			archive.finalize();
			callback(zipPath);
		});
	});
}

function getDirectoryEntries(dir, relDir = '') {
	let results = [];
	let list = fs.readdirSync(dir);
	if (list.length === 0) {
		return results;
	}
	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);
		if (stat && stat.isDirectory()) {
			let subPaths = getDirectoryEntries(filePath, relDir + fileName + '/');
			results = results.concat(subPaths);
		} else {
			results.push({
				folder: relDir,
				file: fileName,
				path: relDir + fileName
			});
		}
	}
	return results
}

function loadPackage(callback) {
	if (fs.existsSync(packagePath)) {
		fs.readFile(packagePath, 'utf8', function (err, data) {
			if (err) {
				console.log(panickMsg, err);
				process.exit();
			}
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

function loadAuthTokens(callback) {
	if (fs.existsSync(authTokenStore)) {
		fs.readFile(authTokenStore, 'utf8', function (err, data) {
			if (err) {
				console.log(panickMsg, err);
				process.exit();
			}
			authTokens = JSON.parse(data);
			callback();
		});
	} else {
		callback();
	}
}

function loadIgnores(callback) {
	for (let ignorePath of ignoresPaths) {
		if (fs.existsSync(ignorePath)) {
			fs.readFile(ignorePath, 'utf8', function (err, data) {
				if (err) {
					console.log(panickMsg, err);
					process.exit();
				}
				let _ignores = data.split('\r\n').join('\n').split('\n');
				ignores = defaultIgnores.concat(_ignores);

				let _ignoreGlobs = [];
				for(let ignoreGlob of _ignores){
					_ignoreGlobs.push(new Minimatch(ignoreGlob));
				}
				ignoreGlobs = defaultIgnoreGlobs.concat(_ignoreGlobs);
				callback();
			});
			return;
		}
	}
	callback();
}

function storeAuthTokens() {
	let json = JSON.stringify(authTokens, undefined, 2);
	fs.writeFile(authTokenStore, json, 'utf8', function (err) {
		if (err) {
			console.log(panickMsg, err);
			process.exit();
		}
	});
}

function getAuthToken(username, callback) {
	if (authTokens[username] === undefined) {
		readline.question(`Please enter the password for croncle.com user "${username}": `, (password) => {
			if (password.length === 0) {
				getAuthToken(username, callback);
				return;
			}
			request.post({
				url: 'https://bjspm.croncle.com/api.php', formData: {
					action: 'GET_USER_AUTH_TOKEN',
					username: username,
					password: password
				}
			}, (err, httpResponse, body) => {
				try {
					let obj = JSON.parse(body);
					switch (obj.status) {
						case API_STATUS.OK:
							authTokens[username] = obj.authToken;
							storeAuthTokens();
							callback(obj.authToken);
							break;
						case API_STATUS.ERR:
							console.log('Server error: ' + obj.error);
							process.exit();
							break;
					}
				} catch (e) {
					console.log(body);
					process.exit();
				}
			});
		});
	} else {
		callback(authTokens[username]);
	}
}

function initPackage() {
	console.log(`
This utility will walk you through creating a bjspackage.json file.
Press ^C at any time to quit.
`);

	let newPackage = getEmptyPackage();

	let writePackage = (obj) => {
		let json = JSON.stringify(obj, undefined, 2);
		console.log('About to write to ' + packagePath);
		console.log();
		console.log(json);
		console.log();
		readline.question(`Is this OK? (yes) `, (answer) => {
			let _answer = answer.toLowerCase();
			if (['', 'y', 'yes'].indexOf(_answer) !== -1) {
				fs.writeFile(packagePath, json, 'utf8', function (err) {
					if (err) {
						console.log(panickMsg, err);
						process.exit();
					}
					process.exit();
				});
			}
		});
	};

	let askQuestion = () => {
		if (newPackage.name.length === 0) {
			let hasDefault = package.name.length !== 0;
			readline.question(`package name: ${hasDefault ? `(${package.name}) ` : ''}`, (name) => {
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
			readline.question(`version: ${hasDefault ? `(${package.version}) ` : ''}`, (version) => {
				if (hasDefault && version.length === 0) {
					if (isValidPackageVersion(package.version)) {
						newPackage.version = package.version;
						console.log();
					} else {
						console.log('Invalid package version, must follow SemVer 2.0.0\n');
					}
				} else {
					if (isValidPackageVersion(version)) {
						newPackage.version = version;
						console.log();
					} else {
						console.log('Invalid package version, must follow SemVer 2.0.0\n');
					}
				}
				askQuestion();
			});
		}
		if (newPackage.description.length === 0) {
			let hasDefault = package.description.length !== 0;
			readline.question(`description: ${hasDefault ? `(${package.description}) ` : ''}`, (description) => {
				if (hasDefault && description.length === 0) {
					if (isValidPackageDescription(package.description)) {
						newPackage.description = package.description;
					} else {
						console.log('Invalid package description.\n');
					}
				} else {
					if (isValidPackageDescription(description)) {
						newPackage.description = description;
					} else {
						console.log('Invalid package description.\n');
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.keywords === null) {
			let hasDefault = package.keywords.length !== 0;
			readline.question(`keywords: ${hasDefault ? `(${package.keywords.join(', ')}) ` : ''}`, (keywords) => {
				if (hasDefault && keywords.length === 0) {
					newPackage.keywords = package.keywords;
				} else {
					newPackage.keywords = keywords.replace(/\,/g, ' ').replace(/  /g, ' ').split(' ');
					if (newPackage.keywords[0].length === 0) {
						newPackage.keywords.length = 0;
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.license.length === 0) {
			let hasDefault = package.license.length !== 0;
			readline.question(`license: ${hasDefault ? `(${package.license}) ` : ''}`, (license) => {
				if (hasDefault && license.length === 0) {
					if (isValidLicense(package.license)) {
						newPackage.license = package.license;
					} else {
						console.log('Invalid license, must be a valid SPDX license expression.\n');
					}
				} else {
					if (isValidLicense(license)) {
						newPackage.license = license;
					} else {
						console.log('Invalid license, must be a valid SPDX license expression.\n');
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.username.length === 0) {
			let hasDefault = package.username.length !== 0;
			readline.question(`your croncle.com username: ${hasDefault ? `(${package.username}) ` : ''}`, (username) => {
				if (hasDefault && username.length === 0) {
					if (isValidUsername(package.username)) {
						newPackage.username = package.username;
					} else {
						console.log('Invalid username (/^[A-Za-z0-9_]{1,16}$/)\n');
					}
				} else {
					if (isValidUsername(username)) {
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