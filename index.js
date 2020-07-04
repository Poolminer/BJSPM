#!/usr/bin/env node

const version = '1.1.0';
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
const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
const stream = require('stream');
const Minimatch = require('minimatch').Minimatch;
const semverValid = require('semver/functions/valid');
const semverMaxSatisfying = require('semver/ranges/max-satisfying');
const semverMajor = require('semver/functions/major');
const semverInc = require('semver/functions/inc');
const semverGt = require('semver/functions/gt');
const semver2Regex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const path = require('path');
const cwdPath = process.cwd() + path.sep;
const bjspmPath = process.cwd() + path.sep + 'bjspm' + path.sep;
const packagesPath = bjspmPath + 'packages' + path.sep;
const webPackagesPath = 'https://bjspm.croncle.com/package/';
const packageJsonPath = bjspmPath + 'package.json';
const regexUser = /^@[a-z0-9_]{1,16}\/[a-z0-9][a-z0-9_\-\.]{0,240}[a-z](?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)?$/;
const regexUserVersioned = /^@[a-z0-9_]{1,16}\/[a-z0-9][a-z0-9_\-\.]{0,240}[a-z](?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?)$/;
const regexUserMajor = /^@[a-z0-9_]{1,16}\/[a-z0-9][a-z0-9_\-\.]{0,240}[a-z]\d{1,9}$/;
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
const appDataConfigPath = appDataPath + path.sep + 'config.json';
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
const checksumHashFunction = 'sha256';
const baseArgs = Symbol('cmdConfigBaseArgs');
const logZipping = false;
const logUploadThreshold = 0;

let ignores = defaultIgnores;
let ignoreGlobs = [];
let tmpToken = null;
let packageVersionsCache = {};
let packageChecksumsCache = {};
let packageTagsCache = {};

for (let ignoreGlob of defaultIgnores) {
	ignoreGlobs.push(new Minimatch(ignoreGlob));
}

mkdirSync(appDataPath);

let authTokens = {};
let cmdArgs = explodeArgs(process.argv.slice(2));
let cmdConfig = getArgsConfig(cmdArgs);
let cmdBaseArgs = cmdConfig[baseArgs];
let conf = null;

function getEmptyPackage() {
	return {
		name: '',
		version: '',
		sid: '',
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
		sid: '',
		description: '',
		keywords: [],
		license: '',
		username: '',
		dependencies: []
	};
}

function getDefaultAppConfig() {
	return {
		username: null,
		packageCachePath: appDataPath + path.sep + 'packages' + path.sep
	};
}

let appConfig = getDefaultAppConfig();
let package = getDefaultPackage();

