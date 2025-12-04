#!/usr/bin/env node

/**
 * 使用 Fontmin 提取字体子集
 *
 * 从完整的字体文件中提取只包含"引领AI出版新范式"这几个字的子集字体
 * 可以大大减小字体文件的大小（从几 MB 减小到几 KB）
 *
 * Fontmin 是一个字体子集化工具，支持：
 * - 提取指定字符
 * - 转换为多种格式（TTF、WOFF、WOFF2、EOT、SVG）
 * - 生成 CSS 文件
 */

import { createRequire } from 'module';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Fontmin 是 CommonJS 模块，需要使用 createRequire 来导入
// 这样可以兼容 ES modules 项目
const require = createRequire(import.meta.url);
const Fontmin = require('fontmin');

// 目标文字
const TARGET_TEXT = '”引领AI出版新范式“';

// 字体文件路径
const SOURCE_FONT = resolve('public/HarmonyOS_SansSC_Bold.ttf');

// 输出目录
const OUTPUT_DIR = resolve('public/font-subset');

/**
 * 主函数
 */
async function main() {
  try {
    console.log('开始提取字体子集...');
    console.log(`源字体文件：${SOURCE_FONT}`);
    console.log(`目标文字：${TARGET_TEXT}`);
    console.log(`输出目录：${OUTPUT_DIR}`);
    console.log('');

    // 检查源字体文件是否存在
    if (!existsSync(SOURCE_FONT)) {
      throw new Error(`源字体文件不存在：${SOURCE_FONT}`);
    }

    // 确保输出目录存在
    if (!existsSync(OUTPUT_DIR)) {
      mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`已创建输出目录：${OUTPUT_DIR}`);
    }

    // 创建 Fontmin 实例
    // Fontmin 使用链式 API 来配置处理流程
    const fontmin = new Fontmin()
      // 指定源字体文件
      .src(SOURCE_FONT)
      // 提取指定文字的字形（glyph）
      // 这是核心功能：只保留 TARGET_TEXT 中包含的字符
      // glyph 插件会从完整字体中提取只包含指定字符的子集
      .use(
        Fontmin.glyph({
          text: TARGET_TEXT,
          // hinting: true 可以保留字体的 hinting 信息，提高渲染质量
          hinting: true,
        })
      )
      // 转换为 WOFF 格式（Web Open Font Format，压缩率更高）
      // 注意：glyph 插件已经生成了 TTF，这里直接转换
      .use(Fontmin.ttf2woff())
      // 转换为 WOFF2 格式（更现代的格式，压缩率最高）
      .use(Fontmin.ttf2woff2())
      // 生成 CSS 文件，包含 @font-face 声明
      // 这个插件会自动生成包含所有格式的 CSS
      .use(
        Fontmin.css({
          // 字体家族名称
          fontFamily: 'HarmonyOS Sans SC Bold',
          // 基础路径（相对于 CSS 文件）
          base64: false,
          // 字体样式
          fontStyle: 'normal',
          fontWeight: 'bold',
        })
      )
      // 指定输出目录
      .dest(OUTPUT_DIR);

    // 执行处理
    // Fontmin 使用回调方式，这里包装成 Promise 以便使用 async/await
    await new Promise<void>((resolve, reject) => {
      fontmin.run((err: Error | null, files?: Array<{ path: string; contents: Buffer }>) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('字体子集提取完成！');
        console.log('');
        console.log('生成的文件：');
        files?.forEach((file: { path: string; contents: Buffer }) => {
          const sizeKB = (file.contents.length / 1024).toFixed(2);
          console.log(`  - ${file.path} (${sizeKB} KB)`);
        });

        console.log('');
        console.log('✅ 字体子集提取成功！');
        console.log('');
        console.log('使用方式：');
        console.log(`  1. 在 HTML 中引入生成的 CSS：`);
        console.log(`     <link rel="stylesheet" href="./font-subset/HarmonyOS_SansSC_Bold.css">`);
        console.log('');
        console.log(`  2. 或者直接使用 @font-face：`);
        console.log(`     @font-face {`);
        console.log(`       font-family: 'HarmonyOS Sans SC Bold';`);
        console.log(`       src: url('./font-subset/HarmonyOS_SansSC_Bold.woff2') format('woff2'),`);
        console.log(`            url('./font-subset/HarmonyOS_SansSC_Bold.woff') format('woff'),`);
        console.log(`            url('./font-subset/HarmonyOS_SansSC_Bold.ttf') format('truetype');`);
        console.log(`       font-weight: bold;`);
        console.log(`       font-style: normal;`);
        console.log(`       font-display: swap;`);
        console.log(`     }`);

        resolve();
      });
    });
  } catch (error) {
    console.error('❌ 错误：', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// 执行主函数
main();
