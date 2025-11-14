## Anthropic x Penn Hackathon – Python Scaffold

This is a minimal Python project set up with **uv** and a local virtual environment.

### Setup

1. **Create / recreate the virtual environment** (already done once):

```bash
cd /Users/yohan/Desktop/AnthropicXPenn-Hackathon
uv venv .venv
```

2. **Activate the virtual environment**:

```bash
source .venv/bin/activate
```

3. **Install dependencies with `uv pip`** (example):

```bash
uv pip install requests
```

### Running the app

From the project root, with the venv activated:

```bash
python3 -m src.main
```


