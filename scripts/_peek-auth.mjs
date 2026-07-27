import { execSync } from "node:child_process";
const head = execSync("git show HEAD:apps/web/src/main.ts", {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});
const i = head.indexOf("auth-title");
console.log(head.slice(i, i + 800));
