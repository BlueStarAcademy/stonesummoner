import fs from "node:fs";

const path = "apps/web/src/main.ts";
let s = fs.readFileSync(path, "utf8");

const helpers = `
function ensureResFxLayer(): HTMLElement {
  let layer = document.querySelector<HTMLElement>("#res-fx-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.id = "res-fx-layer";
    layer.className = "res-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
  }
  return layer;
}

function animateResCount(
  el: HTMLElement,
  from: number,
  to: number,
  ms = 480,
): void {
  const start = performance.now();
  const delta = to - from;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = fmtRes(from + delta * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = fmtRes(to);
  };
  requestAnimationFrame(tick);
}

/** Float resource chips upward, then bump the header wallet. */
function playResourceCollectFx(opts: {
  kind: "mana" | "crystal";
  amount: number;
  from: DOMRect;
  fromValue: number;
  toValue: number;
}): void {
  if (opts.amount <= 0) return;

  const reduce =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;
  const walletSel =
    opts.kind === "mana" ? ".res-item--gold" : ".res-item--crystal";
  const icon =
    opts.kind === "mana" ? "/art/ui/res/gold.svg" : "/art/ui/res/crystal.svg";
  const item = app.querySelector<HTMLElement>(walletSel);
  const valEl = item?.querySelector<HTMLElement>(".res-val");

  if (valEl) valEl.textContent = fmtRes(opts.fromValue);

  const finishHeader = () => {
    if (!valEl || !item) return;
    item.classList.remove("is-res-gain");
    void item.offsetWidth;
    item.classList.add("is-res-gain");
    animateResCount(valEl, opts.fromValue, opts.toValue, reduce ? 180 : 520);
    window.setTimeout(() => item.classList.remove("is-res-gain"), 700);
  };

  if (reduce) {
    finishHeader();
    return;
  }

  const layer = ensureResFxLayer();
  const cx = opts.from.left + opts.from.width / 2;
  const cy = opts.from.top + opts.from.height / 2;
  const n = Math.min(7, Math.max(3, Math.ceil(opts.amount / 40)));

  for (let i = 0; i < n; i++) {
    const chip = document.createElement("div");
    chip.className = \`res-fly res-fly--\${opts.kind}\`;
    const dx = (Math.random() - 0.5) * 56;
    chip.style.left = \`\${cx + (Math.random() - 0.5) * 18}px\`;
    chip.style.top = \`\${cy + (Math.random() - 0.5) * 10}px\`;
    chip.style.setProperty("--dx", \`\${dx}px\`);
    chip.style.setProperty("--delay", \`\${i * 42}ms\`);
    chip.innerHTML = \`<img src="\${icon}" width="16" height="16" alt="" />\`;
    layer.appendChild(chip);
    chip.addEventListener("animationend", () => chip.remove(), { once: true });
  }

  const label = document.createElement("div");
  label.className = \`res-fly-label res-fly-label--\${opts.kind}\`;
  label.style.left = \`\${cx}px\`;
  label.style.top = \`\${cy - 10}px\`;
  label.style.setProperty("--dx", \`\${(Math.random() - 0.5) * 16}px\`);
  label.textContent = \`+\${fmtRes(opts.amount)}\`;
  layer.appendChild(label);
  label.addEventListener("animationend", () => label.remove(), { once: true });

  window.setTimeout(finishHeader, 620);
}

`;

if (s.includes("function playResourceCollectFx")) {
  console.log("helpers already present");
} else {
  const anchor = "function flash(msg: string): void {\n  toast = msg;\n}\n";
  if (!s.includes(anchor)) {
    console.error("flash anchor missing");
    process.exit(1);
  }
  s = s.replace(anchor, anchor + "\n" + helpers);
  console.log("ok helpers");
}

const oldBubble = `  app.querySelectorAll<HTMLElement>("[data-collect]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") {
        return;
      }
      const kind = btn.dataset.collect;
      if (kind === "mana") {
        const r = homeCollect(save);
        save = r.save;
        persist();
        flash(r.message);
        view = "home";
        render();
        return;
      }
      if (kind === "crystal") {
        const r = homeCollectCrystal(save);
        save = r.save;
        persist();
        flash(r.message);
        view = "home";
        render();
      }
    });
  });`;

