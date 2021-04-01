#!/usr/bin/env node

const version = '1.1.3';
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
const tmp = require('tmp');
const got = require('got');
const FormData = require('form-data');
const rimraf = require('rimraf');
const getAppDataPath = require("appdata-path");
const extract = require('extract-zip');
const filesize = require('filesize');
const { trueCasePathSync } = require('true-case-path');
const stream = require('stream');
const sysout = new stream.Writable({
	muted: false,
	write: function (chunk, encoding, callback) {
		if (!this.muted) {
			process.stdout.write(chunk, encoding);
		}
		callback();
	}
});
const readline = require('readline').createInterface({
	input: process.stdin,
	output: sysout,
	terminal: true
});
const Minimatch = require('minimatch').Minimatch;
const semverValid = require('semver/functions/valid');
const semverMaxSatisfying = require('semver/ranges/max-satisfying');
const semverMajor = require('semver/functions/major');
const semverInc = require('semver/functions/inc');
const semverGt = require('semver/functions/gt');
const semverPrerelease = require('semver/functions/prerelease');
const semverValidRange = require('semver/ranges/valid');
const semver2Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const path = require('path');
const cwdPath = process.cwd() + path.sep;
const bjspmPath = process.cwd() + path.sep + 'bjspm' + path.sep;
const packagesPath = bjspmPath + 'packages' + path.sep;
const packageJsonPath = bjspmPath + 'package.json';
const packageConfigPath = bjspmPath + 'config.json';
const packageBaseModuleJSPath = bjspmPath + 'index.js';
const packageBaseModuleTSPath = bjspmPath + 'index.ts';
const filePathsPath = bjspmPath + 'files.json';
const regexUser = /^[a-z0-9_]{1,16}\/[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z](?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?$/;
const regexUserVersioned = /^[a-z0-9_]{1,16}\/[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z](?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$/;
const regexUserMajor = /^[a-z0-9_]{1,16}\/[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z]@?\d{1,9}$/;
const regexUserNoVersion = /^[a-z0-9_]{1,16}\/[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z]$/;
const regexInstallUser = /^([a-z0-9_]{1,16})\/([a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z])@?(.*)$/;
const regexNamed = /^([a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z])_([A-F0-9]{1,7})$/;
const regexUnnamed = /^[A-F0-9]{1,7}$/;
const regexPackageName = /^[a-zA-Z0-9][a-zA-Z0-9_\-\.]{0,240}[a-zA-Z]$/;
const regexMajorVersion = /^\d{1,9}$/;
const regexUsername = /^[A-Za-z0-9_]{1,16}$/;
const regexPackageUsername = /^[a-z0-9_]{1,16}$/;
const ignoresPaths = [
	cwdPath + '.gitignore',
	cwdPath + '.npmignore',
	bjspmPath + '.ignore'
];
const appDataPath = getAppDataPath('BJSPM');
const appDataConfigPath = appDataPath + path.sep + 'config.json';
const authTokenStore = appDataPath + path.sep + 'authTokenStore.json';
const requiredReadingStore = appDataPath + path.sep + 'hasRead.json';
const API_STATUS = {
	OK: 1,
	ERR: 2
}
const licences = ['', '0BSD', 'AAL', 'Abstyles', 'Adobe-2006', 'Adobe-Glyph', 'ADSL', 'AFL-1.1', 'AFL-1.2', 'AFL-2.0', 'AFL-2.1', 'AFL-3.0', 'Afmparse', 'AGPL-1.0-only', 'AGPL-1.0-or-later', 'AGPL-3.0-only', 'AGPL-3.0-or-later', 'Aladdin', 'AMDPLPA', 'AML', 'AMPAS', 'ANTLR-PD', 'Apache-1.0', 'Apache-1.1', 'Apache-2.0', 'APAFML', 'APL-1.0', 'APSL-1.0', 'APSL-1.1', 'APSL-1.2', 'APSL-2.0', 'Artistic-1.0', 'Artistic-1.0-cl8', 'Artistic-1.0-Perl', 'Artistic-2.0', 'Bahyph', 'Barr', 'Beerware', 'BitTorrent-1.0', 'BitTorrent-1.1', 'blessing', 'BlueOak-1.0.0', 'Borceux', 'BSD-1-Clause', 'BSD-2-Clause', 'BSD-2-Clause-FreeBSD', 'BSD-2-Clause-NetBSD', 'BSD-2-Clause-Patent', 'BSD-3-Clause', 'BSD-3-Clause-Attribution', 'BSD-3-Clause-Clear', 'BSD-3-Clause-LBNL', 'BSD-3-Clause-No-Nuclear-License', 'BSD-3-Clause-No-Nuclear-License-2014', 'BSD-3-Clause-No-Nuclear-Warranty', 'BSD-3-Clause-Open-MPI', 'BSD-4-Clause', 'BSD-4-Clause-UC', 'BSD-Protection', 'BSD-Source-Code', 'BSL-1.0', 'bzip2-1.0.5', 'bzip2-1.0.6', 'Caldera', 'CATOSL-1.1', 'CC-BY-1.0', 'CC-BY-2.0', 'CC-BY-2.5', 'CC-BY-3.0', 'CC-BY-4.0', 'CC-BY-NC-1.0', 'CC-BY-NC-2.0', 'CC-BY-NC-2.5', 'CC-BY-NC-3.0', 'CC-BY-NC-4.0', 'CC-BY-NC-ND-1.0', 'CC-BY-NC-ND-2.0', 'CC-BY-NC-ND-2.5', 'CC-BY-NC-ND-3.0', 'CC-BY-NC-ND-4.0', 'CC-BY-NC-SA-1.0', 'CC-BY-NC-SA-2.0', 'CC-BY-NC-SA-2.5', 'CC-BY-NC-SA-3.0', 'CC-BY-NC-SA-4.0', 'CC-BY-ND-1.0', 'CC-BY-ND-2.0', 'CC-BY-ND-2.5', 'CC-BY-ND-3.0', 'CC-BY-ND-4.0', 'CC-BY-SA-1.0', 'CC-BY-SA-2.0', 'CC-BY-SA-2.5', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'CC-PDDC', 'CC0-1.0', 'CDDL-1.0', 'CDDL-1.1', 'CDLA-Permissive-1.0', 'CDLA-Sharing-1.0', 'CECILL-1.0', 'CECILL-1.1', 'CECILL-2.0', 'CECILL-2.1', 'CECILL-B', 'CECILL-C', 'CERN-OHL-1.1', 'CERN-OHL-1.2', 'ClArtistic', 'CNRI-Jython', 'CNRI-Python', 'CNRI-Python-GPL-Compatible', 'Condor-1.1', 'copyleft-next-0.3.0', 'copyleft-next-0.3.1', 'CPAL-1.0', 'CPL-1.0', 'CPOL-1.02', 'Crossword', 'CrystalStacker', 'CUA-OPL-1.0', 'Cube', 'curl', 'D-FSL-1.0', 'diffmark', 'DOC', 'Dotseqn', 'DSDP', 'dvipdfm', 'ECL-1.0', 'ECL-2.0', 'EFL-1.0', 'EFL-2.0', 'eGenix', 'Entessa', 'EPL-1.0', 'EPL-2.0', 'ErlPL-1.1', 'etalab-2.0', 'EUDatagrid', 'EUPL-1.0', 'EUPL-1.1', 'EUPL-1.2', 'Eurosym', 'Fair', 'Frameworx-1.0', 'FreeImage', 'FSFAP', 'FSFUL', 'FSFULLR', 'FTL', 'GFDL-1.1-only', 'GFDL-1.1-or-later', 'GFDL-1.2-only', 'GFDL-1.2-or-later', 'GFDL-1.3-only', 'GFDL-1.3-or-later', 'Giftware', 'GL2PS', 'Glide', 'Glulxe', 'gnuplot', 'GPL-1.0-only', 'GPL-1.0-or-later', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0-only', 'GPL-3.0-or-later', 'gSOAP-1.3b', 'HaskellReport', 'HPND', 'HPND-sell-variant', 'IBM-pibs', 'ICU', 'IJG', 'ImageMagick', 'iMatix', 'Imlib2', 'Info-ZIP', 'Intel', 'Intel-ACPI', 'Interbase-1.0', 'IPA', 'IPL-1.0', 'ISC', 'JasPer-2.0', 'JPNIC', 'JSON', 'LAL-1.2', 'LAL-1.3', 'Latex2e', 'Leptonica', 'LGPL-2.0-only', 'LGPL-2.0-or-later', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0-only', 'LGPL-3.0-or-later', 'LGPLLR', 'Libpng', 'libpng-2.0', 'libtiff', 'LiLiQ-P-1.1', 'LiLiQ-R-1.1', 'LiLiQ-Rplus-1.1', 'Linux-OpenIB', 'LPL-1.0', 'LPL-1.02', 'LPPL-1.0', 'LPPL-1.1', 'LPPL-1.2', 'LPPL-1.3a', 'LPPL-1.3c', 'MakeIndex', 'MirOS', 'MIT', 'MIT-0', 'MIT-advertising', 'MIT-CMU', 'MIT-enna', 'MIT-feh', 'MITNFA', 'Motosoto', 'mpich2', 'MPL-1.0', 'MPL-1.1', 'MPL-2.0', 'MPL-2.0-no-copyleft-exception', 'MS-PL', 'MS-RL', 'MTLL', 'MulanPSL-1.0', 'Multics', 'Mup', 'NASA-1.3', 'Naumen', 'NBPL-1.0', 'NCSA', 'Net-SNMP', 'NetCDF', 'Newsletr', 'NGPL', 'NLOD-1.0', 'NLPL', 'Nokia', 'NOSL', 'Noweb', 'NPL-1.0', 'NPL-1.1', 'NPOSL-3.0', 'NRL', 'NTP', 'OCCT-PL', 'OCLC-2.0', 'ODbL-1.0', 'ODC-By-1.0', 'OFL-1.0', 'OFL-1.1', 'OGL-Canada-2.0', 'OGL-UK-1.0', 'OGL-UK-2.0', 'OGL-UK-3.0', 'OGTSL', 'OLDAP-1.1', 'OLDAP-1.2', 'OLDAP-1.3', 'OLDAP-1.4', 'OLDAP-2.0', 'OLDAP-2.0.1', 'OLDAP-2.1', 'OLDAP-2.2', 'OLDAP-2.2.1', 'OLDAP-2.2.2', 'OLDAP-2.3', 'OLDAP-2.4', 'OLDAP-2.5', 'OLDAP-2.6', 'OLDAP-2.7', 'OLDAP-2.8', 'OML', 'OpenSSL', 'OPL-1.0', 'OSET-PL-2.1', 'OSL-1.0', 'OSL-1.1', 'OSL-2.0', 'OSL-2.1', 'OSL-3.0', 'Parity-6.0.0', 'PDDL-1.0', 'PHP-3.0', 'PHP-3.01', 'Plexus', 'PostgreSQL', 'psfrag', 'psutils', 'Python-2.0', 'Qhull', 'QPL-1.0', 'Rdisc', 'RHeCos-1.1', 'RPL-1.1', 'RPL-1.5', 'RPSL-1.0', 'RSA-MD', 'RSCPL', 'Ruby', 'SAX-PD', 'Saxpath', 'SCEA', 'Sendmail', 'Sendmail-8.23', 'SGI-B-1.0', 'SGI-B-1.1', 'SGI-B-2.0', 'SHL-0.5', 'SHL-0.51', 'SimPL-2.0', 'SISSL', 'SISSL-1.2', 'Sleepycat', 'SMLNJ', 'SMPPL', 'SNIA', 'Spencer-86', 'Spencer-94', 'Spencer-99', 'SPL-1.0', 'SSH-OpenSSH', 'SSH-short', 'SSPL-1.0', 'SugarCRM-1.1.3', 'SWL', 'TAPR-OHL-1.0', 'TCL', 'TCP-wrappers', 'TMate', 'TORQUE-1.1', 'TOSL', 'TU-Berlin-1.0', 'TU-Berlin-2.0', 'UCL-1.0', 'Unicode-DFS-2015', 'Unicode-DFS-2016', 'Unicode-TOU', 'Unlicense', 'UPL-1.0', 'Vim', 'VOSTROM', 'VSL-1.0', 'W3C', 'W3C-19980720', 'W3C-20150513', 'Watcom-1.0', 'Wsuipa', 'WTFPL', 'X11', 'Xerox', 'XFree86-1.1', 'xinetd', 'Xnet', 'xpp', 'XSkat', 'YPL-1.0', 'YPL-1.1', 'Zed', 'Zend-2.0', 'Zimbra-1.3', 'Zimbra-1.4', 'Zlib', 'zlib-acknowledgement', 'ZPL-1.1', 'ZPL-2.0', 'ZPL-2.1'];
const licencesLowerCase = ['', '0bsd', 'aal', 'abstyles', 'adobe-2006', 'adobe-glyph', 'adsl', 'afl-1.1', 'afl-1.2', 'afl-2.0', 'afl-2.1', 'afl-3.0', 'afmparse', 'agpl-1.0-only', 'agpl-1.0-or-later', 'agpl-3.0-only', 'agpl-3.0-or-later', 'aladdin', 'amdplpa', 'aml', 'ampas', 'antlr-pd', 'apache-1.0', 'apache-1.1', 'apache-2.0', 'apafml', 'apl-1.0', 'apsl-1.0', 'apsl-1.1', 'apsl-1.2', 'apsl-2.0', 'artistic-1.0', 'artistic-1.0-cl8', 'artistic-1.0-perl', 'artistic-2.0', 'bahyph', 'barr', 'beerware', 'bittorrent-1.0', 'bittorrent-1.1', 'blessing', 'blueoak-1.0.0', 'borceux', 'bsd-1-clause', 'bsd-2-clause', 'bsd-2-clause-freebsd', 'bsd-2-clause-netbsd', 'bsd-2-clause-patent', 'bsd-3-clause', 'bsd-3-clause-attribution', 'bsd-3-clause-clear', 'bsd-3-clause-lbnl', 'bsd-3-clause-no-nuclear-license', 'bsd-3-clause-no-nuclear-license-2014', 'bsd-3-clause-no-nuclear-warranty', 'bsd-3-clause-open-mpi', 'bsd-4-clause', 'bsd-4-clause-uc', 'bsd-protection', 'bsd-source-code', 'bsl-1.0', 'bzip2-1.0.5', 'bzip2-1.0.6', 'caldera', 'catosl-1.1', 'cc-by-1.0', 'cc-by-2.0', 'cc-by-2.5', 'cc-by-3.0', 'cc-by-4.0', 'cc-by-nc-1.0', 'cc-by-nc-2.0', 'cc-by-nc-2.5', 'cc-by-nc-3.0', 'cc-by-nc-4.0', 'cc-by-nc-nd-1.0', 'cc-by-nc-nd-2.0', 'cc-by-nc-nd-2.5', 'cc-by-nc-nd-3.0', 'cc-by-nc-nd-4.0', 'cc-by-nc-sa-1.0', 'cc-by-nc-sa-2.0', 'cc-by-nc-sa-2.5', 'cc-by-nc-sa-3.0', 'cc-by-nc-sa-4.0', 'cc-by-nd-1.0', 'cc-by-nd-2.0', 'cc-by-nd-2.5', 'cc-by-nd-3.0', 'cc-by-nd-4.0', 'cc-by-sa-1.0', 'cc-by-sa-2.0', 'cc-by-sa-2.5', 'cc-by-sa-3.0', 'cc-by-sa-4.0', 'cc-pddc', 'cc0-1.0', 'cddl-1.0', 'cddl-1.1', 'cdla-permissive-1.0', 'cdla-sharing-1.0', 'cecill-1.0', 'cecill-1.1', 'cecill-2.0', 'cecill-2.1', 'cecill-b', 'cecill-c', 'cern-ohl-1.1', 'cern-ohl-1.2', 'clartistic', 'cnri-jython', 'cnri-python', 'cnri-python-gpl-compatible', 'condor-1.1', 'copyleft-next-0.3.0', 'copyleft-next-0.3.1', 'cpal-1.0', 'cpl-1.0', 'cpol-1.02', 'crossword', 'crystalstacker', 'cua-opl-1.0', 'cube', 'curl', 'd-fsl-1.0', 'diffmark', 'doc', 'dotseqn', 'dsdp', 'dvipdfm', 'ecl-1.0', 'ecl-2.0', 'efl-1.0', 'efl-2.0', 'egenix', 'entessa', 'epl-1.0', 'epl-2.0', 'erlpl-1.1', 'etalab-2.0', 'eudatagrid', 'eupl-1.0', 'eupl-1.1', 'eupl-1.2', 'eurosym', 'fair', 'frameworx-1.0', 'freeimage', 'fsfap', 'fsful', 'fsfullr', 'ftl', 'gfdl-1.1-only', 'gfdl-1.1-or-later', 'gfdl-1.2-only', 'gfdl-1.2-or-later', 'gfdl-1.3-only', 'gfdl-1.3-or-later', 'giftware', 'gl2ps', 'glide', 'glulxe', 'gnuplot', 'gpl-1.0-only', 'gpl-1.0-or-later', 'gpl-2.0-only', 'gpl-2.0-or-later', 'gpl-3.0-only', 'gpl-3.0-or-later', 'gsoap-1.3b', 'haskellreport', 'hpnd', 'hpnd-sell-variant', 'ibm-pibs', 'icu', 'ijg', 'imagemagick', 'imatix', 'imlib2', 'info-zip', 'intel', 'intel-acpi', 'interbase-1.0', 'ipa', 'ipl-1.0', 'isc', 'jasper-2.0', 'jpnic', 'json', 'lal-1.2', 'lal-1.3', 'latex2e', 'leptonica', 'lgpl-2.0-only', 'lgpl-2.0-or-later', 'lgpl-2.1-only', 'lgpl-2.1-or-later', 'lgpl-3.0-only', 'lgpl-3.0-or-later', 'lgpllr', 'libpng', 'libpng-2.0', 'libtiff', 'liliq-p-1.1', 'liliq-r-1.1', 'liliq-rplus-1.1', 'linux-openib', 'lpl-1.0', 'lpl-1.02', 'lppl-1.0', 'lppl-1.1', 'lppl-1.2', 'lppl-1.3a', 'lppl-1.3c', 'makeindex', 'miros', 'mit', 'mit-0', 'mit-advertising', 'mit-cmu', 'mit-enna', 'mit-feh', 'mitnfa', 'motosoto', 'mpich2', 'mpl-1.0', 'mpl-1.1', 'mpl-2.0', 'mpl-2.0-no-copyleft-exception', 'ms-pl', 'ms-rl', 'mtll', 'mulanpsl-1.0', 'multics', 'mup', 'nasa-1.3', 'naumen', 'nbpl-1.0', 'ncsa', 'net-snmp', 'netcdf', 'newsletr', 'ngpl', 'nlod-1.0', 'nlpl', 'nokia', 'nosl', 'noweb', 'npl-1.0', 'npl-1.1', 'nposl-3.0', 'nrl', 'ntp', 'occt-pl', 'oclc-2.0', 'odbl-1.0', 'odc-by-1.0', 'ofl-1.0', 'ofl-1.1', 'ogl-canada-2.0', 'ogl-uk-1.0', 'ogl-uk-2.0', 'ogl-uk-3.0', 'ogtsl', 'oldap-1.1', 'oldap-1.2', 'oldap-1.3', 'oldap-1.4', 'oldap-2.0', 'oldap-2.0.1', 'oldap-2.1', 'oldap-2.2', 'oldap-2.2.1', 'oldap-2.2.2', 'oldap-2.3', 'oldap-2.4', 'oldap-2.5', 'oldap-2.6', 'oldap-2.7', 'oldap-2.8', 'oml', 'openssl', 'opl-1.0', 'oset-pl-2.1', 'osl-1.0', 'osl-1.1', 'osl-2.0', 'osl-2.1', 'osl-3.0', 'parity-6.0.0', 'pddl-1.0', 'php-3.0', 'php-3.01', 'plexus', 'postgresql', 'psfrag', 'psutils', 'python-2.0', 'qhull', 'qpl-1.0', 'rdisc', 'rhecos-1.1', 'rpl-1.1', 'rpl-1.5', 'rpsl-1.0', 'rsa-md', 'rscpl', 'ruby', 'sax-pd', 'saxpath', 'scea', 'sendmail', 'sendmail-8.23', 'sgi-b-1.0', 'sgi-b-1.1', 'sgi-b-2.0', 'shl-0.5', 'shl-0.51', 'simpl-2.0', 'sissl', 'sissl-1.2', 'sleepycat', 'smlnj', 'smppl', 'snia', 'spencer-86', 'spencer-94', 'spencer-99', 'spl-1.0', 'ssh-openssh', 'ssh-short', 'sspl-1.0', 'sugarcrm-1.1.3', 'swl', 'tapr-ohl-1.0', 'tcl', 'tcp-wrappers', 'tmate', 'torque-1.1', 'tosl', 'tu-berlin-1.0', 'tu-berlin-2.0', 'ucl-1.0', 'unicode-dfs-2015', 'unicode-dfs-2016', 'unicode-tou', 'unlicense', 'upl-1.0', 'vim', 'vostrom', 'vsl-1.0', 'w3c', 'w3c-19980720', 'w3c-20150513', 'watcom-1.0', 'wsuipa', 'wtfpl', 'x11', 'xerox', 'xfree86-1.1', 'xinetd', 'xnet', 'xpp', 'xskat', 'ypl-1.0', 'ypl-1.1', 'zed', 'zend-2.0', 'zimbra-1.3', 'zimbra-1.4', 'zlib', 'zlib-acknowledgement', 'zpl-1.1', 'zpl-2.0', 'zpl-2.1'];
const defaultIgnores = ['bjspm/packages/**', 'node_modules/**', 'bjspm/packages/**/.*', 'node_modules/**/.*', '.*.swp', '._*', '.DS_Store', 'Thumbs.db', '.git', '.hg', '.npmrc', '.lock-wscript', '.svn', '.wafpickle-*', 'config.gypi', 'CVS', 'npm-debug.log'];
const panickMsg = 'Something went wrong!';
const credentialsMsg = 'Please enter your Croncle.com account credentials to continue';
const integrityHashFunction = 'sha256';
const filesHashFunction = 'md5';
const baseArgs = Symbol('cmdConfigBaseArgs');

let ignoreGlobs = [];
let ignoresLoaded = false;
let tmpToken = null;
let packageVersionsCache = {};
let packageChecksumsCache = {};
let packageTagsCache = {};

tmp.setGracefulCleanup();

mkdirSync(appDataPath);

let authTokens = {};
let cmdArgs = process.argv.slice(2);
let cmdConfig = getArgsConfig(cmdArgs, ['sub']);
let cmdBaseArgs = cmdConfig[baseArgs];
let conf = null;

function getDefaultPackage() {
	return {
		name: '',
		version: '',
		sid: '',
		description: '',
		keywords: [],
		license: '',
		username: '',
		dependencies: []
	};
}

function getSuggestPackage() {
	let name = path.basename(cwdPath);

	return {
		name: isValidPackageName(name) ? name : '',
		version: '1.0.0',
		sid: '',
		description: '',
		keywords: [],
		license: 'MIT',
		username: '',
		dependencies: []
	};
}

function getDefaultAppConfig() {
	return {
		username: null,
		packageCachePath: appDataPath + path.sep + 'packages' + path.sep,
		maxCacheSize: null,
		logZipping: false,
		logDownloadProgress: true,
		logInstallVerbose: false,
		logUploadThreshold: 10,
		logUploadVerbose: false,
		registry: 'bjspm.croncle.com'
	};
}

function getDefaultPackageConfig() {
	return {

	};
}

let appConfig = getDefaultAppConfig();
let package = getDefaultPackage();
let packageConfig = getDefaultPackageConfig();

function getWebPackagesPath() {
	return `https://${appConfig.registry}/packages/`;
}

loadAppConfig();
for (let param in appConfig) {
	if (cmdConfig[param] !== undefined && cmdConfig[param][0] !== undefined) {
		try {
			appConfig[param] = JSON.parse(cmdConfig[param][0]);
		} catch (e) {
			appConfig[param] = cmdConfig[param][0];
		}
	}
}
promptRequiredReading((_requiredReading) => {
	loadPackage();
	loadAuthTokens();
	cleanAppConfig();

	if (cmdArgs.length === 0) {
		showQuickHelp();
	} else if (cmdArgs.length === 2 && cmdConfig['usage']) {
		showCommandHelp(cmdArgs[0]);
	} else if (cmdArgs.length === 1 && cmdConfig['version']) {
		die(version);
	} else {
		switch (cmdBaseArgs[0]) {
			case 'create':
			case 'innit':
			case 'init': {
				initPackage();
			}
				break;
			case 'publish': {
				let uploadType = 'unnamed';
				let access = 'public';
				let tags = [];
				let save = true;

				if (cmdBaseArgs.length === 1) {
					if (!isValidPackage()) {
						die('This package has an invalid configuration; run "bjspm init" to fix this.');
					}
					uploadType = getPackageType();

					if (conf = cmdConfig['type']) {
						let arg = conf[0];
						if (arg !== undefined) {
							switch (arg.toLowerCase()) {
								case 'user':
									if (package.username.length === 0) {
										die('This package is not configured properly to be a user package; run "bjspm init" to fix this.');
									}
									uploadType = 'user';
									break;
								case 'named':
									if (package.name.length === 0) {
										die('This package is not configured properly to be a named package; run "bjspm init" to fix this.');
									} else {
										uploadType = 'named';
									}
									break;
								case 'unnamed':
									uploadType = 'unnamed';
									break;
							}
						}
					}
					if (conf = cmdConfig['tag']) {
						if (uploadType === 'user') {
							let tag = conf[0];
							if (tag !== undefined) {
								if (!isValidPackageTag(tag)) {
									die('Invalid package tag');
								}
								tags = [tag];
							}
						}
					}
				} else {
					if (conf = cmdConfig['type']) {
						let arg = conf[0];

						if (arg !== undefined) {
							if (arg.toLowerCase() !== 'unnamed') {
								die(`Only type unnamed is allowed when specifying files`);
							}
						}
					}
				}
				if (conf = cmdConfig['access']) {
					let arg = conf[0];
					if (arg !== undefined) {
						if (package.sid.length !== 0 && uploadType === 'user') {
							let bsid = getPackageBsid();

							if (bsid === package.username + '/' + package.name) {
								die(`\nAccess levels cannot be set on individual packages. You may use the access command to change the access level for package tree "${bsid}"\n`);
							}
						}
						switch (arg.toLowerCase()) {
							case 'public':
								access = 'public';
								break;
							case 'restricted':
								access = 'restricted';
								break;
							default:
								die('Invalid access level');
								break;
						}
					}
				}
				if (conf = cmdConfig['no-save']) {
					if (getConfigBool(conf[0])) {
						save = false;
					}
				} else if (conf = cmdConfig['save']) {
					save = getConfigBool(conf[0]);
				}

				{
					// lowercase files
					let lowerCaseFiles = ['bjspm/readme.md', 'bjspm/package.json', 'bjspm/preview.png', 'bjspm/preview.jpg', 'bjspm/preview.jpeg'];
					for (let file of lowerCaseFiles) {
						let baseName = path.basename(file);
						let trueBaseName = getFileBaseName(file);

						if (trueBaseName !== null && baseName !== trueBaseName) {
							die(`For cross-OS compatibility, the "${baseName}" filename must be all-lowercase`);
						}
					}

					// lowercase directories
					let lowerCaseDirectories = ['bjspm'];
					for (let dir of lowerCaseDirectories) {
						let baseName = path.basename(dir);
						let trueBaseName = getDirectoryBaseName(dir);

						if (trueBaseName !== null && baseName !== trueBaseName) {
							die(`For cross-OS compatibility, the "${baseName}" directory name must be all-lowercase`);
						}
					}
				}
				getServerConfig(serverConfig => {
					if (serverConfig.uploadDisabled) {
						die('Package uploading has been disabled on the server');
					}
					let packagePatch = null;
					let token = undefined;

					let packageBackup, filePathsBackup;

					let onZipped = result => {
						let zipPath = result.zipPath;
						let fileData = result.fileData;

						let stats = fs.statSync(zipPath);
						if (stats.size > serverConfig.maxPackageSize) {
							die(`Package archive size exceeds maximum of ${filesize(serverConfig.maxPackageSize, { standard: "iec" })}`);
						}
						if (uploadType !== 'user' && getLoginAuthToken() === null) {
							if (stats.size > serverConfig.maxPackageSizeIP) {
								log(`Package archive size exceeds maximum of ${filesize(serverConfig.maxPackageSizeIP, { standard: "iec" })}`);

								if (serverConfig.maxPackageSizeIP !== serverConfig.maxPackageSize) {
									log(`Sign into your Croncle.com account to have a maximum of ${filesize(serverConfig.maxPackageSize, { standard: "iec" })}`);
								}
								process.exit();
							}
						}
						let uploadCallback = (obj) => {
							switch (obj.status) {
								case API_STATUS.OK:
									if (cmdBaseArgs.length === 1) {
										package.sid = obj.packageId;

										if (save) {
											storePackage();
										}
									}
									die(`\nPackage published, id: ${obj.packageId}\n`);
								case API_STATUS.ERR:
									if (save) {
										if (packageBackup !== undefined) {
											storePackage(packageBackup);
										}
										if (filePathsBackup !== undefined) {
											let json = JSON.stringify(filePathsBackup, undefined, 2);
											mksubdirSync(filePathsPath);
											fs.writeFileSync(filePathsPath, json, 'utf8');
										}
									}
									die('Server error: ' + obj.error);
							}
						};
						uploadPackage(zipPath, fileData, token, uploadType, access, tags, uploadCallback, packagePatch);
					};
					let zip = () => {
						let _logZipping = appConfig.logZipping || ((conf = cmdConfig['verbose']) && getConfigBool(conf[0]));
						if (cmdBaseArgs.length === 1) {
							loadJsonFile(filePathsPath, (prevFilePaths) => {
								loadIgnores(() => {
									getDirectoryFilePaths(cwdPath, (filePaths) => {
										if (save) {
											let json = JSON.stringify(filePaths, undefined, 2);
											mksubdirSync(filePathsPath);
											fs.writeFileSync(filePathsPath, json, 'utf8');
										}
										packageBackup = { ...package };
										if (prevFilePaths !== null) {
											filePathsBackup = prevFilePaths;

											let uploadPatch = package.sid.length !== 0;

											if (uploadPatch && !serverConfig.allowStandalonePatch && access === 'restricted') {
												uploadPatch = false;
											}

											switch (serverConfig.allowStandalonePatch) {
												case 'all': {

												}
													break;
												case 'user': {
													if (uploadType !== 'user' && !isSignedIn()) {
														uploadPatch = false;
													}
												}
													break;
												case 'none': {
													uploadPatch = false;
												}
													break;
											}

											if (uploadPatch) {
												let makePatch = () => {
													increasePackageVersionIfSame();
													log(`Making package patch${_logZipping ? '' : '...'}`);
													let newFilePaths = [];
													let filePathGroups = [];
													let refFilePaths = [];

													for (let hash in filePaths) {
														let paths = filePaths[hash];

														filePathGroups.push(paths);

														if ((hash in prevFilePaths) && !(paths.length === 1 && paths[0] === 'bjspm/package.json')) { // always upload "bjspm/package.json", because it is most likely different from what's on the server
															refFilePaths.push({
																isPrev: true,
																hash: hash
															});
														} else {
															let filePath = paths[0];

															newFilePaths.push(filePath);
															refFilePaths.push({
																isPrev: false,
																filePath: filePath
															});
														}
													}
													packagePatch = {
														filePathGroups: filePathGroups,
														refFilePaths: refFilePaths,
														prevPackage: package.sid
													};
													zipFiles(newFilePaths, onZipped, _logZipping);
												};
												getPackageAvailability(package.sid, (availability) => {
													if (availability === 'deleted_permanently' || availability === 'nonexistent') {
														if (availability === 'deleted_permanently') {
															let packageType = getPackageTypeFromSid(package.sid);

															if (packageType === 'user') {
																let baseId = getPackageBsidFromSid(package.sid);

																getPackageBaseAvailability(baseId, (_availability) => {
																	if (_availability === 'deleted_permanently') {
																		die('Cannot publish – package tree has been deleted permanently');
																	} else {
																		makePatch();
																	}
																});
															} else {
																log(`Making package archive${_logZipping ? '' : '...'}`);
																zipPackage(onZipped, _logZipping);
															}
														} else {
															increasePackageVersionIfSame();
															log(`Making package archive${_logZipping ? '' : '...'}`);
															zipPackage(onZipped, _logZipping);
														}
													} else {
														makePatch();
													}
												});
											} else {
												log(`Making package archive${_logZipping ? '' : '...'}`);
												zipPackage(onZipped, _logZipping);
											}
										} else {
											log(`Making package archive${_logZipping ? '' : '...'}`);
											increasePackageVersionIfSame();
											zipPackage(onZipped, _logZipping);
										}
									}, true);
								});
							});
						} else {
							log(`Making package archive${_logZipping ? '' : '...'}`);

							let subFilesOnly = (conf = cmdConfig['sub']) && getConfigBool(conf[0]);

							zipFiles(cmdBaseArgs.slice(1), onZipped, _logZipping, subFilesOnly);
						}
					};
					if (uploadType === 'user') {
						let bsid = getUserPackageBsid();

						getAuthTokenWithPackagePermissions(bsid, ['mayPublish'], (_token) => { // First, try without prompt, so user won't be prompted if this is the first time publishing the package
							if (_token === null) {
								if (bsid !== getPackageBsidFromSid(package.sid) && authTokens[package.username] !== undefined) { // Assume first upload as user package & valid token
									token = authTokens[package.username];
									zip();
								} else {
									getAuthTokenWithPackagePermissions(bsid, ['mayPublish'], (_token) => { // Secondly, do prompt to really get a token
										if (_token === null) {
											if (bsid !== getPackageBsidFromSid(package.sid) && authTokens[package.username] !== undefined) { // Assume first upload as user package & valid token
												token = authTokens[package.username];
												zip();
											} else {
												die('Not authorized');
											}
										} else {
											token = _token;
											zip();
										}
									}, false, true);
								}
							} else {
								token = _token;
								zip();
							}
						});
					} else if (serverConfig.loginRequired || access === 'restricted') {
						let loginAuthToken = getLoginAuthToken();

						if (loginAuthToken !== null) {
							token = loginAuthToken;
							zip();
						} else {
							log(credentialsMsg);
							pollUsername((username) => {
								getAuthToken(username, (authToken) => {
									token = authToken;
									zip();
								});
							});
						}
					} else {
						token = getLoginAuthToken();
						zip();
					}
				});
			}
				break;
			case 'unpublish': {
				if (cmdBaseArgs.length > 2) {
					showCommandHelp('unpublish');
				}
				let packageId = cmdBaseArgs[1];
				if (packageId === undefined) {
					if (package.sid.length === 0) {
						die('No package specified');
					}
					packageId = package.sid;
				} else {
					if (!isValidSpecificPackageId(packageId) && !isValidPackageBaseId(packageId)) {
						die('Invalid package identifier for unpublishing');
					}
				}
				let unpublish = (authToken) => {
					unpublishPackage(packageId, authToken, (result) => {
						let packageType = getPackageTypeFromSid(packageId);

						if (packageType === 'user' && isValidPackageBaseId(packageId)) {
							log('Package tree unpublished successfully');
						} else {
							if (result.undid) {
								log('Package unpublishing undone successfully');
							} else {
								log('Package unpublished successfully');
							}
						}
						process.exit();
					});
				};
				let proceed = () => {
					getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
						if (token === null) {
							die('Not authorized');
						} else {
							unpublish(token);
						}
					}, false, true);
				};
				if (isValidPackageBaseId(packageId)) {
					getPackageBaseAvailability(packageId, (availability) => {
						switch (availability) {
							case 'deleted_permanently':
								die('Cannot unpublish – package tree deleted permanently');
								break;
							case 'deleted':
								die('Package tree already unpublished; you can revive it by publishing a new package to it');
								break;
							case 'nonexistent':
								die(`Package tree does not exist`);
								break;
							default:
								proceed();
						}
					});
				} else {
					isRegisteredPackageSid(packageId, (exist) => {
						if (!exist) {
							die(`Package does not exist`);
						}
						let packageType = getPackageTypeFromSid(packageId);

						if (packageType === 'user') {
							let baseId = getPackageBsidFromSid(packageId);

							getPackageBaseAvailability(baseId, (availability) => {
								switch (availability) {
									case 'deleted':
										die('Cannot unpublish – package tree has been unpublished');
										break;
									case 'deleted_permanently':
										die('Cannot unpublish – package tree has been deleted permanently');
										break;
									default:
										proceed();
								}
							});
						} else {
							proceed();
						}
					});
				}
			}
				break;
			case 'i':
			case 'isntall':
			case 'install':
			case 'add':
			case 'up':
			case 'upgrade':
			case 'udpate':
			case 'update': {
				let packageId = cmdBaseArgs[1];
				let folder = null;
				let dlType = 'org';
				let installIds = [];
				let force = false;
				let update = ['up', 'upgrade', 'udpate', 'update'].indexOf(cmdBaseArgs[0]) !== -1;
				let checkSIDs = false;

				if (conf = cmdConfig['dir']) {
					let arg = conf[0];
					if (arg !== undefined) {
						folder = arg;
					} else {
						showCommandHelp('install');
					}
				}
				if (update) {
					if (folder !== null) {
						die(`Cannot update in a subdirectory`);
					}
					if (cmdBaseArgs.length === 1) {
						installIds = package.dependencies;
					} else {
						for (let i = 1; i < cmdBaseArgs.length; i++) {
							if (!isValidPackageUpdateId(cmdBaseArgs[i])) {
								log(`Invalid package identifier for updating: "${cmdBaseArgs[i]}"`);
								continue;
							}
							installIds.push(cmdBaseArgs[i]);
						}
						checkSIDs = true;

						for (let dependency of package.dependencies) {
							if (installIds.indexOf(dependency) !== -1) {
								continue;
							}
							if (!isPackageInstalled(dependency, folder ? folder : undefined)) {
								installIds.push(dependency);
								log(`Missing dependency "${dependency}" will be installed as well`);
							}
						}
					}
				} else {
					if (packageId === undefined) {
						installIds = package.dependencies;
					} else {
						installIds.push(packageId);
						checkSIDs = true;
					}
				}
				for (let id of installIds) {
					if (!isValidPackageSid(id)) {
						if (installIds.length === 1) {
							die(`Invalid package identifier`);
						} else {
							die(`Invalid package identifier: "${id}"`);
						}
					}
					if (update && !isValidPackageUpdateId(id)) {
						die(`Invalid package identifier for updating: "${id}"`);
					}
				}
				if (installIds.length === 0) {
					die(`Nothing to ${update ? 'update' : 'install'}`);
				}
				if (conf = cmdConfig['force']) {
					force = getConfigBool(conf[0]);
				}
				let save = folder === null;
				if (conf = cmdConfig['no-save']) {
					if (getConfigBool(conf[0])) {
						save = false;
					}
				} else if (conf = cmdConfig['save']) {
					save = getConfigBool(conf[0]);
				}
				if (save && folder !== null) {
					save = false;
					log(`Packages installed in a custom directory cannot be added as a dependency`);
				}
				let i = -1;
				let installedIds = [];
				let uninstallable = 0;
				let skippedInstalls = 0;
				let word = update ? 'updated' : 'installed';
				let previousDependencies;

				let iterate = () => {
					if (++i === installIds.length) {
						let letter = installedIds.length > 1 ? 's' : '';

						if (installedIds.length !== 0) {
							if (folder === null) {
								addPackageBaseModules(true);
							}
							if (uninstallable !== 0) {
								log(`\nPackage${letter} partially ${word}, ${uninstallable} packages could not be ${word}.\n`);
							} else {
								log(`\nPackage${letter} ${word}.\n`);
							}
							getRawDependencies(package, (currentDependencies) => {
								let uninstalledDependencies = previousDependencies.filter(d => currentDependencies.indexOf(d) === -1);
								let i = 0;
								let removeNext = () => {
									let dependency = uninstalledDependencies[i++];

									if (dependency === undefined) {
										process.exit();
										return;
									}
									let dir = getInstallDirFromInstallId(dependency, folder ? folder : undefined);

									if (fs.existsSync(dir)) {
										deleteDirectory(dir, (err) => {
											if (err) {
												log(`Could not remove files of uninstalled dependency "${dependency}"`);
												removeNext();
											} else {
												log(`Removed files of uninstalled dependency "${dependency}"`);
												removeNext();
											}
										});
									} else {
										removeNext();
									}
								};
								removeNext();
							});
						} else {
							die(`Nothing ${word}`);
						}
						return;
					}
					let installId = installIds[i];
					let packageType = getPackageTypeFromSid(installId);
					let noteVersion = false;
					let packageVersion;

					if (packageType === 'user') {
						let matches = installId.match(regexInstallUser);
						packageVersion = matches[3];
					}

					if (save && packageType === 'user') {
						let matches = installId.match(regexInstallUser);
						let packageVersion = matches[3];

						if (isValidPackageVersion(packageVersion) || isValidPackageTag(packageVersion)) {
							noteVersion = true;
						}
					}

					let install = () => {
						packageType = getPackageTypeFromSid(installId);

						installPackage(installId, folder, dlType, (result, err, installBsid) => {
							if (result !== null) {
								installedIds.push(installId);
							} else {
								if (!update) {
									switch (err) {
										case 'dir_exists': {
											if (save && packageType !== 'user' && package.dependencies.indexOf(installBsid) === -1) {
												package.dependencies.push(installBsid);
												storePackage();

												log(`Added "${installBsid}" to dependencies – it seems to already be installed`);
											} else {
												log(`Not installing "${installId}" — target directory already exists`);
											}
										}
											break;
										case 'same_version': {
											if (save && package.dependencies.indexOf(installBsid) === -1) {
												package.dependencies.push(installBsid);
												storePackage();

												log(`Added "${installBsid}" to dependencies, "${installId}" is already installed`);
											} else {
												log(`Not installing "${installId}" — already installed`);
											}
										}
										default:
											uninstallable++;
									}
								}
								skippedInstalls++;
							}
							iterate();
						}, save, force, update, noteVersion);
					};
					if (checkSIDs && !isValidRangeOnly(packageVersion)) {
						checkPackageAvailability(installId, (availability) => {
							switch (availability) {
								case 'public': {
									resolvePackageSid(installId, (sid) => {
										installId = sid;
										if (installedIds.indexOf(installId) === -1) {
											if (update && isPackageInstalled(installId, folder ? folder : undefined) === false) {
												log(`Package not installed: "${installId}"`);
												skippedInstalls++;
												iterate();
											}
											install();
										} else {
											skippedInstalls++;
											iterate();
										}
									});
								}
									break;
								default:
									install();
							}
						}, false);
					} else {
						if (installedIds.indexOf(installId) === -1) {
							install();
						} else {
							skippedInstalls++;
							iterate();
						}
					}
				};
				getRawDependencies(package, (dependencies) => {
					previousDependencies = dependencies;
					iterate();
				});
			}
				break;
			case 'u':
			case 'un':
			case 'unlink':
			case 'remove':
			case 'rm':
			case 'r':
			case 'uninstall': {
				if (cmdBaseArgs.length > 2) {
					showCommandHelp('uninstall');
				}
				let packageId = cmdBaseArgs[1];
				let save = true;

				if (cmdConfig['dir']) {
					die('Cannot uninstall from a subdirectory');
				}
				if (conf = cmdConfig['save']) {
					save = getConfigBool(conf[0]);
				}
				if (conf = cmdConfig['no-save']) {
					save = !getConfigBool(conf[0]);
				}
				if (packageId === undefined) {
					if (fs.existsSync(packagesPath)) {
						deleteDirectory(packagesPath, (err) => {
							if (err) {
								die(`Could not uninstall package`);
							} else {
								if (save) {
									package.dependencies.length = 0;
									storePackage();
								}
								die(`Package uninstalled`);
							}
						});
					} else {
						log(`ERROR: Package not installed`);
						if (save && package.dependencies.length !== 0) {
							package.dependencies.length = 0;
							storePackage();
							log(`Cleared dependencies`);
						}
						process.exit();
					}
					break;
				}
				if (!isValidPackageUpdateId(packageId)) {
					die(`Invalid package identifier for uninstalling`);
				}
				packageId = getMajorInstallId(packageId);

				let packageType = getPackageTypeFromSid(packageId);

				let proceed = () => {
					let installDir = getInstallDirFromInstallId(packageId);
					let dependencyIndex = package.dependencies.indexOf(packageId);

					if (dependencyIndex === -1 || !fs.existsSync(installDir)) {
						log(`ERROR: Package not installed`);

						if (dependencyIndex !== -1) {
							package.dependencies.splice(dependencyIndex, 1);
							storePackage();
							log(`Removed from dependencies`);
						}
						process.exit();
					}
					getDependencies(package, (dependencies) => {
						let uninstall = (id, callback) => {
							let dependency = dependencies[id];
							if (dependency.refCount === 0) {
								callback();
								return;
							}
							if (--dependency.refCount === 0) {
								deleteDirectory(dependency.dir, (err) => {
									if (err) {
										die(panickMsg, err);
									}
									if (dependency.package !== null) { // Possibly sub-dependencies to uninstall
										let uninstallSubDependencies = () => {
											if (dependency.package.dependencies.length === 0) { // No sub-dependencies
												callback();
												return;
											}
											let uninstalled = 0;
											for (let _dependency of dependency.package.dependencies) {
												uninstall(_dependency, () => {
													if (++uninstalled === dependency.package.dependencies.length) { // All sub-dependencies have been uninstalled
														callback();
													}
												});
											}
										};
										if (dependency.type === 'user') {
											/* Delete user directory if this was the last package of user */
											let deleteDir = true;

											for (let _dependency of dependencies) {
												if (_dependency === dependency) {
													continue;
												}
												if (_dependency.refCount !== 0 && _dependency.package !== null && _dependency.package.username === dependency.package.username) {
													deleteDir = false;
													break;
												}
											}
											if (deleteDir) {
												let dir = path.resolve(dependency.dir, '..');

												deleteDirectory(dir, (err) => {
													if (err) {
														die(panickMsg, err);
													}
													// user directory deleted
													uninstallSubDependencies();
												});
											} else { // user directory not deleted, it has other packages in it
												uninstallSubDependencies();
											}
										} else { // Not a user package, so no parent directory to possibly delete
											uninstallSubDependencies();
										}
									} else { // No package file, so no sub-dependencies to uninstall
										if (dependency.type === 'user') {
											/* Delete user directory */
											let dir = path.resolve(dependency.dir, '..');

											deleteDirectory(dir, (err) => {
												if (err) {
													die(panickMsg, err);
												}
												// user directory deleted
												callback();
											});
										} else {
											callback();
										}
									}
								});
							} else {
								callback();
							}
						};
						uninstall(packageId, () => {
							if (save) {
								let index = package.dependencies.indexOf(packageId);
								package.dependencies.splice(index, 1);
								storePackage();
							}
							if (isEmptyDirectory(packagesPath)) {
								deleteDirectory(packagesPath, () => {
									die(`Package uninstalled`);
								});
							} else {
								die(`Package uninstalled`);
							}
						});
					});
				};
				if (packageType === 'unnamed') {
					resolvePackageSid(packageId, (sid) => {
						let packageType = getPackageTypeFromSid(sid);

						if (packageType === 'user') {
							if (!isPackageInstalled(sid)) {
								die(`ERROR: Package not installed`);
							}
							if (!isPackageInstalledForSure(sid)) {
								die('Please provide the full ID of the package to uninstall it.');
							}
						}
						packageId = getMajorInstallId(sid);
						proceed();
					});
				} else if (packageType === 'named') {
					resolvePackageSid(packageId.split('_')[1], (sid) => {
						let packageType = getPackageTypeFromSid(sid);

						if (packageType === 'user') {
							if (!isPackageInstalled(sid)) {
								die(`ERROR: Package not installed`);
							}
							if (!isPackageInstalledForSure(sid)) {
								die('Please provide the full ID of the package to uninstall it.');
							}
						}
						packageId = getMajorInstallId(sid);
						proceed();
					});
				} else {
					proceed();
				}
			}
				break;
			case 'push': {
				let target = cmdBaseArgs[1];

				if (target === undefined) {
					showCommandHelp('push');
				}
				if (package.sid.length === 0) {
					die(`Cannot push to an unpublished package`);
				}
				let packageId = package.sid;

				switch (target.toLowerCase()) {
					case 'readme': {
						if (cmdBaseArgs.length > 2) {
							showCommandHelp('push');
						}
						let readmePath = path.resolve(bjspmPath, 'readme.md');

						if (!existsAsFile(readmePath)) {
							die(`No readme file in bjspm directory`);
						}

						let baseName = getFileBaseName('bjspm/readme.md');

						if (baseName !== 'readme.md') {
							die('For cross-OS compatibility, the readme filename must be all-lowercase');
						}
						getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
							let finalize = () => {
								updateFileChecksum('bjspm/readme.md', filesHashFunction, () => {
									die(`Readme updated`);
								});
							};
							if (token === null) {
								die('Not authorized');
							} else {
								uploadReadme(token, () => {
									finalize();
								});
							}
						}, false, true);
					}
						break;
					case 'preview-image': {
						if (cmdBaseArgs.length > 2) {
							showCommandHelp('push');
						}
						let imgPath = null;
						let imgName = null;
						let imgNames = ['preview.png', 'preview.jpg', 'preview.jpeg'];

						for (let name of imgNames) {
							let _imgPath = path.resolve(bjspmPath, name);

							if (existsAsFile(_imgPath)) {
								imgPath = _imgPath;
								imgName = name;
								break;
							}
						}
						if (imgPath === null) {
							die(`No preview image in bjspm directory; must be "preview.png", "preview.jpg" or "preview.jpeg"`);
						}
						getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
							let finalize = () => {
								updateFileChecksum('bjspm/' + imgName, filesHashFunction, () => {
									die(`Preview image updated`);
								});
							};
							if (token === null) {
								die('Not authorized');
							} else {
								uploadPreviewImage(imgPath, token, () => {
									finalize();
								});
							}
						}, false, true);
					}
						break;
					case 'description': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('push');
						}
						let description = package.description;
						let newDescription = cmdBaseArgs[2];

						if (newDescription !== undefined) {
							description = newDescription;
						}
						if (!isValidPackageDescription(description)) {
							die('Invalid package description');
						}
						if (newDescription !== undefined) {
							package.description = newDescription;
							storePackage();
						}
						getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
							let finalize = () => {
								updateFileChecksum(packageJsonPath, filesHashFunction, () => {
									die(`Description updated`);
								});
							};
							if (token === null) {
								die('Not authorized');
							} else {
								uploadDescription(description, token, () => {
									finalize();
								});
							}
						}, false, true);
					}
						break;
					default:
						showCommandHelp('push');
				}
			}
				break;
			case 'dist-tags':
			case 'dist-tag': {
				let subCmd = cmdBaseArgs[1];
				if (subCmd === undefined) {
					showCommandHelp('dist-tag');
				}
				switch (subCmd) {
					case 'add': {
						if (cmdBaseArgs.length > 4) {
							showCommandHelp('dist-tag');
						}
						let packageId = cmdBaseArgs[2];
						let tag = cmdBaseArgs[3];

						if (packageId === undefined) {
							showCommandHelp('dist-tag');
						}
						if (tag === undefined) {
							tag = packageId;
							packageId = undefined;
						}
						if (packageId === undefined) {
							if (package.sid.length === 0) {
								die('No package specified');
							}
							if (getPackageTypeFromSid(package.sid) !== 'user') {
								die('Only user packages may have tags');
							}
							packageId = package.sid;
						} else if (!regexUserVersioned.test(packageId)) {
							die('Invalid specific user package identifier');
						}
						if (!isValidPackageTag(tag)) {
							die('Invalid package tag');
						}
						checkPackageAvailability(packageId, () => {
							getAuthTokenWithPackagePermissions(packageId, ['maySetTags'], (token) => {
								let addTag = (authToken) => {
									setPackageTags(packageId, [tag], authToken, () => {
										die('Tag set successfully');
									});
								};
								if (token === null) {
									die('Not authorized');
								} else {
									addTag(token);
								}
							}, false, true);
						});
					}
						break;
					case 'rm': {
						if (cmdBaseArgs.length > 4) {
							showCommandHelp('dist-tag');
						}
						let packageId = cmdBaseArgs[2];
						let tag = cmdBaseArgs[3];

						if (packageId === undefined) {
							showCommandHelp('dist-tag');
						}
						if (tag === undefined) {
							tag = packageId;
							packageId = undefined;
						}
						if (packageId === undefined) {
							if (package.sid.length === 0) {
								die('No package specified');
							}
							if (getPackageTypeFromSid(package.sid) !== 'user') {
								die('Only user packages may have tags');
							}
							packageId = package.sid;
						} else if (!isValidPackageSid(packageId)) {
							die('Invalid package identifier');
						}
						if (!isValidPackageTag(tag)) {
							die('Invalid package tag');
						}
						if (tag === 'latest') {
							die('Tag "latest" may not be deleted');
						}
						checkPackageAvailability(packageId, (availability) => {
							getAuthTokenWithPackagePermissions(packageId, ['maySetTags'], (token) => {
								let deleteTag = (authToken) => {
									deletePackageTags(packageId, [tag], authToken, (result) => {
										if (result.deleted !== 0) {
											die('Tag deleted successfully');
										} else {
											die('Tag does not exist');
										}
									});
								};
								if (token === null) {
									die('Not authorized');
								} else {
									deleteTag(token);
								}
							}, false, true);
						});
					}
						break;
					case 'list':
					case 'ls': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('dist-tag');
						}
						let packageId = cmdBaseArgs[2];
						if (packageId === undefined) {
							if (package.sid.length === 0 || getPackageTypeFromSid(package.sid) !== 'user') {
								die('No package specified');
							} else {
								packageId = getUserPackageBsid();
							}
						}
						if (!regexUserNoVersion.test(packageId)) {
							die('Invalid base user package identifier');
						}
						checkPackageAvailability(packageId, (availability) => {
							let listTags = (authToken) => {
								getPackageTags(packageId, (tagsObj) => {
									for (let majorVersion in tagsObj) {
										let tags = tagsObj[majorVersion];

										for (let tag in tags) {
											log(`${tag}: ${tags[tag]}`);
										}
									}
									process.exit();
								}, authToken);
							};
							if (availability === 'public') {
								listTags();
							} else {
								getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
									if (token === null) {
										die('Not authorized');
									} else {
										listTags(token);
									}
								}, false, true);
							}
						});
					}
						break;
					default:
						showCommandHelp('dist-tag');
				}
			}
				break;
			case 'access': {
				if (cmdBaseArgs.length === 1) {
					showCommandHelp('access');
				} else {
					let arg1 = cmdBaseArgs[1].toLowerCase();
					switch (arg1) {
						case 'public': {
							let packageId;

							if (cmdBaseArgs.length > 3) {
								showCommandHelp('access');
								break;
							}
							if (cmdBaseArgs.length === 2) { // local package
								if (package.sid.length === 0) {
									die('No package specified');
									break;
								}
								packageId = getPackageBsid();
							} else if (cmdBaseArgs.length === 3) {
								packageId = cmdBaseArgs[2];
							} else {
								showCommandHelp('access');
								break;
							}
							if (!isValidPackageBaseId(packageId)) {
								die('Invalid package base identifier');
							}
							let setPublicity = (authToken) => {
								let packageType = getPackageTypeFromSid(packageId);

								setPackagePublicity(packageId, arg1, authToken, () => {
									if (packageType === 'user') {
										die('Package tree set to ' + arg1);
									} else {
										die('Package set to ' + arg1);
									}
								});
							}
							checkPackageAvailability(packageId, (availability) => {
								if (availability === 'public') {
									die('Package already public');
								}
								getAuthTokenWithPackagePermissions(packageId, ['maySetPublicity'], (token) => {
									if (token === null) {
										die('Not authorized');
									} else {
										setPublicity(token);
									}
								}, false, true);
							});
						}
							break;
						case 'grant': {
							if (cmdBaseArgs.length === 2 || cmdBaseArgs.length > 5) {
								showCommandHelp('access');
							} else {
								switch (cmdBaseArgs[2]) {
									case 'read-only':
									case 'read-write': {
										let user = cmdBaseArgs[3];
										let packageId;

										if (cmdBaseArgs.length === 4) { // local package
											if (package.sid.length === 0) {
												die('No package specified');
												break;
											}
											packageId = getPackageBsid();
										} else if (cmdBaseArgs.length === 5) {
											packageId = cmdBaseArgs[4];
										} else {
											showCommandHelp('access');
											break;
										}
										if (!isValidUsername(user)) {
											die('Invalid username');
										}
										if (!isValidPackageBaseId(packageId)) {
											die('Invalid package base identifier');
										}
										checkPackageAvailability(packageId, (availability) => {
											let setPermissions = (authToken) => {
												setUserPermissions(packageId, user, cmdBaseArgs[2], authToken, () => {
													die('User permissions granted');
												});
											};
											getAuthTokenWithPackagePermissions(packageId, ['maySetPermissions'], (token) => {
												if (token === null) {
													die('Not authorized');
												} else {
													setPermissions(token);
												}
											}, false, true);
										});
									}
										break;
									default:
										showCommandHelp('access');
								}
							}
						}
							break;
						case 'revoke': {
							let user = cmdBaseArgs[2];
							let packageId;

							if (cmdBaseArgs.length > 4) {
								showCommandHelp('access');
								break;
							}
							if (cmdBaseArgs.length === 3) { // local package
								if (package.sid.length === 0) {
									die('No package specified');
									break;
								}
								packageId = getPackageBsid();
							} else if (cmdBaseArgs.length === 4) {
								packageId = cmdBaseArgs[3];
							} else {
								showCommandHelp('access');
								break;
							}
							if (!isValidUsername(user)) {
								die('Invalid username');
							}
							if (!isValidPackageBaseId(packageId)) {
								die('Invalid package base identifier');
							}
							checkPackageAvailability(packageId, () => {
								let setPermissions = (authToken) => {
									setUserPermissions(packageId, user, 'none', authToken, () => {
										die('User permissions revoked');
									});
								};
								getAuthTokenWithPackagePermissions(packageId, ['maySetPermissions'], (token) => {
									if (token === null) {
										die('Not authorized');
									} else {
										setPermissions(token);
									}
								}, false, true);
							});
						}
							break;
						case 'ls-packages': {
							let user = cmdBaseArgs[2];

							if (cmdBaseArgs.length > 3) {
								showCommandHelp('access');
								break;
							}
							if (user === undefined) {
								user = appConfig.username;

								if (user === null) {
									die('Not signed in');
								}
							}
							if (!isValidUsername(user)) {
								die('Invalid username');
							}
							getPackageAccessListUser(user, (obj) => {
								let json = JSON.stringify(Array.isArray(obj) ? {} : obj, undefined, 2);
								die(json);
							});
						}
							break;
						case 'ls-collaborators': {
							let user;
							let packageId;

							if (cmdBaseArgs.length > 4) {
								showCommandHelp('access');
								break;
							}
							if (cmdBaseArgs.length === 2) { // local package
								if (package.sid.length === 0) {
									die('No package specified');
									break;
								}
								packageId = package.sid;
							} else {
								packageId = cmdBaseArgs[2];
								user = cmdBaseArgs.length === 4 ? cmdBaseArgs[3] : '';
							}
							if (user.length !== 0 && !isValidUsername(user)) {
								die('Invalid username');
							}
							if (!isValidLoosePackageId(packageId)) {
								die('Invalid package identifier');
							}
							checkPackageAvailability(packageId, (availability) => {
								if (availability === 'public') {
									getPackageCollaborators(packageId, user, (obj) => {
										let json = JSON.stringify(Array.isArray(obj) ? {} : obj, undefined, 2);

										die(json);
									});
								} else {
									let listCollaborators = (authToken) => {
										getPackageCollaborators(packageId, user, (obj) => {
											let json = JSON.stringify(Array.isArray(obj) ? {} : obj, undefined, 2);

											die(json);
										}, authToken);
									};
									getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
										if (token === null) {
											die('Not authorized');
										} else {
											listCollaborators(token);
										}
									}, false, true);
								}
							});
						}
							break;
						default:
							showCommandHelp('access');
					}
				}
			}
				break;
			case 'auth': {
				if (cmdBaseArgs.length === 1) {
					if (appConfig.username === null) {
						log('Not signed in');
					} else {
						log(`Signed in as "${appConfig.username}"`);
					}
					process.exit();
				}
				switch (cmdBaseArgs[1]) {
					case 'save':
					case 'store': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('auth');
						}
						let username = cmdBaseArgs[2];
						let proceed = () => {
							getAuthToken(username, () => {
								die(`Stored auth token of "${username}" in local app data`);
							}, false);
						};
						if (username === undefined) {
							pollUsername((_username) => {
								username = _username;
								proceed();
							});
						} else {
							if (!isValidUsername(username)) {
								die(`Invalid username: ${username}`);
							}
							proceed();
						}
					}
						break;
					case 'forget': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('auth');
						}
						let username = cmdBaseArgs[2];
						let proceed = () => {
							if (!(username in authTokens)) {
								die('User auth token not found');
							}
							delete authTokens[username];
							storeAuthTokens();
							die(`Auth token of "${username}" deleted from local app data`);
						};
						if (username === undefined) {
							pollUsername((_username) => {
								username = _username;
								proceed();
							});
						} else {
							if (!isValidUsername(username)) {
								die(`Invalid username: ${username}`);
							}
							proceed();
						}
					}
						break;
					case 'sign-in':
					case 'signin':
					case 'login': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('auth');
						}
						let username = cmdBaseArgs[2];
						let proceed = () => {
							let useAuthStore = true;
							if (conf = cmdConfig['force']) {
								useAuthStore = !getConfigBool(conf[0]);
							}
							getAuthToken(username, () => {
								appConfig.username = username;
								log(`Signed in as "${username}"`);
								storeAppConfig();
								process.exit();
							}, useAuthStore);
						};
						if (username === undefined) {
							pollUsername((_username) => {
								username = _username;
								proceed();
							});
						} else {
							if (!isValidUsername(username)) {
								die(`Invalid username: ${username}`);
							}
							proceed();
						}
					}
						break;
					case 'sign-out':
					case 'signout':
					case 'logout': {
						if (cmdBaseArgs.length > 2) {
							showCommandHelp('auth');
						}
						if (appConfig.username === null) {
							die(`Not signed in`);
						}
						let username = appConfig.username;
						appConfig.username = null;
						storeAppConfig();
						die(`No longer signed in as "${username}"`);
					}
						break;
					case 'list':
					case 'ls': {
						if (cmdBaseArgs.length > 2) {
							showCommandHelp('auth');
						}
						for (let user in authTokens) {
							log(user);
						}
						process.exit();
					}
						break;
					default:
						showCommandHelp('auth');
				}
			}
				break;
			case 'v':
			case 'info':
			case 'show':
			case 'view': {
				let packageId = cmdBaseArgs[1];
				if (packageId === undefined) {
					die(JSON.stringify(package, undefined, 2));
				}
				if (!isValidPackageSid(packageId)) {
					die('Invalid package identifier');
				}
				let logObj = (obj) => {
					if (cmdBaseArgs[2] === undefined) {
						log(JSON.stringify(obj, undefined, 2));
					} else {
						let logMap = {};
						let skipped = 0;
						for (let i = 2; i < cmdBaseArgs.length; i++) {
							let arg = cmdBaseArgs[i];
							if (arg in logMap) {
								skipped++;
								continue;
							}
							let split = arg.split('.');
							if (split.length === 1) {
								if (obj[arg] !== undefined) {
									logMap[arg] = obj[arg];
								}
							} else if (split.length === 2) {
								if (obj[split[0]] !== undefined && obj[split[0]][split[1]] !== undefined) {
									logMap[arg] = obj[split[0]][split[1]];
								}
							}
						}
						let keys = Object.keys(logMap);
						if (keys.length === 1 && cmdBaseArgs.length - skipped === 3) {
							log(JSON.stringify(logMap[keys[0]]));
						} else {
							for (let key of keys) {
								log(`${key} = ${JSON.stringify(logMap[key])}`);
							}
						}
					}
				};
				checkPackageAvailability(packageId, (availability) => {
					let show = (authToken) => {
						getBjspmPackageJson(packageId, (obj) => {
							logObj(obj);
							process.exit();
						}, authToken, (err) => {
							if (err.response && err.response.statusCode === 404) {
								die('No information available about this package');
							} else {
								_onGotError(err);
							}
						});
					};
					if (availability === 'public') {
						show();
					} else {
						getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
							if (token === null) {
								die('Not authorized');
							} else {
								show(token);
							}
						}, false, true);
					}
				});
			}
				break;
			case 'cache': {
				let files = fs.existsSync(appConfig.packageCachePath) ? fs.readdirSync(appConfig.packageCachePath).filter(file => file.endsWith('.zip')) : [];
				let filePaths = [];
				let totalSize = 0;
				for (let file of files) {
					let filePath = path.resolve(appConfig.packageCachePath, file);
					let stat = fs.statSync(filePath);
					totalSize += stat.size;
					filePaths.push(filePath);
				}
				if (cmdBaseArgs.length === 1) {
					die(`Cache: ${files.length} package${files.length === 1 ? '' : 's'}, ${filesize(totalSize, { standard: "iec" })}`);
				} else {
					switch (cmdBaseArgs[1]) {
						case 'clean':
						case 'clear': {
							if (cmdBaseArgs.length > 2) {
								showCommandHelp('cache');
							}
							for (let filePath of filePaths) {
								try {
									fs.unlinkSync(filePath);
								} catch (e) {
									die(panickMsg, e);
								}
							}
							log(`Cache cleared (${files.length} files, ${filesize(totalSize, { standard: "iec" })})`);
						}
							break;
						case 'dir': {
							if (cmdBaseArgs.length > 3) {
								showCommandHelp('cache');
							}
							let dir = cmdBaseArgs[2];
							if (dir !== undefined) {
								if (dir === 'default') {
									dir = getDefaultAppConfig().packageCachePath;
								}
								if (!path.isAbsolute(dir)) {
									die('Only absolute paths are allowed');
								}
								if (existsAsFile(dir)) {
									die('Path resolves to a file, must be a directory');
								}
								appConfig.packageCachePath = dir;
								storeAppConfig();
								die(resolvePathNative(dir));
							} else {
								die(appConfig.packageCachePath);
							}
						}
							break;
						case 'max-size': {
							if (cmdBaseArgs.length > 3) {
								showCommandHelp('cache');
							}
							let size = cmdBaseArgs[2];
							if (size === undefined) {
								if (appConfig.maxCacheSize === null) {
									log('Cache size limit: none');
								} else {
									log(`Cache size limit: ${filesize(appConfig.maxCacheSize, { standard: "iec" })}`);
								}
							} else if (/^\d+$/.test(size)) {
								appConfig.maxCacheSize = parseInt(size);

								if (isFinite(appConfig.maxCacheSize)) {
									appConfig.maxCacheSize *= 1048576;
								}
								if (!isFinite(appConfig.maxCacheSize)) {
									appConfig.maxCacheSize = null;
								}
								storeAppConfig();
								log('New max cache size set');
							} else if (size === 'none') {
								appConfig.maxCacheSize = null;
								storeAppConfig();
								log('Cache size limit annulled');
							} else {
								log('Invalid new max cache size');
							}
						}
					}
					process.exit();
				}
			}
				break;
			case 'version':
				let varg = cmdBaseArgs[1];

				if (varg === undefined) {
					let packageType = getPackageType(package, true);

					if (packageType === 'user') {
						die(`BJSPM v${version}, ${getUserPackageSid()}`);
					} else {
						die(`BJSPM v${version}`);
					}
				}
				if (!existsAsFile(packageJsonPath)) {
					die('No package file; please run "bjspm init" first');
				}
				if (semverValid(varg) !== null) {
					if (package.version.length !== 0 && !semverGt(varg, package.version)) {
						die(`New version must be greater than current version (${package.version})`);
					}
					package.version = varg;
					storePackage();
					die(`v${package.version}`);
				} else {
					let preid = undefined;
					if (conf === cmdConfig['preid']) {
						preid = conf[0];
					}
					let arr = ['major', 'minor', 'patch', 'premajor', 'preminor', 'prepatch', 'prerelease'];
					if (arr.indexOf(varg) === -1) {
						showCommandHelp('version');
					}
					let newVersion = semverInc(package.version, varg, preid);
					if (newVersion !== null) {
						package.version = newVersion;
						storePackage();
						die(`v${package.version}`);
					} else {
						die(panickMsg);
					}
				}
				break;
			case 'list':
			case 'll':
			case 'la':
			case 'ls':
				if (cmdBaseArgs.length > 1) {
					showCommandHelp('ls');
				}
				let json = false;
				if (conf = cmdConfig['json']) {
					json = getConfigBool(conf[0]);
				}
				if (!json) {
					if (package.sid.length !== 0) {
						log(package.sid, process.cwd());
					} else {
						let packageType = getPackageType(package, true);

						if (packageType === 'user') {
							log(getUserPackageSid(), process.cwd());
						} else {
							log(process.cwd());
						}
					}
				}
				if (package.dependencies.length === 0) {
					if (!json) {
						die('`-- (empty)\n');
					} else {
						die(JSON.stringify(package, undefined, 2) + '\n');
					}
				}
				let maxDepth = Infinity;
				if (conf = cmdConfig['depth']) {
					if (conf[0] === undefined) {
						maxDepth = 1;
					} else {
						maxDepth = parseInt(conf[0]);

						if (isNaN(maxDepth) || maxDepth < 0) {
							maxDepth = Infinity;
						}
					}
				}
				if (json) {
					let addDependencies = (package, depth, branch, dependenciesCache, callback) => {
						if (depth > maxDepth) {
							callback();
							return;
						}
						let addToBranch = (dependencies) => {
							for (let i = 0; i < dependencies.length; i++) {
								let dependency = dependencies[i];
								let obj = {
									type: dependency.type,
									dependencies: {}
								};
								if (dependency.type === 'user' && dependency.package !== null) {
									obj.version = dependency.package.version;
								}
								branch[dependency.id] = obj;

								if (dependency.package !== null) {
									addDependencies(dependency.package, depth + 1, obj.dependencies, dependenciesCache, callback);
								} else {
									if (i === dependencies.length - 1) {
										callback();
									}
								}
							}
						};
						if (dependenciesCache[package.sid] !== undefined) {
							addToBranch(dependenciesCache[package.sid], callback);
						} else {
							getDependencies(package, (dependencies) => {
								dependenciesCache[package.sid] = dependencies;
								addToBranch(dependencies, callback);
							}, false);
						}
					}
					let obj = {};
					addDependencies(package, 0, obj, {}, () => {
						die(JSON.stringify({ dependencies: obj }, undefined, 2) + '\n');
					});
				} else {
					let listDependencies = (package, depth, dependenciesCache, callback) => {
						if (depth > maxDepth) {
							callback();
							return;
						}
						let listPackages = (dependencies, callback) => {
							for (let i = 0; i < dependencies.length; i++) {
								let dependency = dependencies[i];
								let prefix = '';
								for (let j = 0; j < depth; j++) {
									prefix += '| ';
								}
								if (dependency.package !== null) {
									if (!(i === 0 && depth === 0) && i === dependencies.length - 1) {
										log(`${prefix}\`-- ${dependency.package.sid}`);
									} else {
										log(`${prefix}+-- ${dependency.package.sid}`);
									}
									listDependencies(dependency.package, depth + 1, dependenciesCache, callback);
								} else {
									if (i === dependencies.length - 1) {
										log(`${prefix}\`-- ${dependency.id}`);
										callback();
									} else {
										log(`${prefix}+-- ${dependency.id}`);
									}
								}
							}
						};
						if (dependenciesCache[package.sid] !== undefined) {
							listPackages(dependenciesCache[package.sid], callback);
						} else {
							getDependencies(package, (dependencies) => {
								dependenciesCache[package.sid] = dependencies;
								listPackages(dependencies, callback);
							}, false);
						}
					}
					listDependencies(package, 0, {}, () => {
						die();
					});
				}
				break;
			case 'c':
			case 'config': {
				let listConfigParams = (config = appConfig) => {
					die(JSON.stringify(config, undefined, 2));
				};
				switch (cmdBaseArgs[1]) {
					case 'get': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('config');
						}
						let param = cmdBaseArgs[2];

						if (param === undefined) {
							listConfigParams();
						}
						die(appConfig[param]);
					}
						break;
					case 'set': {
						if (cmdBaseArgs.length > 4) {
							showCommandHelp('config');
						}
						let param = cmdBaseArgs[2];
						let value = cmdBaseArgs[3];

						if (param === undefined || value === undefined) {
							showCommandHelp('config');
						}
						try {
							appConfig[param] = JSON.parse(value);
						} catch (e) {
							appConfig[param] = value;
						}
						storeAppConfig();
						die(`${param} = ${JSON.stringify(appConfig[param])}`);
					}
						break;
					case 'delete': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('config');
						}
						let param = cmdBaseArgs[2];

						if (!(param in appConfig)) {
							die(`Parameter not set`);
						}
						delete appConfig[param];
						storeAppConfig();
						process.exit();
					}
						break;
					case 'ls':
					case 'list': {
						if (cmdBaseArgs.length > 2) {
							showCommandHelp('config');
						}
						let config = appConfig;
						if (conf = cmdConfig['long']) {
							if (getConfigBool(conf[0])) {
								config = getDefaultAppConfig();
							}
						}
						listConfigParams(config);
					}
						break;
					case 'reset': {
						if (cmdBaseArgs.length > 3) {
							showCommandHelp('config');
						}
						let param = cmdBaseArgs[2];
						if (param !== undefined) {
							let defaultAppConfig = getDefaultAppConfig();

							if (!(param in defaultAppConfig)) {
								die(`Parameter not in defaults`);
							}
							appConfig[param] = defaultAppConfig[param];
							storeAppConfig();
							die(`${param} = ${JSON.stringify(appConfig[param])}`);
						} else {
							appConfig = getDefaultAppConfig();
							storeAppConfig();
							die('App config reset to default');
						}
					}
						break;
					default:
						showCommandHelp('config');
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
					die(obj);
				});
			}
				break;
			case 'reset': {
				apiPost({
					action: 'wipe'
				}, (obj) => {
					package.version = '1.0.0';
					package.sid = '';
					storePackage();

					if (fs.existsSync(filePathsPath)) {
						fs.unlinkSync(filePathsPath);
					}
					die('Package reset', obj);
				});
			}
				break;
			case 'test':
				die([isValidPackageName(''), isValidPackageVersion(''), isValidPackageUsername('')]);
				break;
			default:
				showQuickHelp();
		}
	}
});

