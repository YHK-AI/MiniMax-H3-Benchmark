# 安装与本地部署

[English (default)](INSTALLATION.md) · [首页](../README.zh-CN.md) · [基准测试报告](BENCHMARK.zh-CN.md)

本指南复现本仓库使用的 Windows 配置。MiniMax H3 模型很大：所选 4 个文件约占 40GB，未完成下载还可能额外占用 20GB 以上。开始前建议在高速 NVMe 硬盘保留至少 80GB 可用空间。

## 1. 已验证设备

| 项目 | 已验证值 |
| --- | --- |
| 电脑 | Lenovo 21J8 |
| 系统 | Windows 11 家庭版，build 26200 |
| CPU | Intel Core i9-13900H，14 核 / 20 线程（14 cores / 20 threads） |
| GPU | NVIDIA GeForce RTX 4060 Laptop GPU |
| 显存 | 8188 MiB |
| 内存 | 2 × 16 GiB Samsung DDR5-5600，实际配置 5200 MT/s；系统可用 31.72 GiB |
| 系统盘 | `SAMSUNG MZVL21T0HCLR-00BL2`，1 TB NVMe |
| 工作盘/模型盘 | `WD PC SN740 SDDPTQE-2T00`，2 TB NVMe（`E:`） |
| 驱动 | NVIDIA 581.08 |
| Python | 3.13.9 |
| PyTorch | 2.13.0+cu130 |
| CUDA runtime | 13.0 |
| ComfyUI | 0.30.0 |

更新的兼容版本可能也能工作，但升级后必须重新执行预检矩阵，不能假定耗时和内存表现完全相同。

清理后的保留占用实测为：`models/` 39.554 GiB、`.venv/` 4.041 GiB、7 个本机 MP4 输出 0.043 GiB；可发布仓库副本不含 `.git` 时为 46.58 MiB。正常运行应至少保留 **60 GiB 空闲空间**；全新下载前保留 80 GB 更安全，因为不完整下载可能临时多占 20 GB 以上。模型和生成临时数据应放在 `E:`；本次审计时系统盘只剩约 1.47 GB。

## 2. 让 Codex 完成部署

Codex 可以检查硬件、创建虚拟环境、安装依赖、放置模型、启动 ComfyUI、执行冒烟测试并整理文档；但它不能代替用户接受模型许可证，也不会绕过仓库权限。