const newBubble = `  app.querySelectorAll<HTMLElement>("[data-collect]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      if (app.querySelector("#island-viewport")?.getAttribute("data-pan-moved") === "1") {
        return;
      }
      const kind = btn.dataset.collect;
      if (kind !== "mana" && kind !== "crystal") return;
      const from = btn.getBoundingClientRect();
      const beforeMana = Math.floor(save.island.mana);
      const beforeCrystal = Math.floor(save.island.crystal);
      const r = kind === "mana" ? homeCollect(save) : homeCollectCrystal(save);
      save = r.save;
      persist();
      const toMana = Math.floor(save.island.mana);
      const toCrystal = Math.floor(save.island.crystal);
      const gained =
        kind === "mana" ? toMana - beforeMana : toCrystal - beforeCrystal;
      view = "home";
      render();
      if (gained > 0) {
        playResourceCollectFx({
          kind,
          amount: gained,
          from,
          fromValue: kind === "mana" ? beforeMana : beforeCrystal,
          toValue: kind === "mana" ? toMana : toCrystal,
        });
      } else {
        flash(r.message);
      }
    });
  });`;

if (!s.includes(oldBubble)) {
  console.error("bubble handler block not found");
  process.exit(1);
}
s = s.replace(oldBubble, newBubble);
console.log("ok bubble handler");

const oldPond = `  app.querySelector("#btn-pond-collect")?.addEventListener("click", () => {
    const now = Date.now();
    const island = collectMana(tickProduction(save.island, now), "mana_pond", now);
    save = { ...save, island };
    persist();
        flash(\`?? ?? ? ?? \${Math.floor(island.mana)}\`);
    render();
  });`;

// Match corrupted flash flexibly
const pondRe =
  /app\.querySelector\("#btn-pond-collect"\)\?\.addEventListener\("click", \(\) => \{\n    const now = Date\.now\(\);\n    const island = collectMana\(tickProduction\(save\.island, now\), "mana_pond", now\);\n    save = \{ \.\.\.save, island \};\n    persist\(\);\n\s*flash\(`[^`]*`\);\n    render\(\);\n  \}\);/;

const newPond = `app.querySelector("#btn-pond-collect")?.addEventListener("click", (ev) => {
    const origin = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const now = Date.now();
    const before = Math.floor(save.island.mana);
    const island = collectMana(tickProduction(save.island, now), "mana_pond", now);
    save = { ...save, island };
    persist();
    const to = Math.floor(island.mana);
    const gained = to - before;
    render();
    if (gained > 0) {
      playResourceCollectFx({
        kind: "mana",
        amount: gained,
        from: origin,
        fromValue: before,
        toValue: to,
      });
    }
  });`;

if (!pondRe.test(s)) {
  console.error("pond collect not found");
  process.exit(1);
}
s = s.replace(pondRe, newPond);
console.log("ok pond collect");

const oldMine = `  app.querySelector("#btn-mine-collect")?.addEventListener("click", () => {
    const r = homeCollectCrystal(save);
    save = r.save;
    persist();
    flash(r.message);
    render();
  });`;

const newMine = `  app.querySelector("#btn-mine-collect")?.addEventListener("click", (ev) => {
    const origin = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const before = Math.floor(save.island.crystal);
    const r = homeCollectCrystal(save);
    save = r.save;
    persist();
    const to = Math.floor(save.island.crystal);
    const gained = to - before;
    render();
    if (gained > 0) {
      playResourceCollectFx({
        kind: "crystal",
        amount: gained,
        from: origin,
        fromValue: before,
        toValue: to,
      });
    } else {
      flash(r.message);
    }
  });`;

if (!s.includes(oldMine)) {
  console.error("mine collect not found");
  process.exit(1);
}
s = s.replace(oldMine, newMine);
console.log("ok mine collect");

fs.writeFileSync(path, s, "utf8");
console.log("done");
