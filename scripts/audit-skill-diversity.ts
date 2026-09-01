import { MONSTERS } from "stonesummoner-data";

type CountMap = Record<string, number>;

function bump(map: CountMap, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

const effects: CountMap = {};
const roles: CountMap = {};
const signatures = new Set<string>();
let skills = 0;
let damageSkills = 0;

for (const monster of MONSTERS) {
  bump(roles, monster.role);
  monster.skills.forEach((skill, slot) => {
    skills += 1;
    if (skill.effects.some((effect) => effect.kind === "damage")) {
      damageSkills += 1;
    }
    for (const effect of skill.effects) bump(effects, effect.kind);
    if (slot > 0) {
      signatures.add(
        JSON.stringify(
          skill.effects.map((effect) => {
            const copy = { ...effect } as Record<string, unknown>;
            delete copy.coeff;
            delete copy.amount;
            delete copy.chance;
            return copy;
          }),
        ),
      );
    }
  });
}

process.stdout.write(
  `${JSON.stringify(
    {
      monsters: MONSTERS.length,
      skills,
      damageSkills,
      damageSkillRatio: Number((damageSkills / skills).toFixed(4)),
      uniqueS2S3Signatures: signatures.size,
      monstersByRole: roles,
      effectInstances: effects,
    },
    null,
    2,
  )}\n`,
);
