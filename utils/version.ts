// 版本信息工具
export interface VersionInfo {
  version: string;
  commitHash: string;
  buildTime: string;
  environment: string;
}

// 从环境变量或构建时生成的版本信息
export function getVersionInfo(): VersionInfo {
  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    commitHash: process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
}

// 获取简化的版本显示文本
export function getVersionText(): string {
  const info = getVersionInfo();
  const shortHash = info.commitHash.substring(0, 7);
  const buildDate = new Date(info.buildTime).toLocaleDateString('zh-CN');
  
  return `v${info.version} (${shortHash}) - ${buildDate}`;
} 