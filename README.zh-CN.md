# MiniMax H3 本地基准测试

[English (default)](README.md) · [在线基准网站](https://yhk-ai.github.io/MiniMax-H3-Benchmark/) · [安装指南](docs/INSTALLATION.zh-CN.md) · [测试报告](docs/BENCHMARK.zh-CN.md)

这是 MiniMax H3 + ComfyUI 在 Lenovo 笔记本上的可复现基准项目，硬件为 NVIDIA GeForce RTX 4060 Laptop GPU（8GB 显存）和 32GB 内存。仓库包含真实本机输出、同步 A/B 视频对比网站、已经验证的 API 工作流，以及每项配置建议的证据。

网站默认英语，可切换为简体中文；切换语言不会重载媒体或丢失当前对比状态。

## 最佳已验证配置

| 目标 | 分辨率 | 帧数 | 时长 | 步数 | 本机生成耗时 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 最佳已验证质量 | 1024×576 | 243 | 10.125 秒 | 20 | 2762.89 秒（46分03秒） |
| 更快的长镜头 | 1024×576 | 243 | 10.125 秒 | 4 | 650.96 秒（10分51秒） |
| 最高已验证分辨率 | 1344×768 | 124 | 5.167 秒 | 4 | 537.49 秒（8分57秒） |

20 步是本机当前质量最好的**已验证结果**，不表示所有中间组合都已穷举。1344×768、243 帧在内存卸载阶段停滞；362 帧触发 CUDA OOM。

## 已验证环境

- Lenovo 21J8，Windows 11 家庭版（build 26200）
- Intel Core i9-13900H，14 核 / 20 线程（14 cores / 20 threads）
- NVIDIA GeForce RTX 4060 Laptop GPU，8188 MiB 显存，驱动 581.08
- 2 × 16 GiB Samsung DDR5-5600，实际配置 5200 MT/s（系统可用 31.72 GiB）
- Samsung `SAMSUNG MZVL21T0HCLR-00BL2` 1 TB NVMe 系统盘
- Western Digital `WD PC SN740 SDDPTQE-2T00` 2 TB NVMe 工作盘/模型盘（`E:`）
- Python 3.13.9
- PyTorch 2.13.0+cu130 / CUDA 13.0
- ComfyUI 0.30.0
- 启动参数：`--fast-disk --reserve-vram 2`

## 本机实测占用

| 项目 | 实测大小 | 说明 |
| --- | ---: | --- |
| 4 个 MiniMax H3 模型及模型元数据 | 39.554 GiB | 当前已验证模型栈所必需 |
| Python 虚拟环境 | 4.041 GiB | 包含已验证的 PyTorch/CUDA 环境 |
| 7 个本机输出 MP4 | 0.043 GiB | ComfyUI 原始输出，含基准媒体 |
| 发布仓库副本（不含 `.git`） | 46.58 MiB | 5 个 MP4、2 张 PNG、网站、工作流与文档 |
| 建议运行余量 | 至少 60 GiB 空闲 | 规划余量，不是文件实测占用 |

模型、下载文件和生成临时数据应放在 `E:`。本次审计时系统盘仅约 1.47 GB 空余。全新下载时建议预留 80 GB，因为中断下载可能暂时保留不完整文件。

## 仓库内容

- 5 个真实 H.264 MP4 结果和 2 张接触表 PNG
- 支持按进度或真实秒数对齐的同步 A/B 播放
- 支持键盘、适应窗口和源像素 1:1 模式的媒体查看器
- 英语/简体中文界面，默认英语
- 1024×576、243 帧、20 步的已验证 ComfyUI API 工作流
- GitHub Pages 自动发布与仓库协作模板
- 完整安装、Codex 辅助部署、测试策略、配置选择和失败边界文档

仓库不包含模型权重、ComfyUI 运行环境、缓存、密钥或本机日志。

## 网站交互

- A/B 对比台支持**进度对齐**和**时间对齐**：前者按故事进度匹配，后者按真实秒数匹配。
- A 默认展示最佳已验证的 **Final C / 20 步**，B 默认展示可直接比较的 **C / 4 步**。
- A 声音与 B 声音互斥，任何时刻最多只播放一侧声音。
- 5 个视频和 2 张图片都可在同一查看器中打开，支持适应窗口、**1:1 原始大小**、左右方向键切换和 Esc 关闭。
- **EN / 中文**切换使用 `localStorage` 的 `minimax-h3-locale` 键；网站默认使用英语，切换不会重置播放和对比状态。

## 本地预览与测试

```powershell
python -m http.server 4173 --bind 127.0.0.1
node --check app.js
node --test tests/*.test.mjs
```

打开 `http://127.0.0.1:4173/`。建议使用 HTTP 服务预览，不要直接双击 `index.html`，这样与 GitHub Pages 的加载方式更一致。

## 复现基准测试

先阅读[安装与本地部署](docs/INSTALLATION.zh-CN.md)，再运行仓库中的 [API 工作流](workflows/minimax_h3_1024x576_243f_20step_api.json)。应先把步数改为 1 做预检，再依次测试 4 步和 20 步。完整配置理由和结果见[基准测试报告](docs/BENCHMARK.zh-CN.md)。

## GitHub Pages

仓库已经使用 GitHub Actions 配置 Pages，并发布仓库根目录 `/ (root)`。公开媒体约 45 MB。首次推送到 `main` 后：

1. 打开 **Settings → Pages**。
2. 如果没有自动选中，将 **Source** 设置为 **GitHub Actions**。
3. 等待 **Test and deploy GitHub Pages** 工作流完成。
4. 访问 `https://yhk-ai.github.io/MiniMax-H3-Benchmark/`。

所有运行资源均使用相对路径，图片和视频能够在仓库子路径下访问。每个媒体文件都小于 GitHub 100MB 单文件限制，因此不需要 Git LFS。

## 官方资料

- [ComfyUI 手动安装](https://docs.comfy.org/installation/manual_install)
- [Comfy-Org MiniMax H3 模型包](https://huggingface.co/Comfy-Org/MiniMax-H3)
- [官方 MiniMax H3 ComfyUI 节点](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_minimax_h3.py)
- [官方 MiniMax H3 T2V 工作流](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_t2v.json)
- [Codex CLI 文档](https://learn.chatgpt.com/docs/codex/cli)
- [Codex AGENTS.md 指南](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

“功夫熊猫”风格提示词仅用于独立基准测试。本仓库与 DreamWorks、MiniMax、Comfy Org、Epic Games 或 NVIDIA 均无隶属或官方背书关系。