function _onGotError(err) {
	if (!err.response) {
		die(panickMsg, err);
	} else {
		switch (err.response.statusCode) {
			case 410:
				die(`Server error: 410 Gone`);
				break;
			case 404:
				die(`Server error: 404 Not Found`);
				break;
			case 403:
				die(`Server error: 403 Forbidden`);
				break;
			case 413:
				die(`Server error: 413 Request Entity Too Large`);
				break;
			case 500:
				die(`Server error: 500 Internal Server Error`);
				break;
			default:
				die(`Server error: ${err.response.statusCode}`);
				break;
		}
	}
}

function log(...args) {
	console.log.apply(this, args);
}

function die(...args) {
	console.log.apply(this, args);
	process.exit();
}

function getArgsConfig(args, singletons) {
	let config = {
		[baseArgs]: []
	};
	let activeKey = null;
	for (let i = 0; i < args.length; i++) {
		let arg = args[i];
		switch (arg) {
			case '-v':
				arg = '--version';
				break;
			case '-h':
			case '-?':
			case '-help':
			case '-H':
				arg = '--usage';
				break;
			case '-f':
				arg = '--force';
				break;
			case '-l':
				arg = '--long';
				break;
			case '--':
				activeKey = null;
				continue;
		}
		if (arg.startsWith('-')) {
			if (/^-{1,2}\d+$/.test(arg)) {
				if (activeKey !== null) {
					config[activeKey].push(arg);
				} else {
					config[baseArgs].push(arg);
				}
				continue;
			}
			let split = arg.substr(arg.startsWith('--') ? 2 : 1).toLowerCase().split('=');
			let key = split[0];

			if (key in config) {
				continue;
			}
			if (split[1] !== undefined) {
				config[key] = [split[1]];
				activeKey = null;
			} else {
				config[key] = [];

				if (singletons.indexOf(key) === -1) {
					activeKey = key;
				} else {
					activeKey = null;
				}
			}
		} else {
			if (activeKey !== null) {
				config[activeKey].push(arg);
			} else {
				config[baseArgs].push(arg);
			}
		}
	}
	return config;
}

