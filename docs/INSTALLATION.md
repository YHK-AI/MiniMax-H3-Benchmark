# Installation and local deployment

[简体中文](INSTALLATION.zh-CN.md) · [Home](../README.md) · [Benchmark report](BENCHMARK.md)

This guide reproduces the verified Windows deployment used by this repository. MiniMax H3 is unusually large: the selected four model files occupy about 40 GB, and incomplete downloads can consume another 20 GB or more. Keep at least 80 GB free on a fast NVMe drive before starting.

## 1. Validated machine profile

| Component | Validated value |
| --- | --- |
| Computer | Lenovo 21J8 |
| OS | Windows 11 Home, build 26200 |
| GPU | NVIDIA GeForce RTX 4060 Laptop GPU |
| VRAM | 8188 MiB |
| RAM | 32 GB |
| Storage | NVMe SSD |
| Driver | NVIDIA 581.08 |
| Python | 3.13.9 |
| PyTorch | 2.13.0+cu130 |
| CUDA runtime | 13.0 |
| ComfyUI | 0.30.0 |

Newer compatible versions may work, but re-run the preflight matrix after an upgrade. Do not assume timing or memory behavior remains identical.

## 2. Use Codex to perform the setup

Codex can inspect hardware, create the virtual environment, install packages, place models, start ComfyUI, run smoke tests, and document the result. It cannot accept a model license for you or bypass repository access controls.

