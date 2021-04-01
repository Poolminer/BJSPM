if(process.platform === 'win32'){
	const fs = require('fs');
	const path = require('path');
	const getAppDataPath = require('appdata-path');
	const ps1 = path.resolve(getAppDataPath(), 'npm', 'bjspm.ps1');
	
	if (fs.existsSync(ps1)) {
		try {
			fs.unlinkSync(ps1);
		} catch (e) {}
	}
}