function promptRequiredReading(callback) {
	let storedRequiredReading = getStoredRequiredReading();
	let expiry = 86400000;

	if (storedRequiredReading.completed && Date.now() - storedRequiredReading.updated < expiry) {
		callback();
		return;
	}
	getRequiredReading((requiredReading) => {
		let names = Object.keys(requiredReading.library);
		let nameIndex = 0;
		let flush = false;
		let hasRead = {
			updated: Date.now(),
			library: storedRequiredReading.library
		};

		let finalize = (ok = true) => {
			if (flush) {
				if (Date.now() - requiredReading.time >= expiry) {
					process.exit();
				}
				hasRead.completed = ok;

				let json = JSON.stringify(hasRead, undefined, 2);

				mksubdirSync(requiredReadingStore);
				fs.writeFileSync(requiredReadingStore, json, 'utf8');
			}
			if (ok) {
				callback();
			} else {
				process.exit();
			}
		};

		let next = () => {
			let name = names[nameIndex++];

			if (name === undefined) {
				finalize();
				return;
			}
			let mustRead = false;
			let { version, url } = requiredReading.library[name];

			if (!(name in storedRequiredReading.library)) {
				mustRead = true;
			} else {
				let stored = storedRequiredReading.library[name];
				let storedVersionSplit = stored.version.split('.').map(s => parseInt(s));
				let versionSplit = version.split('.').map(s => parseInt(s));

				if (storedVersionSplit[0] < versionSplit[0] || storedVersionSplit[1] < versionSplit[1]) {
					mustRead = true;
				}
			}
			if (mustRead) {
				let prompt = `To use BJSPM, you must have fully read and accepted version ${version} of the ${name}, which can be found at:\n${url}\n\nHave you done so? (y/n) `;

				readline.question(prompt, (answer) => {
					switch (answer.toLowerCase()) {
						case 'y':
						case 'yes':
							flush = true;
							hasRead.library[name] = requiredReading.library[name];
							next();
							break;
						default:
							finalize(false);
							break;
					}
				});
			} else {
				hasRead.library[name] = requiredReading.library[name];
				next();
			}
		};
		next();
	});
}

