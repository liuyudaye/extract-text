/**
 * 字体文件文字提取核心模块
 * 
 * 使用 opentype.js 解析字体文件（TTF、OTF 等），提取其中包含的所有字符
 */

import * as opentype from 'opentype.js';
import type { FontInfo, FontGlyph, ExtractOptions } from './types.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * 判断字符是否为可打印字符
 * Unicode 范围参考：
 * - 基本拉丁文：U+0020-U+007E（空格到波浪号）
 * - 拉丁文补充：U+00A0-U+00FF
 * - 中文：U+4E00-U+9FFF（CJK 统一汉字）
 * - 其他常用可打印字符范围
 */
function isPrintableChar(char: string, unicode: number): boolean {
  // ASCII 可打印字符（排除控制字符 0x00-0x1F 和 DEL 0x7F）
  if (unicode >= 0x20 && unicode <= 0x7E) {
    return true;
  }
  
  // 扩展 ASCII（Latin-1 Supplement）
  if (unicode >= 0xA0 && unicode <= 0xFF) {
    return true;
  }
  
  // CJK 统一汉字
  if (unicode >= 0x4E00 && unicode <= 0x9FFF) {
    return true;
  }
  
  // CJK 扩展 A
  if (unicode >= 0x3400 && unicode <= 0x4DBF) {
    return true;
  }
  
  // CJK 扩展 B
  if (unicode >= 0x20000 && unicode <= 0x2A6DF) {
    return true;
  }
  
  // 其他常用 Unicode 块
  // 拉丁文扩展 A
  if (unicode >= 0x0100 && unicode <= 0x017F) {
    return true;
  }
  
  // 拉丁文扩展 B
  if (unicode >= 0x0180 && unicode <= 0x024F) {
    return true;
  }
  
  // 希腊文
  if (unicode >= 0x0370 && unicode <= 0x03FF) {
    return true;
  }
  
  // 西里尔文
  if (unicode >= 0x0400 && unicode <= 0x04FF) {
    return true;
  }
  
  // 日文平假名
  if (unicode >= 0x3040 && unicode <= 0x309F) {
    return true;
  }
  
  // 日文片假名
  if (unicode >= 0x30A0 && unicode <= 0x30FF) {
    return true;
  }
  
  // 韩文音节
  if (unicode >= 0xAC00 && unicode <= 0xD7AF) {
    return true;
  }
  
  // 表情符号和符号（部分）
  if (unicode >= 0x1F300 && unicode <= 0x1F9FF) {
    return true;
  }
  
  // 如果字符本身可以正常显示（非控制字符、非代理对等），也认为是可打印的
  // 这里使用简单的启发式：如果 unicode > 0x1F 且不在代理对范围内
  if (unicode > 0x1F && !(unicode >= 0xD800 && unicode <= 0xDFFF)) {
    // 尝试转换为字符，如果能正常显示则认为是可打印的
    try {
      const charCode = String.fromCharCode(unicode);
      // 排除一些明显的控制字符和特殊字符
      if (charCode.trim() !== '' || unicode === 0x20) {
        return true;
      }
    } catch {
      // 转换失败，跳过
    }
  }
  
  return false;
}

/**
 * 从字体文件中提取所有字符信息
 * 
 * @param fontPath 字体文件路径（支持 TTF、OTF 等）
 * @param options 提取选项
 * @returns 字体信息和提取的字符
 */
