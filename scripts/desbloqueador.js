(function () {
  'use strict';

  // ========== LÓGICA DESBLOQUEAR CONTROL+V (VIA GITHUB) ==========
  const loadBypass = () => {
    const s = document.createElement('script');
    s.src = 'https://raw.githubusercontent.com/lobocatj/desbloquear-colar/refs/heads/main/scripts/desbloqueador.js';
    s.onload = () => console.log('✅ Bypass carregado do GitHub.');
    s.onerror = () => {
      console.error('❌ Erro ao carregar bypass do GitHub. Usando fallback local.');
      // Fallback local caso o GitHub falhe
      const events = ['paste', 'copy', 'cut', 'contextmenu', 'selectstart', 'mousedown', 'mouseup'];
      events.forEach(event => {
        document.addEventListener(event, e => { e.stopImmediatePropagation(); }, true);
      });
    };
    document.head.appendChild(s);
  };
  loadBypass();
  // ===============================================================

  const PANEL_ID = 'escritor-ai-panel';
  const MANUAL_ID = 'extrator-manual-copy';

  const clean = (s = '') =>
    s.replace(/\u00A0/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  const line = (s = '') =>
    s.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = (fn, timeout = 5000, interval = 150) =>
    new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        let result = null;
        try { result = fn(); } catch (_) {}
        if (result) {
          clearInterval(timer);
          resolve(result);
          return;
        }
        if (Date.now() - start >= timeout) {
          clearInterval(timer);
          reject(new Error('timeout'));
        }
      }, interval);
    });

  function showManualCopy(text) {
    let wrap = document.getElementById(MANUAL_ID);

    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = MANUAL_ID;
      wrap.style = 'position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:20px;';
      wrap.innerHTML = `
        <div style="width:min(900px,95vw);background:#111;color:#fff;border:2px solid #F27D26;border-radius:12px;padding:16px;font-family:Arial,sans-serif;">
          <div style="font-weight:700;margin-bottom:8px;">Cópia manual</div>
          <div style="font-size:13px;opacity:.85;margin-bottom:10px;">Pressione Ctrl+C e depois feche.</div>
          <textarea style="width:100%;height:60vh;border:0;outline:0;border-radius:8px;padding:12px;box-sizing:border-box;"></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:10px;">
            <button style="padding:10px 16px;background:#F27D26;color:#fff;border:0;border-radius:8px;cursor:pointer;">Fechar</button>
          </div>
        </div>
      `;
      wrap.querySelector('button').onclick = () => wrap.remove();
      document.body.appendChild(wrap);
    }

    const ta = wrap.querySelector('textarea');
    ta.value = text;
    ta.focus();
    ta.select();
  }

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        alert('✅ Dados copiados.');
        return true;
      }
    } catch (_) {}

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();

      if (ok) {
        alert('✅ Dados copiados.');
        return true;
      }
    } catch (_) {}

    showManualCopy(text);
    return false;
  }

  function extractGenero() {
    const container = document.querySelector('.css-qgasy7');
    if (container) {
      const h6Elements = container.querySelectorAll('h6.MuiTypography-root');
      if (h6Elements.length >= 2) {
        return line(h6Elements[1].textContent);
      }
    }

    const especifico = document.querySelector('h6.MuiTypography-root.MuiTypography-subtitle2.css-a6qwlz');
    if (especifico) {
      return line(especifico.textContent);
    }

    const label = [...document.querySelectorAll('h6')].find(el =>
      /Gênero Textual:/i.test(el.textContent.trim())
    );
    if (label?.nextElementSibling?.tagName === 'H6') {
      return line(label.nextElementSibling.textContent);
    }

    return 'Dissertação ENEM';
  }

  function extractRequisitos() {
    const items = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,li')]
      .map((el) => line(el.innerText || ''))
      .filter(Boolean);

    const min = items.find((t) => /m[ií]nimo de caracteres/i.test(t));
    const max = items.find((t) => /m[aá]ximo de caracteres/i.test(t));

    return [min, max].filter(Boolean).join('\n') || 'N° mínimo de caracteres: 1300';
  }

  function extractTexto() {
    const editor = document.querySelector('.ql-editor');
    if (!editor) return { tema: '', coletanea: '' };

    const blocks = [...editor.querySelectorAll('p,li,h1,h2,h3,h4,h5,h6,blockquote')];
    const lines = (blocks.length ? blocks : [editor])
      .map((el) => line(el.innerText || ''))
      .filter(Boolean);

    const isBad = (t) =>
      /^(colet[âa]nea|texto\s*[ivxlcdm]+|tema|proposta|enunciado)$/i.test(t);

    let tema = '';
    const marker = lines.findIndex((t) => /^(tema|proposta|enunciado)\b/i.test(t));

    if (marker >= 0) {
      tema = lines.slice(marker + 1).find((t) => t.length > 15 && !isBad(t)) || '';
    }

    if (!tema) {
      const emphasized = [...editor.querySelectorAll('strong,u,b')]
        .map((el) => line(el.innerText || ''))
        .filter((t) => t.length > 15 && !isBad(t));

      tema = emphasized[0] || lines.find((t) => t.length > 15 && !isBad(t)) || '';
    }

    const coletaneaLines = marker >= 0 ? lines.slice(0, marker) : lines;
    const coletanea = clean(coletaneaLines.join('\n'));

    return { tema, coletanea };
  }

  async function extractCriterios() {
    const svg = document.querySelector('svg[data-testid="RemoveRedEyeOutlinedIcon"]');
    let btn = svg?.closest('button');

    if (!btn) {
      btn = [...document.querySelectorAll('button')].find((b) =>
        /Critérios de Avaliação/i.test(clean(b.parentElement?.innerText || ''))
      );
    }

    if (!btn) return '';

    btn.click();

    const modal = await waitFor(() => {
      const direct = document.querySelector('.css-3j596c');
      if (direct && /Critérios de Avaliação/i.test(clean(direct.innerText || ''))) {
        return direct;
      }

      return [...document.querySelectorAll('[role="dialog"], .MuiModal-root, .MuiDialog-root, .MuiDialog-root, .MuiPopover-root, body > div')]
        .find((el) => /Critérios de Avaliação/i.test(clean(el.innerText || '')));
    }, 6000).catch(() => null);

    if (!modal) return '';

    await sleep(200);

    const box = modal.querySelector('[data-simplebar="init"], .css-1sc6jgo') || modal;
    let text = clean(box.innerText || modal.innerText || '');
    text = text.replace(/^Critérios de Avaliação\s*/i, '').trim();

    const closeBtn = [...modal.querySelectorAll('button')].find((b) =>
      /fechar|close/i.test(line((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')))
    );

    if (closeBtn) {
      closeBtn.click();
    } else {
      document.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true
        })
      );
    }

    return text;
  }

  async function run(btn) {
    try {
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Copiando...';
      }

      const genero = extractGenero();
      const requisitos = extractRequisitos();
      const { tema, coletanea } = extractTexto();
      const criterios = await extractCriterios();

      const output = [
        '[TEMA]',
        tema || 'Não identificado',
        '',
        '[COLETANEA]',
        coletanea || 'Não identificada',
        '',
        '[REQUISITOS]',
        requisitos || 'Não identificado',
        '',
        '[GENERO]',
        genero || 'Não identificado',
        '',
        '[CRITERIOS]',
        criterios || 'Não identificado'
      ].join('\n');

      await copyToClipboard(output);
    } catch (e) {
      console.error('Erro no extrator:', e);
      alert('❌ Erro ao extrair.');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 COPIAR TUDO';
      }
    }
  }

  function createUI() {
    const old = document.getElementById(PANEL_ID);
    if (old) old.remove();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.style = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:#151619;border:2px solid #F27D26;border-radius:12px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:Arial,sans-serif;';

    const btn = document.createElement('button');
    btn.textContent = '🚀 COPIAR TUDO';
    btn.style = 'padding:12px 18px;background:#F27D26;color:#fff;border:0;border-radius:8px;cursor:pointer;font-weight:700;';
    btn.addEventListener('click', () => run(btn));

    panel.appendChild(btn);
    document.body.appendChild(panel);
  }

  function init() {
    createUI();
    console.log('Extrator + Bypass pronto.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();