function download(url, filename, onProgress, callback, onGotError = _onGotError) {
	const file = fs.createWriteStream(filename);
	let res;
	try {
		res = got.stream(url);
	} catch (err) {
		onGotError(err);
	}
	res.on('downloadProgress', (progress) => {
		if (progress.total === undefined) {
			onProgress({
				bytesReceived: progress.transferred
			});
		} else {
			onProgress({
				bytesReceived: progress.transferred,
				bytesTotal: progress.total,
				percentage: progress.percent
			});
		}
	});

	stream.pipeline(res, file, (err) => {
		if (err) {
			fs.unlinkSync(filename);
			return callback(err.message);
		}
		file.close(callback);
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

async function apiPost(formData, callback, onError) {
	const form = new FormData();

	for (let key in formData) {
		if (formData[key] !== null && formData[key] !== undefined) {
			switch (typeof formData[key]) {
				case 'boolean': {
					form.append(key, formData[key] ? '1' : '0');
				}
					break;
				case 'string': {
					form.append(key, formData[key]);
				}
					break;
				case 'object': {
					if (formData[key] instanceof fs.ReadStream) {
						form.append(key, formData[key]);
					} else {
						form.append(key, JSON.stringify(formData[key]));
					}
				}
					break;
			}
		}
	}
	form.append('cli_version', version);

	try {
		const { body } = await got.post(`https://${appConfig.registry}/api.php`, {
			body: form
		});
		try {
			let obj = JSON.parse(body);

			if (obj.error) {
				if (onError !== undefined) {
					onError();
				} else {
					die('Server error:', obj.error);
				}
			}
			callback(obj);
		} catch (e) {
			if (onError !== undefined) {
				onError();
			} else {
				die(e, body);
			}
		}
	} catch (err) {
		if (onError !== undefined) {
			onError();
		} else {
			_onGotError(err);
		}
	}
}

async function getJson(url, callback, onGotError = _onGotError) {
	try {
		const { body } = await got.get(url);
		try {
			let obj = JSON.parse(body);
			if (obj.error) {
				die('Server error:', obj.error);
			}
			callback(obj);
		} catch (e) {
			die('Server error:', body);
		}
	} catch (err) {
		onGotError(err);
	}
}

function getPackageAvailability(packageBaseId, callback) {
	apiPost({
		action: 'GET_PACKAGE_AVAILABILITY',
		package: packageBaseId,
	}, (obj) => {
		callback(obj.availability);
	});
}

function getPackageBaseAvailability(packageBaseId, callback) {
	apiPost({
		action: 'GET_PACKAGE_BASE_AVAILABILITY',
		bsid: packageBaseId,
	}, (obj) => {
		callback(obj.availability);
	});
}

function checkPackageAvailability(packageId, callback, logAndExitOnUnavailable = true) {
	getPackageAvailability(packageId, (availability) => {
		switch (availability) {
			case 'public':
				callback('public');
				break;
			case 'private':
				callback('private');
				break;
			case 'nonexistent':
				if (logAndExitOnUnavailable) {
					die('ERROR: package does not exist');
				} else {
					callback('nonexistent');
				}
				break;
			case 'deleted_permanently':
			case 'deleted':
				if (logAndExitOnUnavailable) {
					die('ERROR: this package has been deleted');
				} else {
					callback('deleted');
				}
				break;
			default:
				die('ERROR: unexpected server response');
		}
	});
}

function checkPackageBaseAvailability(packageId, callback, logAndExitOnUnavailable = true) {
	getPackageBaseAvailability(packageId, (availability) => {
		switch (availability) {
			case 'public':
				callback('public');
				break;
			case 'private':
				callback('private');
				break;
			case 'nonexistent':
				if (logAndExitOnUnavailable) {
					die('ERROR: package does not exist');
				} else {
					callback('nonexistent');
				}
				break;
			case 'deleted_permanently':
			case 'deleted':
				if (logAndExitOnUnavailable) {
					die('ERROR: this package has been deleted');
				} else {
					callback('deleted');
				}
				break;
			default:
				die('ERROR: unexpected server response');
		}
	});
}

function getPackageAccessListUser(user, callback) {
	apiPost({
		action: 'GET_PACKAGE_ACCESS_LIST_USER',
		user: user
	}, (obj) => {
		callback(obj.permissions);
	});
}

function getPackageCollaborators(packageBaseId, user, callback, authToken) {
	apiPost({
		action: 'GET_PACKAGE_COLLABORATORS',
		authToken: authToken,
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

function unpublishPackage(packageBaseId, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'UNPUBLISH_PACKAGE',
			authToken: authToken,
			tmpToken: tmpToken,
			package: packageBaseId
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

function setPackageTags(packageId, tags, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'SET_PACKAGE_TAGS',
			authToken: authToken,
			tmpToken: tmpToken,
			package: packageId,
			tags: JSON.stringify(tags)
		}, callback);
	});
}

function deletePackageTags(packageId, tags, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'DELETE_PACKAGE_TAGS',
			authToken: authToken,
			tmpToken: tmpToken,
			package: packageId,
			tags: JSON.stringify(tags)
		}, callback);
	});
}

