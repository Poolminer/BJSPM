#!/usr/bin/env node

const fs = require('fs');
const archiver = require('archiver');
const tmp = require('tmp');
const request = require('request');
const getAppDataPath = require("appdata-path");
const extract = require('extract-zip');
const filesize = require('filesize');
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const Minimatch = require('minimatch').Minimatch;
const semverValid = require('semver/functions/valid');
const semverMaxSatisfying = require('semver/ranges/max-satisfying');
const semverMajor = require('semver/functions/major')
const semver2Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const path = require('path');
const cwdPath = process.cwd() + path.sep;
const bjspmPath = process.cwd() + path.sep + 'bjspm' + path.sep;
const packagesPath = bjspmPath + 'packages' + path.sep;
const webPackagesPath = 'https://bjspm.croncle.com/package/';
const packageJsonPath = bjspmPath + 'package.json';
const regexUser = /^@[a-z0-9_]{1,16}\/[a-z0-9][a-z0-9_\-\.]{0,240}[a-z](?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?$/;
const regexUserNoVersion = /^@[a-z0-9_]{1,16}\/[a-z0-9][a-z0-9_\-\.]{0,240}[a-z]$/;
const regexInstallUser = /^@([a-z0-9_]{1,16})\/([a-z0-9][a-z0-9_\-\.]{0,240}[a-z])@?(.*)$/;
const regexNamed = /^[a-z0-9][a-z0-9_\-\.]{0,240}[a-z]_[A-F0-9]{1,7}$/;
const regexUnnamed = /^[A-F0-9]{1,7}$/;
const regexPackageName = /^[a-z0-9][a-z0-9_\-\.]{0,240}[a-z]$/;
const regexMajorVersion = /^\d{1,9}$/;
const ignoresPaths = [
	bjspmPath + 'ignore.txt',
	cwdPath + '.gitignore',
];
const appDataPath = getAppDataPath('BJSPM');
const appDataPackagesPath = appDataPath + path.sep + 'packages' + path.sep;
const authTokenStore = appDataPath + path.sep + 'authTokenStore.json';
const API_STATUS = {
	OK: 1,
	ERR: 2
}
const licences = ['', '0BSD', 'AAL', 'Abstyles', 'Adobe-2006', 'Adobe-Glyph', 'ADSL', 'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AFL-3.0', 'Afmparse', 'AGPL-1.0-only', 'AGPL-1.0-or-later', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'Aladdin', 'AMDPLPA', 'AML', 'AMPAS', 'ANTLR-PD', 'Apache-1.0', 'Apache-1.1', 'Apache-2.0', 'APAFML', 'APL-1.0', 'APSL-1.0', 'APSL-1.1', 'APSL-1.2', 'APSL-2.0', 'Artistic-1.0', 'Artistic-1.0-cl8', 'Artistic-1.0-Perl', 'Artistic-2.0', 'Bahyph', 'Barr', 'Beerware', 'BitTorrent-1.0', 'BitTorrent-1.1', 'blessing', 'BlueOak-1.0.0', 'Borceux', 'BSD-1-Clause', 'BSD-2-Clause', 'BSD-2-Clause-FreeBSD', 'BSD-2-Clause-NetBSD', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'BSD-3-Clause-Attribution', 'BSD-3-Clause-Clear', 'BSD-3-Clause-LBNL', 'BSD-3-Clause-No-Nuclear-License', 'BSD-3-Clause-No-Nuclear-License-2014', 'BSD-3-Clause-No-Nuclear-Warranty', 'BSD-3-Clause-Open-MPI', 'BSD-4-Clause', 'BSD-4-Clause-UC', 'BSD-Protection', 'BSD-Source-Code', 'BSL-1.0', 'bzip2-1.0.5', 'bzip2-1.0.6', 'Caldera', 'CATOSL-1.1', 'CC-BY-1.0', 'CC-BY-2.0', 'CC-BY-2.5', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-NC-1.0', 'CC-BY-NC-2.0', 'CC-BY-NC-2.5', 'CC-BY-NC-3.0', 'CC-BY-NC-4.0', 'CC-BY-NC-ND-1.0', 'CC-BY-NC-ND-2.0', 'CC-BY-NC-ND-2.5', 'CC-BY-NC-ND-3.0', 'CC-BY-NC-ND-4.0', 'CC-BY-NC-SA-1.0', 'CC-BY-NC-SA-2.0', 'CC-BY-NC-SA-2.5', 'CC-BY-NC-SA-3.0', 'CC-BY-NC-SA-4.0', 'CC-BY-ND-1.0', 'CC-BY-ND-2.0', 'CC-BY-ND-2.5', 'CC-BY-ND-3.0', 'CC-BY-ND-4.0', 'CC-BY-SA-1.0', 'CC-BY-SA-2.0', 'CC-BY-SA-2.5', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'CC-PDDC', 'CC0-1.0', 'CDDL-1.0', 'CDDL-1.1', 'CDLA-Permissive-1.0', 'CDLA-Sharing-1.0', 'CECILL-1.0', 'CECILL-1.1', 'CECILL-2.0', 'CECILL-2.1', 'CECILL-B', 'CECILL-C', 'CERN-OHL-1.1', 'CERN-OHL-1.2', 'ClArtistic', 'CNRI-Jython', 'CNRI-Python', 'CNRI-Python-GPL-Compatible', 'Condor-1.1', 'copyleft-next-0.3.0', 'copyleft-next-0.3.1', 'CPAL-1.0', 'CPL-1.0', 'CPOL-1.02', 'Crossword', 'CrystalStacker', 'CUA-OPL-1.0', 'Cube', 'curl', 'D-FSL-1.0', 'diffmark', 'DOC', 'Dotseqn', 'DSDP', 'dvipdfm', 'ECL-1.0', 'ECL-2.0', 'EFL-1.0', 'EFL-2.0', 'eGenix', 'Entessa', 'EPL-1.0', 'EPL-2.0', 'ErlPL-1.1', 'etalab-2.0', 'EUDatagrid', 'EUPL-1.0', 'EUPL-1.1', 'EUPL-1.2', 'Eurosym', 'Fair', 'Frameworx-1.0', 'FreeImage', 'FSFAP', 'FSFUL', 'FSFULLR', 'FTL', 'GFDL-1.1-only', 'GFDL-1.1-or-later', 'GFDL-1.2-only', 'GFDL-1.2-or-later', 'GFDL-1.3-only', 'GFDL-1.3-or-later', 'Giftware', 'GL2PS', 'Glide', 'Glulxe', 'gnuplot', 'GPL-1.0-only', 'GPL-1.0-or-later', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later', 'gSOAP-1.3b', 'HaskellReport', 'HPND', 'HPND-sell-variant', 'IBM-pibs', 'ICU', 'IJG', 'ImageMagick', 'iMatix', 'Imlib2', 'Info-ZIP', 'Intel', 'Intel-ACPI', 'Interbase-1.0', 'IPA', 'IPL-1.0', 'ISC', 'JasPer-2.0', 'JPNIC', 'JSON', 'LAL-1.2', 'LAL-1.3', 'Latex2e', 'Leptonica', 'LGPL-2.0-only', 'LGPL-2.0-or-later', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later', 'LGPLLR', 'Libpng', 'libpng-2.0', 'libtiff', 'LiLiQ-P-1.1', 'LiLiQ-R-1.1', 'LiLiQ-Rplus-1.1', 'Linux-OpenIB', 'LPL-1.0', 'LPL-1.02', 'LPPL-1.0', 'LPPL-1.1', 'LPPL-1.2', 'LPPL-1.3a', 'LPPL-1.3c', 'MakeIndex', 'MirOS', 'MIT', 'MIT-0', 'MIT-advertising', 'MIT-CMU', 'MIT-enna', 'MIT-feh', 'MITNFA', 'Motosoto', 'mpich2', 'MPL-1.0', 'MPL-1.1', 'MPL-2.0', 'MPL-2.0-no-copyleft-exception', 'MS-PL', 'MS-RL', 'MTLL', 'MulanPSL-1.0', 'Multics', 'Mup', 'NASA-1.3', 'Naumen', 'NBPL-1.0', 'NCSA', 'Net-SNMP', 'NetCDF', 'Newsletr', 'NGPL', 'NLOD-1.0', 'NLPL', 'Nokia', 'NOSL', 'Noweb', 'NPL-1.0', 'NPL-1.1', 'NPOSL-3.0', 'NRL', 'NTP', 'OCCT-PL', 'OCLC-2.0', 'ODbL-1.0', 'ODC-By-1.0', 'OFL-1.0', 'OFL-1.1', 'OGL-Canada-2.0', 'OGL-UK-1.0', 'OGL-UK-2.0', 'OGL-UK-3.0', 'OGTSL', 'OLDAP-1.1', 'OLDAP-1.2', 'OLDAP-1.3', 'OLDAP-1.4', 'OLDAP-2.0', 'OLDAP-2.0.1', 'OLDAP-2.1', 'OLDAP-2.2', 'OLDAP-2.2.1', 'OLDAP-2.2.2', 'OLDAP-2.3', 'OLDAP-2.4', 'OLDAP-2.5', 'OLDAP-2.6', 'OLDAP-2.7', 'OLDAP-2.8', 'OML', 'OpenSSL', 'OPL-1.0', 'OSET-PL-2.1', 'OSL-1.0', 'OSL-1.1', 'OSL-2.0', 'OSL-2.1', 'OSL-3.0', 'Parity-6.0.0', 'PDDL-1.0', 'PHP-3.0', 'PHP-3.01', 'Plexus', 'PostgreSQL', 'psfrag', 'psutils', 'Python-2.0', 'Qhull', 'QPL-1.0', 'Rdisc', 'RHeCos-1.1', 'RPL-1.1', 'RPL-1.5', 'RPSL-1.0', 'RSA-MD', 'RSCPL', 'Ruby', 'SAX-PD', 'Saxpath', 'SCEA', 'Sendmail', 'Sendmail-8.23', 'SGI-B-1.0', 'SGI-B-1.1', 'SGI-B-2.0', 'SHL-0.5', 'SHL-0.51', 'SimPL-2.0', 'SISSL', 'SISSL-1.2', 'Sleepycat', 'SMLNJ', 'SMPPL', 'SNIA', 'Spencer-86', 'Spencer-94', 'Spencer-99', 'SPL-1.0', 'SSH-OpenSSH', 'SSH-short', 'SSPL-1.0', 'SugarCRM-1.1.3', 'SWL', 'TAPR-OHL-1.0', 'TCL', 'TCP-wrappers', 'TMate', 'TORQUE-1.1', 'TOSL', 'TU-Berlin-1.0', 'TU-Berlin-2.0', 'UCL-1.0', 'Unicode-DFS-2015', 'Unicode-DFS-2016', 'Unicode-TOU', 'Unlicense', 'UPL-1.0', 'Vim', 'VOSTROM', 'VSL-1.0', 'W3C', 'W3C-19980720', 'W3C-20150513', 'Watcom-1.0', 'Wsuipa', 'WTFPL', 'X11', 'Xerox', 'XFree86-1.1', 'xinetd', 'Xnet', 'xpp', 'XSkat', 'YPL-1.0', 'YPL-1.1', 'Zed', 'Zend-2.0', 'Zimbra-1.3', 'Zimbra-1.4', 'Zlib', 'zlib-acknowledgement', 'ZPL-1.1', 'ZPL-2.0', 'ZPL-2.1'];
const licencesLowerCase = ['', '0bsd', 'aal', 'abstyles', 'adobe-2006', 'adobe-glyph', 'adsl', 'afl-1.1', 'afl-1.2', 'afl-2.0', 'afl-2.1', 'afl-3.0', 'afmparse', 'agpl-1.0-only', 'agpl-1.0-or-later', 'agpl-3.0-only', 'agpl-3.0-or-later', 'aladdin', 'amdplpa', 'aml', 'ampas', 'antlr-pd', 'apache-1.0', 'apache-1.1', 'apache-2.0', 'apafml', 'apl-1.0', 'apsl-1.0', 'apsl-1.1', 'apsl-1.2', 'apsl-2.0', 'artistic-1.0', 'artistic-1.0-cl8', 'artistic-1.0-perl', 'artistic-2.0', 'bahyph', 'barr', 'beerware', 'bittorrent-1.0', 'bittorrent-1.1', 'blessing', 'blueoak-1.0.0', 'borceux', 'bsd-1-clause', 'bsd-2-clause', 'bsd-2-clause-freebsd', 'bsd-2-clause-netbsd', 'bsd-2-clause-patent', 'bsd-3-clause', 'bsd-3-clause-attribution', 'bsd-3-clause-clear', 'bsd-3-clause-lbnl', 'bsd-3-clause-no-nuclear-license', 'bsd-3-clause-no-nuclear-license-2014', 'bsd-3-clause-no-nuclear-warranty', 'bsd-3-clause-open-mpi', 'bsd-4-clause', 'bsd-4-clause-uc', 'bsd-protection', 'bsd-source-code', 'bsl-1.0', 'bzip2-1.0.5', 'bzip2-1.0.6', 'caldera', 'catosl-1.1', 'cc-by-1.0', 'cc-by-2.0', 'cc-by-2.5', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-nc-1.0', 'cc-by-nc-2.0', 'cc-by-nc-2.5', 'cc-by-nc-3.0', 'cc-by-nc-4.0', 'cc-by-nc-nd-1.0', 'cc-by-nc-nd-2.0', 'cc-by-nc-nd-2.5', 'cc-by-nc-nd-3.0', 'cc-by-nc-nd-4.0', 'cc-by-nc-sa-1.0', 'cc-by-nc-sa-2.0', 'cc-by-nc-sa-2.5', 'cc-by-nc-sa-3.0', 'cc-by-nc-sa-4.0', 'cc-by-nd-1.0', 'cc-by-nd-2.0', 'cc-by-nd-2.5', 'cc-by-nd-3.0', 'cc-by-nd-4.0', 'cc-by-sa-1.0', 'cc-by-sa-2.0', 'cc-by-sa-2.5', 'cc-by-sa-3.0', 'cc-by-sa-4.0', 'cc-pddc', 'cc0-1.0', 'cddl-1.0', 'cddl-1.1', 'cdla-permissive-1.0', 'cdla-sharing-1.0', 'cecill-1.0', 'cecill-1.1', 'cecill-2.0', 'cecill-2.1', 'cecill-b', 'cecill-c', 'cern-ohl-1.1', 'cern-ohl-1.2', 'clartistic', 'cnri-jython', 'cnri-python', 'cnri-python-gpl-compatible', 'condor-1.1', 'copyleft-next-0.3.0', 'copyleft-next-0.3.1', 'cpal-1.0', 'cpl-1.0', 'cpol-1.02', 'crossword', 'crystalstacker', 'cua-opl-1.0', 'cube', 'curl', 'd-fsl-1.0', 'diffmark', 'doc', 'dotseqn', 'dsdp', 'dvipdfm', 'ecl-1.0', 'ecl-2.0', 'efl-1.0', 'efl-2.0', 'egenix', 'entessa', 'epl-1.0', 'epl-2.0', 'erlpl-1.1', 'etalab-2.0', 'eudatagrid', 'eupl-1.0', 'eupl-1.1', 'eupl-1.2', 'eurosym', 'fair', 'frameworx-1.0', 'freeimage', 'fsfap', 'fsful', 'fsfullr', 'ftl', 'gfdl-1.1-only', 'gfdl-1.1-or-later', 'gfdl-1.2-only', 'gfdl-1.2-or-later', 'gfdl-1.3-only', 'gfdl-1.3-or-later', 'giftware', 'gl2ps', 'glide', 'glulxe', 'gnuplot', 'gpl-1.0-only', 'gpl-1.0-or-later', 'gpl-2.0-only', 'gpl-2.0-or-later', 'gpl-3.0-only', 'gpl-3.0-or-later', 'gsoap-1.3b', 'haskellreport', 'hpnd', 'hpnd-sell-variant', 'ibm-pibs', 'icu', 'ijg', 'imagemagick', 'imatix', 'imlib2', 'info-zip', 'intel', 'intel-acpi', 'interbase-1.0', 'ipa', 'ipl-1.0', 'isc', 'jasper-2.0', 'jpnic', 'json', 'lal-1.2', 'lal-1.3', 'latex2e', 'leptonica', 'lgpl-2.0-only', 'lgpl-2.0-or-later', 'lgpl-2.1-only', 'lgpl-2.1-or-later', 'lgpl-3.0-only', 'lgpl-3.0-or-later', 'lgpllr', 'libpng', 'libpng-2.0', 'libtiff', 'liliq-p-1.1', 'liliq-r-1.1', 'liliq-rplus-1.1', 'linux-openib', 'lpl-1.0', 'lpl-1.02', 'lppl-1.0', 'lppl-1.1', 'lppl-1.2', 'lppl-1.3a', 'lppl-1.3c', 'makeindex', 'miros', 'mit', 'mit-0', 'mit-advertising', 'mit-cmu', 'mit-enna', 'mit-feh', 'mitnfa', 'motosoto', 'mpich2', 'mpl-1.0', 'mpl-1.1', 'mpl-2.0', 'mpl-2.0-no-copyleft-exception', 'ms-pl', 'ms-rl', 'mtll', 'mulanpsl-1.0', 'multics', 'mup', 'nasa-1.3', 'naumen', 'nbpl-1.0', 'ncsa', 'net-snmp', 'netcdf', 'newsletr', 'ngpl', 'nlod-1.0', 'nlpl', 'nokia', 'nosl', 'noweb', 'npl-1.0', 'npl-1.1', 'nposl-3.0', 'nrl', 'ntp', 'occt-pl', 'oclc-2.0', 'odbl-1.0', 'odc-by-1.0', 'ofl-1.0', 'ofl-1.1', 'ogl-canada-2.0', 'ogl-uk-1.0', 'ogl-uk-2.0', 'ogl-uk-3.0', 'ogtsl', 'oldap-1.1', 'oldap-1.2', 'oldap-1.3', 'oldap-1.4', 'oldap-2.0', 'oldap-2.0.1', 'oldap-2.1', 'oldap-2.2', 'oldap-2.2.1', 'oldap-2.2.2', 'oldap-2.3', 'oldap-2.4', 'oldap-2.5', 'oldap-2.6', 'oldap-2.7', 'oldap-2.8', 'oml', 'openssl', 'opl-1.0', 'oset-pl-2.1', 'osl-1.0', 'osl-1.1', 'osl-2.0', 'osl-2.1', 'osl-3.0', 'parity-6.0.0', 'pddl-1.0', 'php-3.0', 'php-3.01', 'plexus', 'postgresql', 'psfrag', 'psutils', 'python-2.0', 'qhull', 'qpl-1.0', 'rdisc', 'rhecos-1.1', 'rpl-1.1', 'rpl-1.5', 'rpsl-1.0', 'rsa-md', 'rscpl', 'ruby', 'sax-pd', 'saxpath', 'scea', 'sendmail', 'sendmail-8.23', 'sgi-b-1.0', 'sgi-b-1.1', 'sgi-b-2.0', 'shl-0.5', 'shl-0.51', 'simpl-2.0', 'sissl', 'sissl-1.2', 'sleepycat', 'smlnj', 'smppl', 'snia', 'spencer-86', 'spencer-94', 'spencer-99', 'spl-1.0', 'ssh-openssh', 'ssh-short', 'sspl-1.0', 'sugarcrm-1.1.3', 'swl', 'tapr-ohl-1.0', 'tcl', 'tcp-wrappers', 'tmate', 'torque-1.1', 'tosl', 'tu-berlin-1.0', 'tu-berlin-2.0', 'ucl-1.0', 'unicode-dfs-2015', 'unicode-dfs-2016', 'unicode-tou', 'unlicense', 'upl-1.0', 'vim', 'vostrom', 'vsl-1.0', 'w3c', 'w3c-19980720', 'w3c-20150513', 'watcom-1.0', 'wsuipa', 'wtfpl', 'x11', 'xerox', 'xfree86-1.1', 'xinetd', 'xnet', 'xpp', 'xskat', 'ypl-1.0', 'ypl-1.1', 'zed', 'zend-2.0', 'zimbra-1.3', 'zimbra-1.4', 'zlib', 'zlib-acknowledgement', 'zpl-1.1', 'zpl-2.0', 'zpl-2.1'];
const defaultIgnores = ['bjspm/packages/**', '.*.swp', '._*', '.DS_Store', '.git', '.hg', '.npmrc', '.lock-wscript', '.svn', '.wafpickle-*', 'config.gypi', 'CVS', 'npm-debug.log'];
const panickMsg = 'Something went wrong!';
const credentialsMsg = 'Please enter your croncle.com account credentials to continue';

let ignores = defaultIgnores;
let ignoreGlobs = [];
let tmpToken = null;

for (let ignoreGlob of defaultIgnores) {
	ignoreGlobs.push(new Minimatch(ignoreGlob));
}

mkdirSync(appDataPath);
mkdirSync(appDataPackagesPath);

let authTokens = {};
let cmdArgs = process.argv.slice(2);

function getEmptyPackage() {
	return {
		name: '',
		version: '',
		description: '',
		keywords: null,
		license: '',
		username: '',
		dependencies: []
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
		dependencies: []
	};
}

let package = getDefaultPackage();

loadPackage(() => {
	loadAuthTokens(() => {
		if (cmdArgs.length === 0) {
			showQuickHelp();
		} else if (cmdArgs.length === 2 && cmdArgs[1] === '-h') {
			showCommandHelp(cmdArgs[0]);
		} else {
			switch (cmdArgs[0]) {
				case 'init': {
					initPackage();
				}
					break;
				case 'publish': {
					if (!isValidPackage()) {
						console.log('This package has an invalid configuration; run "bjspm init" to fix this.');
						process.exit();
					}
					getServerConfig(serverConfig => {
						zipPackage(result => {
							let zipPath = result.zipPath;
							let fileData = result.fileData;
							let cleanupCallback = result.cleanupCallback;
							let uploadType = getPackageType();
							let tag = '';
							for (let i = 1; i < cmdArgs.length; i += 2) {
								if (cmdArgs[i] !== undefined) {
									switch (cmdArgs[i].toLowerCase()) {
										case '--type':
											if (cmdArgs[i + 1] !== undefined) {
												switch (cmdArgs[i + 1].toLowerCase()) {
													case 'user':
														if (package.username.length === 0) {
															console.log('This package is not configured properly to be a user package; run "bjspm init" to fix this.');
															process.exit();
														}
														uploadType = 'user';
														break;
													case 'named':
														if (package.name.length === 0) {
															console.log('This package is not configured properly to be a named package; run "bjspm init" to fix this.');
															process.exit();
														} else {
															uploadType = 'named';
														}
														break;
													case 'unnamed':
														uploadType = 'unnamed';
														break;
												}
											}
											break;
										case '--tag':
											if (uploadType === 'user') {
												if (cmdArgs[i + 1] !== undefined) {
													tag = cmdArgs[i + 1];
													if (!isValidPackageTag(tag)) {
														console.log('Invalid package tag');
														process.exit();
													}
												}
											}
											break;
									}
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
											process.exit();
											break;
										case API_STATUS.ERR:
											if (obj.error === 'Authentication failed') {
												authTokens[package.username] = undefined;
												getAuthToken(package.username, (authToken) => {
													uploadPackage(zipPath, fileData, authToken, uploadType, tag, uploadCallback);
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
							if (uploadType === 'user') {
								let authToken = authTokens[package.username];
								if (authToken !== undefined) {
									uploadPackage(zipPath, fileData, authToken, uploadType, tag, uploadCallback);
								} else {
									console.log(credentialsMsg);
									pollUsername((username) => {
										getAuthToken(username, (authToken) => {
											uploadPackage(zipPath, fileData, authToken, uploadType, tag, uploadCallback);
										});
									}, package.username);
								}
							} else if (serverConfig.loginRequired) {
								console.log(credentialsMsg);
								pollUsername((username) => {
									getAuthToken(username, (authToken) => {
										uploadPackage(zipPath, fileData, authToken, uploadType, tag, uploadCallback);
									});
								});
							} else {
								uploadPackage(zipPath, fileData, '', uploadType, tag, uploadCallback);
							}
						});
					});
				}
					break;
				case 'i':
				case 'install': {
					let packageId = cmdArgs[1];
					let folder = null;
					let dlType = 'rel';
					for (let i = 2; i < cmdArgs.length; i += 2) {
						if (cmdArgs[i] !== undefined) {
							switch (cmdArgs[i].toLowerCase()) {
								case '--dir':
									if (cmdArgs[i + 1] !== undefined) {
										folder = cmdArgs[i + 1];
									} else {
										showCommandHelp('install');
									}
									break;
								case '--abs':
									dlType = 'abs';
									break;
							}
						}
					}
					if (!isValidPackageInstallId(packageId)) {
						console.log('Invalid package identifier');
						process.exit();
					}
					installPackage(packageId, folder, dlType, (result) => {
						console.log(result.filepath);
						process.exit();
					});
				}
					break;
				case 'access': {
					if (cmdArgs.length === 1) {
						showCommandHelp('access');
					} else {
						switch (cmdArgs[1]) {
							case 'public':
							case 'restricted': {
								let package;
								let packageType = getPackageType();
								if (cmdArgs.length === 2) { // local user package
									if (packageType !== 'user') {
										console.log('No package specified');
										process.exit();
										break;
									}
									package = '@' + package.username + '/' + package.name;
								} else if (cmdArgs.length === 3) {
									package = cmdArgs[2];
								} else {
									showCommandHelp('access');
									break;
								}
								if (!isValidPackageBaseId(package)) {
									console.log('Invalid package identifier');
									process.exit();
								}
								let authToken;
								let engage = () => {
									setPackagePublicity(package, cmdArgs[1], authToken, () => {
										console.log('Package set to ' + cmdArgs[1]);
										process.exit();
									});
								}
								if (cmdArgs.length === 2) { // local user package
									authToken = authTokens[package.username];
									if (authToken !== undefined) {
										engage();
									} else {
										pollUsername((username) => {
											getAuthToken(username, (_authToken) => {
												authToken = _authToken;
												engage();
											});
										}, package.username);
									}
								} else {
									let username = '';
									if (regexUserNoVersion.test(package)) {
										let regex = /^@([a-z0-9_]{1,16})/;
										username = regex.exec(package)[1];
									}
									pollUsername((username) => {
										getAuthToken(username, (_authToken) => {
											authToken = _authToken;
											engage();
										});
									}, username);
								}
							}
								break;
							case 'set':
								if (cmdArgs.length === 2) {
									showCommandHelp('access');
								} else {
									switch (cmdArgs[2]) {
										case 'read-only':
										case 'read-write': {
											let user = cmdArgs[3];
											let package;
											let packageType = getPackageType();
											if (cmdArgs.length === 4) { // local user package
												if (packageType !== 'user') {
													console.log('No package specified');
													process.exit();
													break;
												}
												package = '@' + package.username + '/' + package.name;
											} else if (cmdArgs.length === 5) {
												package = cmdArgs[4];
											} else {
												showCommandHelp('access');
												break;
											}
											if (!isValidUsername(user)) {
												console.log('Invalid username');
												process.exit();
											}
											if (!isValidPackageBaseId(package)) {
												console.log('Invalid package identifier');
												process.exit();
											}
											console.log(credentialsMsg);
											pollUsername((username) => {
												getAuthToken(username, (authToken) => {
													setUserPermissions(package, user, cmdArgs[2], authToken, () => {
														console.log('User permissions set');
														process.exit();
													});
												});
											}, cmdArgs.length === 4 ? package.username : '');
										}
											break;
										default:
											showCommandHelp('access');
									}
								}
								break;
							case 'ls-packages': {
								if (cmdArgs.length !== 3) {
									showCommandHelp('ls-packages');
								} else {
									let user = cmdArgs[2];
									if (!isValidUsername(user)) {
										console.log('Invalid username');
										process.exit();
									}
									getAccessListForUser(user, (obj) => {
										let json = JSON.stringify(obj, undefined, 2);
										console.log(json);
										process.exit();
									});
								}
							}
								break;
							case 'ls-collaborators': {
								let user;
								let package;
								let packageType = getPackageType();
								if (cmdArgs.length > 4) {
									showCommandHelp('ls-collaborators');
									break;
								}
								if (cmdArgs.length === 2) { // local user package
									if (packageType !== 'user') {
										console.log('No package specified');
										process.exit();
										break;
									}
									package = '@' + package.username + '/' + package.name;
								} else {
									package = cmdArgs[2];
									user = cmdArgs.length === 4 ? cmdArgs[3] : '';
								}
								getAccessListForPackage(package, user, (obj) => {
									let json = JSON.stringify(obj, undefined, 2);
									console.log(json);
									process.exit();
								});
							}
								break;
							default:
								showCommandHelp('access');
						}
					}
				}
					break;
				case 'cache': {
					let files = fs.readdirSync(appDataPackagesPath).filter(file => file.endsWith('.zip'));
					let filePaths = [];
					let totalSize = 0;
					for (let file of files) {
						let filePath = path.resolve(appDataPackagesPath, file);
						let stat = fs.statSync(filePath);
						totalSize += stat.size;
						filePaths.push(filePath);
					}
					if (cmdArgs.length === 1) {
						console.log(`Cache: ${files.length} packages, ${filesize(totalSize)}`);
						process.exit();
					} else {
						switch (cmdArgs[1]) {
							case 'clear': {
								for (let filePath of filePaths) {
									try {
										fs.unlinkSync(filePath);
									} catch (e) {
										console.log(panickMsg, e);
										process.exit();
									}
								}
								console.log(`Cache cleared (${files.length} packages, ${filesize(totalSize)})`);
								process.exit();
							}
								break;
						}
					}
				}
					break;
				case 'api': {
					if (cmdArgs[1] === undefined) {
						break;
					}
					apiPost({
						action: cmdArgs[1]
					}, (obj) => {
						console.log(obj);
						process.exit();
					});
				}
					break;
					break;
				default:
					showQuickHelp();
			}
		}
	});
});

function download(url, filename, onProgress, callback) {
	const file = fs.createWriteStream(filename);
	let bytesReceived = 0;
	let bytesTotal = 0;

	// Send request to the given URL
	request.get(url)
		.on('response', (response) => {
			if (response.statusCode !== 200) {
				return callback('Response status was ' + response.statusCode);
			}
			bytesTotal = parseInt(response.headers['content-length'] || 0);
		})
		.on('data', (chunk) => {
			bytesReceived += chunk.length;
			if (bytesTotal !== 0) {
				onProgress({
					bytesReceived: bytesReceived,
					bytesTotal: bytesTotal,
					percentage: bytesReceived / bytesTotal
				});
			} else {
				onProgress({
					bytesReceived: bytesReceived
				});
			}
		})
		.pipe(file)
		.on('error', (err) => {
			fs.unlinkSync(filename);
		});

	file.on('finish', () => {
		file.close(callback);
	});

	file.on('error', (err) => {
		fs.unlinkSync(filename);
		return callback(err.message);
	});
}

function pollUsername(callback, defaultOption = '') {
	let prompt = defaultOption ? `Username: (${defaultOption}) ` : `Username: `;
	readline.question(prompt, (username) => {
		if (defaultOption && username.length === 0) {
			username = defaultOption;
		}
		if (isValidUsername(username)) {
			callback(username);
		} else {
			pollUsername(callback, defaultOption);
		}
	});
}

function apiPost(formData, callback) {
	request.post({
		url: 'https://bjspm.croncle.com/api.php', formData: formData
	}, (err, httpResponse, body) => {
		if (err) {
			console.log(panickMsg, err);
			process.exit();
		}
		try {
			let obj = JSON.parse(body);
			if (obj.error) {
				console.log(obj.error);
				process.exit();
			}
			callback(obj);
		} catch (e) {
			console.log(body);
			process.exit();
		}
	});
}

function getJson(url, callback) {
	request.get({
		url: url
	}, (err, httpResponse, body) => {
		if (err) {
			console.log(panickMsg, err);
			process.exit();
		}
		try {
			let obj = JSON.parse(body);
			callback(obj);
		} catch (e) {
			console.log('Error', body);
			console.log(e);
			process.exit();
		}
	});
}

function getAccessListForUser(user, callback) {
	apiPost({
		action: 'GET_PACKAGE_ACCESS_LIST_USER',
		user: user
	}, (obj) => {
		callback(obj.permissions);
	});
}

function getAccessListForPackage(packageBaseId, user, callback) {
	apiPost({
		action: 'GET_PACKAGE_ACCESS_LIST',
		package: packageBaseId,
		user: user
	}, (obj) => {
		callback(obj.permissions);
	});
}

function setPackagePublicity(packageBaseId, publicity, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'SET_PACKAGE_PUBLICITY',
			authToken: authToken,
			tmpToken: tmpToken,
			package: packageBaseId,
			publicity: publicity
		}, callback);
	});
}

function setUserPermissions(packageBaseId, user, permissions, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'SET_USER_PERMISSIONS',
			authToken: authToken,
			tmpToken: tmpToken,
			user: user,
			permissions: permissions,
			package: packageBaseId
		}, callback);
	});
}

