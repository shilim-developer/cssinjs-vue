import path from "node:path";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vitepress";
import { vitepressDemoPlugin } from "vitepress-demo-plugin";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: "en",
  title: "CssInJs Vue",
  description: "CssInJs Vue",
  locales: {
    root: {
      label: "English",
      lang: "en",
      themeConfig: {
        nav: [
          { text: "Demo", link: "/demo-animation" },
        ],
        sidebar: [
          {
            text: "Showcase",
            items: [
              { text: "Animation", link: "/demo-animation" },
              { text: "Auto Clear", link: "/demo-auto-clear" },
              { text: "Basic", link: "/demo-basic" },
              { text: "Css Variables", link: "/demo-css-var" },
              { text: "Diff Salt", link: "/demo-diff-salt" },
              { text: "Dynamic", link: "/demo-dynamic" },
              { text: "Layer", link: "/demo-layer" },
              { text: "Seed", link: "/demo-seed" },
              { text: "Shadow", link: "/demo-shadow" },
              { text: "Transformer", link: "/demo-transformer" },
              { text: "Ssr Advanced", link: "/demo-ssr-advanced" },
            ],
          },
        ],
      },
    },
    zh: {
      label: "简体中文",
      lang: "zh",
      themeConfig: {
        nav: [
          { text: "演示", link: "/zh/demo-animation" },
        ],
        sidebar: [
          {
            text: "Showcase",
            items: [
              { text: "动画", link: "/zh/demo-animation" },
              { text: "自动清除", link: "/zh/demo-auto-clear" },
              { text: "基础", link: "/zh/demo-basic" },
              { text: "Css变量", link: "/zh/demo-css-var" },
              { text: "不同的Salt", link: "/zh/demo-diff-salt" },
              { text: "动态切换", link: "/zh/demo-dynamic" },
              { text: "级联层", link: "/zh/demo-layer" },
              { text: "Seed", link: "/zh/demo-seed" },
              { text: "Shadow Dom", link: "/zh/demo-shadow" },
              { text: "转化", link: "/zh/demo-transformer" },
              { text: "Ssr Advanced", link: "/zh/demo-ssr-advanced" },
            ],
          },
        ],
      },
    },
  },
  themeConfig: {
    search: {
      provider: "local",
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: "搜索",
                buttonAriaLabel: "搜索",
              },
              modal: {
                displayDetails: "显示详细列表",
                resetButtonTitle: "重置搜索",
                backButtonTitle: "关闭搜索",
                noResultsText: "没有结果",
                footer: {
                  selectText: "选择",
                  selectKeyAriaLabel: "输入",
                  navigateText: "导航",
                  navigateUpKeyAriaLabel: "上箭头",
                  navigateDownKeyAriaLabel: "下箭头",
                  closeText: "关闭",
                  closeKeyAriaLabel: "esc",
                },
              },
            },
          },
        },
      },
    },
    // https://vitepress.dev/reference/default-theme-config

    socialLinks: [
      { icon: "github", link: "https://github.com/vuejs/vitepress" },
    ],
  },
  markdown: {
    config(md) {
      md.use(vitepressDemoPlugin, {
        demoDir: path.resolve(__dirname, "../demo"),
      });
    },
  },
  vite: {
    resolve: {
      alias: {
        "cssinjs-vue": path.resolve(__dirname, "../../src"),
      },
    },
    plugins: [vueJsx() as any],
  },
});