function getUserPackagePermissions(packageId, authToken, callback, defaultToAllGranted = false) {
	apiPost({
		action: 'GET_GRANTED_PERMISSIONS',
		package: packageId,
		authToken: authToken,
		grant: defaultToAllGranted
	}, (obj) => {
		callback(obj.permissions);
	});
}

function getAuthTokenWithPackagePermissions(packageId, permissions, callback, defaultToAllGranted = false, doPrompt = false, promptUsername) {
	if (doPrompt) {
		getAuthTokenWithPackagePermissions(packageId, permissions, (token) => {
			if (token === null) {
				if (typeof promptUsername === 'function') {
					promptUsername = promptUsername();
				}
				if (promptUsername === undefined) {
					promptUsername = getPromptUsername(packageId);
				}
				log(credentialsMsg);
				pollUsername((username) => {
					getAuthToken(username, () => {
						getAuthTokenWithPackagePermissions(packageId, permissions, callback, defaultToAllGranted, false);
					}, false);
				}, promptUsername);
			} else {
				callback(token);
			}
		}, defaultToAllGranted);
		return;
	}
	let packageBsid = getPackageBsidFromSid(packageId);
	let tokens = [];

	if (packageBsid.indexOf('/') !== -1) {
		let username = packageBsid.split('/')[0];
		if (authTokens[username] !== undefined) {
			tokens.push(authTokens[username]);
		}
	}
	if (appConfig.username !== null && authTokens[appConfig.username] !== undefined) {
		tokens.push(authTokens[appConfig.username]);
	}
	for (let username in authTokens) {
		let authToken = authTokens[username];
		if (tokens.indexOf(authToken) === -1) {
			tokens.push(authToken);
		}
	}
	let i = 0;
	let iterate = () => {
		let token = tokens[i++];
		if (token === undefined) {
			callback(null);
			return;
		}
		getUserPackagePermissions(packageBsid, token, (permissionsObj) => {
			for (let permission of permissions) {
				if (!permissionsObj[permission]) {
					iterate();
					return;
				}
			}
			callback(token);
		}, defaultToAllGranted);
	};
	iterate();
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

function getChallenge(callback) {
	apiPost({
		action: 'GET_CHALLENGE'
	}, (obj) => {
		callback(obj.challenge);
	});
}

function getSolvedChallenge(callback) {
	getChallenge((challenge) => {
		for (let suffix = 0; suffix <= challenge.max; suffix++) {
			let hash = getHash(`${challenge.prefix}_${suffix}`, 'md5');

			if (hash === challenge.hash) {
				challenge.suffix = suffix;
				callback(challenge);
				return;
			}
		}
		callback(null);
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

function getRequiredReading(callback) {
	apiPost({
		action: 'GET_REQUIRED_READING'
	}, (obj) => {
		callback(obj.requiredReading);
	});
}

function getPackageDownloadUrls(packageId, callback, authToken, patch) {
	apiPost({
		action: 'GET_PACKAGE_DOWNLOAD_URLS',
		authToken: authToken,
		package: packageId,
		patch: patch
	}, (obj) => {
		callback(obj.urls);
	});
}

function getPackageChecksums(packageId, callback, authToken, patch) {
	let cachekey = packageId + (patch === undefined ? '' : patch);
	if (packageChecksumsCache[cachekey] !== undefined) {
		callback(packageChecksumsCache[cachekey]);
		return;
	}
	apiPost({
		action: 'GET_PACKAGE_CHECKSUMS',
		authToken: authToken,
		package: packageId,
		patch: patch
	}, (obj) => {
		packageChecksumsCache[cachekey] = obj.checksums;
		callback(obj.checksums);
	});
}

function resolvePackageSid(id, callback, authToken) {
	apiPost({
		action: 'RESOLVE_PACKAGE_SID',
		authToken: authToken,
		id: id
	}, (obj) => {
		callback(obj.sid);
	}, authToken === undefined ? undefined : () => {
		return id;
	});
}

function isRegisteredPackageSid(sid, callback) {
	apiPost({
		action: 'PACKAGE_SID_EQUALS',
		package: sid,
		str: sid
	}, (obj) => {
		callback(obj.result);
	});
}

function getAppDataPackagePath(packageId, patch) {
	let fileNameHash = getHash(packageId + patch, 'md5');
	let filePath = path.resolve(appConfig.packageCachePath, fileNameHash + '.zip');

	return filePath;
}

function getUserPackageSid(pk = package) {
	return `${pk.username}/${pk.name}@${pk.version}`;
}

function getUserPackageBsid(pk = package) {
	return `${pk.username}/${pk.name}`;
}

function increasePackageVersionIfSame() {
	if (package.sid.length === 0) {
		return false;
	}
	let pubVersion = package.sid.split('@')[1];
	if (pubVersion !== undefined && pubVersion === package.version) {
		let newVersion;
		if (semverPrerelease(package.version) === null) {
			newVersion = semverInc(package.version, 'patch');
		} else {
			newVersion = semverInc(package.version, 'prerelease');
		}
		package.version = newVersion;
		storePackage();
		return true;
	} else {
		return false;
	}
}

function getPackageBsid(pk = package, ignoreSid = false) {
	if (!ignoreSid && pk.sid.length !== 0) {
		return getPackageBsidFromSid(pk.sid);
	}
	if (getPackageType(pk, ignoreSid) === 'user') {
		return getUserPackageBsid(pk);
	} else {
		return pk.sid;
	}
}

function getPackageBsidFromSid(sid) {
	if (getPackageTypeFromSid(sid) === 'user') {
		let matches = sid.match(regexInstallUser);
		let user = matches[1];
		let packageName = matches[2];

		return `${user}/${packageName}`;
	} else {
		return sid;
	}
}

function getMajorInstallId(installId) {
	if (regexUserMajor.test(installId)) {
		return installId;
	}
	if (installId.indexOf('/') !== -1) {
		let matches = installId.match(regexInstallUser);
		let user = matches[1];
		let packageName = matches[2];
		let packageVersion = regexMajorVersion.test(matches[3]) ? matches[3] : (isValidPackageVersion(matches[3]) ? semverMajor(matches[3]) : null);

		if (packageVersion === null) {
			return null;
		}
		return `${user}/${packageName}${packageVersion}`;
	} else {
		return installId;
	}
}

function getInstallDirFromInstallId(installId, baseDir = packagesPath) {
	if (!isValidSemiSpecificPackageId(installId)) {
		return null;
	}
	if (installId.indexOf('/') !== -1) {
		let matches = installId.match(regexInstallUser);
		let user = matches[1];
		let packageName = matches[2];
		let packageVersion = regexMajorVersion.test(matches[3]) ? matches[3] : semverMajor(matches[3]);

		return path.resolve(baseDir, `${user}`, `${packageName}${packageVersion}`);
	} else {
		return path.resolve(baseDir, installId);
	}
}

function getPackageFromInstallId(installId, callback, baseDir) {
	let packageDir = getInstallDirFromInstallId(installId, baseDir);

	if (packageDir === null) {
		return null;
	}
	let packageFile = path.resolve(packageDir, 'bjspm', 'package.json');

	if (fs.existsSync(packageFile)) {
		return loadJsonFile(packageFile, callback);
	} else {
		if (callback !== undefined) {
			callback(null);
		}
		return null;
	}
}

function isPackageInstalled(installId, baseDir) {
	let packageDir = getInstallDirFromInstallId(installId, baseDir);

	return fs.existsSync(packageDir);
}

function isPackageInstalledForSure(installId, baseDir) {
	let package = getPackageFromInstallId(installId, undefined, baseDir);

	if (package === null) {
		return false;
	}
	let packageType = getPackageTypeFromSid(installId);

	if (packageType === 'user') {
		if (regexUserMajor.test(installId)) {
			return installId === getMajorInstallId(package.sid);
		} else {
			return installId === package.sid;
		}
	} else {
		return installId === package.sid;
	}
}

function getDependencies(package, callback, getSubDependencies = true, dependencies = []) {
	let index = 0;
	let iterate = () => {
		let dependency = package.dependencies[index++];
		if (dependency === undefined) {
			callback(dependencies);
			return;
		}
		if (dependencies[dependency] !== undefined) {
			dependencies[dependency].refCount++;
			iterate();
		} else {
			let packageType = getPackageTypeFromSid(dependency);
			getPackageFromInstallId(dependency, (pk) => {
				let dependencyObj = {
					id: dependency,
					dir: getInstallDirFromInstallId(dependency),
					package: pk,
					type: packageType,
					refCount: 1
				}
				dependencies[dependency] = dependencyObj;
				dependencies.push(dependencyObj);
				if (pk !== null && getSubDependencies) {
					getDependencies(pk, () => {
						iterate();
					}, getSubDependencies, dependencies);
				} else {
					iterate();
				}
			});
		}
	};
	iterate();
}

function getRawDependencies(package, callback, getSubDependencies) {
	getDependencies(package, (dependencies) => {
		callback(Object.keys(dependencies).slice(dependencies.length));
	}, getSubDependencies);
}

function existsAsFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return false;
	}
	return isFile(filePath);
}

function isFile(filePath) {
	let stats = fs.statSync(filePath);
	return stats.isFile();
}

function existsAsDirectory(filePath) {
	if (!fs.existsSync(filePath)) {
		return false;
	}
	return isDirectory(filePath);
}

function isDirectory(filePath) {
	let stats = fs.statSync(filePath);
	return stats.isDirectory();
}

function installPackage(packageId, folder, dlType, callback, save = false, force = false, update = false, noteVersion = false) {
	if (!isValidPackageSid(packageId)) {
		callback(null, 'invalid_id');
		return;
	}
	let authToken = undefined;
	let proceed = () => {
		if (noteVersion) {
			let suffix = appConfig.logDownloadProgress ? '' : '\n';

			log(`Note: only the package's major version will be saved to the dependencies list${suffix}`);
		}
		let packageBaseId = null;

		if (packageId.indexOf('/') !== -1) {
			let matches = packageId.match(regexInstallUser);
			let user = matches[1];
			let packageName = matches[2];
			let packageVersion = matches[3];
			packageBaseId = `${user}/${packageName}`;

			getPackageVersions(packageBaseId, (versions) => {
				if (versions.length === 0) {
					die(`Cannot install "${packageId}" – no package versions found`);
				}
				let proceed = () => {
					let versionMajor = semverMajor(packageVersion);
					let dependency = `${user}/${packageName}${versionMajor}`;

					let saveDependency = () => {
						if (save && package.dependencies.indexOf(dependency) === -1) {
							package.dependencies.push(dependency);
							storePackage();
							return true;
						}
						return false;
					};
					getPackageFromInstallId(dependency, (pk) => {
						let targetPath = path.resolve(folder || packagesPath, `${user}`, `${packageName}${versionMajor}`);
						let proceed = () => {
							let downloadId = `${packageBaseId}@${packageVersion}`;

							installPackageChain(downloadId, dlType, targetPath, (filepath, installed) => {
								saveDependency();
								callback({ filepath: filepath, version: packageVersion });
							}, authToken, force);
						};
						if (pk === null) {
							if (!update && !force && fs.existsSync(targetPath)) {
								callback(null, 'dir_exists', dependency);
								return;
							}
							proceed();
						} else if (!force && packageVersion === pk.version) {
							if (update) {
								installPackageDependencies(dlType, targetPath, (filepath, installed) => {
									if (installed === 0) {
										callback(null, 'no_update');
									} else {
										callback({ filepath: filepath, version: packageVersion });
									}
								}, force, true);
							} else {
								callback(null, 'same_version', dependency);
							}
						} else {
							proceed();
						}
					}, folder ? folder : undefined);
				};
				if (isValidRangeOnly(packageVersion)) {
					let highestMatch = semverMaxSatisfying(versions, packageVersion);

					if (highestMatch === null) {
						die(`Cannot install "${packageId}" – version range does not match any available version`);
					} else {
						packageVersion = highestMatch;
					}
					installPackage(`${packageBaseId}@${packageVersion}`, folder, dlType, callback, save, force, update);
				} else {
					resolvePackageSid(packageId, (sid) => {
						packageVersion = sid.split('@')[1];
						proceed();
					}, authToken);
				}
			}, authToken);
		} else {
			packageBaseId = packageId;

			let saveDependency = () => {
				if (save && package.dependencies.indexOf(packageBaseId) === -1) {
					package.dependencies.push(packageBaseId);
					storePackage();
					return true;
				}
				return false;
			};
			getPackageFromInstallId(packageBaseId, (pk) => {
				let targetPath = path.resolve(folder || packagesPath, packageBaseId);
				let proceed = () => {
					installPackageChain(packageBaseId, dlType, targetPath, (filepath, installed) => {
						saveDependency();
						callback({ filepath: filepath });
					}, authToken, force);
				};
				if (pk === null) {
					if (!force && fs.existsSync(targetPath)) {
						callback(null, 'dir_exists', packageBaseId);
						return;
					}
					proceed();
				} else if (!force) {
					if (update) {
						installPackageDependencies(dlType, targetPath, (filepath, installed) => {
							if (installed === 0) {
								callback(null, 'no_update');
							} else {
								callback({ filepath: filepath });
							}
						}, force, true);
					} else {
						callback(null, 'same_version', packageBaseId);
					}
				} else {
					proceed();
				}
			}, folder ? folder : undefined);
		}
	};
	let checkAvailability = () => {
		checkPackageAvailability(packageId, (availability) => {
			switch (availability) {
				case 'public':
					proceed();
					break;
				case 'deleted_permanently':
				case 'deleted':
					log(`ERROR: Package "${packageId}" has been deleted`);
					callback(null);
					break;
				case 'nonexistent':
					log(`ERROR: Package "${packageId}" does not exist`);
					callback(null);
					break;
				default:
					getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
						if (token === null) {
							log(`Please enter your Croncle.com account credentials to install "${packageId}"`);
							pollUsername((username) => {
								getAuthToken(username, (token) => {
									authToken = token;
									proceed();
								}, false);
							});
						} else {
							authToken = token;
							proceed();
						}
					});
			}
		}, false);
	};
	let checkBaseAvailability = () => {
		let packageBaseId = getPackageBsidFromSid(packageId);

		checkPackageBaseAvailability(packageBaseId, (availability) => {
			switch (availability) {
				case 'public':
					proceed();
					break;
				case 'deleted_permanently':
				case 'deleted':
					log(`ERROR: Package tree "${packageBaseId}" has been deleted`);
					callback(null);
					break;
				case 'nonexistent':
					log(`ERROR: Package tree "${packageBaseId}" does not exist`);
					callback(null);
					break;
				default:
					getAuthTokenWithPackagePermissions(packageBaseId, ['mayRead'], (token) => {
						if (token === null) {
							log(`Please enter your Croncle.com account credentials to install from "${packageBaseId}"`);
							pollUsername((username) => {
								getAuthToken(username, (token) => {
									authToken = token;
									proceed();
								}, false);
							});
						} else {
							authToken = token;
							proceed();
						}
					});
			}
		}, false);
	};
	if (packageId.indexOf('/') !== -1) {
		let matches = packageId.match(regexInstallUser);
		let packageVersion = matches[3];

		if (isValidRangeOnly(packageVersion)) {
			checkBaseAvailability();
		} else {
			checkAvailability();
		}
	} else {
		checkAvailability();
	}
}

