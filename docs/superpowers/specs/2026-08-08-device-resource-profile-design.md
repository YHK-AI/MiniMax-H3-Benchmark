# Device and resource profile design

## Goal

Make the benchmark self-contained and auditable by publishing the exact test-machine configuration and the resource evidence associated with every tested MiniMax H3 preset. The website remains English by default and supports Simplified Chinese with identical technical values.

## Approved interaction change

- Comparison rail A defaults to the best verified result: Final C, `1024×576`, 243 frames, 20 steps.
- Comparison rail B defaults to the directly comparable C-tier four-step result: `1024×576`, 243 frames, 4 steps.
- Both rails retain the existing selectors, swap behavior, synchronized playback, audio ownership, and source-pixel viewer.

## Device profile

The reproduction section will show one detailed, semantic device profile:

- Lenovo model `21J8`
- Intel Core i9-13900H, 14 cores / 20 logical processors
- NVIDIA GeForce RTX 4060 Laptop GPU, 8188 MiB VRAM, driver 581.08
- 32 GiB RAM: two Samsung 16 GiB DDR5-5600 modules configured at 5200 MT/s
- Samsung 1 TB NVMe SSD plus WD 2 TB NVMe SSD; the benchmark workspace and models are on `E:`
- ComfyUI 0.30.0, PyTorch 2.13.0 + CUDA 13.0, Python 3.13.9, Windows 11

The installation documents will also identify the measured local footprint: 39.554 GiB of model files, 4.041 GiB for the virtual environment, and 46.58 MiB for the published website copy. A 60 GiB free-space floor will be described as operational headroom, not a measured file total.

## Resource matrix

The website and bilingual benchmark documents will list all seven controlled runs, including the two preflights. Each row contains:

- resolution, frames/duration, steps, outcome, and generation time;
- VRAM evidence;
- system-RAM/private-memory evidence;
- final MP4 size, or no output for failed runs;
- a provenance label that distinguishes exact file measurements, observed runtime telemetry, and values that were not recorded.

Known evidence will remain explicit:

- A upper bound: CUDA OOM after a 4.38 GiB QKV request with about 4.32 GiB already allocated; no MP4.
- B-long: approximately 7.9 / 8.2 GB GPU memory and 27.8 GiB process private memory before the unloading stall; no MP4.
- Successful `1024×576 × 243` family: approximately 6.46 GB observed GPU peak; per-run RAM peak was not captured.
- Successful short `1344×768 × 124` runs completed inside the 8188 MiB device limit; exact VRAM and RAM peaks were not captured.
- Output sizes are read directly from the five published MP4 files: 6.38, 4.83, 16.94, 8.42, and 6.82 MiB.

No missing peak will be inferred from spatial or temporal scaling. “Completed within device capacity” is not presented as an exact peak.

## Information architecture and responsive behavior

The detailed device profile stays near the reproduction stack. The existing experiment matrix gains resource columns and the two preflight rows, keeping result filtering intact. Wide tables remain keyboard and touch scrollable; responsive data labels preserve meaning on narrow screens. Status text accompanies color.

## Documentation scope

Update the English and Chinese README, installation guide, benchmark report, and the original workspace manual at `02DOCs/ComfyUI.md`. English remains the default entry point. Both languages use the same numbers and measurement caveats.

## Testing

Tests are written first and must fail before implementation. They will require:

- A default `final20` and B default `c4`, with matching initial title, source, and selected option;
- exact CPU, GPU, RAM-module, storage, and runtime identifiers in the page;
- seven resource rows and the required VRAM, RAM, output-size, and provenance fields;
- identical English and Chinese translation keys;
- bilingual documentation coverage and deployable relative media paths.

After implementation, run the complete Node test suite, JavaScript syntax check, JSON parse check, PowerShell launcher parse check, Git diff checks, local HTTP checks, GitHub Actions, and public Pages/media range checks.

## Non-goals

- No new long-running generation is required.
- No unrecorded peak RAM, VRAM, CPU utilization, power, or scratch-space value is fabricated.
- No model binaries or additional benchmark media are added to GitHub.
- The visual direction, comparison mechanics, and existing media viewer are preserved rather than redesigned.
