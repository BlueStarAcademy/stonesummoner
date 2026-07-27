import { AtlasAttachmentLoader, SkeletonJson, TextureAtlas } from "@esotericsoftware/spine-core";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("public/art/spine/fire_fang");
const atlasText = fs.readFileSync(path.join(dir, "fire_fang-pma.atlas"), "utf8");
const atlas = new TextureAtlas(atlasText);
for (const p of atlas.pages) {
  p.setTexture({
    getImagePath: () => p.name,
    setFilters: () => {},
    setWraps: () => {},
    dispose: () => {},
  });
}
const loader = new AtlasAttachmentLoader(atlas);
const json = new SkeletonJson(loader);
const data = json.readSkeletonData(
  fs.readFileSync(path.join(dir, "fire_fang.json"), "utf8"),
);
console.log(
  JSON.stringify(
    {
      bones: data.bones.length,
      slots: data.slots.length,
      skins: data.skins.map((s) => s.name),
      animNames: data.animations.map((a) => a.name),
      events: data.events.map((e) => e.name),
      regions: atlas.regions.map((r) => r.name),
    },
    null,
    2,
  ),
);