function installPackageDependencies(dlType, targetPath, callback, force = false, update = false) {
	let installed = 0;
	let packageFile = path.resolve(targetPath, 'bjspm', 'package.json');

	if (fs.existsSync(packageFile)) {
		loadJsonFile(packageFile, (obj) => {
			if (obj !== null) {
				let packageType = getPackageType(obj);
				let basePath = path.resolve(targetPath, packageType === 'user' ? '../../' : '../');

				if (obj.dependencies !== undefined) {
					let i = 0;
					let installNext = () => {
						if (i === obj.dependencies.length) {
							callback(targetPath, installed);
							return;
						}
						let dependency = obj.dependencies[i++];
						installPackage(`${dependency}`, basePath, dlType, (result) => {
							if (result !== null) {
								installed++;
							}
							installNext();
						}, false, force, update);
					};
					installNext();
				}
			}
		});
	} else {
		callback(targetPath, installed);
	}
}

function installPackageChain(packageId, dlType, targetPath, callback, authToken, force = false, update = false) {
	downloadPackage(packageId, dlType, targetPath, (targetPath) => {
		installPackageDependencies(dlType, targetPath, callback, force, update);
	}, authToken);
}

function deleteDirectory(path, callback) {
	rimraf(path, { disableGlob: true }, callback);
}

function getPackageCacheSize() {
	let files = fs.existsSync(appConfig.packageCachePath) ? fs.readdirSync(appConfig.packageCachePath).filter(file => file.endsWith('.zip')) : [];
	let filePaths = [];
	let totalSize = 0;

	for (let file of files) {
		let filePath = path.resolve(appConfig.packageCachePath, file);
		let stat = fs.statSync(filePath);
		totalSize += stat.size;
		filePaths.push(filePath);
	}
	return totalSize;
}

function isCacheFull() {
	if (appConfig.maxCacheSize === null) {
		return false;
	}
	let size = getPackageCacheSize();
	return size > appConfig.maxCacheSize;
}

function isPackageInCache(packageId) {
	let zipPath = getAppDataPackagePath(packageId);
	
	return fs.existsSync(zipPath);
}

function downloadPackage(packageId, dlType, targetPath, callback, authToken, urlIndex = 0, patchFrom = undefined) {
	mkdirSync(appConfig.packageCachePath);

	let packageType = getPackageTypeFromSid(packageId);
	let patchFiles;
	let patch;
	let patchSID = undefined;
	let basePath = path.resolve(targetPath, packageType === 'user' ? '../../' : '../');

	if (patchFrom === undefined) {
		let currentPackage = getPackageFromInstallId(packageId, undefined, basePath);

		if (currentPackage !== null && packageId !== currentPackage.sid) {
			patchFrom = currentPackage.sid;
		}
	}

	getPackageDownloadUrls(packageId, (urls) => {
		let urlArray = urls[urlIndex];
		if (urlArray === undefined) {
			die("The package archive could not be downloaded.");
		}
		patchSID = urlArray.patch;
		let zipPath = getAppDataPackagePath(urlArray.base, patchFrom);
		let cls = () => {
			if (isCacheFull()) {
				fs.unlinkSync(zipPath);
			}
		};
		getPackageChecksums(packageId, (checksums) => {
			let onInstalled = () => {
				cls();
				if (patchSID === undefined) {
					onPackageInstalled(packageId, basePath);
				}
				callback(targetPath);
			};
			let onDownloaded = (checkIntegrity) => {
				let onIntegrityCheckOK = () => {
					mkdirSync(targetPath);

					let extractDir;
					if (patchFrom === undefined) {
						if (appConfig.logInstallVerbose) {
							log('Extracting files from package archive...');
						}
						extractDir = targetPath;
					} else {
						if (appConfig.logInstallVerbose) {
							log('Extracting files from patch archive...');
						}
						extractDir = path.resolve(targetPath, 'tmp_' + randomBase36(16));
						fs.mkdirSync(extractDir);
					}
					extract(zipPath, { dir: extractDir }).then(() => {
						if (patchFrom !== undefined) {
							if (appConfig.logInstallVerbose) {
								log(`Applying patch...`);
							}
							let filePathsPath = path.resolve(targetPath, 'bjspm', 'files.json');
							loadJsonFile(filePathsPath, (prevFilePaths) => {
								getDirectoryFilesWithChecksum(targetPath, filesHashFunction, (entries) => {

									// Move one specimen of each currently existing file that has to be kept into the tmp dir
									for (let hash in patch.files) {
										let currentFiles = entries[hash] ? entries[hash].filter(f => !f.path.endsWith('/')) : [];
										let filePath = path.resolve(extractDir, hash);
										let currentFile = currentFiles[0];

										if (currentFile === undefined) {
											continue;
										}
										let currentFilePath = path.resolve(targetPath, currentFile.path);
										fs.renameSync(currentFilePath, filePath);
									}

									// Delete registered previous package files and directories outside the tmp dir, keep new ones
									if (prevFilePaths !== null) {
										for (let hash in prevFilePaths) {
											let leftoverFiles = prevFilePaths[hash];

											for (let file of leftoverFiles) {
												let filePath = path.resolve(targetPath, file);

												if (!fs.existsSync(filePath)) {
													continue;
												}
												let stats = fs.statSync(filePath);

												if (stats.isFile()) {
													let dir = path.dirname(filePath);

													fs.unlinkSync(filePath);

													let list = fs.readdirSync(dir);

													if (list.length === 0) {
														fs.rmdirSync(dir);
													}
												} else {
													let list = fs.readdirSync(filePath);

													if (list.length === 0) {
														fs.rmdirSync(filePath);
													}
												}
											}
										}
									}

									// Move/copy file specimens from tmp dir to target dir
									for (let hash in patch.files) {
										let targetFiles = patch.files[hash];
										let filePathFrom = path.resolve(extractDir, hash);

										for (let i = 0; i < targetFiles.length; i++) {
											let file = targetFiles[i];
											let filePathTo = path.resolve(targetPath, file);

											if (file.endsWith('/')) {
												mkdirSync(filePathTo);
											} else {
												if (!fs.existsSync(filePathFrom)) {
													continue;
												}
												mksubdirSync(filePathTo);

												if (i === targetFiles.length - 1) {
													fs.renameSync(filePathFrom, filePathTo);
												} else {
													fs.copyFileSync(filePathFrom, filePathTo);
												}
											}
										}
									}

									// Delete the tmp dir
									deleteDirectory(extractDir, () => {
										onInstalled();
									});
								});
							});
						} else {
							if (patchSID !== undefined) {
								downloadPackage(patchSID, dlType, targetPath, () => {
									onInstalled();
								}, authToken, 0, urlArray.base);
							} else {
								onInstalled();
							}
						}
					}, (err) => {
						log(panickMsg);
						console.trace();
						process.exit();
					});
				};
				if (checkIntegrity) {
					if (appConfig.logInstallVerbose) {
						if (patchFrom === undefined) {
							log(`Verifying package integrity...`);
						} else {
							log(`Verifying package patch integrity...`);
						}
					}
					getFileChecksum(zipPath, integrityHashFunction, (checksum) => {
						if (checksum !== checksums[dlType][integrityHashFunction]) {
							log(`Package integrity check failed`);
							log(`Deleting package archive...`);
							fs.unlinkSync(zipPath);
							die(`Aborted.`);
						} else {
							onIntegrityCheckOK();
						}
					});
				} else {
					onIntegrityCheckOK();
				}
			};
			if (fs.existsSync(zipPath)) {
				if (appConfig.logInstallVerbose) {
					if (patchFrom === undefined) {
						log(`\nPackage "${urlArray.base}" found in cache`);
						log(`Verifying package integrity...`);
					} else {
						log(`\nPackage patch "${patchFrom}" -> "${packageId}" found in cache`);
						log(`Verifying package patch integrity...`);
					}
				}
				getFileChecksum(zipPath, integrityHashFunction, (checksum) => {
					if (checksum !== checksums[dlType][integrityHashFunction]) {
						if (appConfig.logInstallVerbose) {
							log(`Integrity check failed, deleting package from cache...`);
							fs.unlinkSync(zipPath);
							log(`Downloading package...`);
						} else {
							fs.unlinkSync(zipPath);
						}
						downloadPackage(packageId, dlType, targetPath, callback, authToken, urlIndex, patchFrom);
					} else {
						if (patchFrom === undefined) {
							onDownloaded(false);
						} else {
							getPackageJson(packageId, (dlPackage) => {
								patch = dlPackage;
								onDownloaded(false);
							}, authToken, patchFrom);
						}
					}
				});
			} else {
				let url = urlArray[dlType];
				getPackageJson(urlArray.base, (dlPackage) => {
					let prefix = ' | ';
					let downloadIndex = 0;
					let rawTotalSize = 0;

					if (patchFrom === undefined) {
						for (let file of dlPackage.files) {
							rawTotalSize += file.size;
						}
					} else {
						for (let size of dlPackage.newFileSizes) {
							rawTotalSize += size;
						}
					}
					let sortedFiles;

					if (patchFrom === undefined) {
						sortedFiles = dlPackage.files.slice().sort((a, b) => a.size - b.size);
						if (rawTotalSize === 0) {
							let accumulatedSize = 0;
							for (let file of sortedFiles) {
								accumulatedSize += 1;
								file.atSizePercentage = accumulatedSize / sortedFiles.length;
							}
						} else {
							let accumulatedSize = 0;
							for (let file of sortedFiles) {
								accumulatedSize += file.size;
								file.atSizePercentage = accumulatedSize / rawTotalSize;
							}
						}
					} else {
						patchFiles = [];
						for (let i = 0; i < dlPackage.newFiles.length; i++) {
							patchFiles.push({
								index: dlPackage.newFiles[i],
								size: dlPackage.newFileSizes[i]
							});
						}
						patchFiles.sort((a, b) => a.size - b.size);
						sortedFiles = [];

						let accumulatedSize = 0;
						let checksums = Object.keys(dlPackage.files);
						for (let patchFile of patchFiles) {
							accumulatedSize += patchFile.size;
							sortedFiles.push({
								path: `${dlPackage.files[checksums[patchFile.index]][0]}`,
								atSizePercentage: accumulatedSize / rawTotalSize
							});
						}
						patch = dlPackage;
					}
					if (urlIndex === 0) {
						let prefix = appConfig.logDownloadProgress || appConfig.logInstallVerbose ? '\n' : '';

						if (patchFrom !== undefined) {
							log(`${prefix}Downloading package patch "${patchFrom}" -> "${packageId}" (${filesize(rawTotalSize, { standard: "iec" })})`);
						} else {
							log(`${prefix}Downloading package "${urlArray.base}" (${filesize(rawTotalSize, { standard: "iec" })})`);
						}
					}
					if (authToken !== undefined) {
						if (url.indexOf('?') !== -1) {
							url += `&authToken=${authToken}`;
						}
					}
					download(url, zipPath, appConfig.logDownloadProgress ? (status) => {
						if (status.percentage === undefined) {
							return;
						}
						for (let i = downloadIndex; i < sortedFiles.length; i++) {
							let file = sortedFiles[i];
							let percentageStr = Math.round(file.atSizePercentage * 100).toString();

							if (status.percentage >= file.atSizePercentage) {
								let padding = '';

								switch (percentageStr.length) {
									case 1:
										padding += '  ';
										break;
									case 2:
										padding += ' ';
								}
								log(`${padding}${percentageStr}%${prefix}${file.path}`);
								downloadIndex++;
							}
						}
					} : function () { }, (err) => {
						if (err) {
							if (!fs.existsSync(zipPath)) {
								if (urls.length > urlIndex + 1) {
									downloadPackage(packageId, dlType, targetPath, callback, authToken, urlIndex + 1, patchFrom);
								} else {
									log(panickMsg);
									console.trace();
									process.exit();
								}
							}
						} else {
							if (urlArray['regDl']) {
								registerPackageDownload(packageId);
							}
							onDownloaded(true);
						}
					});
				}, authToken, patchFrom, urlArray.baseDeleted ? '&ackDel' : '');
			}
		}, authToken, patchFrom);
	}, authToken, patchFrom);
}

function getConfigBool(str) {
	if (str === undefined || str === 'true') {
		return true;
	}
	return false;
}

function getPackageTags(packageId, callback, authToken) {
	if (packageTagsCache[packageId] !== undefined) {
		callback(packageTagsCache[packageId]);
		return;
	}
	let url = getWebPackagesPath() + packageId + '?tags' + (authToken ? `&authToken=${authToken}` : '');
	let _callback = (obj) => {
		packageTagsCache[packageId] = obj;
		callback(obj);
	};
	getJson(url, _callback);
}

function getPackageVersions(packageId, callback, authToken) {
	if (packageVersionsCache[packageId] !== undefined) {
		callback(packageVersionsCache[packageId]);
		return;
	}
	let url = getWebPackagesPath() + packageId + '?versions' + (authToken ? `&authToken=${authToken}` : '');
	let _callback = (obj) => {
		packageVersionsCache[packageId] = obj;
		callback(obj);
	};
	getJson(url, _callback);
}

function getPackageJson(packageId, callback, authToken, patch, suffix = '') {
	let url = getWebPackagesPath() + packageId + '?json' + (patch ? `&patch=${patch}` : '') + (authToken ? `&authToken=${authToken}` : '') + suffix;
	getJson(url, callback);
}

function getBjspmPackageJson(packageId, callback, authToken, onError) {
	let url = getWebPackagesPath() + packageId + '/bjspm/package.json' + (authToken ? `&authToken=${authToken}` : '');
	getJson(url, callback, onError);
}