function requestUID(callback) {
	apiPost({
		action: 'GET_NEXT_UID'
	}, (obj) => {
		callback(obj.uid);
	});
}

function getTmpToken(callback) {
	if (tmpToken !== null) {
		callback(tmpToken);
		return;
	}
	apiPost({
		action: 'GET_TMP_TOKEN'
	}, (obj) => {
		tmpToken = obj.tmpToken;
		callback(obj.tmpToken);
	});
}

function registerPackageDownload(packageId, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'REGISTER_PACKAGE_DOWNLOAD',
			tmpToken: tmpToken,
			package: packageId
		}, (obj) => {
			if (callback !== undefined) {
				callback(obj);
			}
		});
	});
}

function getServerConfig(callback) {
	apiPost({
		action: 'GET_CONFIG'
	}, callback);
}

function getPackageDownloadUrls(packageId, callback) {
	apiPost({
		action: 'GET_PACKAGE_DOWNLOAD_URLS',
		package: packageId
	}, (obj) => {
		callback(obj.urls);
	});
}

function getAppDataPackagePath(packageId) {
	let fileName = packageId.replace('/', '@');
	let filePath = appDataPackagesPath + fileName + '.zip';
	return filePath;
}

function installPackage(packageId, folder, dlType, callback) {
	if (!isValidPackageInstallId(packageId)) {
		callback(null);
		return;
	}
	let packageBaseId = null;
	if (packageId.indexOf('@') !== -1) {
		let matches = packageId.match(regexInstallUser);
		let user = matches[1];
		let packageName = matches[2];
		let packageVersion = matches[3];
		packageBaseId = `@${user}/${packageName}`;
		getPackageVersions(packageBaseId, (versions) => {
			if (versions.length === 0) {
				console.log('Could not retrieve package versions from server');
				process.exit();
			}
			getPackageTags(packageBaseId, (tags) => {
				if (tags.length === 0) {
					console.log('Could not retrieve package tags from server');
					process.exit();
				}
				if (packageVersion.length === 0) {
					packageVersion = tags['latest'];
				}
				if (isValidPackageTag(packageVersion)) {
					if (tags[packageVersion] === undefined) {
						console.log(`Could not install "${packageId}", error:`);
						console.log('No such package tag, available tags:');
						console.log(tags.join(', '));
						process.exit();
					}
					packageVersion = tags[packageVersion];
				} else if (isValidPackageVersionMajor(packageVersion)) {
					let highestMatch = semverMaxSatisfying(versions, `${packageVersion}.x`);
					if (highestMatch === null) {
						console.log(`Could not install "${packageId}", error:`);
						console.log('Could not find highest version');
						process.exit();
					}
					packageVersion = highestMatch;
				} else if (!semverValid(packageVersion)) {
					console.log(`Could not install "${packageId}", error:`);
					console.log(`Invalid package version identifier: ${packageVersion}`);
					process.exit();
				} else {
					console.log(`Note: only the package's major version will be saved to the dependecies list`);
				}
				let versionMajor = semverMajor(packageVersion);
				let downloadId = `${packageBaseId}@${packageVersion}`;
				let targetPath;
				if (folder !== null) {
					targetPath = path.resolve(folder, `@${user}`, `${packageName}${versionMajor}`);
				} else {
					targetPath = path.resolve(packagesPath, `@${user}`, `${packageName}${versionMajor}`);
					deleteDirectory(targetPath);
				}
				downloadPackageChain(downloadId, dlType, targetPath, (filepath) => {
					package.dependencies.push(`@${user}/${packageName}${versionMajor}`);
					storePackage();
					callback({ filepath: filepath, version: packageVersion });
				});
			});
		});
	} else {
		downloadId = packageId;
		packageBaseId = packageId;
		let targetPath;
		if (folder !== null) {
			targetPath = path.resolve(folder, packageBaseId);
		} else {
			targetPath = path.resolve(packagesPath, packageBaseId);
			deleteDirectory(targetPath);
		}
		downloadPackageChain(downloadId, dlType, targetPath, (filepath) => {
			package.dependencies.push(packageBaseId);
			storePackage();
			callback({ filepath: filepath });
		});
	}
}

