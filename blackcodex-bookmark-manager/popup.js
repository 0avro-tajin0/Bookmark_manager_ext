try { I18N.applyStatic(document); } catch (e) {}

const T = (k, p) => (window.I18N ? I18N.t(k, p) : k);

const urlInput   = document.getElementById('urlInput');
const titleInput = document.getElementById('titleInput');
const pageField  = document.getElementById('pageField');
const pageSel    = document.getElementById('pageSelect');
const boardSel   = document.getElementById('boardSelect');
const saveBtn    = document.getElementById('saveBtn');
const status     = document.getElementById('status');

function genId() { return '_' + Math.random().toString(36).slice(2, 10); }

// tab.title is the LIVE tab title, which carries noise the static page <title>
// (used when adding from a board) doesn't: unread counts like "(394)" anywhere
// in the string, the signed-in account email, badge markers, doubled spaces.
// e.g. "Входящие (394) - evom9788@gmail.com - Gmail" → "Входящие - Gmail".
function cleanTitle(t) {
  if (!t || typeof t !== 'string') return '';
  let s = t.replace(/\s+/g, ' ').trim();
  s = s.replace(/\s*[([{]\s*\d+\s*[)\]}]\s*/g, ' ');  // unread counts (394) / [12]
  s = s.replace(/^[•·●○▶►*]+\s*/, '');                // leading badge markers
  s = s.replace(/\s+/g, ' ').trim();
  // Drop separator-bounded segments that are just the account email.
  if (s.includes('@')) {
    const parts = s.split(/\s+[-–—|·•]\s+/).map(p => p.trim()).filter(Boolean);
    const kept = parts.filter(p => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
    if (kept.length && kept.length < parts.length) s = kept.join(' - ');
  }
  return s.replace(/\s+/g, ' ').trim();
}

let _allBoards = [];

function populateBoards(pageId) {
  boardSel.innerHTML = '';
  const filtered = pageId ? _allBoards.filter(b => b.pageId === pageId) : _allBoards;
  filtered.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id; opt.textContent = b.name;
    boardSel.appendChild(opt);
  });
}

chrome.storage.local.get('appState', res => {
  const S = res.appState;
  if (!S) { status.textContent = T('popup.noData'); status.className = 'status err'; return; }
  if (S.themeStyle && !S.themeStyle.isDark) document.body.classList.add('theme-light');
  if (S.themeStyle?.accentHex) {
    const hex = S.themeStyle.accentHex.replace('#', '');
    const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
    const luminance = 0.299*r + 0.587*g + 0.114*b;
    saveBtn.style.background = S.themeStyle.accentHex;
    saveBtn.style.color = luminance > 160 ? 'rgba(0,0,0,0.75)' : '#fff';
  }

  _allBoards = (S.boards || []).filter(b => !b.type || b.type === 'board');
  if (!_allBoards.length) { status.textContent = T('popup.noBoards'); status.className = 'status err'; return; }

  const pages = S.pages || [];
  if (pages.length > 1) {
    pageField.style.display = '';
    const savedBoard = _allBoards.find(b => b.id === S.quickSaveBoard);
    const curPageId = savedBoard?.pageId || pages[0]?.id;
    pages.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id; opt.textContent = p.name;
      if (p.id === curPageId) opt.selected = true;
      pageSel.appendChild(opt);
    });
    populateBoards(curPageId);
    pageSel.addEventListener('change', () => populateBoards(pageSel.value));
  } else {
    populateBoards(null);
  }

  // Pre-select saved board
  if (S.quickSaveBoard && boardSel.querySelector(`[value="${S.quickSaveBoard}"]`)) {
    boardSel.value = S.quickSaveBoard;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (tab) {
      urlInput.value = tab.url || '';
      titleInput.value = cleanTitle(tab.title);
    }
    urlInput.focus();
    urlInput.select();
  });
});

saveBtn.addEventListener('click', save);
[urlInput, titleInput].forEach(inp => {
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
});

function save() {
  const raw = urlInput.value.trim();
  if (!raw) { status.textContent = T('popup.urlRequired'); status.className = 'status err'; return; }
  const url = /^https?:\/\//.test(raw) ? raw : 'https://' + raw;
  const title = titleInput.value.trim() || (() => { try { return new URL(url).hostname.replace('www.', ''); } catch { return url; } })();
  const boardId = boardSel.value;

  saveBtn.disabled = true;

  chrome.storage.local.get('appState', res => {
    const S = res.appState;
    if (!S) { fail(T('popup.loadFail')); return; }

    const existing = S.bookmarks.filter(b => b.boardId === boardId);
    const maxOrder = existing.length ? Math.max(...existing.map(b => b.order)) : -1;
    S.bookmarks.push({ id: genId(), boardId, url, title, order: maxOrder + 1 });
    S.quickSaveBoard = boardId;
    // Tag the write as external so an open new-tab page picks it up live (its
    // listener ignores writes whose _writer matches its own tab id).
    S._writer = 'popup_' + Date.now();

    chrome.storage.local.set({ appState: S }, () => {
      status.textContent = T('popup.saved');
      status.className = 'status ok';
      setTimeout(() => window.close(), 800);
    });
  });
}

function fail(msg) {
  saveBtn.disabled = false;
  status.textContent = msg;
  status.className = 'status err';
}
