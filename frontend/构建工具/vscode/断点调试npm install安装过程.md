# 通用node断点技巧


例子：antd-x项目install报错，初步判断puppeteer安装依赖报错
ERROR: Failed to set up chrome-headless-shell v137.0.7151.119! Set "PUPPETEER_SKIP_DOWNLOAD" env variable to swnload.

问题排查
需要在install过程中断点查看下载链接是否正常

1. 配置
配置launch.json
``` json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "调试依赖安装脚本",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "skipFiles": ["<node_internals>/**"]
        },
    ]
}
```

查看npm位置
`npm -h`
最底部可以看到npm执行文件位置

在package.json的scripts中添加命令
``` json
"debug:install": "node --inspect-brk C:/Users/admin/AppData/Roaming/nvm/v20.19.3/node_modules/npm install",
```

2. 调试
运行命令
``` bash
npm run debug:install
```

attach(附加到进程)
在vscode的debugger中启动attach


3. 打断点
可以在node_modules的执行的代码块左侧打断点（红色小点）


断点会莫名消失(因为每次install会把库重新下载)