function downloadPackageChain(packageId, dlType, targetPath, callback) {
	downloadPackage(packageId, dlType, targetPath, () => {
		let packageFile = path.resolve(targetPath, 'bjspm', 'package.json');
		if (fs.existsSync(packageFile)) {
			loadJsonFile(packageFile, (obj) => {
				if (obj !== null) {
					if (obj.dependencies !== undefined) {
						let i = 0;
						let installNext = () => {
							if (i === obj.dependencies.length) {
								callback(targetPath);
								return;
							}
							let dependency = obj.dependencies[i++];
							installPackage(`${dependency}`, null, dlType, (result) => {
								installNext();
							});
						};
						installNext();
					}
				}
			});
		} else {
			callback(packageFile);
		}
	});
}

function deleteDirectory(path) {
	if (!fs.existsSync(path)) {
		return;
	}
	let files = getSubFiles(path);
	let dirs = getSubDirectories(path).sort((a, b) => b.length - a.length);

	for (let file of files) {
		fs.unlinkSync(file);
	}
	for (let dir of dirs) {
		fs.rmdirSync(dir);
	}
	fs.rmdirSync(path);
}

function isPackageInCache(packageId) {
	let zipPath = getAppDataPackagePath(packageId);
	return fs.existsSync(zipPath);
}

