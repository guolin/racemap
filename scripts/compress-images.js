const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function compressLogo() {
  try {
    const inputPath = 'public/logo.png';
    const outputPath = 'public/logo-compressed.png';
    
    // 获取原始文件大小
    const originalStats = fs.statSync(inputPath);
    const originalSizeKB = (originalStats.size / 1024).toFixed(2);
    
    console.log(`原始文件大小: ${originalSizeKB} KB`);
    
    // 压缩图片
    await sharp(inputPath)
      .png({ 
        quality: 80,  // 质量设置为80%
        compressionLevel: 9  // 最高压缩级别
      })
      .toFile(outputPath);
    
    // 获取压缩后文件大小
    const compressedStats = fs.statSync(outputPath);
    const compressedSizeKB = (compressedStats.size / 1024).toFixed(2);
    
    console.log(`压缩后文件大小: ${compressedSizeKB} KB`);
    console.log(`压缩率: ${((1 - compressedStats.size / originalStats.size) * 100).toFixed(1)}%`);
    
    // 备份原文件并替换
    fs.renameSync(inputPath, 'public/logo-backup.png');
    fs.renameSync(outputPath, inputPath);
    
    console.log('压缩完成！原文件已备份为 logo-backup.png');
    
  } catch (error) {
    console.error('压缩失败:', error);
  }
}

compressLogo(); 