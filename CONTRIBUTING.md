# Contributing

English is the default project language. Chinese translations should be updated with the corresponding English documentation or UI key.

1. Keep the site dependency-free and compatible with GitHub Pages project subpaths.
2. Never commit model weights, ComfyUI runtime files, caches, credentials, or machine-identifying logs.
3. Add only real, reproducible benchmark claims. Mark untested configurations as untested.
4. Keep each media file below GitHub's 100 MB limit unless the repository deliberately migrates to Git LFS.
5. Run `node --check app.js` and `node --test tests/*.test.mjs` before opening a pull request.
6. Describe hardware, software versions, parameters, timing method, and whether the output fully decoded and muxed.

## 中文说明

项目默认语言为英语；修改英语文档或界面键时，应同步更新对应中文翻译。不要提交模型、运行环境、缓存、凭据或可识别本机身份的日志。所有基准结论必须来自真实、可复现结果，未测试配置必须明确标注。提交前运行 JavaScript 语法检查和全部 Node 测试。