function downloadPackage(packageId, dlType, targetPath, callback, urlIndex = 0) {
	let zipPath = getAppDataPackagePath(packageId);
	mkdirSync(targetPath);
	let onDownloaded = () => {
		console.log('Extracting files from package...');
		extract(zipPath, { dir: targetPath }).then(() => {
			// fs.unlink(zipPath, function (err) {
			// 	if (err) {
			// 		console.log(panickMsg);
			// 		console.trace();
			// 		process.exit();
			// 	}
			// 	callback(targetPath);
			// });
			callback(targetPath);
		}, (err) => {
			console.log(panickMsg);
			console.trace();
			process.exit();
		});
	};
	if (fs.existsSync(zipPath)) {
		console.log(`Package "${packageId}" found in cache`);
		onDownloaded();
	} else {
		getPackageDownloadUrls(packageId, (urls) => {
			let urlArray = urls[urlIndex];
			if (urlArray === undefined) {
				console.log("The package archive could not be downloaded.");
				process.exit();
			}
			let url = urlArray[dlType];
			getPackageJson(packageId, (package) => {
				let prefix = ' -> ';
				if (urlIndex === 0) {
					console.log(`Downloading package "${packageId}"`);
					if (package.files.length > 0) {
						console.log(prefix + packageId + '/' + package.files[0].path);
					}
				}
				let downloadIndex = -1;
				let rawTotalSize = 0;
				for (let file of package.files) {
					rawTotalSize += file.size;
				}
				if (rawTotalSize === 0) {
					let accumulatedSize = 0;
					for (let file of package.files) {
						accumulatedSize += 1;
						file.atSizePercentage = accumulatedSize / files.length;
					}
				} else {
					let accumulatedSize = 0;
					for (let file of package.files) {
						accumulatedSize += file.size;
						file.atSizePercentage = accumulatedSize / rawTotalSize;
					}
				}
				download(url, zipPath, (status) => {
					for (let i = 0; i < package.files.length; i++) {
						let file = package.files[i];
						let nextFile = package.files[i + 1];
						if (i > downloadIndex && status.percentage >= file.atSizePercentage) {
							if (nextFile !== undefined) {
								console.log(prefix + packageId + '/' + nextFile.path);
							}
							downloadIndex++;
						}
					}
				}, (err) => {
					if (err) {
						if (!fs.existsSync(zipPath)) {
							if (urls.length > urlIndex + 1) {
								downloadPackage(packageId, dlType, targetPath, callback, urlIndex + 1);
							} else {
								console.log(panickMsg);
								console.trace();
								process.exit();
							}
						}
					} else {
						if (urlArray['regDl']) {
							registerPackageDownload(packageId);
						}
						onDownloaded();
					}
				});
			});
		});
	}
}

