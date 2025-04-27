const iconv = require('iconv-lite');
const chardet = require('chardet');
const path = require('path');
const fs = require('fs/promises');

// 读取 TXT 文件内容，支持指定编码
const readTxtFile = async (filePath, encoding = 'utf8') => {
    try {
        const buffer = await fs.readFile(filePath);
        return iconv.decode(buffer, encoding);
    } catch (err) {
        throw new Error(`读取文件 ${filePath} 时出错: ${err.message}`);
    }
}

// 检测文件编码
const detectEncoding = async (filePath) => {
    const buffer = await fs.readFile(filePath);
    const detectedEncoding = chardet.detect(buffer);
    return detectedEncoding || 'utf8';
}


module.exports = {
    detectEncoding, readTxtFile
};