function uploadPackage(path, fileData, authToken, type, access, tags, callback, patch) {
	if (patch === null) {
		log('Uploading package archive...');
	} else {
		log('Uploading package patch...');
	}
	getTmpToken(async () => {
		const form = new FormData();
		const formData = {
			action: 'UPLOAD_PACKAGE',
			authToken: authToken,
			tmpToken: tmpToken,
			package: fs.createReadStream(path),
			username: package.username,
			name: package.name,
			version: package.version,
			description: package.description,
			keywords: package.keywords.join(','),
			license: package.license,
			type: type,
			access: access,
			tags: JSON.stringify(tags),
			patch: patch !== null ? JSON.stringify(patch) : undefined,
			cli_version: version
		};
		for (let key in formData) {
			if (formData[key] !== null && formData[key] !== undefined) {
				form.append(key, formData[key]);
			}
		}
		try {
			let uploadIndex = 0;
			let prefix = ' | ';
			let toLog = fileData.totalSize > appConfig.logUploadThreshold * 1048576;
			let prevPercentage = -1;
			let skippedPercents = 0;

			const { body } = await got.post(`https://${appConfig.registry}/api.php`, {
				body: form
			}, (err) => {
				if (err) {
					callback({
						status: API_STATUS.ERR,
						error: err.toString()
					});
				}
			}).on('uploadProgress', progress => {
				if (progress.percent === undefined || !toLog) {
					return;
				}
				for (let i = uploadIndex; i < fileData.length; i++) {
					let file = fileData[i];
					if (progress.percent >= file.atSizePercentage) {
						let percentage = Math.round(progress.percent * 100);

						if (percentage === prevPercentage && !appConfig.logUploadVerbose) {
							skippedPercents++;
							uploadIndex++;
							continue;
						}
						prevPercentage = percentage;

						let percentageStr = percentage.toString();
						let padding = '';

						switch (percentageStr.length) {
							case 1:
								padding += '  ';
								break;
							case 2:
								padding += ' ';
						}
						log(`${padding}${percentageStr}%${prefix}${file.path}${skippedPercents === 0 ? '' : ` (+${skippedPercents})`}`);
						uploadIndex++;
					}
				}
				if (progress.percent === 1 && appConfig.logUploadVerbose) {
					log('Upload complete, waiting for server...');
				}
			});
			try {
				let obj = JSON.parse(body);
				callback(obj);
			} catch (err) {
				callback({
					status: API_STATUS.ERR,
					error: body
				});
			}
		} catch (err) {
			callback({
				status: API_STATUS.ERR,
				error: err.response.statusCode
			});
		}
	});
}

function uploadReadme(authToken, callback) {
	getTmpToken(() => {
		let readmePath = path.resolve(bjspmPath, 'readme.md');

		apiPost({
			action: 'UPDATE_PACKAGE_README',
			authToken: authToken,
			tmpToken: tmpToken,
			package: package.sid,
			readme: fs.createReadStream(readmePath)
		}, (obj) => {
			callback(obj);
		});
	});
}

function uploadPreviewImage(imgName, authToken, callback) {
	let imgPath = path.resolve(bjspmPath, imgName);

	getTmpToken(() => {
		apiPost({
			action: 'UPDATE_PACKAGE_PREVIEW_IMG',
			authToken: authToken,
			tmpToken: tmpToken,
			package: package.sid,
			img: fs.createReadStream(imgPath),
			ext: path.extname(imgPath).slice(1)
		}, (obj) => {
			callback(obj);
		});
	});
}

function uploadDescription(description, authToken, callback) {
	getTmpToken(() => {
		apiPost({
			action: 'UPDATE_PACKAGE_DESCRIPTION',
			authToken: authToken,
			tmpToken: tmpToken,
			package: package.sid,
			description: description
		}, (obj) => {
			callback(obj);
		});
	});
}

function getFileBaseName(file) {
	try {
		if (!existsAsFile(file)) {
			return null;
		}
		return path.basename(trueCasePathSync(file));
	} catch (e) {
		return null;
	}
}

function getDirectoryBaseName(dir) {
	try {
		if (!existsAsDirectory(dir)) {
			return null;
		}
		return path.basename(trueCasePathSync(dir));
	} catch (e) {
		return null;
	}
}

function updateFileChecksum(localPath, algorithm, callback, addIfDoesNotExist = false) {
	let absPath = path.resolve(cwdPath, localPath);

	if (!fs.existsSync(absPath)) {
		callback();
		return;
	}
	loadJsonFile(filePathsPath, (filePaths) => {
		if (filePaths === null) {
			callback();
			return;
		}
		let checksums = Object.keys(filePaths);

		for (let checksum of checksums) {
			let fp = filePaths[checksum];
			let index = fp.indexOf(localPath);

			if (index === -1) {
				continue;
			}
			fp.splice(index, 1);

			if (fp.length === 0) {
				delete filePaths[checksum];
			}
		}
		getFileChecksum(absPath, algorithm, (checksum) => {
			let finalize = (write) => {
				if (write) {
					let arr = filePaths[checksum] || [localPath];
					filePaths[checksum] = arr;

					let json = JSON.stringify(filePaths, undefined, 2);
					fs.writeFileSync(filePathsPath, json, 'utf8');
				}
				callback();
			};

			if (filePaths[checksum] === undefined) {
				finalize(addIfDoesNotExist);
			} else {
				finalize(true);
			}
		});
	});
}

function getFileChecksum(path, algorithm, callback) {
	try {
		let hash = crypto.createHash(algorithm);
		let stats = fs.statSync(path);

		if (stats.isDirectory()) {
			callback(hash.digest('hex'));
			return;
		}
		let stream = fs.createReadStream(path);

		stream.on('data', function (data) {
			hash.update(data, 'utf8');
		});

		stream.on('end', function () {
			callback(hash.digest('hex'));
		});
	} catch (e) {
		die(e);
	}
}

function getHash(str, algorithm) {
	return crypto.createHash(algorithm).update(str, 'utf8').digest('hex');
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
	return isString(name) && regexUsername.test(name);
}

function isValidPackageUsername(name) {
	return isString(name) && regexPackageUsername.test(name);
}

function isValidPackageTag(tag) {
	if (!isString(tag)) {
		return false;
	}
	if (tag.length > 255) {
		return false;
	}
	if (semverValid(tag)) {
		return false;
	}
	if (semverValidRange(tag)) {
		return false;
	}
	if (isValidPackageVersionMajor(tag)) {
		return false;
	}
	if (!/^[a-zA-Z0-9_\-\.]+$/.test(tag)) {
		return false;
	}
	return true;
}

function isValidRange(range) {
	return semverValidRange(range) !== null;
}

function isValidRangeOnly(range) {
	return range !== undefined && range.length !== 0 && !isValidPackageVersion(range) && !isValidPackageVersionMajor(range) && semverValidRange(range) !== null;
}

function isValidPackageHexId(hex) {
	return regexUnnamed.test(hex);
}

function isValidPackageName(name) {
	return isString(name) && regexPackageName.test(name);
}

function isValidPackageBaseId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserNoVersion.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidPackageSid(sid) {
	let packageType = getPackageTypeFromSid(sid);

	if (packageType === 'user') {
		let matches = sid.match(regexInstallUser);

		if (matches === null) {
			return false;
		}
		let packageVersion = matches[3];

		if (!isValidPackageVersion(packageVersion) && !isValidPackageVersionMajor(packageVersion) && !isValidPackageTag(packageVersion) && !isValidRange(packageVersion)) {
			return false;
		}
		return true;
	} else {
		return isValidPackageBaseId(sid);
	}
}

function isValidPackageUpdateId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserMajor.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidLoosePackageId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserNoVersion.test(id) || regexUserVersioned.test(id) || regexUserMajor.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidSemiSpecificPackageId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexNamed.test(id) || regexUnnamed.test(id) || regexUserVersioned.test(id) || regexUserMajor.test(id);
}

function isValidSpecificPackageId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserVersioned.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidPackageVersionMajor(major) {
	return isString(major) && regexMajorVersion.test(major);
}

function isValidPackageVersion(version) {
	return isString(version) && version.length < 256 && semver2Regex.test(version);
}

function isValidPackageDescription(description) {
	return isString(description) && description.length < 256;
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
		if (package.sid.length !== 0 && getPackageTypeFromSid(package.sid) === 'user') {
			let matches = package.sid.match(regexInstallUser);
			let user = matches[1];
			let packageName = matches[2];

			if (package.username === user && package.name !== packageName && package.name.toLowerCase() === packageName.toLowerCase()) {
				return false;
			}
		}
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

function mayRead(file) {
	try {
		if (!fs.existsSync(file)) {
			file = path.dirname(file);
		}
		fs.accessSync(file, fs.constants.R_OK);
		return true;
	} catch (err) {
		return false;
	}
}

function mayWrite(file) {
	try {
		if (!fs.existsSync(file)) {
			file = path.dirname(file);
		}
		fs.accessSync(file, fs.constants.W_OK);
		return true;
	} catch (err) {
		return false;
	}
}

function validatePackagePaths(files, baseDirs) {
	let paths = [];
	let upperPaths = [];
	let filePaths = [];
	let fileUpperPaths = [];
	let assocPaths = [];
	let _files = [];
	let baseDirIndex = 0;

	for (let file of files) {
		let baseDir = baseDirs[baseDirIndex++];

		if (path.isAbsolute(file)) {
			let baseName = path.basename(file);
			let upper = baseName.toUpperCase();
			let upperIndex = upperPaths.indexOf(upper);

			if (upperIndex === -1) {
				paths.push(baseName);
				upperPaths.push(upper);
				filePaths.push(file);
				fileUpperPaths.push(file.toUpperCase());
				assocPaths.push(file);
				_files.push(file);
			} else {
				if (filePaths.indexOf(file) !== -1) {
					die(`Cannot add the same file twice: "${file}".`);
				} else {
					if (paths.indexOf(baseName) !== -1) {
						die(`File name conflict: cannot have both "${assocPaths[upperIndex]}" and "${file}".`);
					} else {
						die(`For cross-OS compatibility, file names are case-insensitive. Cannot have both "${paths[upperIndex]}" and "${file}".`);
					}
				}
			}
		} else {
			let _file = resolvePath(baseDir, file);
			let _dir = resolvePath(baseDir);
			let localFile = _file.substr(_dir.length);

			if (localFile.length === 0) {
				localFile = '.';
			}

			let parts = localFile.split('/');
			let defaultPath = '';
			let upperPath = '';

			if (parts[parts.length - 1].length === 0) {
				parts.length--;
			}

			for (let i = 0; i < parts.length; i++) {
				let part = parts[i];

				defaultPath += part;
				upperPath += part.toUpperCase();

				let pathIndex = upperPaths.indexOf(upperPath);

				if (pathIndex !== -1) {
					if (paths.indexOf(defaultPath) === -1) {
						die(`For cross-OS compatibility, file names are case-insensitive. Cannot have both "${paths[pathIndex]}" and "${defaultPath}".`);
					} else {
						if (i === parts.length - 1) {
							if (filePaths.indexOf(defaultPath) !== -1) {
								die(`Cannot add the same file twice: "${defaultPath}".`);
							} else {
								let assocPath = assocPaths[pathIndex];

								if (assocPath.startsWith(_dir)) {
									assocPath = assocPath.substr(_dir.length);
								}
								die(`File name conflict: cannot have both "${assocPath}" and "${localFile}".`);
							}
						}
					}
				} else {
					paths.push(defaultPath);
					upperPaths.push(upperPath);
					assocPaths.push(_file);

					if (i === parts.length - 1) {
						_files.push(localFile);
					}
				}

				if (i !== parts.length - 1) {
					defaultPath += '/';
					upperPath += '/';
				}
			}
		}
	}
	return _files;
}

function getPackageFilePaths(files, baseDir, result = [], baseDirs = [], addEmptyDirsAtDepth0 = true) {
	for (let file of files) {
		let resDot = resolvePath(baseDir);
		let resFile = resolvePath(baseDir, file);
		let isOuterFile = !resFile.startsWith(resDot);
		let localFile = resFile.substr(resDot.length);

		if (isDirectory(resFile)) {
			let entries = getDirectoryFiles(resFile);

			if (entries.length === 0 && addEmptyDirsAtDepth0) {
				if (isOuterFile) {
					result.push(resFile);
					baseDirs.push(baseDir);
				} else {
					if (localFile.length === 0) {
						result.push(path.basename(baseDir) + '/');
						baseDirs.push(resolvePath(baseDir, '..'));
					} else {
						result.push(localFile);
						baseDirs.push(baseDir);
					}
				}
			}

			for (let entry of entries) {
				let _resFile = resolvePath(resFile, entry.path);

				if (isDirectory(_resFile)) {
					getPackageFilePaths([localFile + entry.path], baseDir, result, baseDirs);
				} else {
					result.push(localFile + entry.path);
					baseDirs.push(baseDir);
				}
			}
		} else {
			if (isOuterFile) {
				result.push(resFile);
				baseDirs.push(baseDir);
			} else {
				result.push(localFile);
				baseDirs.push(baseDir);
			}
		}
	}
}

function getValidatedPackagePaths(files, sameBase = true, subFilesOnly = false) {
	let orgPaths = [];
	let resPaths = [];

	for (let file of files) {
		if (!fs.existsSync(file)) {
			die(`Non-existent file: "${file}"`);
		}
		let res = path.resolve(file);
		let resIndex = resPaths.indexOf(res);

		if (resIndex !== -1) {
			if (orgPaths[resIndex] === file) {
				die(`Cannot add the same file twice: "${file}".`);
			} else {
				die(`Cannot add the same file twice: "${orgPaths[resIndex]}" and "${file}".`);
			}
		}
		orgPaths.push(file);
		resPaths.push(res);
	}

	let paths = [];
	let _files = [];
	let baseDirs = [];

	if(sameBase){
		getPackageFilePaths(files, '.', paths, baseDirs);
	} else {
		for (let file of files) {
			let stats = fs.statSync(file);
	
			if (stats.isDirectory()) {
				if (subFilesOnly) {
					getPackageFilePaths(['.'], file, paths, baseDirs, false);
				} else {
					let baseName = path.basename(resolvePath(file));

					getPackageFilePaths([baseName], resolvePath(file, '..'), paths, baseDirs, true);
				}
			} else {
				_files.push(file);
			}
		}
		getPackageFilePaths(_files, '.', paths, baseDirs);
	}
	
	validatePackagePaths(paths, baseDirs);

	let fullPaths = [];

	for (let i = 0; i < paths.length; i++) {
		fullPaths.push(resolvePath(baseDirs[i], paths[i]));
	}

	let result = new Array(paths.length);

	for (let i = 0; i < paths.length; i++) {
		result[i] = {
			path: paths[i],
			baseDir: baseDirs[i],
			fullPath: fullPaths[i]
		};
	}
	return result;
}

function zipFiles(files, callback, logZipping, subFilesOnly) {
	let _files = getValidatedPackagePaths(files, false, subFilesOnly);

	tmp.dir({ unsafeCleanup: true }, (err, tmpDir) => {
		if (err) {
			die(panickMsg, err);
		}
		let fileData = [];
		let totalSize = 0;
		let zipPath = tmpDir + '/archive.zip';
		var output = fs.createWriteStream(zipPath);
		var archive = archiver('zip', {
			zlib: { level: 0 } // Sets the compression level.
		});
		archive.pipe(output);

		for (let file of _files) {
			let stats = fs.statSync(file.fullPath);
			let dpPath = file.path;

			if (stats.isDirectory()) {
				let entries = getDirectoryFiles(file.fullPath);
				if (entries.length === 0) {
					if (logZipping) {
						log(`Packing ${dpPath}...`);
					}
					archive.file(file.fullPath, { name: file.path });
				} else {
					log(`Warning: not packing non-empty directory ${file.fullPath}`);
				}
			} else {
				totalSize += stats.size;
				fileData.push({
					path: file.path,
					size: stats.size
				});
				if (logZipping) {
					log(`Packing ${dpPath}...`);
				}
				archive.file(file.fullPath, { name: file.path });
			}
		}
		fileData.sort((a, b) => a.size - b.size);
		fileData['totalSize'] = totalSize;

		let accumulatedSize = 0;
		for (let file of fileData) {
			accumulatedSize += file.size;
			file.atSizePercentage = accumulatedSize / totalSize;
		}
		archive.finalize().then(() => {
			callback({ zipPath: zipPath, fileData: fileData });
		});
	});
}

function zipPackage(callback, logZipping) {
	tmp.dir({ unsafeCleanup: true }, (err, path) => {
		if (err) {
			die(panickMsg, err);
		}
		loadIgnores(() => {
			let entries = getDirectoryFiles('.');
			let paths = [];

			for (let entry of entries) {
				paths.push('./' + entry.path);
			}

			let files = getValidatedPackagePaths(paths, true, false);
			let fileData = [];
			let totalSize = 0;
			let zipPath = path + '/archive.zip';
			var output = fs.createWriteStream(zipPath);
			var archive = archiver('zip', {
				zlib: { level: 0 } // Sets the compression level.
			});
			archive.pipe(output);

			for (let entry of files) {
				if (shouldIgnore(entry.path)) {
					if (logZipping) {
						log(`Skipping ${entry.path}`);
					}
				} else {
					let entryStats = fs.statSync(entry.path);

					totalSize += entryStats.size;

					fileData.push({
						path: entry.path,
						size: entryStats.size,
						atSizePercentage: 0
					});
					if (logZipping) {
						log(`Packing ${entry.path}...`);
					}
					archive.file('./' + entry.path, { name: entry.path });
				}
			}
			fileData.sort((a, b) => a.size - b.size);
			fileData['totalSize'] = totalSize;

			let accumulatedSize = 0;

			for (let file of fileData) {
				accumulatedSize += file.size;
				file.atSizePercentage = accumulatedSize / totalSize;
			}
			output.on('close', () => {
				callback({ zipPath: zipPath, fileData: fileData });
			});
			archive.finalize();
		});
	});
}

function isEmptyDirectory(dir) {
	return fs.readdirSync(dir).length === 0;
}

function getDirectoryFiles(dir, relDir = '', results = [], useIgnores) {
	let list = fs.readdirSync(dir);

	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			let relPath = relDir + fileName + '/';
			let orgLen = results.length;

			getDirectoryFiles(filePath, relDir + fileName + '/', results, useIgnores);
			if (results.length === orgLen) {
				if (useIgnores && shouldIgnore(relPath)) {
					continue;
				}
				let entry = {
					folder: relDir,
					file: fileName + '/',
					path: relPath,
					isDir: true
				};
				results.push(entry);
				results[entry.path] = entry;
			}
		} else {
			let relPath = relDir + fileName;

			if (useIgnores && shouldIgnore(relPath)) {
				continue;
			}
			let entry = {
				folder: relDir,
				file: fileName,
				path: relPath,
				isDir: false
			};
			results.push(entry);
			results[entry.path] = entry;
		}
	}
	return results;
}

