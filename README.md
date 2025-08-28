# ArtKid — Expo React Native prototype [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/kuptservol/artkid/blob/main/notebooks/playground.ipynb)

Simple prototype: capture or pick a child drawing → send to a ControlNet model → preview result. Android-focused for now.

## Setup

1) Install deps

```bash
npm install
```

2) Configure environment (Replicate API)

Create `.env` in project root:

```bash
EXPO_PUBLIC_REPLICATE_TOKEN=your_replicate_token
# Optional: override default pinned model version (jagilley/controlnet-scribble)
# Default in code: 435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117
EXPO_PUBLIC_REPLICATE_MODEL_VERSION=
```

Notes:
- Token: create at `https://replicate.com/account/api-tokens`.
- Default model: `jagilley/controlnet-scribble` pinned version above. You can paste another version id to override.

3) Android run

```bash
npm run android
```

Requirements:
- Android Studio emulator running or a USB‑connected device with USB debugging.

## Usage

- On the Home tab press “Камера / Галерея” to capture/pick an image.
- Press “Сгенерировать” to send it to the Replicate model.
- The result is displayed below.

## Where to change things

- UI actions: `app/(tabs)/index.tsx`
- Generation service (Replicate upload + prediction): `services/generation.ts`
- Expo config/permissions: `app.json`

## Switching providers

Currently wired for Replicate (upload → prediction → poll). To switch to Fal.ai or your server, replace `services/generation.ts` implementation keeping the same function signature.

## Notebook playground

Location: `notebooks/playground.ipynb`

Setup (one-time):

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install jupyter ipywidgets pillow requests
```

Run:

```bash
jupyter notebook
# open notebooks/playground.ipynb
```

Paste your Replicate token in the widget, upload an image, tweak params, and click Generate.
