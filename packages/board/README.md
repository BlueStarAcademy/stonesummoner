# @stonesummoner/board

마법진(바둑) 룰 엔진 — 전투와 분리된 순수 로직.

## API

```ts
import { Board } from "./src/index.js";

const board = new Board(9); // or 13
const result = board.play("black", { x: 4, y: 4 });
if (result.ok) {
  console.log(result.capturedCount);
}
```

지원: **5×5 / 7×7 / 9×9**, 착수, 활로, 따냄, 자살수 금지, 단순 패(ko), `clear()`·강화 진문 페이즈 헬퍼. 집 계산 없음.

장기전: 9×9에서 착수 50회 → `registerStoneSummon`이 리셋 신호 → `board.clear()` + phase↑.

## Test

```bash
npm install
npm test
```