function getPackageTags(packageId, callback) {
	let url = webPackagesPath + packageId + '?tags';
	getJson(url, callback);
}

function getPackageVersions(packageId, callback) {
	let url = webPackagesPath + packageId + '?versions';
	getJson(url, callback);
}

function getPackageJson(packageId, callback) {
	let url = webPackagesPath + packageId + '?json';
	getJson(url, callback);
}

function uploadPackage(path, fileData, authToken, type, tag, callback) {
	console.log('Uploading package...');
	getTmpToken(() => {
		request.post({
			url: 'https://bjspm.croncle.com/api.php', formData: {
				action: 'UPLOAD_PACKAGE',
				authToken: authToken,
				tmpToken: tmpToken,
				package: fs.createReadStream(path),
				name: package.name,
				version: package.version,
				description: package.description,
				keywords: package.keywords.join(','),
				license: package.license,
				type: type,
				tag: tag
			}
		}, callback);
	});
}

function getValidLicense(str) {
	let index = licencesLowerCase.indexOf(str.toLowerCase());
	if (index === -1) {
		return null;
	} else {
		return licences[index];
	}
}

function isString(obj) {
	return typeof obj === 'string';
}

function isValidLicense(name) {
	return isString(name) && licences.indexOf(name) !== -1;
}

