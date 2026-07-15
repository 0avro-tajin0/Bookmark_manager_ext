# Восстановление плашки поиска (Nav Search Bar)

Плашка поиска в топбаре удалена из-за артефакта (светлое гало по краю от `backdrop-filter`,
который при субпиксельной позиции плашки давал вертикальную линию на бордах).

**Важно:** это НЕ search-борд (`buildSearchBoard`, type:'search') — тот остаётся.
И `SEARCH_ENGINES` НЕ удалялся (он общий, нужен для search-борда).

Что было удалено / как восстановить:

---

## 1. newtab.html

### Топбар — элемент плашки (между `#pagesNav` и `#topWidgets`, строка ~17):
```html
<div id="navSearchBar"></div>
```

### Карточка в галерее виджетов (`#wcNavSearch`):
```html
<div class="widget-card" id="wcNavSearch">
  <div class="widget-card-icon">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
  </div>
  <span class="widget-card-name">Search</span>
  <button class="st-toggle" id="navSearchToggle"><span class="st-toggle-knob"></span></button>
</div>
```

---

## 2. newtab.js

### В `loadState()` (дефолт):
```js
if (S.navSearchEnabled === undefined) S.navSearchEnabled = true;
```

### В `renderAll()` — вызов рендера:
```js
function renderAll() { renderPages(); renderBoards(); renderNavSearch(); requestAnimationFrame(syncLayout); }
```
(сейчас `renderNavSearch()` из этой строки убран)

### В `updateNavLayout()` — учёт ширины плашки (оставлен, т.к. защищён `if (nsbBar)`):
```js
const nsbBar = document.querySelector('.nsb-bar');
if (nsbBar) {
  const r = nsbBar.getBoundingClientRect();
  if (r.width > 0) rightBound = r.left;
}
```

### Функции (оставлены в коде как «спящие», помечены комментарием — можно просто вернуть вызовы):
- `renderNavSearch()`
- `closeNsbEnginePopup()` / `openNsbEnginePopup(engBtn)`
- `let _nsbEngPopup = null;`
- `nsbFaviconUrl(domain)`, `nsbEngineIcon(eng, size)`, `nsbDoSearch(query)`
- `syncNavSearchCard()`

### Обработчики (УДАЛЕНЫ — вернуть после `syncNavSearchCard`):
```js
document.getElementById('navSearchToggle').addEventListener('click', () => {
  S.navSearchEnabled = !S.navSearchEnabled;
  saveState();
  syncNavSearchCard();
  renderNavSearch();
  requestAnimationFrame(syncLayout);
});

document.getElementById('mpWidgets').addEventListener('click', syncNavSearchCard, { capture: true });
```

---

## 3. style.css

Весь блок `/* ── Nav search bar ── */` (правила `#navSearchBar`, `.nsb-bar`, `.nsb-icon`,
`.nsb-input`, `.nsb-eng-logo`, `.nsb-eng-popup`, `@keyframes nsbPopupIn`, `.nsb-eng-opt`,
их `body.theme-light` варианты) — оставлен в файле как есть (CSS неактивен без HTML-элемента).
Если будешь чистить и его — вот он:

```css
/* ── Nav search bar ── */
#navSearchBar {
  pointer-events: none;
}

.nsb-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 340px;
  height: 44px;
  padding: 0 6px 0 14px;
  border-radius: 999px;
  background: rgba(var(--board-rgb, 255,255,255), var(--board-alpha, 0.05));
  backdrop-filter: blur(var(--board-blur, 12px));
  -webkit-backdrop-filter: blur(var(--board-blur, 12px));
  pointer-events: all;
}

.nsb-icon {
  flex-shrink: 0;
  color: var(--board-text-dim, rgba(255,255,255,0.3));
  pointer-events: none;
}

.nsb-input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--board-text, rgba(255,255,255,0.9));
  caret-color: var(--accent-color, #fff);
}
.nsb-input::placeholder { color: var(--board-text-dim, rgba(255,255,255,0.28)); }

.nsb-eng-logo {
  flex-shrink: 0;
  width: 28px; height: 28px;
  border-radius: 8px;
  border: none;
  background: rgba(var(--board-rgb, 255,255,255), 0.07);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s;
  padding: 0;
}
.nsb-eng-logo:hover { background: rgba(var(--board-rgb, 255,255,255), 0.15); }

/* Engine picker popup — appended to body, above boards */
.nsb-eng-popup {
  position: fixed;
  z-index: 500;
  min-width: 186px;
  background: rgba(22, 22, 30, 0.97);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 6px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  gap: 2px;
  animation: nsbPopupIn 0.13s ease;
}
@keyframes nsbPopupIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
body.theme-light .nsb-eng-popup {
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(0,0,0,0.09);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
}

.nsb-eng-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: none;
  border-radius: 9px;
  background: none;
  color: var(--board-text-secondary, rgba(255,255,255,0.65));
  font-size: 13px; font-weight: 500;
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.1s, color 0.1s;
}
.nsb-eng-opt:hover {
  background: rgba(255,255,255,0.08);
  color: var(--board-text, rgba(255,255,255,0.95));
}
.nsb-eng-opt.active {
  background: rgba(255,255,255,0.13);
  color: var(--board-text, #fff);
  font-weight: 600;
}
body.theme-light .nsb-eng-opt:hover  { background: rgba(0,0,0,0.06); }
body.theme-light .nsb-eng-opt.active { background: rgba(0,0,0,0.08); }
```

---

## Также при возврате
В `syncLayout()` есть округление ширины топбара до чётного и `marginLeft` до целого —
это была попытка убрать субпиксель ради плашки поиска. Без плашки можно упростить
(вернуть `topbar.style.width = (last.right - first.left) + 'px'` и
`topbar.style.marginLeft = first.left + 'px'`), но это не обязательно.
