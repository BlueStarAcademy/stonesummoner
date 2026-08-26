# Photoshop CS6 (64-bit)

Default path on this machine:

```
C:\Program Files\Adobe\Adobe Photoshop CS6 (64 Bit)\Photoshop.exe
```

Optional env override:

```powershell
$env:PHOTOSHOP_EXE = "C:\Program Files\Adobe\Adobe Photoshop CS6 (64 Bit)\Photoshop.exe"
```

CS6 runs JSX by passing the script path directly (not `-r`).

**Paint new art:** double-click or run `scripts/photoshop/new-transparent-battle-still-doc.jsx` in Photoshop.

**Batch plate cleanup (magenta/black AI sources):** CS6 uses Node chroma inside the runner (JSX color range is unreliable on CS6).

```bash
npm run monster-art:photoshop -- --families wolf_fighter --plate magenta
```

Outputs to `assets/monster/battle-transparent/wolf_fighter/`. Copy PNGs into `assets/monster/battle/` then sync.

## Paint target

**No background layer.** New document → Background Contents: **Transparent**.

Export **PNG** with transparency (File → Export → Export As… → PNG, Transparency on).

Drop into:

```
assets/monster/battle/{artKey}-front.png
assets/monster/battle/{artKey}-awaken-front.png
```

Then:

```bash
npm run monster-art:sync -- --families wolf_fighter
```

Pre-alpha sources skip plate dematte and install as clean WebP.

## AI plate cleanup (magenta / black)

When sources are still on a color plate:

```bash
# set if Photoshop is not under Program Files\Adobe
# PHOTOSHOP_EXE=C:\Path\To\Photoshop.exe

node scripts/run-photoshop-transparent.mjs --families wolf_fighter --plate magenta
```

Outputs to `assets/monster/battle-transparent/{family}/`. Copy results into `assets/monster/battle/` and sync.

Plate modes: `magenta` (AI `#FF00FF`) or `black` (`#000`).

## Manual checklist

1. Layers panel: no **Background** layer (only transparent + character layers).
2. No floor glow painted on a separate “backdrop” layer — VFX on character layers only.
3. Export PNG-24, not JPEG.
4. Do not flatten onto white/black before export.
