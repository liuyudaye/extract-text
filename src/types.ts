/**
 * 字体提取相关的类型定义
 */

export interface FontGlyph {
  /** Unicode 码点 */
  unicode: number;
  /** 字符（如果可显示） */
  char: string;
  /** 字形名称 */
  name: string;
  /** 是否包含路径数据 */
  hasPath: boolean;
}

export interface FontInfo {
  /** 字体家族名称 */
  familyName: string;
  /** 字体子家族名称 */
  subfamilyName: string;
  /** 字体全名 */
  fullName: string;
  /** PostScript 名称 */
  postScriptName: string;
  /** 字符总数 */
  glyphCount: number;
  /** 所有字符信息 */
  glyphs: FontGlyph[];
  /** 提取的文本内容 */
  extractedText: string;
}

export interface ExtractOptions {
  /** 是否只提取可打印字符（默认 true） */
  printableOnly?: boolean;
  /** 是否包含 ASCII 控制字符（默认 false） */
  includeControlChars?: boolean;
  /** 自定义字符过滤函数 */
  filter?: (char: string, unicode: number) => boolean;
  /** 输出格式：'text' | 'json' | 'array'（默认 'text'） */
  outputFormat?: 'text' | 'json' | 'array';
}

