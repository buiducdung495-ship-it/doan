const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Remove asset fetching block
code = code.replace(/fetch\('\/api\/assets'\)[\s\S]*?\),/, '');
code = code.replace(/assetsRes,/g, '');
code = code.replace(/const safeAssets = Array\.isArray\(assetsRes\) \? assetsRes : \[\];/, '');
code = code.replace(/setAssets\(safeAssets\);/, '');
code = code.replace(/const \[assets, setAssets\] = useState<Asset\[\]>\(\[\]\);/, '');

// Remove indexing
code = code.replace(/\/\/ 6\. Assets[\s\S]*?tab: 'assets',\n\s*badge: 'Tài sản'\n\s*\}\);\n\s*\}\);/g, '');

// Remove handlers
code = code.replace(/const handleRequestAsset = async \([\s\S]*?\}\n\s*\};/g, '');
code = code.replace(/const handleReturnAsset = async \([\s\S]*?\}\n\s*\};/g, '');
code = code.replace(/const handleExchangeAsset = async \([\s\S]*?\}\n\s*\};/g, '');
code = code.replace(/const handleBuybackAsset = async \([\s\S]*?\}\n\s*\};/g, '');
code = code.replace(/const handleApproveAsset = async \([\s\S]*?\}\n\s*\};/g, '');
code = code.replace(/const handleRejectAsset = async \([\s\S]*?\}\n\s*\};/g, '');

// Remove rendering
code = code.replace(/\{currentTab === 'assets' && \([\s\S]*?\} \/>\n\s*\)\}/, '');
code = code.replace(/assets=\{assets\}/g, '');
code = code.replace(/import \{ AssetManager \} from '\.\/components\/AssetManager';/g, '');

fs.writeFileSync('src/App.tsx', code);
console.log('Done');