function isValidUsername(name) {
	return isString(name) && /^[A-Za-z0-9_]{1,16}$/.test(name);
}

function isValidPackageTag(tag) {
	return isString(tag) && !semverValid(tag) && !isValidPackageVersionMajor(tag);
}

function isValidPackageName(name) {
	return isString(name) && regexPackageName.test(name);
}

function isValidPackageId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUser.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidPackageBaseId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserNoVersion.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidPackageInstallId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexInstallUser.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidPackageVersionMajor(major) {
	return isString(major) && regexMajorVersion.test(major);
}

function isValidPackageVersion(version) {
	return isString(version) && semver2Regex.test(version);
}

function isValidPackageDescription(description) {
	return isString(description) && description.length < 65536;
}

function isValidPackageKeywords(keywords) {
	if (keywords === null) {
		return false;
	}
	for (let keyword of keywords) {
		if (!isString(keyword) || keyword.length === 0) {
			return false;
		}
	}
	return true;
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
			isValidLicense(package.license) &&
			isValidPackageKeywords(package.keywords);
	}
}

function zipPackage(callback) {
	tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
		if (err) {
			console.log(panickMsg, err);
			process.exit();
		}
		loadIgnores(() => {
			let fileData = [];
			let totalSize = 0;
			let zipPath = path + '/archive.zip';
			var output = fs.createWriteStream(zipPath);
			var archive = archiver('zip', {
				zlib: { level: 9 } // Sets the compression level.
			});
			archive.pipe(output);

			let entries = getDirectoryEntries('.');
			for (let entry of entries) {
				let skip = false;
				for (let ignoreGlob of ignoreGlobs) {
					if (ignoreGlob.match(entry.path)) {
						skip = !ignoreGlob.negate;
					}
				}
				if (skip) {
					console.log(`Skipping ${entry.path}`);
				} else {
					let entryStats = fs.statSync(entry.path);
					totalSize += entryStats.size;
					fileData.push({
						path: entry.path,
						size: entryStats.size
					});
					console.log(`Packing ${entry.path}...`);
					archive.file("./" + entry.path, { name: entry.path });
				}
			}
			fileData['totalSize'] = totalSize;
			archive.finalize().then(() => {
				callback({ zipPath: zipPath, fileData: fileData, cleanupCallback: cleanupCallback });
			});
		});
	});
}