loadAppConfig(() => {
	loadPackage(() => {
		loadAuthTokens(() => {
			if (cmdArgs.length === 0) {
				showQuickHelp();
			} else if (cmdArgs.length === 2 && cmdArgs[1] === '-h') {
				showCommandHelp(cmdArgs[0]);
			} else {
				switch (cmdBaseArgs[0]) {
					case 'create':
					case 'innit':
					case 'init': {
						initPackage();
					}
						break;
					case 'p':
					case 'publish': {
						let uploadType = 'unnamed';
						let access = 'public';
						let tags = [];

						if (cmdBaseArgs.length === 1) {
							if (!isValidPackage()) {
								log('This package has an invalid configuration; run "bjspm init" to fix this.');
								process.exit();
							}
							uploadType = getPackageType();

							if (conf = cmdConfig['type']) {
								let arg = conf[0];
								if (arg !== undefined) {
									switch (arg.toLowerCase()) {
										case 'user':
											if (package.username.length === 0) {
												log('This package is not configured properly to be a user package; run "bjspm init" to fix this.');
												process.exit();
											}
											uploadType = 'user';
											break;
										case 'named':
											if (package.name.length === 0) {
												log('This package is not configured properly to be a named package; run "bjspm init" to fix this.');
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
							}
							if (conf = cmdConfig['tag']) {
								if (uploadType === 'user') {
									let tag = conf[0];
									if (tag !== undefined) {
										if (!isValidPackageTag(tag)) {
											log('Invalid package tag');
											process.exit();
										}
										tags = [tag];
									}
								}
							}
						}
						if (conf = cmdConfig['access']) {
							let arg = conf[0];
							if (arg !== undefined) {
								switch (arg.toLowerCase()) {
									case 'public':
										access = 'public';
										break;
									case 'restricted':
										access = 'restricted'
										break;
									default:
										log('Invalid access level');
										process.exit();
										break;
								}
							}
						}
						getServerConfig(serverConfig => {
							let onZipped = result => {
								let zipPath = result.zipPath;
								let fileData = result.fileData;
								let cleanupCallback = result.cleanupCallback;

								let uploadCallback = (obj) => {
									switch (obj.status) {
										case API_STATUS.OK:
											package.sid = obj.packageId;
											log('Package published, id: ' + obj.packageId);
											process.exit();
										case API_STATUS.ERR:
											log('Server error: ' + obj.error);
											process.exit();
									}
									// Manual cleanup
									cleanupCallback();
								};
								if (uploadType === 'user') {
									getAuthTokenWithPackagePermissions(getUserPackageBSID(), ['mayPublish'], (token) => {
										if (token === null) {
											let promptUsername = undefined;
											if (authTokens[package.username] === undefined) {
												promptUsername = package.username;
											} else if (appConfig.username !== null && authTokens[appConfig.username] === undefined) {
												promptUsername = appConfig.username;
											}
											log(credentialsMsg);
											pollUsername((username) => {
												getAuthToken(username, (authToken) => {
													uploadPackage(zipPath, fileData, authToken, uploadType, access, tags, uploadCallback);
												}, false);
											}, promptUsername);
										} else {
											uploadPackage(zipPath, fileData, token, uploadType, access, tags, uploadCallback);
										}
									});
								} else if (serverConfig.loginRequired) {
									let loginAuthToken = getLoginAuthToken();
									if (loginAuthToken !== null) {
										uploadPackage(zipPath, fileData, loginAuthToken, uploadType, access, tags, uploadCallback);
									} else {
										log(credentialsMsg);
										pollUsername((username) => {
											getAuthToken(username, (authToken) => {
												uploadPackage(zipPath, fileData, authToken, uploadType, access, tags, uploadCallback);
											});
										});
									}
								} else {
									let loginAuthToken = getLoginAuthToken();
									uploadPackage(zipPath, fileData, loginAuthToken, uploadType, access, tags, uploadCallback);
								}
							};
							if (cmdBaseArgs.length === 1) {
								log(`Making package archive...`);
								zipPackage(onZipped);
							} else {
								log(`Making file archive...`);
								zipFiles(cmdBaseArgs.slice(1), onZipped);
							}
						});
					}
						break;
					case 'unpublish':
						let packageId = cmdBaseArgs[1];
						if (packageId === undefined) {
							if (package.sid.length === 0) {
								log('No package specified');
								process.exit();
							}
							packageId = package.sid;
						} else {
							if (!isValidSpecificPackageId(packageId)) {
								log('Invalid package identifier');
								process.exit();
							}
						}
						let unpublish = (authToken) => {
							unpublishPackage(packageId, authToken, (result) => {
								if (result.undid) {
									log('Package unpublishing undone successfully');
								} else {
									log('Package unpublished successfully');
								}
								process.exit();
							});
						};
						getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
							if (token === null) {
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
								log(credentialsMsg);
								pollUsername((username) => {
									getAuthToken(username, (authToken) => {
										unpublish(authToken);
									}, false);
								}, promptUsername);
							} else {
								unpublish(token);
							}
						});
						break;
					case 'i':
					case 'install':
					case 'up':
					case 'upgrade':
					case 'udpate':
					case 'update': {
						let packageId = cmdBaseArgs[1];
						let folder = null;
						let dlType = 'rel';
						let installIds = [];
						let force = false;
						let update = ['up', 'upgrade', 'udpate', 'update'].indexOf(cmdBaseArgs[0]) !== -1;
						let packageType = null;

						if (update) {
							if (cmdBaseArgs.length === 1) {
								installIds = package.dependencies;
							} else {
								for (let i = 1; i < cmdBaseArgs.length; i++) {
									installIds.push(cmdBaseArgs[i]);
								}
							}
							for (let installId of installIds) {
								if (!isValidPackageInstallId(installId)) {
									log(`Invalid package identifier "${installId}"`);
									process.exit();
								}
							}
						} else {
							if (packageId === undefined) {
								installIds = package.dependencies;
							} else {
								installIds.push(packageId);
								packageType = getPackageTypeFromSid(packageId);
							}
							if (conf = cmdConfig['dir']) {
								let arg = conf[0];
								if (arg !== undefined) {
									folder = arg;
								} else {
									showCommandHelp('install');
								}
							}
						}
						if ('abs' in cmdConfig) {
							dlType = 'abs';
						}
						if ('force' in cmdConfig) {
							force = true;
						}
						let i = 0;
						let iterate = () => {
							if (i === installIds.length) {
								process.exit();
							}
							let installId = installIds[i];
							let install = () => {
								installPackage(installId, folder, dlType, (result) => {
									log('Package installed');
									iterate();
								}, true, force);
							};
							if (packageType === 'unnamed') { // If so, installIds will be [packageId]
								getPackageSID(installId, (sid) => {
									installId = getMajorInstallId(sid);
									install();
								});
							} else {
								install();
							}
							i++;
						};
						iterate();
					}
						break;
					case 'u':
					case 'un':
					case 'unlink':
					case 'remove':
					case 'rm':
					case 'r':
					case 'uninstall': {
						let packageId = cmdBaseArgs[1];
						let save = false;
						if (conf = cmdConfig['--save']) {
							save = getConfigBool(conf[0]);
						}
						if (conf = cmdConfig['--no-save']) {
							save = !getConfigBool(conf[0]);
						}
						if (packageId === undefined) {
							if (fs.existsSync(packagesPath)) {
								deleteDirectory(packagesPath, (err) => {
									if (err) {
										log(`Could not uninstall package`);
										process.exit();
									} else {
										log(`Package uninstalled`);
										process.exit();
									}
								});
							} else {
								log(`Package not installed`);
								process.exit();
							}
							break;
						}
						if (!isValidLoosePackageId(packageId)) {
							log(`Invalid package identifier`);
							process.exit();
						}
						packageId = getMajorInstallId(packageId);
						let packageType = getPackageTypeFromSid(packageId);
						let proceed = () => {
							let installDir = getInstallDirFromInstallId(packageId);
							if (package.dependencies.indexOf(packageId) === -1 || !fs.existsSync(installDir)) {
								log(`Package not installed: ${packageId}`);
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
												log(panickMsg, err);
												process.exit();
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
													/* Remove @user directory if this was the last package of @user */
													let deleteDir = true;
													for (let _dependencyId of dependency.package.dependencies) {
														let _dependency = dependencies[_dependencyId];
														if (_dependency.refCount !== 0 && _dependency.package !== null && _dependency.package.username === dependency.package.username) {
															deleteDir = false;
															break;
														}
													}
													if (deleteDir) {
														let dir = path.resolve(dependency.dir, '..');
														deleteDirectory(dir, (err) => {
															if (err) {
																log(panickMsg, err);
																process.exit();
															}
															// @user directory deleted
															uninstallSubDependencies();
														});
													} else { // @user directory not deleted, it has other packages in it
														uninstallSubDependencies();
													}
												} else { // Not a user package, so no parent directory to possibly delete
													uninstallSubDependencies();
												}
											} else { // No package file, so no sub-dependencies to uninstall
												callback();
											}
										});
									} else {
										callback();
									}
								};
								uninstall(packageId, () => {
									log(`Package uninstalled`);
									if (save) {
										delete package.dependencies[packageId];
										storePackage();
									}
									process.exit();
								});
							});
						};
						if (packageType === 'unnamed') {
							getPackageSID(packageId, (sid) => {
								packageId = getMajorInstallId(sid);
								proceed();
							});
						} else if (packageType === 'named') {
							getPackageSID(packageId.split('_')[1], (sid) => {
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
							log(`Cannot push to unpublished package`);
							process.exit();
						}
						let packageId = package.sid;
						switch (target.toLowerCase()) {
							case 'readme': {
								let readmePath = path.resolve(bjspmPath, 'readme.md');
								if (!existsAsFile(readmePath)) {
									log(`No readme file in bjspm directory`);
									process.exit();
								}
								getAuthTokenWithPackagePermissions(packageId, ['mayPublish'], (token) => {
									if (token === null) {
										let promptUsername = getPromptUsername(packageId);

										log(credentialsMsg);
										pollUsername((username) => {
											getAuthToken(username, (authToken) => {
												uploadReadme(packageId, authToken, () => {
													log(`Readme updated`);
													process.exit();
												});
											}, false);
										}, promptUsername);
									} else {
										unpublish(token);
									}
								});
							}
								break;
							default:
								showCommandHelp('push');
						}
					}
						break;
					case 'dist-tag':
					case 'dist-tags': {
						let subCmd = cmdBaseArgs[1];
						if (subCmd === undefined) {
							showCommandHelp('dist-tag');
						}
						switch (subCmd) {
							case 'add': {
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
										log('No package specified');
										process.exit();
									}
									if (getPackageType() !== 'user') {
										log('Only versioned packages may have tags');
										process.exit();
									}
									packageId = package.sid;
								} else if (!regexUserVersioned.test(packageId)) {
									log('Invalid versioned package identifier');
									process.exit();
								}
								if (!isValidPackageTag(tag)) {
									log('Invalid package tag');
									process.exit();
								}
								checkPackageAvailability(packageId, (availability) => {
									getAuthTokenWithPackagePermissions(packageId, ['maySetTags'], (token) => {
										let addTag = (authToken) => {
											setPackageTags(packageId, [tag], authToken, () => {
												log('Tag added successfully');
												process.exit();
											});
										};
										if (token === null) {
											let promptUsername = getPromptUsername(packageId);

											log(credentialsMsg);
											pollUsername((username) => {
												getAuthToken(username, (authToken) => {
													addTag(authToken);
												}, false);
											}, promptUsername);
										} else {
											addTag(token);
										}
									});
								});
							}
								break;
							case 'rm': {
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
										log('No package specified');
										process.exit();
									}
									if (getPackageType() !== 'user') {
										log('Only versioned packages may have tags');
										process.exit();
									}
									packageId = package.sid;
								} else if (isValidLoosePackageId(packageId)) {
									log('Invalid package identifier');
									process.exit();
								}
								if (!isValidPackageTag(tag)) {
									log('Invalid package tag');
									process.exit();
								}
								checkPackageAvailability(packageId, (availability) => {
									getAuthTokenWithPackagePermissions(packageId, ['maySetTags'], (token) => {
										let deleteTag = (authToken) => {
											deletePackageTags(packageId, [tag], authToken, () => {
												log('Tag deleted successfully');
												process.exit();
											});
										};
										if (token === null) {
											let promptUsername = getPromptUsername(packageId);

											log(credentialsMsg);
											pollUsername((username) => {
												getAuthToken(username, (authToken) => {
													deleteTag(authToken);
												}, false);
											}, promptUsername);
										} else {
											deleteTag(token);
										}
									});
								});
							}
								break;
							case 'ls': {
								if (cmdBaseArgs.length > 3) {
									showCommandHelp('dist-tag');
								}
								let packageId = cmdBaseArgs[2];
								if (packageId === undefined) {
									if (package.sid.length === 0 || getPackageTypeFromSid(package.sid) !== 'user') {
										log('No package specified');
										process.exit();
									} else {
										packageId = getUserPackageBSID();
									}
								}
								if (!regexUserNoVersion.test(packageId)) {
									log('Invalid base user package identifier');
									process.exit();
								}
								checkPackageAvailability(packageId, (availability) => {
									let listTags = (authToken) => {
										getPackageTags(packageId, (tags) => {
											for (let tag in tags) {
												console.log(`${tag}: ${tags[tag]}`);
											}
											process.exit();
										}, authToken);
									};
									if (availability === 'public') {
										listTags();
									} else {
										getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
											if (token === null) {
												let promptUsername = getPromptUsername(packageId);

												log(credentialsMsg);
												pollUsername((username) => {
													getAuthToken(username, (authToken) => {
														listTags(authToken);
													}, false);
												}, promptUsername);
											} else {
												listTags(token);
											}
										});
									}
								});
							}
								break;
						}
					}
						break;
					case 'access': {
						if (cmdBaseArgs.length === 1) {
							showCommandHelp('access');
						} else {
							switch (cmdBaseArgs[1].toLowerCase()) {
								case 'public':
								case 'restricted': {
									let packageId;
									if (cmdBaseArgs.length === 2) { // local package
										if (package.sid.length === 0) {
											log('No package specified');
											process.exit();
											break;
										}
										packageId = package.sid;
									} else if (cmdBaseArgs.length === 3) {
										packageId = cmdBaseArgs[2];
									} else {
										showCommandHelp('access');
										break;
									}
									if (!isValidPackageBaseId(packageId)) {
										log('Invalid package identifier');
										process.exit();
									}
									let setPublicity = (authToken) => {
										setPackagePublicity(packageId, cmdBaseArgs[1], authToken, () => {
											log('Package set to ' + cmdBaseArgs[1]);
											process.exit();
										});
									}
									checkPackageAvailability(packageId, (availability) => {
										getAuthTokenWithPackagePermissions(packageId, ['mayPublicity'], (token) => {
											if (token === null) {
												let promptUsername = getPromptUsername(packageId);

												log(credentialsMsg);
												pollUsername((username) => {
													getAuthToken(username, (authToken) => {
														setPublicity(authToken);
													}, false);
												}, promptUsername);
											} else {
												setPublicity(token);
											}
										});
									});
								}
									break;
								case 'set': {
									if (cmdBaseArgs.length === 2) {
										showCommandHelp('access');
									} else {
										switch (cmdBaseArgs[2]) {
											case 'read-only':
											case 'read-write': {
												let user = cmdBaseArgs[3];
												let packageId;
												if (cmdBaseArgs.length === 4) { // local package
													if (package.sid.length === 0) {
														log('No package specified');
														process.exit();
														break;
													}
													packageId = package.sid;
												} else if (cmdBaseArgs.length === 5) {
													packageId = cmdBaseArgs[4];
												} else {
													showCommandHelp('access');
													break;
												}
												if (!isValidUsername(user)) {
													log('Invalid username');
													process.exit();
												}
												if (!isValidPackageBaseId(packageId)) {
													log('Invalid package identifier');
													process.exit();
												}
												checkPackageAvailability(packageId, (availability) => {
													let setPermissions = (authToken) => {
														setUserPermissions(packageId, user, cmdBaseArgs[2], authToken, () => {
															log('User permissions set');
															process.exit();
														});
													};
													getAuthTokenWithPackagePermissions(packageId, ['maySetPermissions'], (token) => {
														if (token === null) {
															let promptUsername = getPromptUsername(packageId);

															log(credentialsMsg);
															pollUsername((username) => {
																getAuthToken(username, (authToken) => {
																	setPermissions(authToken);
																}, false);
															}, promptUsername);
														} else {
															setPermissions(token);
														}
													});
												});
											}
												break;
											default:
												showCommandHelp('access');
										}
									}
								}
									break;
								case 'ls-packages': {
									if (cmdBaseArgs.length !== 3) {
										showCommandHelp('ls-packages');
									} else {
										let user = cmdBaseArgs[2];
										if (!isValidUsername(user)) {
											log('Invalid username');
											process.exit();
										}
										getPackageAccessListUser(user, (obj) => {
											let json = JSON.stringify(obj, undefined, 2);
											log(json);
											process.exit();
										});
									}
								}
									break;
								case 'ls-collaborators': {
									let user;
									let packageId;
									if (cmdBaseArgs.length > 4) {
										showCommandHelp('ls-collaborators');
										break;
									}
									if (cmdBaseArgs.length === 2) { // local package
										if (package.sid.length === 0) {
											log('No package specified');
											process.exit();
											break;
										}
										packageId = package.sid;
									} else {
										packageId = cmdBaseArgs[2];
										user = cmdBaseArgs.length === 4 ? cmdBaseArgs[3] : '';
									}
									let matches = packageId.match(regexInstallUser);
									let username = matches !== null ? matches[1] : '';
									checkPackageAvailability(packageId, (availability) => {
										if (availability === 'public') {
											getPackageCollaborators(packageId, user, (obj) => {
												let json = JSON.stringify(obj, undefined, 2);
												log(json);
												process.exit();
											});
										} else {
											let listCollaborators = (authToken) => {
												getPackageCollaborators(packageId, user, (obj) => {
													let json = JSON.stringify(obj, undefined, 2);
													log(json);
													process.exit();
												}, authToken);
											};
											getAuthTokenWithPackagePermissions(packageId, ['maySetPermissions'], (token) => {
												if (token === null) {
													let promptUsername = getPromptUsername(packageId);

													log(credentialsMsg);
													pollUsername((username) => {
														getAuthToken(username, (authToken) => {
															listCollaborators(authToken);
														}, false);
													}, promptUsername);
												} else {
													listCollaborators(token);
												}
											});
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
							showCommandHelp('auth');
						}
						switch (cmdBaseArgs[1]) {
							case 'save':
							case 'store': {
								pollUsername((username) => {
									getAuthToken(username, () => {
										appConfig.username = username;
										log(`Stored auth token of "${username}" in local app data`);
										storeAppConfig();
										process.exit();
									}, false);
								});
							}
								break;
							case 'forget': {
								let username = cmdBaseArgs[2];
								let deleteAuthToken = (username) => {
									delete authTokens[username];
									storeAuthTokens();
									log(`Auth token of "${username}" deleted from local app data`);
									process.exit();
								};
								if (username !== undefined && isValidUsername(username)) {
									deleteAuthToken(username);
								}
								pollUsername((username) => {
									if (authTokens[username] !== undefined) {
										deleteAuthToken(username);
									} else {
										log(`User auth token not found`);
										process.exit();
									}
								});
							}
								break;
							case 'signin':
							case 'login': {
								pollUsername((username) => {
									let useAuthStore = true;
									if (conf = cmdConfig['force']) {
										useAuthStore = !getConfigBool(conf[0]);
									}
									getAuthToken(username, () => {
										appConfig.username = username;
										log(`Logged in as "${username}"`);
										storeAppConfig();
										process.exit();
									}, useAuthStore);
								});
							}
								break;
							case 'signout':
							case 'logout': {
								if (appConfig.username === null) {
									die(`Not logged in`);
								}
								let username = appConfig.username;
								appConfig.username = null;
								storeAppConfig();
								die(`No longer logged in as "${username}"`);
							}
								break;
							case 'ls': {
								for (let user in authTokens) {
									log(user);
								}
								process.exit();
							}
								break;
						}
					}
						break;
					case 'info':
					case 'show':
					case 'v':
					case 'view': {
						let packageId = cmdBaseArgs[1];
						if (packageId === undefined) {
							log(JSON.stringify(package, undefined, 2));
							process.exit();
						}
						if (!isValidLoosePackageId(packageId)) {
							log('Invalid package identifier');
							process.exit();
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
										log('No information available about this package');
										process.exit();
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
										let promptUsername = getPromptUsername(packageId);

										log(credentialsMsg);
										pollUsername((username) => {
											getAuthToken(username, (authToken) => {
												show(authToken);
											}, false);
										}, promptUsername);
									} else {
										show(token);
									}
								});
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
							log(`Cache: ${files.length} package${files.length === 1 ? '' : 's'}, ${filesize(totalSize)}`);
							process.exit();
						} else {
							switch (cmdBaseArgs[1]) {
								case 'clean':
								case 'clear': {
									for (let filePath of filePaths) {
										try {
											fs.unlinkSync(filePath);
										} catch (e) {
											log(panickMsg, e);
											process.exit();
										}
									}
									log(`Cache cleared (${files.length} packages, ${filesize(totalSize)})`);
								}
									break;
							}
							if (conf = cmdConfig['dir']) {
								let dir = conf[0];
								if (dir !== undefined) {
									if (!path.isAbsolute(dir)) {
										log('--dir: Only absolute paths are allowed');
										process.exit();
									}
									if (fs.existsSync(dir)) {
										let stat = fs.statSync(dir);
										if (!stat.isDirectory()) {
											log('--dir: Path resolves to a file, must be a directory');
											process.exit();
										}
									}
									appConfig.packageCachePath = dir;
									storeAppConfig();
									process.exit();
								} else {
									process.exit();
								}
							}
							process.exit();
						}
					}
						break;
					case '-v':
					case '--version':
						log(version);
						process.exit();
						break;
					case 'version':
						let varg = cmdBaseArgs[1];
						if (varg === undefined) {
							log(version);
							process.exit();
						}
						if (!existsAsFile(packageJsonPath)) {
							log('No package file, please run "bjspm init" first');
							process.exit();
						}
						if (semverValid(varg)) {
							if (!semverGt(varg, package.version)) {
								log(`New version must be greater than current version (${package.version})`);
								process.exit();
							}
							package.version = newVersion;
							storePackage();
							log(`v${package.version}`);
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
								log(`v${package.version}`);
								process.exit();
							} else {
								log(panickMsg);
								process.exit();
							}
						}
						break;
					case 'ls':
						if (package.sid.length !== 0) {
							log(package.sid);
						}
						let json = false;
						if (conf = cmdConfig['json']) {
							json = getConfigBool(conf[0]);
						}
						let maxDepth = Infinity;
						if (conf = cmdConfig['depth']) {
							if (conf[0] === undefined) {
								maxDepth = 1;
							} else {
								maxDepth = conf[0];
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
										};
										if (dependency.type === 'user' && dependency.package !== null) {
											obj.version = dependency.package.version;
										}
										obj.dependencies = {};
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
								log(JSON.stringify(obj, undefined, 2));
								process.exit();
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
								process.exit();
							});
						}
						break;
					case 'api': {
						if (cmdArgs[1] === undefined) {
							break;
						}
						apiPost({
							action: cmdArgs[1]
						}, (obj) => {
							log(obj);
							process.exit();
						});
					}
						break;
					case 'test':
						getUserPackagePermissions('01', authTokens['gijs'], (p) => {
							log(p);
						});
						break;
					default:
						showQuickHelp();
				}
			}
		});
	});
});

