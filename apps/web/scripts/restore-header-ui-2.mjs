import fs from 'node:fs';

const FILE = 'apps/web/src/main.ts';
let s = fs.readFileSync(FILE, 'utf8');

const startAnchor = '  app.classList.remove("auth-mode");';
const endAnchor = 'bind();';
const start = s.indexOf(startAnchor);
if (start < 0) throw new Error('start anchor not found');
const bindIdx = s.indexOf(endAnchor, start);
if (bindIdx < 0) throw new Error('end anchor not found');
// walk back from bindIdx to the end of the closing backtick+semicolon of app.innerHTML
const end = s.lastIndexOf('`;', bindIdx) + 2;
const oldRenderBody = s.slice(start, end);
console.log('extracted old block length', oldRenderBody.length);
fs.writeFileSync('apps/web/scripts/_extracted_old_render_body.txt', oldRenderBody, 'utf8');

const newRenderBody = `  const activeSum = getActiveSummoner(save);
  const activeEl = save.activeSummoner ?? "light";
  const isHome = view === "home";
  const nick = escapeHtml(displayNickname());
  const userLv = island.summonerLevel;
  const userExp = Math.floor(island.summonerExp ?? 0);
  const accountLabel =
    sessionUser?.email ??
    (sessionUser?.kind === "demo"
      ? "데모 계정"
      : sessionUser?.kind === "guest"
        ? "게스트"
        : "계정");
  const rosterForPicker = save.summoners ?? createSummonerRoster();
  const summonerPickerList = SUMMONER_ELEMENTS.map((el) => {
    const p = rosterForPicker[el];
    const on = el === activeEl;
    const aw = p.awaken > 0 ? \` · 각성 \${p.awaken}\` : "";
    return \`<button type="button" class="summoner-pick\${on ? " is-active" : ""}" data-summoner="\${el}" \${on ? "disabled" : ""}>
      <img class="summoner-pick-art" src="/art/summoner/\${el}.svg" width="44" height="44" alt="" draggable="false" />
      <span class="summoner-pick-body">
        <strong>\${SUMMONER_ELEMENT_LABEL[el]} 서머너</strong>
        <small>Lv.\${p.level}\${aw}\${on ? " · 사용 중" : ""}</small>
      </span>
    </button>\`;
  }).join("");

  app.classList.remove("auth-mode");
  app.classList.toggle("home-mode", view === "home");
  app.classList.toggle("expedition-mode", view === "stages");
  app.classList.toggle("combat-mode", view === "battle" || view === "result");
  app.innerHTML = \`
    <header class="app-bar app-bar--strip\${isHome ? " app-bar--home" : ""}">
      <div class="app-bar-frame app-bar-frame--strip">
        <div class="app-bar-rail" aria-hidden="true"></div>
        <div class="app-bar-strip">
          <div class="app-bar-brand app-bar-brand--strip" title="\${nick}">
            <div class="user-profile" aria-label="Lv.\${userLv}">
              <img class="user-profile-img" src="/art/auth/logo-mark-192.png" width="40" height="40" alt="" />
              <span class="user-profile-lv">Lv.\${userLv}</span>
              <div class="user-profile-foot">
                <div class="user-profile-exp" role="progressbar" aria-valuenow="\${userExp}" aria-valuemin="0" aria-valuemax="100" aria-label="경험치 \${userExp}/100">
                  <div class="user-profile-exp-fill" style="width:\${Math.min(100, userExp)}%"></div>
                </div>
              </div>
            </div>
            <div class="user-profile-info">
              <div class="user-profile-top">
                <p class="user-profile-nick">\${nick}\${demoTag ? \` \${demoTag}\` : ""}</p>
                <div class="res-item res-item--energy" title="행동력">
                  <img class="res-ico" src="/art/ui/res/energy.svg" width="14" height="14" alt="" draggable="false" />
                  <strong class="res-val">\${Math.floor(island.energy)}<small>/\${island.energyMax ?? 100}</small></strong>
                </div>
              </div>
              \${
                isHome
                  ? ""
                  : \`<p class="user-profile-sub">\${SUMMONER_ELEMENT_LABEL[activeEl]} Lv.\${activeSum.level}\${
                      activeSum.awaken > 0 ? \` · 각성 \${activeSum.awaken}\` : ""
                    }</p>\`
              }
            </div>
          </div>
          <div class="res-wallet" role="group" aria-label="주요 재화">
            <div class="res-item res-item--gold" title="골드">
              <img class="res-ico" src="/art/ui/res/gold.svg" width="14" height="14" alt="" draggable="false" />
              <strong class="res-val">\${fmtRes(island.mana)}</strong>
            </div>
            <div class="res-crystal-wrap">
              <div class="res-item res-item--crystal" title="크리스탈">
                <img class="res-ico" src="/art/ui/res/crystal.svg" width="14" height="14" alt="" draggable="false" />
                <strong class="res-val">\${fmtRes(island.crystal)}</strong>
              </div>
              <button type="button" class="res-more-btn\${resMoreOpen ? " is-open" : ""}" id="btn-res-more" aria-expanded="\${resMoreOpen ? "true" : "false"}" aria-controls="res-more-panel" title="\${resMoreOpen ? "재화 접기" : "다른 재화 보기"}" aria-label="\${resMoreOpen ? "재화 접기" : "다른 재화 보기"}">
                <span class="res-more-chevron" aria-hidden="true"></span>
              </button>
              <div class="res-more-panel\${resMoreOpen ? " is-open" : ""}" id="res-more-panel" role="region" aria-label="기타 재화" \${resMoreOpen ? "" : "hidden"}>
                <div class="res-item res-item--scroll" title="일반 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "normal"))}<small>일</small></strong>
                </div>
                <div class="res-item res-item--scroll" title="고급 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "premium"))}<small>고</small></strong>
                </div>
                <div class="res-item res-item--scroll" title="신성/심연 소환서">
                  <img class="res-ico" src="/art/ui/res/scroll.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(scrollCount(save, "mystic"))}<small>신</small></strong>
                </div>
                <div class="res-item res-item--glory" title="영광">
                  <img class="res-ico" src="/art/ui/res/glory.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(save.gloryPoints ?? 0)}</strong>
                </div>
                <div class="res-item res-item--jinmun" title="진문석">
                  <img class="res-ico" src="/art/ui/res/jinmun.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(save.jinmunStones ?? 0)}</strong>
                </div>
                <div class="res-item res-item--guild" title="기여">
                  <img class="res-ico" src="/art/ui/res/guild.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(save.guildContribution ?? 0)}</strong>
                </div>
                <div class="res-item res-item--arena" title="시즌승">
                  <img class="res-ico" src="/art/ui/res/arena.svg" width="16" height="16" alt="" draggable="false" />
                  <strong class="res-val">\${fmtRes(save.arenaSeasonWins ?? 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      \${renderTicker()}
      \${toast ? \`<p class="toast">\${toast}</p>\` : ""}
    </header>
    <main>\${mainContent(manaPct)}</main>
    \${
      settingsOpen
        ? \`<div class="settings-layer" id="settings-layer">
      <button type="button" class="settings-backdrop" id="btn-settings-close" aria-label="설정 닫기"></button>
      <div class="settings-sheet" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="settings-title">설정</h2>
        <p class="settings-account">\${accountLabel}</p>
        <button type="button" class="settings-logout" id="btn-logout">로그아웃</button>
      </div>
    </div>\`
        : ""
    }
    \${
      isHome
        ? \`<div class="settings-layer" id="summoner-picker-layer" \${summonerPickerOpen ? "" : "hidden"} aria-hidden="\${summonerPickerOpen ? "false" : "true"}">
      <button type="button" class="settings-backdrop" id="btn-summoner-picker-close" aria-label="서머너 선택 닫기"></button>
      <div class="settings-sheet summoner-picker-sheet" role="dialog" aria-modal="true" aria-labelledby="summoner-picker-title">
        <div class="settings-sheet-handle" aria-hidden="true"></div>
        <h2 class="settings-title" id="summoner-picker-title">서머너 변경</h2>
        <p class="settings-account">속성별 서머너를 선택해 육성하세요</p>
        <div class="summoner-picker-list">\${summonerPickerList}</div>
      </div>
    </div>\`
        : ""
    }
    <nav class="tabs">
      <button type="button" data-nav="home" class="\${view === "home" || view === "summon" || view === "enhance" || view === "shop" || view === "pond" || view === "mine" || view === "wish" || view === "glory" || view === "fusion" || view === "party" || view === "guild" || view === "dojo" ? "active" : ""}"><span class="tab-ico tab-ico--home" aria-hidden="true"></span>홈</button>
      <button type="button" data-nav="stages" class="\${tabStages ? "active" : ""}"><span class="tab-ico tab-ico--gate" aria-hidden="true"></span>출정</button>
      <button type="button" data-nav="collect"><span class="tab-ico tab-ico--collect" aria-hidden="true"></span>수집</button>
      <button type="button" id="btn-settings" class="\${settingsOpen ? "active" : ""}" aria-expanded="\${settingsOpen ? "true" : "false"}" aria-controls="settings-layer" title="설정"><span class="tab-ico tab-ico--settings" aria-hidden="true"></span>설정</button>
    </nav>
    <p class="install-hint">공유 → 홈 화면에 추가 (PWA)</p>
  \`;`;

if (!s.includes(oldRenderBody)) throw new Error('sanity check failed: extracted block not findable');
const occurrences = s.split(oldRenderBody).length - 1;
if (occurrences !== 1) throw new Error(`expected 1 occurrence, found ${occurrences}`);

s = s.replace(oldRenderBody, newRenderBody);
fs.writeFileSync(FILE, s, 'utf8');
console.log('wrote stage 2, new file length', s.length);
