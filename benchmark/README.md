# Benchmark Test Project

This folder contains a small backend fixture (`python_service` + `dotnet_service`) and comparison outputs.

## Run benchmark

```bash
npm run build
npm run benchmark:compare
```

## Output files

- `benchmark/results/latest.json`
- `benchmark/results/latest.md`

The benchmark compares:

- baseline context strategy (replay full history + broader code context each session)
- project-brain strategy (handoff/task/rules/decision context only)
