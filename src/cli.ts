#!/usr/bin/env node

/**
 * 命令行工具入口
 * 
 * 用法：
 *   extract-text <font-file> [options]
 * 
 * 选项：
 *   --format <text|json|array>  输出格式（默认：text）
 *   --output <file>             输出到文件（默认：输出到控制台）
 *   --printable-only            只提取可打印字符（默认：true）
 *   --include-control           包含控制字符
 *   --info                      显示字体信息
 */

import { extractTextFromFont } from './font-extractor.js';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

interface CliOptions {
  format: 'text' | 'json' | 'array';
  output?: string;
  printableOnly: boolean;
  includeControl: boolean;
  info: boolean;
}

/**
 * 解析命令行参数
 */
function parseArgs(): { fontPath: string; options: CliOptions } {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('错误：请提供字体文件路径');
    console.error('用法：extract-text <font-file> [options]');
    console.error('');
    console.error('选项：');
    console.error('  --format <text|json|array>  输出格式（默认：text）');
    console.error('  --output <file>             输出到文件');
    console.error('  --printable-only            只提取可打印字符（默认：true）');
    console.error('  --include-control           包含控制字符');
    console.error('  --info                      显示字体信息');
    process.exit(1);
  }
  
  const fontPath = args[0];
  const options: CliOptions = {
    format: 'text',
    printableOnly: true,
    includeControl: false,
    info: false
  };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--format' && i + 1 < args.length) {
      const format = args[++i] as 'text' | 'json' | 'array';
      if (['text', 'json', 'array'].includes(format)) {
        options.format = format;
      } else {
        console.error(`错误：无效的输出格式 "${format}"，支持：text, json, array`);
        process.exit(1);
      }
    } else if (arg === '--output' && i + 1 < args.length) {
      options.output = args[++i];
    } else if (arg === '--printable-only') {
      options.printableOnly = true;
    } else if (arg === '--include-control') {
      options.includeControl = true;
      options.printableOnly = false;
    } else if (arg === '--info') {
      options.info = true;
    } else {
      console.error(`错误：未知选项 "${arg}"`);
      process.exit(1);
    }
  }
  
  return { fontPath, options };
}

/**
 * 主函数
 */
async function main() {
  try {
    const { fontPath, options } = parseArgs();
    
    console.log(`正在解析字体文件：${fontPath}`);
    console.log('');
    
    // 提取文字
    const fontInfo = await extractTextFromFont(fontPath, {
      printableOnly: options.printableOnly,
      includeControlChars: options.includeControl,
      outputFormat: options.format
    });
    
    // 显示字体信息
    if (options.info) {
      console.log('字体信息：');
      console.log(`  字体家族：${fontInfo.familyName}`);
      console.log(`  子家族：${fontInfo.subfamilyName}`);
      console.log(`  全名：${fontInfo.fullName}`);
      console.log(`  PostScript 名称：${fontInfo.postScriptName}`);
      console.log(`  字符总数：${fontInfo.glyphCount}`);
      console.log('');
    }
    
    // 准备输出内容
    let output: string;
    if (options.format === 'json') {
      output = JSON.stringify(fontInfo, null, 2);
    } else if (options.format === 'array') {
      output = JSON.stringify(fontInfo.glyphs.map(g => g.char), null, 2);
    } else {
      output = fontInfo.extractedText;
    }
    
    // 输出到文件或控制台
    if (options.output) {
      const outputPath = resolve(options.output);
      writeFileSync(outputPath, output, 'utf-8');
      console.log(`已保存到：${outputPath}`);
      console.log(`字符数：${fontInfo.glyphCount}`);
    } else {
      console.log('提取的文字：');
      console.log('---');
      console.log(output);
      console.log('---');
      console.log(`字符数：${fontInfo.glyphCount}`);
    }
    
  } catch (error) {
    console.error('错误：', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 执行主函数
main();