function _onGotError(err) {
	if (!err.response) {
		log(panickMsg, err);
		process.exit();
	} else {
		switch (err.response.statusCode) {
			case 404:
				console.log(`Server error: 404 Not Found`);
				break;
			case 403:
				console.log(`Server error: 403 Forbidden`);
				break;
			case 500:
				console.log(`Server error: 500 Internal Server Error`, err.response);
				break;
		}
		process.exit();
	}
}

function log(...args) {
	console.log.apply(this, args);
}

function die(...args) {
	console.log.apply(this, args);
	process.exit();
}

function explodeArgs(args) {
	let newArgs = [];
	for (let i = 0; i < args.length; i++) {
		let arg = args[i];
		let index = arg.indexOf('=');
		if (index === -1) {
			newArgs.push(arg);
		} else {
			newArgs.push(arg.substr(0, index), arg.substr(index + 1));
		}
	}
	return newArgs;
}

function getArgsConfig(args) {
	let config = {
		[baseArgs]: []
	};
	let activeKey = null;
	for (let i = 0; i < args.length; i++) {
		let arg = args[i];
		switch (arg) {
			case '-f':
				arg = '--force';
				break;
		}
		if (arg.startsWith('--')) {
			let key = arg.substr(2).toLowerCase();
			if (key in config) {
				continue;
			}
			config[key] = [];
			activeKey = key;
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

async function apiPost(formData, callback, onGotError = _onGotError) {
	const form = new FormData();
	for (let key in formData) {
		if (formData[key] !== null && formData[key] !== undefined) {
			form.append(key, formData[key]);
		}
	}
	try {
		const { body } = await got.post('https://bjspm.croncle.com/api.php', {
			body: form
		}, (err) => {
			if (err) {
				log(panickMsg, err);
				process.exit();
			}
		});
		try {
			let obj = JSON.parse(body);
			if (obj.error) {
				log('ERROR', obj.error);
				process.exit();
			}
			callback(obj);
		} catch (e) {
			log(e, body);
			process.exit();
		}
	} catch (err) {
		onGotError(err);
	}
}
async function getJson(url, callback, onGotError = _onGotError) {
	try {
		const { body } = await got.get(url);
		try {
			let obj = JSON.parse(body);
			if (obj.error) {
				log('ERROR', obj.error);
				process.exit();
			}
			callback(obj);
		} catch (e) {
			log(e, body);
			process.exit();
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

function checkPackageAvailability(packageBaseId, callback) {
	getPackageAvailability(packageBaseId, (availability) => {
		switch (availability) {
			case 'public':
				callback('public');
				break;
			case 'private':
				callback('private');
				break;
			case 'nonexistent':
				log('Error: package does not exist');
				process.exit();
			case 'deleted':
				log('Error: this package has been deleted');
				process.exit();
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

function getUserPackagePermissions(packageId, authToken, callback) {
	apiPost({
		action: 'GET_GRANTED_PERMISSIONS',
		package: packageId,
		authToken: authToken
	}, (obj) => {
		callback(obj.permissions);
	});
}

function getAuthTokenWithPackagePermissions(packageId, permissions, callback) {
	let tokens = [];
	if (packageId.indexOf('@') !== -1) {
		let username = packageId.split('/')[0].substr(1);
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
		getUserPackagePermissions(packageId, token, (permissionsObj) => {
			for (let permission of permissions) {
				if (!(permission in permissionsObj)) {
					iterate();
					return;
				}
			}
			callback(token);
		});
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

function getPackageDownloadUrls(packageId, callback, authToken) {
	apiPost({
		action: 'GET_PACKAGE_DOWNLOAD_URLS',
		authToken: authToken,
		package: packageId
	}, (obj) => {
		callback(obj.urls);
	});
}

function getPackageChecksums(packageId, callback, authToken) {
	if (packageChecksumsCache[packageId] !== undefined) {
		callback(packageChecksumsCache[packageId]);
		return;
	}
	apiPost({
		action: 'GET_PACKAGE_CHECKSUMS',
		authToken: authToken,
		package: packageId
	}, (obj) => {
		packageChecksumsCache[packageId] = obj.checksums;
		callback(obj.checksums);
	});
}

function getPackageSID(hid, callback) {
	apiPost({
		action: 'GET_PACKAGE_SID_FROM_HID',
		hid: hid
	}, (obj) => {
		callback(obj.sid);
	});
}

function getAppDataPackagePath(packageId) {
	let fileName = packageId.replace('/', '@');
	let filePath = path.resolve(appConfig.packageCachePath, fileName + '.zip');
	return filePath;
}

function getUserPackageSID() {
	return `@${package.username}/${package.name}@${package.version}`;
}

function getUserPackageBSID() {
	return `@${package.username}/${package.name}`;
}

function getMajorInstallId(installId) {
	if (regexUserMajor.test(installId)) {
		return installId;
	}
	if (installId.indexOf('@') != -1) {
		let split = installId.split('@');
		let bsid = split[1];
		let version = split[2];
		let major = semverMajor(version);
		return `@${bsid}${major}`;
	} else {
		return installId;
	}
}

function getInstallDirFromInstallId(installId) {
	if (installId.indexOf('@') !== -1) {
		let matches = installId.match(regexInstallUser);
		let user = matches[1];
		let packageName = matches[2];
		let packageVersion = matches[3];

		return path.resolve(packagesPath, `@${user}`, `${packageName}${packageVersion}`);
	} else {
		return path.resolve(packagesPath, installId);
	}
}

function getPackageFromInstallId(installId, callback) {
	let packageDir = getInstallDirFromInstallId(installId);
	let packageFile = path.resolve(packageDir, 'bjspm', 'package.json');
	if (fs.existsSync(packageFile)) {
		loadJsonFile(packageFile, (obj) => {
			callback(obj);
		});
	} else {
		callback(null);
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

function existsAsFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return false;
	}
	let stats = fs.statSync(filePath);
	return stats.isFile();
}

function existsAsDirectory(filePath) {
	if (!fs.existsSync(filePath)) {
		return false;
	}
	let stats = fs.statSync(filePath);
	return stats.isDirectory();
}

function installPackage(packageId, folder, dlType, callback, save = false, force = false) {
	if (!isValidPackageInstallId(packageId)) {
		callback(null);
		return;
	}
	let authToken = undefined;
	let proceed = () => {
		let packageBaseId = null;
		if (packageId.indexOf('@') !== -1) {
			let matches = packageId.match(regexInstallUser);
			let user = matches[1];
			let packageName = matches[2];
			let packageVersion = matches[3];
			packageBaseId = `@${user}/${packageName}`;
			getPackageVersions(packageBaseId, (versions) => {
				if (versions.length === 0) {
					log('Could not retrieve package versions from server');
					process.exit();
				}
				getPackageTags(packageBaseId, (tags) => {
					if (tags.length === 0) {
						log('Could not retrieve package tags from server');
						process.exit();
					}
					if (packageVersion.length === 0) {
						packageVersion = tags['latest'];
					}
					if (isValidPackageTag(packageVersion)) {
						if (tags[packageVersion] === undefined) {
							log(`Could not install "${packageId}", error:`);
							log('No such package tag, available tags:');
							log(tags.join(', '));
							process.exit();
						}
						packageVersion = tags[packageVersion];
					} else if (isValidPackageVersionMajor(packageVersion)) {
						let highestMatch = semverMaxSatisfying(versions, `${packageVersion}.x`);
						if (highestMatch === null) {
							log(`Could not install "${packageId}", error:`);
							log('Could not find highest version');
							process.exit();
						}
						packageVersion = highestMatch;
					} else if (!semverValid(packageVersion)) {
						log(`Could not install "${packageId}", error:`);
						log(`Invalid package version identifier: ${packageVersion}`);
						process.exit();
					} else if (matches[3].length !== 0) {
						log(`Note: only the package's major version will be saved to the dependecies list`);
					}
					let versionMajor = semverMajor(packageVersion);
					let dependency = `@${user}/${packageName}${versionMajor}`;
					getPackageFromInstallId(dependency, (pk) => {
						let proceed = () => {
							let downloadId = `${packageBaseId}@${packageVersion}`;
							let targetPath;
							let download = () => {
								downloadPackageChain(downloadId, dlType, targetPath, (filepath) => {
									if (save && package.dependencies.indexOf(dependency) === -1) {
										package.dependencies.push(dependency);
										storePackage();
									}
									callback({ filepath: filepath, version: packageVersion });
								}, authToken, force);
							};
							if (folder !== null) {
								targetPath = path.resolve(folder, `@${user}`, `${packageName}${versionMajor}`);
								download();
							} else {
								targetPath = path.resolve(packagesPath, `@${user}`, `${packageName}${versionMajor}`);
								deleteDirectory(targetPath, (err) => {
									if (err) {
										log(panickMsg, err);
										process.exit();
									}
									download();
								});
							}
						};
						if (pk === null) {
							proceed();
						} else if (!force && packageVersion === pk.version) {
							callback(null);
						} else {
							proceed();
						}
					});
				}, authToken);
			}, authToken);
		} else {
			downloadId = packageId;
			packageBaseId = packageId;

			let targetPath;
			if (folder !== null) {
				targetPath = path.resolve(folder, packageBaseId);
			} else {
				targetPath = path.resolve(packagesPath, packageBaseId);
			}
			if (!force && fs.existsSync(getInstallDirFromInstallId(packageBaseId))) {
				callback(null);
				return;
			}
			let download = () => {
				downloadPackageChain(downloadId, dlType, targetPath, (filepath) => {
					if (save && package.dependencies.indexOf(packageBaseId) === -1) {
						package.dependencies.push(packageBaseId);
						storePackage();
					}
					callback({ filepath: filepath });
				}, authToken, force);
			};
			if (folder === null) {
				deleteDirectory(targetPath, (err) => {
					if (err) {
						log(panickMsg, err);
						process.exit();
					}
					download();
				});
			} else {
				download();
			}
		}
	};
	checkPackageAvailability(packageId, (availability) => {
		if (availability !== 'public') {
			getAuthTokenWithPackagePermissions(packageId, ['mayRead'], (token) => {
				if (token === null) {
					log(`Please enter your croncle.com account credentials to install "${packageId}"`);
					pollUsername((username) => {
						getAuthToken(username, (token) => {
							authToken = token;
							proceed();
						});
					});
				} else {
					authToken = token;
					proceed();
				}
			});
		} else {
			proceed();
		}
	});
}

function downloadPackageChain(packageId, dlType, targetPath, callback, authToken, force = false) {
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
							}, false, force);
						};
						installNext();
					}
				}
			});
		} else {
			callback(targetPath);
		}
	}, authToken);
}

// function deleteDirectory(path) {
// 	if (!fs.existsSync(path)) {
// 		return false;
// 	}
// 	let files = getSubFiles(path);
// 	let dirs = getSubDirectories(path).sort((a, b) => b.length - a.length);

// 	for (let file of files) {
// 		fs.unlinkSync(file);
// 	}
// 	for (let dir of dirs) {
// 		fs.rmdirSync(dir);
// 	}
// 	fs.rmdirSync(path);
// 	return true;
// }

function deleteDirectory(path, callback) {
	rimraf(path, { disableGlob: true }, callback);
}

function isPackageInCache(packageId) {
	let zipPath = getAppDataPackagePath(packageId);
	return fs.existsSync(zipPath);
}

function downloadPackage(packageId, dlType, targetPath, callback, authToken, urlIndex = 0) {
	let zipPath = getAppDataPackagePath(packageId);
	mkdirSync(appConfig.packageCachePath);
	mkdirSync(targetPath);

	getPackageChecksums(packageId, (checksums) => {
		let onDownloaded = (checkIntegrity) => {
			let onIntegrityCheckOK = () => {
				log('Extracting files from package...');
				extract(zipPath, { dir: targetPath }).then(() => {
					// fs.unlink(zipPath, function (err) {
					// 	if (err) {
					// 		log(panickMsg);
					// 		console.trace();
					// 		process.exit();
					// 	}
					// 	callback(targetPath);
					// });
					callback(targetPath);
				}, (err) => {
					log(panickMsg);
					console.trace();
					process.exit();
				});
			};
			if (checkIntegrity) {
				log(`Verifying package integrity`);
				getFileChecksum(zipPath, checksumHashFunction, (checksum) => {
					if (checksum !== checksums[dlType][checksumHashFunction]) {
						log(`Package integrity check failed`);
						log(`Deleting package`);
						fs.unlinkSync(zipPath);
						log(`Aborting`);
						process.exit();
					} else {
						onIntegrityCheckOK();
					}
				});
			} else {
				onIntegrityCheckOK();
			}
		};
		if (fs.existsSync(zipPath)) {
			log(`Package "${packageId}" found in cache`);
			log(`Verifying package integrity`);
			getFileChecksum(zipPath, checksumHashFunction, (checksum) => {
				if (checksum !== checksums[dlType][checksumHashFunction]) {
					log(`Package integrity check failed`);
					log(`Deleting package`);
					fs.unlinkSync(zipPath);
					log(`Downloading package`);
					downloadPackage(packageId, dlType, targetPath, callback, urlIndex);
				} else {
					onDownloaded(false);
				}
			});
		} else {
			getPackageDownloadUrls(packageId, (urls) => {
				let urlArray = urls[urlIndex];
				if (urlArray === undefined) {
					log("The package archive could not be downloaded.");
					process.exit();
				}
				let url = urlArray[dlType];
				getPackageJson(packageId, (package) => {
					let prefix = ' -> ';
					let downloadIndex = 0;
					let rawTotalSize = 0;
					for (let file of package.files) {
						rawTotalSize += file.size;
					}
					let sortedFiles = package.files.slice().sort((a, b) => a.size - b.size);
					if (rawTotalSize === 0) {
						let accumulatedSize = 0;
						for (let file of sortedFiles) {
							accumulatedSize += 1;
							file.atSizePercentage = accumulatedSize / files.length;
						}
					} else {
						let accumulatedSize = 0;
						for (let file of sortedFiles) {
							accumulatedSize += file.size;
							file.atSizePercentage = accumulatedSize / rawTotalSize;
						}
					}
					if (urlIndex === 0) {
						log(`Downloading package "${packageId}"`);
					}
					if (authToken !== undefined) {
						if (url.endsWith('?download')) { // hosted on bjspm.croncle.com
							url += `&authToken=${authToken}`;
						}
					}
					let loggedFirst = false;
					download(url, zipPath, (status) => {
						if (status.percentage === undefined) {
							return;
						}
						if (!loggedFirst) {
							log(prefix + sortedFiles[0].path);
							loggedFirst = true;
						}
						for (let i = downloadIndex; i < sortedFiles.length; i++) {
							let file = sortedFiles[i];
							let nextFile = sortedFiles[i + 1];
							if (status.percentage >= file.atSizePercentage) {
								if (nextFile !== undefined) {
									log(prefix + nextFile.path);
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
				}, authToken);
			}, authToken);
		}
	}, authToken);
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
	let url = webPackagesPath + packageId + '?tags' + (authToken ? `&authToken=${authToken}` : '');
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
	let url = webPackagesPath + packageId + '?versions' + (authToken ? `&authToken=${authToken}` : '');
	let _callback = (obj) => {
		packageVersionsCache[packageId] = obj;
		callback(obj);
	};
	getJson(url, _callback);
}

function getPackageJson(packageId, callback, authToken) {
	let url = webPackagesPath + packageId + '?json' + (authToken ? `&authToken=${authToken}` : '');
	getJson(url, callback);
}

function getBjspmPackageJson(packageId, callback, authToken, onError) {
	let url = webPackagesPath + packageId + '/bjspm/package.json' + (authToken ? `&authToken=${authToken}` : '');
	getJson(url, callback, onError);
}

function uploadPackage(path, fileData, authToken, type, access, tags, callback, onGotError = _onGotError) {
	log('Uploading package archive...');
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
			tags: JSON.stringify(tags)
		};
		for (let key in formData) {
			if (formData[key] !== null && formData[key] !== undefined) {
				form.append(key, formData[key]);
			}
		}
		try {
			let uploadIndex = 0;
			let loggedFirst = false;
			let prefix = ' -> ';
			let prevPercent = -1;
			let toLog = fileData.totalSize > logUploadThreshold;

			const { body } = await got.post('https://bjspm.croncle.com/api.php', {
				body: form
			}, (err) => {
				if (err) {
					log(panickMsg, err);
					process.exit();
				}
			}).on('uploadProgress', progress => {
				if (progress.percent === undefined) {
					return;
				}
				if (!loggedFirst) {
					if (toLog) {
						log(`0% ${prefix} ${fileData[0].path}`);
					}
					loggedFirst = true;
				}
				for (let i = uploadIndex; i < fileData.length; i++) {
					let file = fileData[i];
					let nextFile = fileData[i + 1];
					if (progress.percent >= file.atSizePercentage) {
						if (nextFile !== undefined) {
							let percent = Math.floor((i + 1) / fileData.length * 100);
							if (percent !== prevPercent) {
								prevPercent = percent;
								if (toLog) {
									log(`${percent}% ${prefix} ${nextFile.path}`);
								}
							}
						}
						uploadIndex++;
					}
				}
			});
			try {
				let obj = JSON.parse(body);
				if (obj.error) {
					log('ERROR', obj.error);
					process.exit();
				}
				callback(obj);
			} catch (e) {
				log(e, body);
				process.exit();
			}
		} catch (err) {
			onGotError(err);
		}
	});
}

function uploadReadme(package, authToken, callback, onGotError = _onGotError) {
	let readmePath = path.resolve(bjspmPath, 'readme.md');
	log('Uploading readme...');
	getTmpToken(async () => {
		const form = new FormData();
		const formData = {
			action: 'UPDATE_PACKAGE_README',
			authToken: authToken,
			tmpToken: tmpToken,
			package: package,
			readme: fs.createReadStream(readmePath)
		};
		for (let key in formData) {
			if (formData[key] !== null && formData[key] !== undefined) {
				form.append(key, formData[key]);
			}
		}
		try {
			const { body } = await got.post('https://bjspm.croncle.com/api.php', {
				body: form
			}, (err) => {
				if (err) {
					log(panickMsg, err);
					process.exit();
				}
			});
			try {
				let obj = JSON.parse(body);
				if (obj.error) {
					log('ERROR', obj.error);
					process.exit();
				}
				callback(obj);
			} catch (e) {
				log(e, body);
				process.exit();
			}
		} catch (err) {
			onGotError(err);
		}
	});
}

function getFileChecksum(path, algorithm, callback) {
	try {
		let hash = crypto.createHash(algorithm);
		let stream = fs.createReadStream(path);

		stream.on('data', function (data) {
			hash.update(data, 'utf8');
		})

		stream.on('end', function () {
			callback(hash.digest('hex'));
		});
	} catch (e) {
		log(e);
		process.exit();
	}
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
	return isString(tag) && tag.length < 256 && !semverValid(tag) && !isValidPackageVersionMajor(tag);
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

function isValidPackageInstallId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexInstallUser.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
}

function isValidLoosePackageId(id) {
	if (!isString(id)) {
		return false;
	}
	return regexUserVersioned.test(id) || regexUserMajor.test(id) || regexNamed.test(id) || regexUnnamed.test(id);
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

function zipFiles(files, callback) {
	tmp.dir({ unsafeCleanup: true }, (err, tmpDir, cleanupCallback) => {
		if (err) {
			log(panickMsg, err);
			process.exit();
		}
		let fileData = [];
		let totalSize = 0;
		let zipPath = tmpDir + '/archive.zip';
		var output = fs.createWriteStream(zipPath);
		var archive = archiver('zip', {
			zlib: { level: 9 } // Sets the compression level.
		});
		archive.pipe(output);

		for (let file of files) {
			if (!fs.existsSync) {
				log(`Non-existent file: "${file}"`);
				process.exit();
			}
			let stats = fs.statSync(file);
			if (stats.isDirectory()) {
				let entries = getDirectoryEntries(file, path.basename(file) + '/');
				if (entries.length === 0) {
					if (path.isAbsolute(file)) {
						if (logZipping) {
							log(`Packing ${file}...`);
						}
						archive.file(file, { name: path.basename(file) });
					} else {
						if (logZipping) {
							log(`Packing ${file}...`);
						}
						archive.file(path.resolve('.', file), { name: file });
					}
				} else {
					for (let entry of entries) {
						let entryStats = fs.statSync(entry.path);
						totalSize += entryStats.size;
						fileData.push({
							path: entry.path,
							size: entryStats.size
						});
						if (logZipping) {
							log(`Packing ${entry.path}...`);
						}
						archive.file("./" + entry.path, { name: entry.path });
					}
				}
			} else {
				totalSize += stats.size;
				fileData.push({
					path: file,
					size: stats.size
				});
				if (path.isAbsolute(file)) {
					if (logZipping) {
						log(`Packing ${file}...`);
					}
					archive.file(file, { name: path.basename(file) });
				} else {
					if (logZipping) {
						log(`Packing ${file}...`);
					}
					archive.file(path.resolve('.', file), { name: file });
				}
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
			callback({ zipPath: zipPath, fileData: fileData, cleanupCallback: cleanupCallback });
		});
	});
}

function zipPackage(callback) {
	tmp.dir({ unsafeCleanup: true }, (err, path, cleanupCallback) => {
		if (err) {
			log(panickMsg, err);
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
					archive.file("./" + entry.path, { name: entry.path });
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

function getEmptySubDirectories(dir) {
	let results = [];
	let list = fs.readdirSync(dir);

	for (let fileName of list) {
		let filePath = path.resolve(dir, fileName);
		let stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			let subFiles = fs.readdirSync(filePath)
			if (subFiles.length === 0) {
				results.push(filePath);
			} else {
				let subPaths = getEmptySubDirectories(filePath);
				results = results.concat(subPaths);
			}
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
			if (subPaths.length === 0) {
				results.push({
					folder: relDir,
					file: fileName,
					path: relDir + fileName
				});
			} else {
				results = results.concat(subPaths);
			}
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

function getLoginAuthToken() {
	if (appConfig.username !== null && authTokens[appConfig.username] !== undefined) {
		return authTokens[appConfig.username];
	} else {
		return null;
	}
}

function getPackageType() {
	if (package.name.length !== 0 && package.version.length !== 0 && package.username.length !== 0) { // user package
		return 'user';
	} else if (package.name.length !== 0) { // named standalone package
		return 'named';
	} else { // unnamed standalone package
		return 'unnamed';
	}
}

function getPackageTypeFromSid(sid) {
	if (sid.indexOf('@') !== -1) {
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
			return null;
		}
		fs.readFile(jsonPath, 'utf8', function (err, data) {
			if (err) {
				log(panickMsg, err);
				process.exit();
			}
			try {
				let obj = JSON.parse(data);
				callback(obj);
			} catch (e) {
				log(e);
				callback(null);
			}
		});
	} else {
		callback(null);
	}
}

function loadAppConfig(callback) {
	if (fs.existsSync(appDataConfigPath)) {
		fs.readFile(appDataConfigPath, 'utf8', function (err, data) {
			if (err) {
				log(panickMsg, err);
				process.exit();
			}
			appConfig = JSON.parse(data);
			callback();
		});
	} else {
		callback();
	}
}

function loadPackage(callback) {
	if (fs.existsSync(packageJsonPath)) {
		fs.readFile(packageJsonPath, 'utf8', function (err, data) {
			if (err) {
				log(panickMsg, err);
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
				log(panickMsg, err);
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
					log(panickMsg, err);
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
		fs.mkdirSync(path, { recursive: true });
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

function storeAppConfig() {
	let json = JSON.stringify(appConfig, undefined, 2);
	fs.writeFileSync(appDataConfigPath, json, 'utf8');
}

function getAuthToken(username, callback, useAuthStore = true) {
	if (authTokens[username] === undefined || !useAuthStore) {
		readline.question(`Password: `, (password) => {
			if (password.length === 0) {
				getAuthToken(username, callback);
				return;
			}
			apiPost({
				action: 'GET_USER_AUTH_TOKEN',
				username: username,
				password: password
			}, (obj) => {
				switch (obj.status) {
					case API_STATUS.OK:
						authTokens[username] = obj.authToken;
						storeAuthTokens();
						callback(obj.authToken);
						break;
					case API_STATUS.ERR:
						log('Server error: ' + obj.error);
						process.exit();
						break;
				}
			});
		});
	} else {
		callback(authTokens[username]);
	}
}

function initPackage() {
	log(`
This utility will walk you through creating a package.json file.
Press ^C at any time to quit.
`);

	let newPackage = getEmptyPackage();
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
				process.exit();
			} else {
				log('Aborted.\n');
				process.exit();
			}
		});
	};

	let descriptionSet = false;
	let licenseSet = false;
	let usernameSet = false;
	let packageNameSet = false;
	let askQuestion = () => {
		if (!packageNameSet) {
			let hasDefault = package.name.length !== 0 && isValidPackageName(package.name);
			readline.question(`package name: ${hasDefault ? `(${package.name}) ` : ''}`, (name) => {
				name = name.toLowerCase();
				if (hasDefault && name.length === 0) {
					newPackage.name = package.name;
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
		}
		if (newPackage.version.length === 0) {
			let hasDefault = package.version.length !== 0 && isValidPackageVersion(package.version);
			readline.question(`version: ${hasDefault ? `(${package.version}) ` : ''}`, (version) => {
				if (hasDefault && version.length === 0) {
					newPackage.version = package.version;
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
						log('Invalid package description.\n');
					}
				}
				log();
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
				log();
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
						log('Invalid license, must be a valid SPDX license expression.\n');
					}
				}
				log();
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
						log('Invalid username (/^[A-Za-z0-9_]{1,16}$/)\n');
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
		case 'init': {
			log(`
aliases: create, innit
`);
		}
			break;
		case 'i':
		case 'install': {
			log(`
bjspm install (with no args, in package dir)
bjspm install <hex_id>
bjspm install <pkg>_<hex_id>
bjspm install <@user>/<pkg>
bjspm install <@user>/<pkg>@<tag>
bjspm install <@user>/<pkg>@<version>
bjspm install <@user>/<pkg><version_major>
bjspm install <@user>/<pkg>@<version range>

options: --abs, --force

alias: i, isntall, add
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
			log(`
bjspm uninstall (with no args, in package dir)
bjspm uninstall <hex_id>
bjspm uninstall <pkg>_<hex_id>
bjspm uninstall <@user>/<pkg>@<version>
bjspm uninstall <@user>/<pkg><version_major>

aliases: u, un, unlink, remove, rm, r
`);
		}
			break;
		case 'update': {
			log(`
bjspm update [<pkg>...] [--abs] [--force]

alias: up, upgrade, udpate
`);
		}
			break;
		case 'p':
		case 'publish': {
			log(`
bjspm publish [<file|folder>...] [--type <unnamed|named|user>] [--tag <tag>] [--access <public|restricted>]

Publishes '.' if no argument supplied

Sets tag \`latest\` if no --tag specified
`);
		}
			break;
		case 'unpublish': {
			log(`
bjspm unpublish (with no args, package dir)
bjspm unpublish <pkg_hex_id>
bjspm unpublish <pkg>_<hex_id>
bjspm unpublish <@user>/<pkg>
bjspm unpublish <@user>/<pkg>@<version>
`);
		}
			break;
		case 'v':
		case 'version': {
			log(`
bjspm version [<newversion> | major | minor | patch | premajor | preminor | prepatch | prerelease] [--preid=<prerelease-id>]
(run in package dir)
'bjspm -v' or 'bjspm --version' to print bjspm version (${ version})
'bjspm ls' to inspect current package/dependency versions
`);
		}
			break;
		case 'push': {
			log(`
bjspm push readme
`);
		}
			break;
		case 'dist-tag': {
			log(`
bjspm dist-tag add <@user>/<pkg>@<version> [<tag>]
bjspm dist-tag rm <@user>/<pkg> <tag>
bjspm dist-tag ls [<@user>/<pkg>]

alias: dist-tags
`);
		}
			break;
		case 'access': {
			log(`
			bjspm access public [<package>]
bjspm access restricted [<package>]
bjspm access set <read-only|read-write> <user> [<package>]
bjspm access ls-packages [<user>]
bjspm access ls-collaborators [<package> [<user>]]
`);
		}
			break;
		case 'cache': {
			log(`
bjspm cache clear
bjspm cache verify
`);
		}
			break;
		case 'ls': {
			log(`
npm ls [[<@scope>/]<pkg> ...]

options: --json, --depth

aliases: list, la, ll
`);
		}
			break;
		case 'view': {
			log(`
bjspm view <hex_id> [<field>[.subfield]...]
bjspm view <pkg>_<hex_id> [<field>[.subfield]...]
bjspm view <@user>/<pkg> [<field>[.subfield]...]
bjspm view <@user>/<pkg>@<version> [<field>[.subfield]...]
bjspm view <@user>/<pkg><version_major>

aliases: v, info, show
`);
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
	[i]nstall, [u]ninstall, [p]ublish, [v]ersion

bjspm <command> -h  quick help on <command>
`);
	process.exit();
}