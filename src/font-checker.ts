/**
 * 字体字符检查工具
 * 
 * 用于检查字体文件是否包含特定的字符或文字
 */

import * as opentype from 'opentype.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export interface CharCheckResult {
  /** 字符 */
  char: string;
  /** Unicode 码点 */
  unicode: number;
  /** 是否存在于字体中 */
  exists: boolean;
  /** 字形名称（如果存在） */
  glyphName?: string;
}

export interface TextCheckResult {
  /** 检查的文字 */
  text: string;
  /** 每个字符的检查结果 */
  chars: CharCheckResult[];
  /** 是否所有字符都存在 */
  allExists: boolean;
  /** 缺失的字符列表 */
  missingChars: string[];
}

/**
 * 检查字体文件是否包含指定的字符
 * 
 * @param fontPath 字体文件路径
 * @param char 要检查的字符
 * @returns 检查结果
 */
export function checkCharInFont(fontPath: string, char: string): CharCheckResult {
  const absolutePath = resolve(fontPath);
  const fontBuffer = readFileSync(absolutePath);
  const font = opentype.parse(fontBuffer.buffer);
  
  // 获取字符的 Unicode 码点
  // 对于多字节字符（如中文），使用 codePointAt(0) 获取完整的 Unicode 码点
  const unicode = char.codePointAt(0) ?? char.charCodeAt(0);
  
  // 在字体中查找对应的字形
  // opentype.js 的字体对象提供了 charToGlyph 方法，但需要先检查字符是否在字符映射表中
  let exists = false;
  let glyphName: string | undefined;
  
  // 遍历所有字形查找匹配的 Unicode
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    if (glyph.unicode === unicode) {
      exists = true;
      glyphName = glyph.name || `glyph_${i}`;
      break;
    }
  }
  
  return {
    char,
    unicode,
    exists,
    glyphName
  };
}

/**
 * 检查字体文件是否包含指定的文字（字符串）
 * 
 * @param fontPath 字体文件路径
 * @param text 要检查的文字
 * @returns 检查结果，包含每个字符的检查状态
 */
export function checkTextInFont(fontPath: string, text: string): TextCheckResult {
  const absolutePath = resolve(fontPath);
  const fontBuffer = readFileSync(absolutePath);
  const font = opentype.parse(fontBuffer.buffer);
  
  // 将文字拆分为字符数组
  // 使用 Array.from 或扩展运算符可以正确处理多字节字符（如 emoji、某些 CJK 字符）
  const chars = Array.from(text);
  const charResults: CharCheckResult[] = [];
  const missingChars: string[] = [];
  
  // 为每个字符创建 Unicode 码点到字形的映射（优化性能，避免重复遍历）
  const unicodeToGlyph = new Map<number, { name: string; index: number }>();
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    if (glyph.unicode !== undefined && glyph.unicode !== null) {
      unicodeToGlyph.set(glyph.unicode, {
        name: glyph.name || `glyph_${i}`,
        index: i
      });
    }
  }
  
  // 检查每个字符
  for (const char of chars) {
    const unicode = char.codePointAt(0) ?? char.charCodeAt(0);
    const glyphInfo = unicodeToGlyph.get(unicode);
    
    const exists = glyphInfo !== undefined;
    const result: CharCheckResult = {
      char,
      unicode,
      exists,
      glyphName: glyphInfo?.name
    };
    
    charResults.push(result);
    
    if (!exists) {
      missingChars.push(char);
    }
  }
  
  return {
    text,
    chars: charResults,
    allExists: missingChars.length === 0,
    missingChars
  };
}

/**
 * 批量检查多个文字是否都在字体中
 * 
 * @param fontPath 字体文件路径
 * @param texts 要检查的文字数组
 * @returns 每个文字的检查结果
 */
export function checkMultipleTextsInFont(
  fontPath: string,
  texts: string[]
): TextCheckResult[] {
  return texts.map(text => checkTextInFont(fontPath, text));
}

