# 字体子集提取工具

使用 Fontmin 提取字体子集，针对"引领AI出版新范式"这几个字优化字体文件大小。

## 功能

从完整的字体文件中提取只包含特定文字的字体子集，可以大大减小文件大小（从 8MB 减小到约 10KB）。

## 安装

```bash
pnpm install
```

## 使用方法

### 提取字体子集

```bash
# 提取字体子集（只包含"引领AI出版新范式"）
pnpm run extract-font
```

提取后的字体文件会保存在 `public/font-subset/` 目录，包含：
- **WOFF2 格式**（约 10KB，推荐使用）
- WOFF 格式（约 33KB）
- TTF 格式（约 33KB）
- CSS 文件（包含 @font-face 声明）

## 在 Web 中使用

### 方式 1：引入生成的 CSS

```html
<link rel="stylesheet" href="./font-subset/HarmonyOS_SansSC_Bold.css">
```

### 方式 2：直接使用 @font-face

```css
@font-face {
  font-family: 'HarmonyOS Sans SC Bold';
  src: url('./font-subset/HarmonyOS_SansSC_Bold.woff2') format('woff2'),
       url('./font-subset/HarmonyOS_SansSC_Bold.woff') format('woff'),
       url('./font-subset/HarmonyOS_SansSC_Bold.ttf') format('truetype');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

.harmony-text {
  font-family: 'HarmonyOS Sans SC Bold', sans-serif;
}
```

### HTML 示例

```html
<span class="harmony-text">引领AI出版新范式</span>
```

完整示例请查看 `public/index.html`。

## 优势

- ✅ 文件大小从 8MB 减小到约 10KB（WOFF2）
- ✅ 加载速度大幅提升
- ✅ 只包含需要的字符，减少带宽消耗
- ✅ 支持多种字体格式（WOFF2、WOFF、TTF）

## 技术栈

- TypeScript
- Node.js
- Fontmin（字体子集化工具）
