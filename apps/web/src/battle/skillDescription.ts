import { t } from "../i18n";

type EffectValue = string | number | boolean | null | undefined;

export interface SkillDescriptionEffect {
  kind: string;
  target?: string;
  coeff?: number;
  amount?: number;
  turns?: number;
  chance?: number;
  count?: number;
  axis?: string;
  cc?: string;
  [key: string]: EffectValue | Record<string, EffectValue>;
}

export interface SkillDescriptionSource {
  cooldown: number;
  effects: SkillDescriptionEffect[];
}

export interface SkillDescriptionOptions {
  cooldown?: number;
  powerMultiplier?: number;
}

function numberFrom(
  effect: SkillDescriptionEffect,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = effect[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function stringFrom(
  effect: SkillDescriptionEffect,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = effect[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function pct(value: number | undefined, fractionByDefault = true): number {
  if (value == null) return 0;
  const normalized =
    fractionByDefault && Math.abs(value) <= 1 ? value * 100 : value;
  return Math.round(normalized);
}

function targetLabel(target: string | undefined): string {
  switch (target) {
    case "all_enemies":
      return t("ui.skillTargetAllEnemies");
    case "self":
      return t("ui.skillTargetSelf");
    case "ally_lowest":
      return t("ui.skillTargetLowestAlly");
    case "all_allies":
      return t("ui.skillTargetAllAllies");
    case "single_ally":
    case "ally":
    case "dead_ally":
    case "ally_dead":
      return t("ui.skillTargetOneAlly");
    default:
      return t("ui.skillTargetOneEnemy");
  }
}

function scalingSource(effect: SkillDescriptionEffect, fallback: string): string {
  const nested = effect.scaling;
  const source =
    stringFrom(effect, "scalingSource", "scalesWith", "source", "scale") ??
    (typeof nested === "string"
      ? nested
      : nested && typeof nested === "object" && typeof nested.source === "string"
        ? nested.source
        : fallback);
  switch (normalizedKind(source)) {
    case "max_hp":
    case "caster_max_hp":
    case "own_max_hp":
      return t("ui.skillScaleMaxHp");
    case "target_max_hp":
      return t("ui.skillScaleTargetMaxHp");
    case "current_hp":
    case "caster_current_hp":
      return t("ui.skillScaleCurrentHp");
    case "lost_hp":
    case "missing_hp":
      return t("ui.skillScaleLostHp");
    case "def":
    case "defense":
      return t("ui.skillScaleDef");
    case "spd":
    case "speed":
      return t("ui.skillScaleSpd");
    default:
      return t("ui.skillScaleAtk");
  }
}

function axisLabel(axis: string | undefined): string {
  switch (axis) {
    case "def":
      return t("ui.skillAxisDef");
    case "spd":
      return t("ui.skillAxisSpd");
    case "critRate":
    case "crit_rate":
      return t("ui.skillAxisCritRate");
    case "critDmg":
    case "crit_dmg":
      return t("ui.skillAxisCritDmg");
    case "accuracy":
    case "acc":
      return t("ui.skillAxisAccuracy");
    default:
      return t("ui.skillAxisAtk");
  }
}

function ccLabel(cc: string | undefined): string {
  switch (cc ? normalizedKind(cc) : cc) {
    case "freeze":
      return t("ui.skillCcFreeze");
    case "sleep":
      return t("ui.skillCcSleep");
    default:
      return t("ui.skillCcStun");
  }
}

function withTurnsAndChance(
  line: string,
  effect: SkillDescriptionEffect,
): string {
  const turns = numberFrom(effect, "turns", "duration");
  const chance = numberFrom(effect, "chance", "applyChance");
  let result = line;
  if (turns != null) {
    result = t("ui.skillFxWithTurns", {
      text: result,
      turns: Math.max(0, Math.round(turns)),
    });
  }
  if (chance != null) {
    result = t("ui.skillFxWithChance", {
      text: result,
      pct: pct(chance),
    });
  }
  return result;
}

function normalizedKind(kind: string): string {
  return kind.replaceAll("-", "_").replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function effectLine(
  effect: SkillDescriptionEffect,
  powerMultiplier: number,
): string | null {
  const kind = normalizedKind(effect.kind);
  const target = targetLabel(effect.target);
  const scaledCoeff =
    (numberFrom(effect, "coeff", "ratio", "power", "multiplier", "amount") ??
      0) * (numberFrom(effect, "sourceFactor") ?? 1);
  const amount = numberFrom(
    effect,
    "amount",
    "value",
    "ratio",
    "coeff",
    "percent",
    "pct",
  );

  switch (kind) {
    case "damage": {
      let line = t("ui.skillFxDamage", {
        target,
        source: scalingSource(effect, "atk"),
        pct: pct(scaledCoeff * powerMultiplier),
      });
      const hits = numberFrom(effect, "hits");
      if (hits != null && hits > 1) {
        line = t("ui.skillFxMultiHit", { text: line, hits: Math.round(hits) });
      }
      if (
        effect.ignoreDefense === true ||
        effect.ignoreDef === true ||
        effect.ignore_defense === true
      ) {
        line = t("ui.skillFxIgnoreDefenseApplied", { text: line });
      } else {
        const ignored = numberFrom(effect, "ignoreDef", "ignoreDefensePct");
        if (ignored != null && ignored > 0) {
          line = t("ui.skillFxIgnoreDefensePercent", {
            text: line,
            pct: pct(ignored),
          });
        }
      }
      return line;
    }
    case "heal":
      return t("ui.skillFxHeal", {
        target,
        source: scalingSource(effect, "max_hp"),
        pct: pct(scaledCoeff * powerMultiplier),
      });
    case "shield":
      return withTurnsAndChance(
        t("ui.skillFxShieldTarget", {
          target,
          source: scalingSource(effect, "max_hp"),
          pct: pct(scaledCoeff * powerMultiplier),
        }),
        effect,
      );
    case "mana":
      return t("ui.skillFxMana", {
        n: Math.round((amount ?? 0) * powerMultiplier),
      });
    case "buff":
    case "debuff":
      return withTurnsAndChance(
        t(kind === "buff" ? "ui.skillFxBuff" : "ui.skillFxDebuff", {
          target,
          axis: axisLabel(effect.axis),
          pct: Math.abs(pct(amount)),
        }),
        effect,
      );
    case "cc":
      return withTurnsAndChance(
        t("ui.skillFxCc", {
          target,
          cc: ccLabel(stringFrom(effect, "cc", "type", "status")),
        }),
        effect,
      );
    case "dot":
    case "hot": {
      const dotKind = stringFrom(effect, "dotKind", "dot_kind");
      const dotKey =
        kind === "hot"
          ? "ui.skillFxHot"
          : dotKind === "burn"
            ? "ui.skillFxBurn"
            : dotKind === "poison"
              ? "ui.skillFxPoison"
              : "ui.skillFxDot";
      const source =
        kind === "hot"
          ? scalingSource(effect, "max_hp")
          : dotKind === "poison"
            ? scalingSource(effect, "max_hp")
            : scalingSource(effect, "atk");
      return withTurnsAndChance(
        t(dotKey, {
          target,
          source,
          pct: pct(scaledCoeff * powerMultiplier),
        }),
        effect,
      );
    }
    case "strip":
    case "cleanse":
      return withTurnsAndChance(
        t(kind === "strip" ? "ui.skillFxStrip" : "ui.skillFxCleanse", {
          target,
          count: Math.max(1, Math.round(effect.count ?? 1)),
        }),
        effect,
      );
    case "provoke":
      return withTurnsAndChance(t("ui.skillFxProvoke", { target }), effect);
    case "heal_block":
      return withTurnsAndChance(t("ui.skillFxHealBlock", { target }), effect);
    case "silence":
      return withTurnsAndChance(t("ui.skillFxSilence", { target }), effect);
    case "immunity":
      return withTurnsAndChance(t("ui.skillFxImmunity", { target }), effect);
    case "atb":
    case "attack_bar":
    case "atb_gain":
    case "atb_reduce": {
      const value = pct(amount);
      const decreases = kind === "atb_reduce" || value < 0;
      return withTurnsAndChance(
        t(decreases ? "ui.skillFxAtbDown" : "ui.skillFxAtbUp", {
          target,
          pct: Math.abs(value),
        }),
        effect,
      );
    }
    case "revive":
      return t("ui.skillFxRevive", {
        target,
        pct: Math.abs(
          pct(
            numberFrom(
              effect,
              "hpFraction",
              "hpRatio",
              "hp",
              "amount",
              "ratio",
            ),
          ),
        ),
      });
    case "cooldown": {
      const delta = numberFrom(effect, "delta");
      const value = numberFrom(effect, "amount", "turns", "delta") ?? 0;
      const direction = stringFrom(effect, "direction", "mode");
      const increases =
        direction === "increase" || (direction == null && delta != null && delta > 0);
      return t(increases ? "ui.skillFxCooldownUp" : "ui.skillFxCooldownDown", {
        target,
        n: Math.abs(Math.round(value)),
      });
    }
    case "cooldown_increase":
    case "cooldown_reduce":
      return t(
        kind === "cooldown_increase"
          ? "ui.skillFxCooldownUp"
          : "ui.skillFxCooldownDown",
        {
          target,
          n: Math.abs(Math.round(amount ?? numberFrom(effect, "turns") ?? 0)),
        },
      );
    case "share":
    case "damage_share":
      return withTurnsAndChance(
        t("ui.skillFxShare", {
          target,
          pct: Math.abs(pct(numberFrom(effect, "fraction") ?? amount)),
        }),
        effect,
      );
    case "reflect":
      return withTurnsAndChance(
        t("ui.skillFxReflect", {
          target,
          pct: Math.abs(pct(numberFrom(effect, "fraction") ?? amount)),
        }),
        effect,
      );
    case "ignore_defense":
      return t("ui.skillFxIgnoreDefense");
    default:
      return null;
  }
}

export function monsterSkillDescLines(
  skill: SkillDescriptionSource | null | undefined,
  options: SkillDescriptionOptions = {},
): string[] {
  if (!skill) return [];
  const cooldown = Math.max(
    0,
    Math.floor(options.cooldown ?? skill.cooldown ?? 0),
  );
  const lines = [
    cooldown > 0
      ? t("ui.skillCdLabel", { n: cooldown })
      : t("ui.skillCdNone"),
  ];
  const multiplier = Math.max(0, options.powerMultiplier ?? 1);
  for (const effect of skill.effects ?? []) {
    const line = effectLine(effect, multiplier);
    if (line) lines.push(line);
  }
  return lines;
}