function getDirectoryFilesWithChecksum(dir, hashFn, callback, useIgnores) {
	let entries = getDirectoryFiles(dir, '', [], useIgnores);

	if (entries.length === 0) {
		callback(entries);
	}
	let done = 0;

	for (let entry of entries) {
		getFileChecksum(path.resolve(dir, entry.path), hashFn, (checksum) => {
			entry.checksum = checksum;
			if (entries[checksum] === undefined) {
				entries[checksum] = [];
			}
			entries[checksum].push(entry);
			if (++done === entries.length) {
				callback(entries);
			}
		});
	}
}

function getDirectoryFilePaths(dir, callback, useIgnores, excludes = []) {
	getDirectoryFilesWithChecksum(dir, filesHashFunction, (entries) => {
		let list = {};

		for (let entry of entries) {
			if (excludes.indexOf(entry) !== -1) {
				continue;
			}
			let arr = list[entry.checksum];

			if (arr === undefined) {
				arr = list[entry.checksum] = [];
			}
			arr.push(entry.path);
		}
		callback(list);
	}, useIgnores);
}

function getLoginAuthToken() {
	if (appConfig.username !== null && authTokens[appConfig.username] !== undefined) {
		return authTokens[appConfig.username];
	} else {
		return null;
	}
}

function isSignedIn() {
	return getLoginAuthToken() !== null;
}

function getPackageType(pk = package, ignoreSid = false) {
	if (!ignoreSid && pk.sid.length !== 0) {
		return getPackageTypeFromSid(pk.sid);
	}
	if (isValidPackageName(pk.name)) {
		if (isValidPackageVersion(pk.version) && isValidPackageUsername(pk.username)) {
			return 'user';
		} else {
			return 'named';
		}
	}
	return 'unnamed';
}

function getPackageTypeFromSid(sid) {
	if (sid.indexOf('/') !== -1) {
		return 'user';
	} else if (sid.indexOf('_') !== -1) {
		return 'named';
	} else {
		return 'unnamed';
	}
}

function getPromptUsername(packageId) {
	let matches = packageId.match(regexInstallUser);
	let promptUsername = undefined;

	if (matches !== null) {
		if (authTokens[matches[1]] === undefined) {
			promptUsername = matches[1];
		}
	}
	if (promptUsername === undefined && appConfig.username !== null && authTokens[appConfig.username] === undefined) {
		promptUsername = appConfig.username;
	}
	return promptUsername;
}

function loadJsonFile(jsonPath, callback, maxSize = 10485760) {
	if (fs.existsSync(jsonPath)) {
		let stats = fs.statSync(jsonPath);

		if (stats.size > maxSize) {
			if (callback !== undefined) {
				callback(null);
			}
			return null;
		}
		try {
			let obj = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
			if (callback !== undefined) {
				callback(obj);
			}
			return obj;
		} catch (err) {
			die(panickMsg, err);
		}
	} else {
		if (callback !== undefined) {
			callback(null);
		}
		return null;
	}
}

function loadAppConfig() {
	let storedAppConfig = loadJsonFile(appDataConfigPath);

	if(storedAppConfig === null){
		return;
	}
	for (let key in appConfig) {
		if (!(key in storedAppConfig)) {
			storedAppConfig[key] = appConfig[key];
		}
	}
	appConfig = storedAppConfig;
}

function cleanAppConfig() {
	if (appConfig.username !== null && authTokens[appConfig.username] === undefined) {
		appConfig.username = null;
		storeAppConfig();
	}
}

function loadPackage() {
	let obj = loadJsonFile(packageJsonPath) || {};

	for (let prop in obj) {
		package[prop] = obj[prop];
	}
}

function loadAuthTokens() {
	authTokens = loadJsonFile(authTokenStore) || {};
}

function getStoredRequiredReading() {
	return loadJsonFile(requiredReadingStore) || {
		updated: 0,
		library: {},
		completed: false
	};
}

function shouldIgnore(str) {
	let ignore = false;

	for (let ignoreGlob of ignoreGlobs) {
		if (ignoreGlob.match(str)) {
			ignore = !ignoreGlob.negate;
		}
	}
	return ignore;
}

function loadIgnores(callback) {
	if (ignoresLoaded) {
		callback();
	}
	for (let ignoreGlob of defaultIgnores) {
		ignoreGlobs.push(new Minimatch(ignoreGlob));
	}
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
					die(panickMsg, err);
				}
				let ignores = data.split('\r\n').join('\n').split('\n');

				for (let ignoreGlob of ignores) {
					if (ignoreGlob.length === 0) {
						continue;
					}
					ignoreGlobs.push(new Minimatch(ignoreGlob, { flipNegate: true }));
				}
				loadNext();
			});
		} else {
			loadNext();
		}
	}
	loadNext();
}

function mkdirSync(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function mksubdirSync(dirPath) {
	dirPath = path.dirname(dirPath);

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
	}
}

function storeAuthTokens() {
	let json = JSON.stringify(authTokens, undefined, 2);
	mksubdirSync(authTokenStore);
	fs.writeFileSync(authTokenStore, json, 'utf8');
}

function storePackage(pk = package, file = packageJsonPath) {
	let json = JSON.stringify(pk, undefined, 2);
	mksubdirSync(file);
	fs.writeFileSync(file, json, 'utf8');
}

function storeAppConfig() {
	let json = JSON.stringify(appConfig, undefined, 2);
	mksubdirSync(appDataConfigPath);
	fs.writeFileSync(appDataConfigPath, json, 'utf8');
}

function addPackageBaseModules(checkExists = false) {
	let packageBaseModuleString = getPackageBaseModuleString('/');

	if (checkExists) {
		if (!fs.existsSync(packageBaseModuleJSPath)) {
			fs.writeFileSync(packageBaseModuleJSPath, packageBaseModuleString, 'utf8');
		}
		if (!fs.existsSync(packageBaseModuleTSPath)) {
			fs.writeFileSync(packageBaseModuleTSPath, packageBaseModuleString, 'utf8');
		}
	} else {
		fs.writeFileSync(packageBaseModuleJSPath, packageBaseModuleString, 'utf8');
		fs.writeFileSync(packageBaseModuleTSPath, packageBaseModuleString, 'utf8');
	}
}

function onPackageInstalled(packageId, dir) {
	let rDir = path.resolve(dir);
	let isLocalPackage = rDir === path.resolve(packagesPath);

	if (isLocalPackage) {
		let localDir = getInstallDirFromInstallId(packageId).substr(rDir.length + 1) + '/';
		let indexJS = path.resolve(dir, `${localDir}bjspm/index.js`);
		let indexTS = path.resolve(dir, `${localDir}bjspm/index.ts`);
		let moduleStr = getPackageBaseModuleString('/bjspm/packages/' + localDir).replace(/\\/g, '/');

		if (existsAsFile(indexJS)) {
			fs.writeFileSync(indexJS, moduleStr, 'utf8');
		}
		if (existsAsFile(indexTS)) {
			fs.writeFileSync(indexTS, moduleStr, 'utf8');
		}
	}
}

function getPackageBaseModuleString(dir) {
	return `export const PACKAGE_BASE = '${dir}';`;
}

function randomBase36(length) {
	return new Array(length).fill(0).map(() => ((Math.random() * 36) | 0).toString(36)).join('');
}

function resolvePath(...args) {
	let result = path.resolve.apply(this, args).replace(/\\/g, '/');

	if (fs.existsSync(result)) {
		let stats = fs.statSync(result);

		if (stats.isDirectory()) {
			result += '/';
		}
	}
	return result;
}

function resolvePathNative(...args) {
	return resolvePath.apply(this, args).replace(/\//g, path.sep);
}

function getAuthToken(username, callback, useAuthStore = true) {
	if (authTokens[username] === undefined || !useAuthStore) {
		readline.question(`Password: `, (password) => {
			sysout.muted = false;
			console.log();
			if (password.length === 0) {
				getAuthToken(username, callback);
				return;
			}
			getSolvedChallenge((challenge) => {
				delete challenge.hash;

				apiPost({
					action: 'GET_USER_AUTH_TOKEN',
					username: username,
					password: password,
					challenge: challenge
				}, (obj) => {
					switch (obj.status) {
						case API_STATUS.OK:
							authTokens[username] = obj.authToken;
							storeAuthTokens();
							callback(obj.authToken);
							break;
						case API_STATUS.ERR:
							die('Server error: ' + obj.error);
							break;
					}
				});
			});
		});
		sysout.muted = true;
	} else {
		callback(authTokens[username]);
	}
}

function initPackage() {
	log(`
This utility will walk you through creating a package.json file.
Press ^C at any time to quit.
`);

	let suggestPackage = getSuggestPackage();
	let newPackage = getDefaultPackage();
	newPackage.sid = package.sid;
	newPackage.dependencies = package.dependencies;

	let writePackage = (obj) => {
		let json = JSON.stringify(obj, undefined, 2);
		log('About to write to ' + packageJsonPath);
		log();
		log(json);
		log();
		readline.question(`Is this OK? (yes) `, (answer) => {
			let _answer = answer.toLowerCase();
			if (['', 'y', 'yes'].indexOf(_answer) !== -1) {
				mkdirSync(bjspmPath);
				fs.writeFileSync(packageJsonPath, json, 'utf8');
				addPackageBaseModules();
				process.exit();
			} else {
				die('Aborted.\n');
			}
		});
	};

	let keywordsSet = false;
	let descriptionSet = false;
	let licenseSet = false;
	let usernameSet = false;
	let packageNameSet = false;

	let askQuestion = () => {
		// Package name
		if (!packageNameSet) {
			let defaultName = package.name || suggestPackage.name;
			let hasDefault = defaultName.length !== 0 && isValidPackageName(defaultName);

			readline.question(`package name: ${hasDefault ? `(${defaultName}) ` : ''}`, (name) => {
				if (hasDefault && name.length === 0) {
					newPackage.name = defaultName;
					packageNameSet = true;
					log();
				} else {
					if (name.length === 0 || isValidPackageName(name)) {
						newPackage.name = name;
						packageNameSet = true;
						log();
					} else {
						log('Invalid package name\n');
					}
				}
				askQuestion();
			});
			return;
		}

		// Package version
		if (newPackage.version.length === 0) {
			let defaultVersion = package.version || suggestPackage.version;
			let hasDefault = defaultVersion.length !== 0 && isValidPackageVersion(defaultVersion);

			readline.question(`version: ${hasDefault ? `(${defaultVersion}) ` : ''}`, (version) => {
				if (hasDefault && version.length === 0) {
					newPackage.version = defaultVersion;
					log();
				} else {
					if (isValidPackageVersion(version)) {
						newPackage.version = version;
						log();
					} else {
						log('Invalid package version, must follow SemVer 2.0.0\n');
					}
				}
				askQuestion();
			});
			return;
		}

		// Package description
		if (!descriptionSet) {
			let defaultDescription = package.description || suggestPackage.description;
			let hasDefault = defaultDescription.length !== 0 && isValidPackageDescription(defaultDescription);

			readline.question(`description: ${hasDefault ? `(${defaultDescription}) ` : ''}`, (description) => {
				if (hasDefault && description.length === 0) {
					newPackage.description = defaultDescription;
					descriptionSet = true;
				} else {
					if (isValidPackageDescription(description)) {
						newPackage.description = description;
						descriptionSet = true;
					} else {
						log('Invalid package description');
					}
				}
				log();
				askQuestion();
			});
			return;
		}

		// Package keywords
		if (!keywordsSet) {
			let defaultKeywords = package.keywords.length === 0 ? suggestPackage.keywords : package.keywords;
			let hasDefault = defaultKeywords.length !== 0 && isValidPackageKeywords(defaultKeywords);

			readline.question(`keywords: ${hasDefault ? `(${defaultKeywords.join(', ')}) ` : ''}`, (keywords) => {
				if (hasDefault && keywords.length === 0) {
					newPackage.keywords = defaultKeywords;
				} else {
					newPackage.keywords = keywords.replace(/\,/g, ' ').replace(/  /g, ' ').split(' ').filter(keyword => keyword.length !== 0);
				}
				keywordsSet = true;
				log();
				askQuestion();
			});
			return;
		}

		// Package license
		if (!licenseSet) {
			let defaultLicense = package.license || suggestPackage.license;
			let validLicense = getValidLicense(defaultLicense);
			let hasDefault = defaultLicense.length !== 0 && validLicense !== null;

			readline.question(`license: ${hasDefault ? `(${validLicense}) ` : ''}`, (license) => {
				if (hasDefault && license.length === 0) {
					newPackage.license = validLicense;
					licenseSet = true;
				} else {
					let _license = getValidLicense(license);
					if (_license !== null) {
						newPackage.license = _license;
						licenseSet = true;
					} else {
						log('Invalid license, must be a valid SPDX license expression.');
					}
				}
				log();
				askQuestion();
			});
			return;
		}

		// Package username
		if (!usernameSet) {
			let defaultUsername = package.username || suggestPackage.username;
			let hasDefault = defaultUsername.length !== 0 && isValidPackageUsername(defaultUsername);

			readline.question(`your croncle.com username: ${hasDefault ? `(${defaultUsername}) ` : ''}`, (username) => {
				if (hasDefault && username.length === 0) {
					newPackage.username = defaultUsername;
					usernameSet = true;

					if (package.sid.length !== 0 && getPackageTypeFromSid(package.sid) === 'user') {
						let matches = package.sid.match(regexInstallUser);
						let user = matches[1];
						let packageName = matches[2];

						if (newPackage.username === user && newPackage.name !== packageName && newPackage.name.toLowerCase() === packageName.toLowerCase()) {
							usernameSet = false;
							packageNameSet = false;

							log(`User package names must have the same character case; cannot have both "${user}/${packageName}" and "${user}/${newPackage.name}".\n`);
							askQuestion();
						} else {
							writePackage(newPackage);
						}
					} else {
						writePackage(newPackage);
					}
				} else {
					if (isValidUsername(username) || username.length === 0) {
						newPackage.username = username.toLowerCase();
						writePackage(newPackage);
					} else {
						log('Invalid username\n');
						askQuestion();
					}
				}
			});
			return;
		}
		writePackage(newPackage);
	}
	askQuestion();
}

function showCommandHelp(cmd) {
	let _log = (str) => {
		log(str.substr(1));
	};
	switch (cmd) {
		//	init
		case 'create':
		case 'innit':
		case 'init': {
			_log(`
aliases: create, innit
`);
		}
			break;
		//	install
		case 'i':
		case 'isntall':
		case 'install':
		case 'add': {
			_log(`
bjspm install (with no args, in package dir)
bjspm install <hex-id>
bjspm install <pkg>_<hex-id>
bjspm install <user>/<pkg>
bjspm install <user>/<pkg>@<tag>
bjspm install <user>/<pkg>@<version>
bjspm install <user>/<pkg><version-major>
bjspm install <user>/<pkg><version-major>@<tag>
bjspm install <user>/<pkg>@<version range>

Options:
 --no-save
 --dir
 --force

aliases: i, isntall, add`);
		}
			break;
		//	uninstall
		case 'u':
		case 'un':
		case 'unlink':
		case 'remove':
		case 'rm':
		case 'r':
		case 'uninstall': {
			_log(`
bjspm uninstall (with no args, in package dir)
bjspm uninstall <hex-id>
bjspm uninstall <pkg>_<hex-id>
bjspm uninstall <user>/<pkg>@<version>
bjspm uninstall <user>/<pkg><version-major>

aliases: u, un, unlink, remove, rm, r`);
		}
			break;
		// update
		case 'up':
		case 'upgrade':
		case 'udpate':
		case 'update': {
			_log(`
bjspm update [<pkg>...] [--force]

alias: up, upgrade, udpate`);
		}
			break;
		// publish
		case 'publish': {
			_log(`
bjspm publish [<file|folder>...]

Options:
 --type <unnamed|named|user>
 --tag <tag>
 --access <public|restricted>
 --sub
 --no-save

Publishes '.' if no argument supplied.

Sets tag \`latest\` if no --tag specified.`);
		}
			break;
		// unpublish
		case 'unpublish': {
			_log(`
bjspm unpublish (with no args, package dir)
bjspm unpublish <unn-pkg-id>
bjspm unpublish <pkg>_<hex-id>
bjspm unpublish <user>/<pkg>
bjspm unpublish <user>/<pkg>@<version>`);
		}
			break;
		// version
		case 'version': {
			_log(`
bjspm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease]
(run in package dir)

Options:
 --preid <prerelease-id>

See also:
 "bjspm -v" or "bjspm --version" to print BJSPM version only (${version})
 "bjspm view <pkg> version" to view a package's published version
 "bjspm ls" to inspect current package/dependency versions`);
		}
			break;
		// push
		case 'push': {
			_log(`
bjspm push readme
bjspm push preview-image
bjspm push description [<new description>]`);
		}
			break;
		// dist-tag
		case 'dist-tags':
		case 'dist-tag': {
			_log(`
bjspm dist-tag add <tag>
bjspm dist-tag add <user>/<pkg>@<version> <tag>
bjspm dist-tag rm <user>/<pkg> <tag>
bjspm dist-tag ls [<user>/<pkg>]

alias: dist-tags`);
		}
			break;
		// access
		case 'access': {
			_log(`
bjspm access public [<package>]
bjspm access grant <read-only|read-write> <user> [<package>]
bjspm access revoke <user> [<package>]
bjspm access ls-packages [<user>]
bjspm access ls-collaborators [<package> [<user>]]`);
		}
			break;
		// cache
		case 'cache': {
			_log(`
bjspm cache (with no args, shows info)
bjspm cache clear
bjspm cache max-size [<MiB>|none]
bjspm cache dir [<new-dir-path>|default]`);
		}
			break;
		// ls
		case 'list':
		case 'll':
		case 'la':
		case 'ls': {
			_log(`
bjspm ls

Options:
 --json
 --depth

aliases: list, la, ll`);
		}
			break;
		// auth
		case 'auth': {
			_log(`
bjspm auth store [<user>]
bjspm auth forget [<user>]
bjspm auth login [<user>] [--force]
bjspm auth logout
bjspm auth ls`);
		}
			break;
		// view
		case 'v':
		case 'info':
		case 'show':
		case 'view': {
			_log(`
bjspm view <hex-id> [<field>[.subfield]...]
bjspm view <pkg>_<hex-id> [<field>[.subfield]...]
bjspm view <user>/<pkg> [<field>[.subfield]...]
bjspm view <user>/<pkg>@<tag> [<field>[.subfield]...]
bjspm view <user>/<pkg>@<version> [<field>[.subfield]...]
bjspm view <user>/<pkg><version-major> [<field>[.subfield]...]

aliases: v, info, show`);
		}
			break;
		// config
		case 'c':
		case 'config': {
			_log(`
bjspm config set <key> <value>
bjspm config get [<key>]
bjspm config delete <key>
bjspm config list

alias: c`);
		}
			break;
		default:
			showQuickHelp();
	}
	process.exit();
}

function showQuickHelp() {
	log(`
Usage: bjspm <command>

where <command> is one of:
	access, auth, cache, dist-tag, i, init, install, list, ls, publish,
	push, un, uninstall, unpublish, up, update, v, version, view

bjspm <command> -h  quick help on <command>`);
	process.exit();
}