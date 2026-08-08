# MiniMax H3 Local Benchmark

[简体中文](README.zh-CN.md) · [Live benchmark](https://yhk-ai.github.io/MiniMax-H3-Benchmark/) · [Installation guide](docs/INSTALLATION.md) · [Benchmark report](docs/BENCHMARK.md)

A reproducible MiniMax H3 + ComfyUI benchmark for a Lenovo laptop with an NVIDIA GeForce RTX 4060 Laptop GPU (8 GB VRAM) and 32 GB RAM. The repository contains the real local outputs, a synchronized A/B video comparison lab, a tested API workflow, and the evidence behind each recommendation.

The website is English by default and can switch to Simplified Chinese without reloading media or losing comparison state.

## Best verified configuration

| Goal | Resolution | Frames | Duration | Steps | Local generation time |
| --- | ---: | ---: | ---: | ---: | ---: |
| Best verified quality | 1024×576 | 243 | 10.125 s | 20 | 2762.89 s (46m 03s) |
| Faster long shot | 1024×576 | 243 | 10.125 s | 4 | 650.96 s (10m 51s) |
| Highest verified resolution | 1344×768 | 124 | 5.167 s | 4 | 537.49 s (8m 57s) |

The 20-step preset is the strongest **verified** result on this machine, not a claim that every intermediate combination has been exhausted. At 1344×768, 243 frames stalled during memory unloading; 362 frames failed with CUDA OOM.

## Verified environment

- Lenovo 21J8, Windows 11 Home (build 26200)
- Intel Core i9-13900H, 14 cores / 20 threads
- NVIDIA GeForce RTX 4060 Laptop GPU, 8188 MiB VRAM, driver 581.08
- 2 × 16 GiB Samsung DDR5-5600, configured at 5200 MT/s (31.72 GiB usable)
- Samsung `SAMSUNG MZVL21T0HCLR-00BL2` 1 TB NVMe system disk
- Western Digital `WD PC SN740 SDDPTQE-2T00` 2 TB NVMe workspace/model disk (`E:`)
- Python 3.13.9
- PyTorch 2.13.0+cu130 / CUDA 13.0
- ComfyUI 0.30.0
- Launch flags: `--fast-disk --reserve-vram 2`

## Measured local footprint

| Item | Measured size | Notes |
| --- | ---: | --- |
| Four MiniMax H3 model files and model metadata | 39.554 GiB | Required for this tested stack |
| Python virtual environment | 4.041 GiB | Includes the verified PyTorch/CUDA runtime |
| Seven local output MP4 files | 0.043 GiB | Original ComfyUI output, including benchmark media |
| Published repository copy (excluding `.git`) | 46.58 MiB | Five MP4s, two PNGs, site, workflow, and docs |
| Recommended operating headroom | ≥ 60 GiB free | Planning allowance, not measured file use |

Keep models, downloads, and temporary generation files on `E:`. During this audit the system disk had only about 1.47 GB free. For a fresh download, 80 GB free is safer because interrupted downloads may temporarily retain partial files.

## What is included

- Five real H.264 MP4 results and two contact-sheet PNGs
- Synchronized A/B playback with progress or absolute-time alignment
- A keyboard-accessible media viewer with fit-to-window and true 1:1 source-pixel modes
- English and Simplified Chinese UI, English default
- A tested 1024×576 / 243-frame / 20-step ComfyUI API workflow
- GitHub Pages deployment workflow and repository contribution templates
- Detailed installation, Codex-assisted setup, test strategy, results, and failure boundaries

No model weights, ComfyUI runtime, caches, secrets, or machine-specific logs are included.

## Website behavior

- The A/B comparison console supports **progress alignment** for matching relative story beats and **time alignment** for matching real seconds.
- A opens on the best verified **Final C / 20-step** result; B opens on the directly comparable **C / 4-step** result.
- Audio A and audio B are mutually exclusive, so no more than one result is audible at once.
- All five videos and two images open in the same media viewer. It supports fit-to-window and **original 1:1** modes, Left/Right arrow navigation, and Esc to close.
- The **EN / 中文** switch uses `localStorage` key `minimax-h3-locale`. English is the safe default, and changing language preserves playback and comparison state.

## Preview and test

```powershell
python -m http.server 4173 --bind 127.0.0.1
node --check app.js
node --test tests/*.test.mjs
```

Open `http://127.0.0.1:4173/`. Use an HTTP server instead of opening `index.html` directly so local behavior matches GitHub Pages.

## Reproduce the benchmark

Follow [Installation and local deployment](docs/INSTALLATION.md), then run the included [API workflow](workflows/minimax_h3_1024x576_243f_20step_api.json). Start with a one-step preflight before changing the workflow to four or twenty steps. The full parameter-selection rationale and recorded results are in the [benchmark report](docs/BENCHMARK.md).

## GitHub Pages

The repository is configured for Pages through GitHub Actions and publishes the repository root `/ (root)`. The public media payload is about 45 MB. After the first push to `main`:

1. Open **Settings → Pages**.
2. Set **Source** to **GitHub Actions** if it is not selected automatically.
3. Wait for **Test and deploy GitHub Pages** to finish.
4. Visit `https://yhk-ai.github.io/MiniMax-H3-Benchmark/`.

All runtime paths are relative, so videos and images work under the repository subpath. Every media file is below GitHub's 100 MB per-file limit; Git LFS is not required for the published benchmark media.

## Official references

- [ComfyUI manual installation](https://docs.comfy.org/installation/manual_install)
- [Comfy-Org MiniMax H3 model package](https://huggingface.co/Comfy-Org/MiniMax-H3)
- [Official MiniMax H3 ComfyUI nodes](https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_minimax_h3.py)
- [Official MiniMax H3 T2V workflow](https://github.com/Comfy-Org/workflow_templates/blob/main/templates/video_minimax_h3_t2v.json)
- [Codex CLI documentation](https://learn.chatgpt.com/docs/codex/cli)
- [Codex AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md)

The Kung Fu Panda-inspired prompt is an independent benchmark prompt. This repository is not affiliated with or endorsed by DreamWorks, MiniMax, Comfy Org, Epic Games, or NVIDIA.