Install and sign in to Codex using the [official Codex CLI guide](https://learn.chatgpt.com/docs/codex/cli), open PowerShell in the parent installation directory, run `codex`, and use a request like this:

```text
Inspect this Windows PC and install the official ComfyUI source in ./ComfyUI for
local MiniMax H3 text-to-video generation. Use an isolated Python virtual
environment. Select model variants suitable for an RTX 4060 Laptop GPU with
8 GB VRAM and 32 GB RAM. Download only the four required model files from the
official Comfy-Org/MiniMax-H3 repository, verify paths and sizes, launch only on
127.0.0.1, run a 1-step smoke test before longer tests, and document every
command, version, result, and cleanup target. Never delete completed models.
```

Useful Codex commands are `/init` to create repository instructions, `/status` to inspect the session, `/permissions` to review command permissions, and `/review` before committing. Keep an `AGENTS.md` in the workspace with machine-specific safety rules; see the [official AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md).

## 3. Install ComfyUI

Install Git, Python 3.13, and a current NVIDIA driver first. In PowerShell:

```powershell
git clone https://github.com/Comfy-Org/ComfyUI.git
Set-Location ComfyUI
py -3.13 -m venv .venv
& .\.venv\Scripts\python.exe -m pip install --upgrade pip wheel
& .\.venv\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu130
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Verify the environment:

```powershell
& .\.venv\Scripts\python.exe --version
& .\.venv\Scripts\python.exe -c "import torch; print(torch.__version__, torch.version.cuda, torch.cuda.get_device_name(0))"
```

If a future ComfyUI release recommends a different Python or PyTorch build, follow the official requirements and treat this document as the known-good reference for this benchmark snapshot.

## 4. Download only the 8 GB-friendly model set

The official [Comfy-Org MiniMax H3 package](https://huggingface.co/Comfy-Org/MiniMax-H3) supplies multiple very large variants. This machine used exactly these four files:

```powershell
& .\.venv\Scripts\hf.exe download Comfy-Org/MiniMax-H3 `
  diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors `
  text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors `
  vae/minimax_h3_video_vae_fp16.safetensors `
  vae/minimax_h3_audio_vae_fp32.safetensors `
  --local-dir models
```

Expected placement and official LFS SHA-256 values:

| Relative path under `models/` | Size | SHA-256 |
| --- | ---: | --- |
| `diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors` | 20,970,379,616 bytes | `e889202c41dafb67b10d67b97f0d8541508036a6090af23425a5c2615d03c47a` |
| `text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors` | 15,687,142,551 bytes | `35a88d51044231fe332301d7a62aa81e3f2cba62febeb446e2c1e3e0ef76f2c6` |
| `vae/minimax_h3_video_vae_fp16.safetensors` | 5,207,808,496 bytes | `7c1f131492e7eddacaac9069a61b81bdd39de5cc96561e677c5eab1cdce5e522` |
| `vae/minimax_h3_audio_vae_fp32.safetensors` | 605,254,808 bytes | `8e505d95dd1561d47abd43d4238fd40d9bb1ae9e147ed0a4cba778d76ae4db48` |

Verify a file with `Get-FileHash -Algorithm SHA256 <path>`. Hashing all four files is I/O intensive but recommended after a resumed download.

Do not download the BF16 or non-pruned variants on this 8 GB configuration unless you deliberately want to test a much larger offload workload. Model use remains subject to the license linked by the model repository.

## 5. Start ComfyUI safely

```powershell
& .\.venv\Scripts\python.exe main.py `
  --fast-disk `
  --listen 127.0.0.1 `
  --port 8188 `
  --reserve-vram 2
```

`--fast-disk` favors disk-backed dynamic loading/offload on fast NVMe storage. `--reserve-vram 2` leaves headroom for decoding, display, and driver allocations. Binding to `127.0.0.1` keeps the API local; do not bind to all interfaces unless you have intentionally secured the service.

Open `http://127.0.0.1:8188/`. Confirm the MiniMax H3 nodes are available. The official node implementation fixes output to 24 FPS, rounds frame counts up to the `17k+5` grid, and notes that roughly 124–362 frames are the trained range.

## 6. Load or submit a workflow

For the visual UI, start with the official [MiniMax H3 T2V workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_t2v.json). This repository also includes the exact [20-step API workflow](../workflows/minimax_h3_1024x576_243f_20step_api.json) used for the final result.

Submit it to a running local ComfyUI server:

```powershell
$prompt = Get-Content -Raw .\workflows\minimax_h3_1024x576_243f_20step_api.json | ConvertFrom-Json
$body = @{ prompt = $prompt } | ConvertTo-Json -Depth 100
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8188/prompt -ContentType 'application/json' -Body $body
```

Before the first run, change node `8` → `inputs.steps` from `20` to `1` and change the filename prefix. Once the one-step result fully decodes and saves, test 4 steps; only then run 20 steps.

## 7. Recommended test ladder

1. **Environment smoke:** start ComfyUI, load all four models, and confirm CUDA is available.
2. **One-step preflight:** use the final target resolution and frame count. A saved MP4 proves that sampling, both VAEs, audio, and muxing all complete.
3. **Four-step comparison:** compare 1344×768 / 124 frames with 1024×576 / 243 frames.
4. **Twenty-step final:** run 1024×576 / 243 frames only after the four-step version is stable.
5. **Media verification:** check codec, dimensions, duration, frame count, audio stream, and SHA-256 before publishing.

Monitor with `nvidia-smi -l 2`, Task Manager, and the ComfyUI console. A run that remains at 0% CPU and GPU while private memory is near the 32 GB ceiling is not a healthy slow run; stop it and reduce resolution or frame count.

## 8. Cleanup after interrupted downloads

Hugging Face may leave `*.incomplete` files under `models/.cache/huggingface/download/`. First verify all four completed files exist and match expected sizes, stop any active model download, then remove only the `.incomplete` files. Never delete `models/`, `.venv/`, or completed `.safetensors` as generic cleanup.

## 9. Configuration choice

- Choose **1024×576 / 243 frames / 20 steps** for the best verified ten-second result.
- Choose **1024×576 / 243 frames / 4 steps** for iteration and narrative blocking.
- Choose **1344×768 / 124 frames / 4 steps** when spatial detail matters more than duration.
- Use **1 step only as a systems preflight**, not as a quality deliverable.
- Avoid **1344×768 at 243 or 362 frames** on this 8 GB / 32 GB machine based on the recorded stall and OOM.

See [Benchmark report](BENCHMARK.md) for measurements and interpretation.