按[官方 Codex CLI 文档](https://learn.chatgpt.com/docs/codex/cli)安装并登录 Codex，在计划安装 ComfyUI 的父目录打开 PowerShell，运行 `codex`，然后输入：

```text
检查此 Windows 电脑，并在 ./ComfyUI 中安装官方 ComfyUI，用于本地运行
MiniMax H3 文生视频。使用独立 Python 虚拟环境；针对 RTX 4060 Laptop
8GB 显存和 32GB 内存选择模型；只从官方 Comfy-Org/MiniMax-H3 下载所需
4 个文件，核对路径与大小；仅监听 127.0.0.1；先做 1 步冒烟测试再运行
更长测试；记录所有命令、版本、结果和可清理目标；绝不删除已完成模型。
```

可使用 `/init` 创建仓库说明、`/status` 查看会话、`/permissions` 核对命令权限、`/review` 在提交前检查。建议在工作区放置包含本机安全规则的 `AGENTS.md`，格式参见[官方 AGENTS.md 指南](https://learn.chatgpt.com/docs/agent-configuration/agents-md)。

## 3. 安装 ComfyUI

先安装 Git、Python 3.13 和当前 NVIDIA 驱动，然后在 PowerShell 执行：

```powershell
git clone https://github.com/Comfy-Org/ComfyUI.git
Set-Location ComfyUI
py -3.13 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install --upgrade pip wheel
& .\.venv\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

验证环境：

```powershell
& .\.venv\Scripts\python.exe --version
& .\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.get_device_name(0))"
```

如果后续 ComfyUI 官方推荐不同 Python 或 PyTorch 版本，应遵循新的官方依赖，并把本文配置作为本次基准的已知可用快照。

## 4. 只下载适合 8GB 显存的模型组合

官方 [Comfy-Org MiniMax H3 模型包](https://huggingface.co/Comfy-Org/MiniMax-H3)包含多个超大版本。本机只使用以下 4 个文件：

```powershell
& .\.venv\Scripts\hf.exe download Comfy-Org/MiniMax-H3 `
  diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors `
  text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors `
  vae/minimax_h3_video_vae_fp16.safetensors `
  vae/minimax_h3_audio_vae_fp32.safetensors `
  --local-dir models
```

期望路径、大小和官方 LFS SHA-256：

| `models/` 下相对路径 | 大小 | SHA-256 |
| --- | ---: | --- |
| `diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors` | 20,970,379,616 bytes | `e889202c41dafb67b10d67b97f0d8541508036a6090af23425a5c2615d03c47a` |
| `text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | 15,687,142,551 bytes | `35a88d51044231fe332301d7a62aa81e3f2cba62febeb446e2c1e3e0ef76f2c6` |
| `vae/minimax_h3_video_vae_fp16.safetensors` | 5,207,808,496 bytes | `7c1f131492e7eddacaac9069a61b81bdd39de5cc96561e677c5eab1cdce5e522` |
| `vae/minimax_h3_audio_vae_fp32.safetensors` | 605,254,808 bytes | `8e505d95dd1561d47abd43d4238fd40d9bb1ae9e147ed0a4cba778d76ae4db48` |

使用 `Get-FileHash -Algorithm SHA256 <路径>` 校验。4 个文件全部计算哈希会产生较多磁盘读取，但断点续传后建议执行。

不要在这台 8GB 显存设备上无目的下载 BF16 或未裁剪版本，它们会产生远大于本测试组合的卸载压力。模型使用需遵守模型仓库链接的许可证。

## 5. 安全启动 ComfyUI

```powershell
& .\.venv\Scripts\python.exe main.py `
  --fast-disk `
  --listen 127.0.0.1 `
  --port 8188 `
  --reserve-vram 2
```

`--fast-disk` 在高速 NVMe 上优先使用磁盘支持的动态加载与卸载；`--reserve-vram 2` 为解码、显示和驱动分配保留余量。监听 `127.0.0.1` 可保持 API 仅本机可访问；除非已经主动做好安全配置，不要监听全部网卡。

打开 `http://127.0.0.1:8188/`，确认可以找到 MiniMax H3 节点。官方节点固定输出 24 FPS，把帧数向上对齐到 `17k+5` 网格，并说明约 124–362 帧是训练长度范围。

## 6. 加载或提交工作流

图形界面可先使用官方 [MiniMax H3 T2V 工作流](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_t2v.json)。本仓库还包含最终视频使用的 [20 步 API 工作流](../workflows/minimax_h3_1024x576_243f_20step_api.json)。

向正在运行的本机 ComfyUI 提交：

```powershell
$prompt = Get-Content -Raw .\workflows\minimax_h3_1024x576_243f_20step_api.json | ConvertFrom-Json
$body = @{ prompt = $prompt } | ConvertTo-Json -Depth 100
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8188/prompt -ContentType 'application/json' -Body $body
```

首次运行前，将节点 `8` 的 `inputs.steps` 从 `20` 改为 `1`，同时修改输出文件名前缀。确认 1 步结果能够完成解码和保存后，再运行 4 步；最后才运行 20 步。

## 7. 推荐测试阶梯

1. **环境冒烟：**启动 ComfyUI，加载 4 个模型，确认 CUDA 可用。
2. **1 步预检：**直接使用目标分辨率和帧数。生成可播放 MP4 才表示采样、双 VAE、音频和封装完整成功。
3. **4 步对比：**比较 1344×768 / 124 帧与 1024×576 / 243 帧。
4. **20 步最终：**只有在 4 步稳定后，运行 1024×576 / 243 帧。
5. **媒体校验：**发布前检查编码、分辨率、时长、帧数、音频流和 SHA-256。

使用 `nvidia-smi -l 2`、任务管理器和 ComfyUI 控制台监控。如果进程私有内存已经接近 32GB，同时 CPU/GPU 长期都是 0%，这不是“只是很慢”的健康运行，应停止并降低分辨率或帧数。

## 8. 清理中断下载

Hugging Face 可能在 `models/.cache/huggingface/download/` 留下 `*.incomplete`。必须先确认 4 个完成模型存在且大小正确，并停止仍在进行的模型下载，然后只删除 `.incomplete` 文件。不要把 `models/`、`.venv/` 或完整 `.safetensors` 当作普通缓存删除。

## 9. 配置选择

- 需要最佳已验证的 10 秒效果：**1024×576 / 243 帧 / 20 步**。
- 需要较快迭代和叙事预演：**1024×576 / 243 帧 / 4 步**。
- 更重视空间细节而只需约 5 秒：**1344×768 / 124 帧 / 4 步**。
- **1 步只用于系统预检**，不作为质量成片。
- 根据已经记录的停滞和 OOM，本机应避免 **1344×768 / 243 或 362 帧**。

测量和判断依据见[基准测试报告](BENCHMARK.zh-CN.md)。
