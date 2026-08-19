export { initAudio, unlockAudio, playBgm, stopBgm, playSfx, duckBgm, getAudioPrefs, setAudioPrefs } from "./manager";
export { readAudioPrefs, writeAudioPrefs, type AudioPrefs } from "./prefs";
export {
  bindUiSfx,
  syncBgmForView,
  playCombatCastSfx,
  playCombatHitSfx,
  magicKindFromId,
  kindFromEffects,
  cueModalSfx,
  isBossStage,
  type AudioScreen,
  type CombatSfxKind,
  type CombatElement,
} from "./bind";
export { combatBgmForBg, type BgmId, type SfxId } from "./catalog";
