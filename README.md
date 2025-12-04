# Extract Text - 字体文件文字提取工具

从字体文件（TTF、OTF 等）中提取所有包含的字符。

## 安装

```bash
npm install
npm run build
```

## 使用方法

### 命令行工具

```bash
# 基本用法
npm run build
node dist/cli.js <字体文件路径>

# 输出到文件
node dist/cli.js font.ttf --output output.txt

# JSON 格式输出
node dist/cli.js font.ttf --format json --output output.json

# 显示字体信息
node dist/cli.js font.ttf --info

# 包含控制字符
node dist/cli.js font.ttf --include-control
```

### 编程方式使用

```typescript
import { extractTextFromFont } from './src/index.js';

const fontInfo = await extractTextFromFont('font.ttf', {
  printableOnly: true,
  outputFormat: 'text'
});

console.log(fontInfo.extractedText);
console.log(`字符数：${fontInfo.glyphCount}`);
```

## API

### `extractTextFromFont(fontPath: string, options?: ExtractOptions): Promise<FontInfo>`

从字体文件中提取文字。

**参数：**
- `fontPath`: 字体文件路径
- `options`: 提取选项
  - `printableOnly`: 是否只提取可打印字符（默认：true）
  - `includeControlChars`: 是否包含控制字符（默认：false）
  - `filter`: 自定义字符过滤函数
  - `outputFormat`: 输出格式，'text' | 'json' | 'array'（默认：'text'）

**返回：**
- `FontInfo` 对象，包含字体信息和提取的字符

## 技术栈

- TypeScript
- Node.js
- opentype.js（字体解析库）