function getSubDirectories(dir) {
	let results = [];
	let list = fs.readdirSync(dir);

	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			results.push(filePath);
			let subPaths = getSubDirectories(filePath);
			results = results.concat(subPaths);
		}
	}
	return results;
}

function getSubFiles(dir) {
	let results = [];
	let list = fs.readdirSync(dir);

	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			results = results.concat(getSubFiles(filePath));
		} else {
			results.push(filePath);
		}
	}
	return results;
}

function getDirectoryEntries(dir, relDir = '') {
	let results = [];
	let list = fs.readdirSync(dir);

	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
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
	return results;
}

function getPackageType() {
	if (package.name.length !== 0 && package.version.length !== 0) { // user package
		return 'user';
	} else if (package.name.length !== 0) { // named standalone package
		return 'named';
	} else { // unnamed standalone package
		return 'unnamed';
	}
}

function loadJsonFile(jsonPath, callback, maxSize) {
	if (fs.existsSync(jsonPath)) {
		let stats = fs.statSync(jsonPath);
		if (stats.size > maxSize) {
			return null;
		}
		fs.readFile(jsonPath, 'utf8', function (err, data) {
			if (err) {
				console.log(panickMsg, err);
				process.exit();
			}
			try {
				let obj = JSON.parse(data);
				callback(obj);
			} catch (e) {
				console.log(e);
				callback(null);
			}
		});
	} else {
		callback(null);
	}
}

