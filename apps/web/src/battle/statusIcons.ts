import type { Unit } from "stonesummoner-combat";
import {
  listUnitStatuses,
  type UnitStatusIcon,
  type UnitStatusId,
} from "stonesummoner-combat";

function plate(rim: string, wash: string, glyph: string): string {
  return (
    '<svg class="battle-status-svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">' +
    `<rect x="1" y="1" width="22" height="22" rx="5.2" fill="#141018" stroke="${rim}" stroke-width="1.75"/>` +
    `<rect x="3.05" y="3.05" width="17.9" height="17.9" rx="3.5" fill="${wash}"/>` +
    glyph +
    "</svg>"
  );
}

const GLYPH: Record<UnitStatusId, string> = {
  "atk-up": plate(
    "#E87830",
    "#5A2810",
    '<path fill="#F4D090" d="M12 4.4l3.2 4.2h-2V12h-2.4V8.6H8.8z"/>' +
      '<path fill="#F4D090" d="M12 10.2l3.2 4.2h-2V19h-2.4v-4.6H8.8z"/>',
  ),
  "def-up": plate(
    "#4A9AE0",
    "#143048",
    '<path fill="#D8EEFF" d="M12 4.6c2.6 1.4 5.4 1.9 7 2.1v6.2c0 3.6-2.7 6.1-7 7.5-4.3-1.4-7-3.9-7-7.5V6.7c1.6-.2 4.4-.7 7-2.1z"/>',
  ),
  "spd-up": plate(
    "#3CB87A",
    "#103024",
    '<path fill="none" stroke="#D8FFE8" stroke-width="1.8" stroke-linecap="round" d="M6.2 9.2h7.4M5.4 12.4h9.4M6.8 15.6h6.2"/>' +
      '<path fill="#D8FFE8" d="M16.2 7.4l4.2 4.8-4.2 4.8V7.4z"/>',
  ),
  "crit-up": plate(
    "#E8C84A",
    "#3A3010",
    '<path fill="#FFF4C0" d="M12 4.4l1.7 4.1 4.4.5-3.3 3 .9 4.3L12 14.4 8.3 16.3l.9-4.3-3.3-3 4.4-.5z"/>',
  ),
  "cdmg-up": plate(
    "#E07040",
    "#401810",
    '<path fill="#FFD0A0" d="M12 4.2l1.4 4.2 4.4.2-3.4 2.8 1.1 4.2L12 13.4 8.5 15.6l1.1-4.2-3.4-2.8 4.4-.2z"/>' +
      '<circle cx="12" cy="12" r="2.1" fill="#FFF6E0"/>',
  ),
  "acc-up": plate(
    "#58C8E0",
    "#103038",
    '<circle cx="12" cy="12" r="5.4" fill="none" stroke="#E0F8FF" stroke-width="1.7"/>' +
      '<circle cx="12" cy="12" r="2" fill="#E0F8FF"/>' +
      '<path stroke="#E0F8FF" stroke-width="1.5" stroke-linecap="round" d="M12 5.2v1.8M12 17v1.8M5.2 12h1.8M17 12h1.8"/>',
  ),
  shield: plate(
    "#7ECBFF",
    "#183040",
    '<path fill="#E8F8FF" d="M12 5c2.4 1.2 4.8 1.6 6.2 1.8v5.4c0 3.1-2.3 5.2-6.2 6.5-3.9-1.3-6.2-3.4-6.2-6.5V6.8C7.2 6.6 9.6 6.2 12 5z"/>',
  ),
  immune: plate(
    "#E8C84A",
    "#3A3010",
    '<rect x="10.4" y="6.2" width="3.2" height="11.6" rx="1.1" fill="#FFF4C0"/>' +
      '<rect x="6.2" y="10.4" width="11.6" height="3.2" rx="1.1" fill="#FFF4C0"/>',
  ),
  "atk-down": plate(
    "#A84840",
    "#301018",
    '<path fill="#E8B0A8" d="M12 19.6l-3.2-4.2h2V12h2.4v3.4h2z"/>' +
      '<path fill="#E8B0A8" d="M12 13.8l-3.2-4.2h2V5h2.4v4.6h2z"/>',
  ),
  "def-down": plate(
    "#5A78A8",
    "#181828",
    '<path fill="#C0D0E8" d="M12 4.8c2.4 1.3 5 1.8 6.4 2v5.6c0 2.2-.9 3.9-2.6 5.2L12 12.2 8.2 17.6C6.5 16.3 5.6 14.6 5.6 12.4V6.8c1.4-.2 4-.7 6.4-2z"/>' +
      '<path fill="none" stroke="#2A1018" stroke-width="1.6" d="M8.2 9.4l7.6 7.2"/>',
  ),
  "spd-down": plate(
    "#6A8858",
    "#182018",
    '<path fill="none" stroke="#D0E0C0" stroke-width="1.8" stroke-linecap="round" d="M6.4 8.6h8M5.8 12h9.2M6.8 15.4h7.2"/>' +
      '<path fill="#D0E0C0" d="M16.4 16.8l4-4.8-4-4.8v9.6z"/>',
  ),
  stun: plate(
    "#A090E0",
    "#241838",
    '<path fill="none" stroke="#E8E0FF" stroke-width="1.8" stroke-linecap="round" d="M14.8 7.2c1.8 1.2 2.6 3.4 1.6 5.4-1.2 2.4-4.2 3-6.4 1.8-2-.1-3.2-2.8-2.2-4.8.8-1.6 2.6-2.2 4.2-1.6"/>' +
      '<circle cx="9.2" cy="8.2" r="1.15" fill="#E8E0FF"/>' +
      '<circle cx="16.4" cy="10.6" r="1.05" fill="#E8E0FF"/>',
  ),
  provoke: plate(
    "#E05050",
    "#381018",
    '<path fill="#FFD0D0" d="M7.2 8.4h3.2l-1 8.4H8.2zm6.4 0h3.2l-1 8.4h-1.2z"/>' +
      '<circle cx="8.8" cy="6.4" r="1.3" fill="#FFD0D0"/>' +
      '<circle cx="15.2" cy="6.4" r="1.3" fill="#FFD0D0"/>',
  ),
  dot: plate(
    "#8A58C8",
    "#241030",
    '<path fill="#E0C8FF" d="M12 5.2c2.8 3.4 5.4 6.2 5.4 9.1A5.4 5.4 0 0 1 12 19.6a5.4 5.4 0 0 1-5.4-5.3c0-2.9 2.6-5.7 5.4-9.1z"/>',
  ),
};

function renderOne(item: UnitStatusIcon): string {
  const ticks =
    item.ticks > 0
      ? `<b class="battle-status-ticks">${item.ticks}</b>`
      : "";
  return `<span class="battle-status-ico is-${item.polarity} is-${item.id}">${GLYPH[item.id]}${ticks}</span>`;
}

export function renderUnitStatusIcons(u: Unit): string {
  const items = listUnitStatuses(u);
  if (!items.length) return "";
  return `<div class="battle-unit-statuses" aria-hidden="true">${items.map(renderOne).join("")}</div>`;
}
