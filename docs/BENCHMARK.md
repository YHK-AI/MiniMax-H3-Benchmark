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

## Results

| Experiment | Resolution | Frames / duration | Steps | Result | Evidence |
| --- | ---: | ---: | ---: | --- | --- |
| A upper bound | 1344×768 | 362 / 15.08 s | 1 | CUDA OOM | QKV requested 4.38 GiB with about 4.32 GiB already allocated |
| B-long | 1344×768 | 243 / 10.13 s | 1 | Stalled | Private memory reached about 27.8 GiB; unloading stopped progressing |
| B-short preflight | 1344×768 | 124 / 5.17 s | 1 | Success | Complete decodable MP4; timing not recorded |
| B-short | 1344×768 | 124 / 5.17 s | 4 | Success | 537.49 s; highest verified resolution |
| C preflight | 1024×576 | 243 / 10.13 s | 1 | Success | Complete decodable MP4; timing not recorded |
| C balanced | 1024×576 | 243 / 10.13 s | 4 | Success | 650.96 s; complete four-beat narrative |
| Final C | 1024×576 | 243 / 10.13 s | 20 | Recommended | 2762.89 s; complete media verification |

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
