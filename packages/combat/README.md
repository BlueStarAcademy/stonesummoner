# stonesummoner-combat

전투 코어: ATB → 스톤소환 → Amplify/마나 → 스킬(서머너 진문개방).

```bash
# repo root
npm install
npm test -w stonesummoner-combat
```

## 사용

```ts
import { Battle, makeUnit } from "stonesummoner-combat";

const battle = new Battle({ boardSize: 5, units, allySummoner, enemySummoner });
battle.runAutoTurn();
```
