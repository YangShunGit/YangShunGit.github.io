import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: '个人知识库',
  tagline: '一名前端开发者整理的技术小册',
  favicon: 'img/favicon.ico',
  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://YangShunGit.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'YangShunGit', // Usually your GitHub org/user name.
  projectName: 'YangShunGit.github.io', // Usually your repo name.
  deploymentBranch: 'gh-pages', // 部署分支
  trailingSlash: false,
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          path: 'frontend',
          routeBasePath: 'frontend',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          // Useful options to enforce blogging best practices
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'backend',
        path: 'backend',
        routeBasePath: 'backend',
        sidebarPath: './sidebarsBackend.ts',
        // ... other options
      }, 
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: '智库',
      logo: {
        alt: '个人智库',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'frontend',
          position: 'left',
          label: '前端',
        },
        {
          to: '/backend/intro',
          label: '后端',
          position: 'left',
          activeBaseRegex: `/backend`,
        },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'communitySidebar',
        //   position: 'left',
        //   label: '后端',
        // },
        {to: '/blog', label: '博客', position: 'left'},
        {
          href: 'https://github.com/YangShunGit/YangShunGit.github.io',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {
              label: '前端',
              to: '/frontend/intro',
            },
            {
              label: '后端',
              to: '/backend/intro',
            },
          ],
        },
        {
          title: '常用网站',
          items: [
            {
              label: 'react',
              href: 'https://react.docschina.org/',
            },
            {
              label: 'antd',
              href: 'https://ant-design.antgroup.com/components/overview-cn',
            },
            {
              label: 'react-native',
              href: 'https://www.react-native.cn/',
            },
            {
              label: 'taro',
              href: 'https://docs.taro.zone/docs/',
            },
            {
              label: '微信小程序',
              href: 'https://developers.weixin.qq.com/miniprogram/dev/framework/',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: '博客',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/YangShunGit/YangShunGit.github.io',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