function loadPackage(callback) {
	if (fs.existsSync(packageJsonPath)) {
		fs.readFile(packageJsonPath, 'utf8', function (err, data) {
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
	let i = 0;
	let loadNext = () => {
		let ignorePath = ignoresPaths[i++];
		if (ignorePath === undefined) {
			callback();
			return;
		}
		if (fs.existsSync(ignorePath)) {
			fs.readFile(ignorePath, 'utf8', function (err, data) {
				if (err) {
					console.log(panickMsg, err);
					process.exit();
				}
				let _ignores = data.split('\r\n').join('\n').split('\n');
				ignores.push(..._ignores);

				let _ignoreGlobs = [];
				for (let ignoreGlob of _ignores) {
					if (ignoreGlob.length === 0) {
						continue;
					}
					_ignoreGlobs.push(new Minimatch(ignoreGlob, { flipNegate: true }));
				}
				ignoreGlobs.push(..._ignoreGlobs);
				loadNext();
			});
		} else {
			loadNext();
		}
	}
	loadNext();
}

function mkdirSync(path) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(bjspmPath, { recursive: true });
	}
}

function storeAuthTokens() {
	let json = JSON.stringify(authTokens, undefined, 2);
	fs.writeFileSync(authTokenStore, json, 'utf8');
}

function storePackage() {
	let json = JSON.stringify(package, undefined, 2);
	mkdirSync(bjspmPath);
	fs.writeFileSync(packageJsonPath, json, 'utf8');
}

function getAuthToken(username, callback) {
	if (authTokens[username] === undefined) {
		readline.question(`Password: `, (password) => {
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
				if (err) {
					console.log(panickMsg, err);
					process.exit();
				}
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
					console.log(e, body);
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
This utility will walk you through creating a package.json file.
Press ^C at any time to quit.
`);

	let newPackage = getEmptyPackage();
	newPackage.dependencies = package.dependencies;

	let writePackage = (obj) => {
		let json = JSON.stringify(obj, undefined, 2);
		console.log('About to write to ' + packageJsonPath);
		console.log();
		console.log(json);
		console.log();
		readline.question(`Is this OK? (yes) `, (answer) => {
			let _answer = answer.toLowerCase();
			if (['', 'y', 'yes'].indexOf(_answer) !== -1) {
				mkdirSync(bjspmPath);
				fs.writeFileSync(packageJsonPath, json, 'utf8');
				process.exit();
			} else {
				console.log('Aborted.\n');
				process.exit();
			}
		});
	};

	let descriptionSet = false;
	let licenseSet = false;
	let usernameSet = false;
	let askQuestion = () => {
		if (newPackage.name.length === 0) {
			let hasDefault = package.name.length !== 0 && isValidPackageName(package.name);
			readline.question(`package name: ${hasDefault ? `(${package.name}) ` : ''}`, (name) => {
				name = name.toLowerCase();
				if (hasDefault && name.length === 0) {
					newPackage.name = package.name;
					console.log();
				} else {
					if (isValidPackageName(name)) {
						newPackage.name = name;
						console.log();
					} else {
						console.log('Invalid package name\n');
					}
				}
				askQuestion();
			});
		}
		if (newPackage.version.length === 0) {
			let hasDefault = package.version.length !== 0 && isValidPackageVersion(package.version);
			readline.question(`version: ${hasDefault ? `(${package.version}) ` : ''}`, (version) => {
				if (hasDefault && version.length === 0) {
					newPackage.version = package.version;
					console.log();
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
		if (!descriptionSet) {
			let hasDefault = package.description.length !== 0 && isValidPackageDescription(package.description);
			readline.question(`description: ${hasDefault ? `(${package.description}) ` : ''}`, (description) => {
				if (hasDefault && description.length === 0) {
					newPackage.description = package.description;
					descriptionSet = true;
				} else {
					if (isValidPackageDescription(description)) {
						newPackage.description = description;
						descriptionSet = true;
					} else {
						console.log('Invalid package description.\n');
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (newPackage.keywords === null) {
			let hasDefault = package.keywords.length !== 0 && isValidPackageKeywords(package.keywords);
			readline.question(`keywords: ${hasDefault ? `(${package.keywords.join(', ')}) ` : ''}`, (keywords) => {
				if (hasDefault && keywords.length === 0) {
					newPackage.keywords = package.keywords;
				} else {
					newPackage.keywords = keywords.replace(/\,/g, ' ').replace(/  /g, ' ').split(' ').filter(keyword => keyword.length !== 0);
				}
				console.log();
				askQuestion();
			});
		}
		if (!licenseSet) {
			let validLicense = getValidLicense(package.license);
			let hasDefault = package.license.length !== 0 && validLicense !== null;
			readline.question(`license: ${hasDefault ? `(${package.license}) ` : ''}`, (license) => {
				if (hasDefault && license.length === 0) {
					newPackage.license = validLicense;
					licenseSet = true;
				} else {
					let _license = getValidLicense(license);
					if (_license !== null) {
						newPackage.license = _license;
						licenseSet = true;
					} else {
						console.log('Invalid license, must be a valid SPDX license expression.\n');
					}
				}
				console.log();
				askQuestion();
			});
		}
		if (!usernameSet) {
			let hasDefault = package.username.length !== 0 && isValidUsername(package.username);
			readline.question(`your croncle.com username: ${hasDefault ? `(${package.username}) ` : ''}`, (username) => {
				if (hasDefault && username.length === 0) {
					newPackage.username = package.username;
					usernameSet = true;
				} else {
					if (isValidUsername(username) || username.length === 0) {
						newPackage.username = username;
						usernameSet = true;
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

function showCommandHelp(cmd) {
	switch (cmd) {
		case 'i':
		case 'install': {
			console.log(`
bjspm install (with no args, in package dir)
bjspm install <pkg>
bjspm install @<user>/<pkg>
bjspm install @<user>/<pkg>@<version>
bjspm install @<user>/<pkg>@<version range>

alias: i
`);
		}
			break;
		case 'u':
		case 'un':
		case 'unlink':
		case 'remove':
		case 'r':
		case 'rm':
		case 'uninstall': {
			console.log(`
bjspm uninstall (with no args, in package dir)
bjspm uninstall <pkg>
bjspm uninstall @<user>/<pkg>
bjspm uninstall @<user>/<pkg>@<version>
bjspm uninstall @<user>/<pkg>@<version range>

aliases: u, un, unlink, remove, rm, r
`);
		}
			break;
		case 'p':
		case 'publish': {
			console.log(`
bjspm publish [<unnamed|named|user>]

alias: p
`);
		}
			break;
		case 'v':
		case 'version': {
			console.log(`
bjspm version [<new version>]

alias: v
`);
		}
			break;
		default:
			showQuickHelp();
	}
	process.exit();
}

function showQuickHelp() {
	console.log(`
Usage: bjspm <command>

where <command> is one of:
	[i]nstall, [u]ninstall, [p]ublish, [v]ersion

bjspm <command> -h  quick help on <command>
`);
	process.exit();
}