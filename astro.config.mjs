// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import katex from 'katex';

// 用 loadEnv 读取环境变量（同时兼容 .env 文件与 CI/终端注入的变量）
// 文档参考：https://docs.astro.build/en/guides/environment-variables/#using-environment-variables-in-astroconfig
const { PUBLIC_SITE, PUBLIC_BASE } = loadEnv(import.meta.env.MODE, process.cwd(), '');

// GitHub Pages 部署配置（详见 README「🚀 部署到 GitHub Pages」）
// - 用户站点 <username>.github.io：PUBLIC_BASE 留空或 '/'（默认）
// - 项目站点 <username>.github.io/<repo>/：PUBLIC_BASE 设为 '/<repo>'
// 可在 .env 中配置，也可在 GitHub 仓库 Settings → Actions → Variables 中配置，
// 由 .github/workflows/deploy.yml 注入构建环境。
// 兜底值 = 本站实际地址，避免变量缺失时静默生成错误的绝对链接（canonical / RSS / sitemap）
const site = PUBLIC_SITE || 'https://Junjun404.github.io';
const base = PUBLIC_BASE || '/';

// LaTeX 公式渲染：把 Sätteri 解析出的 math / inlineMath 节点渲染成 KaTeX HTML。
// 只需提供符合 MdastPluginDefinition 形状的对象（name + 按节点类型命名的访问器）。
// $...$ → 行内公式（displayMode: false）；$$...$$ → 块级公式（displayMode: true）。
// throwOnError: false 让公式语法错误只在页面上标红，而不是中断整个构建。
const renderMath = (node, ctx, displayMode) => {
  ctx.replaceNode(node, {
    // ⚠️ 必须用 mdast 的 html 节点。若改用 { rawHtml } 会按块级处理，
    // 在段落中插入 <p> 造成 <p><p> 非法嵌套（浏览器会提前闭合外层段落）。
    type: 'html',
    value: katex.renderToString(node.value, { displayMode, throwOnError: false }),
  });
};

const katexPlugin = {
  name: 'katex',
  inlineMath: (node, ctx) => renderMath(node, ctx, false),
  math: (node, ctx) => renderMath(node, ctx, true),
};

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [sitemap()],
  markdown: {
    // Sätteri 是 Astro 新版默认 Markdown 处理器，公式解析默认关闭，需显式开启
    processor: satteri({
      features: { math: true },
      mdastPlugins: [katexPlugin],
    }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
