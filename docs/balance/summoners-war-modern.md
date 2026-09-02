# Summoners War modern reference snapshot

Snapshot date: **2026-09-01**

This document records external reference points for StoneSummoner balance work.
It is not a claim that StoneSummoner should copy Summoners War values one for
one. The machine-readable snapshot is
`packages/data/src/balance/swModern.ts`; it is intentionally not exported from
the data package root yet.

## Sources

- [Summoners War Wiki: Scenario](https://summonerswar.fandom.com/wiki/Scenario)
  - 13 areas, 7 stages per area, and Normal/Hard/Hell progression.
- [Summoners War Wiki: Faimon Volcano](https://summonerswar.fandom.com/wiki/Faimon_Volcano)
  - Scenario energy and the community's post-v5.0.8 XP measurements.
- [v5.0.8 update notice](https://summonerswar.spokland.com/game/update/v5.0.8_update_notice-2019-08-28)
  - Provenance boundary for the scenario XP rebalance.
- [Com2uS/HIVE RELOADED notice mirror](https://m-mercury.qpyou.cn/custom/board_detail/527)
  - Core Cairos recompression from B12 to B10, new B10's former-B12 rewards,
    reduced 8-energy cost, and slightly reduced difficulty.
- [Summoners War Wiki: Giant's Keep](https://summonerswar.fandom.com/wiki/Giant%27s_Keep)
  - Community-maintained floor levels and historical rune-grade observations.
- [SWARFARM: Giant's Keep Abyss Hard](https://swarfarm.com/bestiary/dungeons/giants-keep-abyss/2/)
  - Level-75 wave and boss snapshot.
- [Giant's Keep Abyss community guide](https://summonerswarskyarena.info/giants-keep-abyss/)
  - 6-star-only rune statement, Intangible eligibility, and stronger seasonal
    boss behavior.
- [RELOADED recap](https://summonerswarskyarena.info/summoners-war-reloaded-major-update-recap/)
  - Normal/Hard Abyss structure, seasonal boss changes, duplicate-monster
    restriction, and higher rune-rarity intent.
- [SWARFARM project/API notice](https://github.com/swarfarm/swarfarm)
  - Explains that the public API schema can change and that community data is
    not a permanent official contract.

## Reference tables

### Scenario

The stable structure is 13 areas × 7 stages, each with three
difficulties. Stages 1-6 use 3/4/5 energy on Normal/Hard/Hell. Community XP
tables imply that stage 7 uses one additional energy (4/5/6).

Faimon stage 1 is the XP anchor because its wiki table explicitly identifies
the post-v5.0.8 remeasurement:

| Difficulty | Energy | Party XP | XP per occupied slot | Gross party XP/energy |
| --- | ---: | ---: | ---: | ---: |
| Normal | 3 | 3,024 | 756 | 1,008 |
| Hard | 4 | 5,104 | 1,276 | 1,276 |
| Hell | 5 | 10,920 | 2,730 | 2,184 |

These values assume four occupied player-monster slots. They exclude XP
boosters, friend representatives, and any redistribution caused by max-level
units. They are anchors, not a complete formula for all 273 scenario stages.

### Core Cairos B1-B10

The generic Giant/Dragon/Necro reference ladder is:

| Floor | Energy | Representative boss level | Supported rune stars |
| --- | ---: | ---: | --- |
| B1 | 5 | 12 | 2-3 |
| B2 | 5 | 15 | 2-3 |
| B3 | 6 | 20 | 2-4 |
| B4 | 6 | 25 | 3-4 |
| B5 | 7 | 30 | 3-5 |
| B6 | 7 | 40 | 3-5 |
| B7 | 7 | 50 | 4-6 |
| B8 | 8 | 55 | 4-6 |
| B9 | 8 | 60 | 4-6 |
| B10 | 8 | 75 | 6★ |

B10 is a discontinuity, not a smooth extrapolation: RELOADED removed B11/B12
and assigned former-B12 rewards to the new B10 at 8 energy with slightly lower
difficulty. The level-75 anchor is community-observed and should not be treated
as an official immutable stat contract. The lower-floor bands summarize
supported grades, not drop probabilities.

### Abyss

| Profile | Energy | Enemy-level anchor | Rune stars | Metadata |
| --- | ---: | ---: | --- | --- |
| Normal (B1) | 8 | 70 | 6 | Intangible eligible, no duplicate monsters |
| Hard (B2) | 8 | 75 | 6 | Better rarity ceiling, same restrictions |

Abyss bosses and skills are seasonal. The level and energy anchors are useful
for relative progression, while exact HP, attack, defense, speed, skill
behavior, and rarity rates must be re-snapshotted for a specific season.

## Exact values versus measurements

The source quality is mixed:

- Topology and announced RELOADED rules are published rules and are the most
  stable references.
- Wiki and SWARFARM enemy levels are community-maintained observations.
- Scenario XP and rune-grade tables are measured samples. Their values may lag
  a patch, differ by collection window, or omit low-frequency outcomes.

## StoneSummoner explicit deviations

- The product requirement caps scenario symbols at ★3 and starts every depth
  floor at ★3, even where older SW lower-floor samples contain ★2 runes.
- Board captures and item pickups grant a team-wide temporary effect until
  immediately before that team's next stone placement. This has no SW analogue.
- Symbol effects are wearer-only in StoneSummoner, including the Shield-equivalent
  set; summoner equipment affects only the equipped summoner. Innate summoner
  leader skills remain team-wide.
- Values unavailable from the live server are frozen community measurements or
  clearly marked synthesis. They must not be presented as private Com2uS data.
- A supported rune-star band says only that a grade can occur. It does not
  encode odds.
- The qualitative efficiency profiles are design synthesis, not measured drop
  rates. Actual efficiency depends on clear time, success rate, returned
  energy, events, boosters, and the player's sell/keep policy.

For those reasons the TypeScript data carries provenance and confidence
metadata. Do not derive precise drop weights from the bands or turn qualitative
efficiency labels into percentages.

## StoneSummoner mapping

| Summoners War reference | StoneSummoner mode | Intended use |
| --- | --- | --- |
| Scenario Normal/Hard/Hell | `scenario` main quest | Story progression and XP/repeat-farm baseline |
| Core Cairos B1-B10 | `depth` Giant/Dragon/Necro floors | Symbol-star progression and repeatable farming |
| Abyss Normal/Hard | Future top-end `depth` profiles | Optional ceiling above reliable B10-equivalent farming |
| Scenario rune grades | Scenario symbol grades | Directional cap/shape only; StoneSummoner owns its probabilities |
| Cairos/Abyss rune grades | Depth symbol grades | Directional floor/ceiling only; no copied drop rates |

Arena, weekday awakening, trials, challenge tower, world arena, guild raid, and
equipment vault modes have no direct row-level mapping in this snapshot. They
should use their own reward currencies and progression goals rather than
borrowing scenario XP or Cairos rune efficiency.