export async function extractTextFromFont(
  fontPath: string,
  options: ExtractOptions = {}
): Promise<FontInfo> {
  const {
    printableOnly = true,
    includeControlChars = false,
    filter,
    outputFormat = 'text'
  } = options;

  // 解析绝对路径，避免相对路径问题
  const absolutePath = resolve(fontPath);
  
  // 读取字体文件（opentype.js 需要 Buffer）
  const fontBuffer = readFileSync(absolutePath);
  
  // 使用 opentype.js 解析字体文件
  // parse 方法可以接受 Buffer、ArrayBuffer 或文件路径
  const font = opentype.parse(fontBuffer.buffer);
  
  // 提取字体元信息
  const familyName = font.names.fontFamily?.en || font.names.fontFamily || 'Unknown';
  const subfamilyName = font.names.fontSubfamily?.en || font.names.fontSubfamily || 'Unknown';
  const fullName = font.names.fullName?.en || font.names.fullName || `${familyName} ${subfamilyName}`;
  const postScriptName = font.names.postScriptName?.en || font.names.postScriptName || fullName.replace(/\s+/g, '');
  
  // 收集所有字形信息
  const glyphs: FontGlyph[] = [];
  const textSet = new Set<string>(); // 用于去重和快速查找
  
  // 遍历字体中的所有字形
  // font.glyphs 是一个字形数组，每个字形包含 Unicode 码点信息
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    
    // 获取字形的 Unicode 码点
    // 一个字形可能对应多个 Unicode（如连字），这里取第一个
    const unicode = glyph.unicode !== undefined ? glyph.unicode : null;
    
    // 跳过没有 Unicode 码点的字形（通常是复合字形、标记等）
    if (unicode === null || unicode === undefined) {
      continue;
    }
    
    // 将 Unicode 码点转换为字符
    // 注意：某些 Unicode 码点可能无法用单个字符表示（如代理对），需要特殊处理
    let char: string;
    try {
      // 对于基本多文种平面（BMP，0x0000-0xFFFF）的字符，可以直接转换
      if (unicode <= 0xFFFF) {
        char = String.fromCharCode(unicode);
      } else {
        // 对于超出 BMP 的字符（如某些 CJK 扩展字符、表情符号），需要使用代理对
        // JavaScript 的 String.fromCharCode 无法直接处理，需要使用 String.fromCodePoint
        char = String.fromCodePoint(unicode);
      }
    } catch (error) {
      // 转换失败，跳过该字符
      console.warn(`无法转换 Unicode 码点 ${unicode} (0x${unicode.toString(16)})`);
      continue;
    }
    
    // 应用过滤条件
    let shouldInclude = true;
    
    // 1. 可打印字符过滤
    if (printableOnly && !isPrintableChar(char, unicode)) {
      shouldInclude = false;
    }
    
    // 2. 控制字符过滤
    if (!includeControlChars && unicode >= 0x00 && unicode <= 0x1F) {
      shouldInclude = false;
    }
    
    // 3. 自定义过滤函数
    if (shouldInclude && filter && !filter(char, unicode)) {
      shouldInclude = false;
    }
    
    if (!shouldInclude) {
      continue;
    }
    
    // 检查是否已存在（去重）
    if (textSet.has(char)) {
      continue;
    }
    
    // 记录字形信息
    glyphs.push({
      unicode,
      char,
      name: glyph.name || `glyph_${i}`,
      hasPath: glyph.path !== undefined && glyph.path !== null
    });
    
    textSet.add(char);
  }
  
  // 按 Unicode 码点排序，便于查看和输出
  glyphs.sort((a, b) => a.unicode - b.unicode);
  
  // 根据输出格式生成文本
  let extractedText: string;
  switch (outputFormat) {
    case 'array':
      extractedText = JSON.stringify(glyphs.map(g => g.char), null, 2);
      break;
    case 'json':
      extractedText = JSON.stringify(glyphs, null, 2);
      break;
    case 'text':
    default:
      // 直接拼接所有字符
      extractedText = glyphs.map(g => g.char).join('');
      break;
  }
  
  return {
    familyName,
    subfamilyName,
    fullName,
    postScriptName,
    glyphCount: glyphs.length,
    glyphs,
    extractedText
  };
}

/**
 * 同步版本的提取函数（用于某些场景）
 * 
 * 注意：由于文件读取是同步的，这个函数实际上也是同步的
 * 但为了保持 API 一致性，提供异步版本
 */
export function extractTextFromFontSync(
  fontPath: string,
  options: ExtractOptions = {}
): FontInfo {
  // 直接调用异步版本，但立即执行
  // 由于内部操作都是同步的，这里可以安全地同步执行
  const absolutePath = resolve(fontPath);
  const fontBuffer = readFileSync(absolutePath);
  const font = opentype.parse(fontBuffer.buffer);
  
  const {
    printableOnly = true,
    includeControlChars = false,
    filter,
    outputFormat = 'text'
  } = options;
  
  const familyName = font.names.fontFamily?.en || font.names.fontFamily || 'Unknown';
  const subfamilyName = font.names.fontSubfamily?.en || font.names.fontSubfamily || 'Unknown';
  const fullName = font.names.fullName?.en || font.names.fullName || `${familyName} ${subfamilyName}`;
  const postScriptName = font.names.postScriptName?.en || font.names.postScriptName || fullName.replace(/\s+/g, '');
  
  const glyphs: FontGlyph[] = [];
  const textSet = new Set<string>();
  
  for (let i = 0; i < font.glyphs.length; i++) {
    const glyph = font.glyphs.get(i);
    const unicode = glyph.unicode !== undefined ? glyph.unicode : null;
    
    if (unicode === null || unicode === undefined) {
      continue;
    }
    
    let char: string;
    try {
      if (unicode <= 0xFFFF) {
        char = String.fromCharCode(unicode);
      } else {
        char = String.fromCodePoint(unicode);
      }
    } catch (error) {
      continue;
    }
    
    let shouldInclude = true;
    
    if (printableOnly && !isPrintableChar(char, unicode)) {
      shouldInclude = false;
    }
    
    if (!includeControlChars && unicode >= 0x00 && unicode <= 0x1F) {
      shouldInclude = false;
    }
    
    if (shouldInclude && filter && !filter(char, unicode)) {
      shouldInclude = false;
    }
    
    if (!shouldInclude || textSet.has(char)) {
      continue;
    }
    
    glyphs.push({
      unicode,
      char,
      name: glyph.name || `glyph_${i}`,
      hasPath: glyph.path !== undefined && glyph.path !== null
    });
    
    textSet.add(char);
  }
  
  glyphs.sort((a, b) => a.unicode - b.unicode);
  
  let extractedText: string;
  switch (outputFormat) {
    case 'array':
      extractedText = JSON.stringify(glyphs.map(g => g.char), null, 2);
      break;
    case 'json':
      extractedText = JSON.stringify(glyphs, null, 2);
      break;
    case 'text':
    default:
      extractedText = glyphs.map(g => g.char).join('');
      break;
  }
  
  return {
    familyName,
    subfamilyName,
    fullName,
    postScriptName,
    glyphCount: glyphs.length,
    glyphs,
    extractedText
  };
}

