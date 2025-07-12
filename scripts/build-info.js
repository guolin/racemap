const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 获取git信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const shortHash = commitHash.substring(0, 7);
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const lastCommitTime = execSync('git log -1 --format=%cd', { encoding: 'utf8' }).trim();
    
    return {
      commitHash,
      shortHash,
      branch,
      lastCommitTime
    };
  } catch (error) {
    console.warn('无法获取git信息:', error.message);
    return {
      commitHash: 'unknown',
      shortHash: 'unknown',
      branch: 'unknown',
      lastCommitTime: new Date().toISOString()
    };
  }
}

// 读取package.json获取版本号
function getPackageVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.warn('无法读取package.json:', error.message);
    return '0.1.0';
  }
}

// 生成版本信息
function generateBuildInfo() {
  const gitInfo = getGitInfo();
  const version = getPackageVersion();
  const buildTime = new Date().toISOString();
  
  const buildInfo = {
    version,
    commitHash: gitInfo.commitHash,
    shortHash: gitInfo.shortHash,
    branch: gitInfo.branch,
    buildTime,
    lastCommitTime: gitInfo.lastCommitTime
  };
  
  // 写入到.env.local文件
  const envContent = `# 自动生成的构建信息
NEXT_PUBLIC_APP_VERSION=${version}
NEXT_PUBLIC_COMMIT_HASH=${gitInfo.commitHash}
NEXT_PUBLIC_BUILD_TIME=${buildTime}
NEXT_PUBLIC_BRANCH=${gitInfo.branch}
`;
  
  fs.writeFileSync('.env.local', envContent);
  
  // 也写入到public目录，供静态文件访问
  const publicBuildInfo = {
    ...buildInfo,
    generatedAt: buildTime
  };
  
  fs.writeFileSync(
    path.join('public', 'build-info.json'), 
    JSON.stringify(publicBuildInfo, null, 2)
  );
  
  console.log('构建信息已生成:');
  console.log(`版本: ${version}`);
  console.log(`提交: ${gitInfo.shortHash}`);
  console.log(`分支: ${gitInfo.branch}`);
  console.log(`构建时间: ${new Date(buildTime).toLocaleString('zh-CN')}`);
}

generateBuildInfo(); 