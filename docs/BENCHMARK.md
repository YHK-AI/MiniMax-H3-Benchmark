# Benchmark report

[简体中文](BENCHMARK.zh-CN.md) · [Home](../README.md) · [Installation](INSTALLATION.md)

## Question

What is the highest practical MiniMax H3 configuration that completes end-to-end on an RTX 4060 Laptop GPU with 8 GB VRAM and 32 GB system RAM while still producing a useful side-scrolling game video?

## Controlled inputs

- Same text-to-video model set, prompt, seed `20260805`, sampler `res_multistep`, scheduler `simple`, denoise `1.0`, and H.264 output
- 24 FPS, matching the official MiniMax H3 ComfyUI node
- ComfyUI launched with `--fast-disk --reserve-vram 2`
- A run counts as successful only when sampling, video VAE, audio VAE, and MP4 muxing all finish
- The prompt describes Unreal Engine 5-style 3D side-scrolling kung-fu panda gameplay with a single continuous side-view shot

## Host and fixed storage cost

The measured host was a Lenovo 21J8 with an Intel Core i9-13900H (14 cores / 20 threads), an NVIDIA GeForce RTX 4060 Laptop GPU (8188 MiB, driver 581.08), and 2 × 16 GiB Samsung DDR5-5600 configured at 5200 MT/s. Storage was a `SAMSUNG MZVL21T0HCLR-00BL2` 1 TB NVMe system disk plus a `WD PC SN740 SDDPTQE-2T00` 2 TB NVMe workspace disk.

Fixed retained storage was 39.554 GiB for model files, 4.041 GiB for the Python environment, and 46.58 MiB for the published site copy. Keep at least 60 GiB free as operating headroom; that allowance is not measured file use.

## Results

| Experiment | Resolution | Frames / duration | Steps | Generation time | Result | VRAM evidence | RAM / private memory | MP4 size | Measurement basis |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | ---: | --- |
| A upper bound | 1344×768 | 362 / 15.08 s | 1 | Failed before output | CUDA OOM | About 4.32 GiB allocated + 4.38 GiB QKV request | Peak not recorded | — | Runtime error log |
| B-long | 1344×768 | 243 / 10.13 s | 1 | Stalled | Failed | About 7.9 / 8.2 GB | About 27.8 GiB private | — | Process / GPU observation |
| B-short preflight | 1344×768 | 124 / 5.17 s | 1 | Not recorded | Success | Completed within 8188 MiB; peak not recorded | Peak not recorded | 6.38 MiB | Output file measurement |
| B-short | 1344×768 | 124 / 5.17 s | 4 | 537.49 s | Success | Completed within 8188 MiB; peak not recorded | Peak not recorded | 4.83 MiB | Runtime + output file |
| C preflight | 1024×576 | 243 / 10.13 s | 1 | Not recorded | Success | Peak not recorded | Peak not recorded | 16.94 MiB | Output file measurement |
| C balanced | 1024×576 | 243 / 10.13 s | 4 | 650.96 s | Success | Peak not recorded | Peak not recorded | 8.42 MiB | Runtime + output file |
| Final C | 1024×576 | 243 / 10.13 s | 20 | 2762.89 s | Recommended | About 6.46 GB observed peak | Peak not recorded | 6.82 MiB | GPU observation + output file |

CPU utilization and power were not continuously sampled. Successful-run RAM peaks and several VRAM peaks were not recorded, so the table says so instead of presenting estimates. Output sizes are direct filesystem measurements; failed runs created no MP4.

## Decision

The recommended final configuration is **1024×576, 243 frames, 20 steps**. It is the best verified balance of duration, motion continuity, detail, and recoverable memory behavior. Four steps are substantially faster and are appropriate for prompt and motion iteration. Use 1344×768 only for the shorter 124-frame shot.

The primary capacity driver is the product of spatial resolution and temporal length, not the number of sampling steps. More steps mostly increase runtime, while larger frames and longer sequences increase activation and attention memory. This explains why 20 steps at 1024×576 completes but one step at 1344×768 / 362 frames does not.

## What is not proven

This is a boundary study, not an exhaustive sweep. Configurations such as 1152×640, 1024×576 / 362 frames, different model quantizations, other schedulers, and different offload flags remain untested. The 20-step result is therefore the machine's **best verified result**, not its mathematical or absolute limit.

## Published evidence

- Five complete result videos are under [`assets/videos/`](../assets/videos/).
- Two contact sheets are under [`assets/images/`](../assets/images/).
- The final API prompt is under [`workflows/`](../workflows/).
- The website exposes every result in an A/B synchronized player and a source-pixel viewer.
- Final video SHA-256: `BA978D87ECAD4DDF5A099FF842AA1E487FDF55D97F7E7C1051F4969ABF5856D5`.

## Recommended next experiments

If more boundary testing is worthwhile, test one variable at a time in this order: 1152×640 / 243 frames / 1 step, then 1152×640 / 4 steps; 1024×576 / 362 frames / 1 step; and only then additional 20-step variants. Every tier should save a result video or a structured failure log so comparisons remain auditable.
