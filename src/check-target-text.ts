#!/usr/bin/env node

/**
 * 检查目标文字是否在字体文件中
 * 
 * 专门用于检查"引领AI出版新范式"是否在鸿蒙字体中
 */

import { checkTextInFont } from './font-checker.js';
import { resolve } from 'path';

const TARGET_TEXT = '引领AI出版新范式';
const FONT_PATH = resolve('public/HarmonyOS_SansSC_Bold.ttf');

async function main() {
  try {
    console.log(`检查文字："${TARGET_TEXT}"`);
    console.log(`字体文件：${FONT_PATH}`);
    console.log('');
    
    const result = checkTextInFont(FONT_PATH, TARGET_TEXT);
    
    console.log('检查结果：');
    console.log('---');
    
    // 显示每个字符的检查结果
    for (const charResult of result.chars) {
      const status = charResult.exists ? '✓' : '✗';
      const unicodeHex = `U+${charResult.unicode.toString(16).toUpperCase().padStart(4, '0')}`;
      console.log(`${status} ${charResult.char} (${unicodeHex}) ${charResult.exists ? `- ${charResult.glyphName}` : '- 缺失'}`);
    }
    
    console.log('---');
    console.log('');
    
    if (result.allExists) {
      console.log('✅ 所有字符都存在于字体中！');
      console.log('');
      console.log('可以使用以下 CSS 来应用字体：');
      console.log('');
      console.log(`@font-face {
  font-family: 'HarmonyOS Sans SC Bold';
  src: url('./public/HarmonyOS_SansSC_Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

.target-text {
  font-family: 'HarmonyOS Sans SC Bold', sans-serif;
}`);
    } else {
      console.log('❌ 以下字符在字体中缺失：');
      result.missingChars.forEach(char => {
        const unicode = char.codePointAt(0) ?? char.charCodeAt(0);
        const unicodeHex = `U+${unicode.toString(16).toUpperCase().padStart(4, '0')}`;
        console.log(`  - ${char} (${unicodeHex})`);
      });
    }
    
  } catch (error) {
    console.error('错误：', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();

