javascript:(function () {
  const allowedSites = ["saladofuturo", "educacao.sp.gov.br", "sp.gov.br", "ip.tv"];
  if (!allowedSites.some((s) => location.href.includes(s))) return;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function findCriteriaToggle() {
    const candidates = Array.from(
      document.querySelectorAll("button, [role='button'], span, i, svg")
    );

    return (
      document.querySelector("svg[data-testid='RemoveRedEyeOutlinedIcon']")?.closest("button") ||
      candidates.find((el) => /crit[eé]rio/i.test((el.textContent || "").trim())) ||
      candidates.find((el) => {
        const html = (el.outerHTML || "").toLowerCase();
        return html.includes("removeRedEye".toLowerCase()) || html.includes("fa-eye");
      }) ||
      null
    );
  }

  function isCriteriaOpen() {
    const selectors = [
      "[role='dialog']",
      ".MuiDialog-root",
      ".MuiPopover-root",
      ".MuiModal-root",
      ".MuiDrawer-root",
      "[class*='dialog']",
      "[class*='modal']",
      "[class*='popover']"
    ];
    return Array.from(document.querySelectorAll(selectors.join(","))).some((el) => {
      const txt = (el.innerText || "").toLowerCase();
      const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      return visible && /crit[eé]rio/.test(txt);
    });
  }

  async function openCriteria() {
    if (isCriteriaOpen()) return true;
    const btn = findCriteriaToggle();
    if (!btn) return false;
    btn.click();
    await sleep(300);
    return isCriteriaOpen();
  }

  async function closeCriteria() {
    let open = isCriteriaOpen();
    if (!open) return true;

    const closeBtn = Array.from(document.querySelectorAll("button,[role='button']")).find((b) => {
      const t = (b.textContent || "").trim().toLowerCase();
      const a = (b.getAttribute("aria-label") || "").trim().toLowerCase();
      return /fechar|close|x/.test(t) || /fechar|close/.test(a);
    });

    if (closeBtn) {
      closeBtn.click();
      await sleep(200);
    }

    if (isCriteriaOpen()) {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
      await sleep(200);
    }

    if (isCriteriaOpen()) {
      const toggle = findCriteriaToggle();
      if (toggle) {
        toggle.click();
        await sleep(250);
      }
    }

    open = isCriteriaOpen();
    return !open;
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}

    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "0";
      ta.style.left = "0";
      ta.style.width = "1px";
      ta.style.height = "1px";
      ta.style.opacity = "0";
      ta.style.zIndex = "-1";
      document.body.appendChild(ta);

      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);

      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (ok) return true;
    } catch (_) {}

    try {
      prompt("Copie manualmente:", text);
    } catch (_) {}
    return false;
  }

  function extractText() {
    const editor =
      document.querySelector(".ql-editor") ||
      document.querySelector("[contenteditable='true']") ||
      document.body;

    const blocks = Array.from(editor.children || []);
    let inColetanea = false;
    let inEnunciado = false;
    let coletanea = "";
    let enunciado = "";

    for (const el of blocks) {
      const line = (el.innerText || "").trim();
      const upper = line.toUpperCase();

      if (upper.includes("COLETÂNEA") || upper.includes("COLETANEA")) {
        inColetanea = true;
        inEnunciado = false;
        continue;
      }
      if (upper === "ENUNCIADO") {
        inColetanea = false;
        inEnunciado = true;
        continue;
      }

      if (inColetanea) coletanea += line + "\n";
      if (inEnunciado) enunciado += line + "\n";
    }

    const page = document.body.innerText || "";
    const minMatch = page.match(/m[ií]nimo de\s*(\d+)\s*caracteres/i);
    const genMatch = page.match(/G[eê]nero:\s*([^\n]+)/i);

    const minimo = minMatch ? `Mínimo de ${minMatch[1]} caracteres.` : "Mínimo de 500 caracteres.";
    const genero = genMatch ? `Gênero: ${genMatch[1].trim()}` : "Gênero: Dissertativo.";

    const temaBase = (enunciado || editor.innerText || "").trim().slice(0, 1200);
    const colet = coletanea.trim();

    return `[TEMA]
${temaBase}

[COLETÂNEA]
${colet || "Não identificada."}

[REQUISITOS]
${minimo}

[GENERO]
${genero}`;
  }

  function buildPanel() {
    if (document.getElementById("escritor-ai-panel")) return;

    const panel = document.createElement("div");
    panel.id = "escritor-ai-panel";
    panel.style.cssText = [
      "position:fixed",
      "bottom:20px",
      "right:20px",
      "z-index:2147483647",
      "display:flex",
      "flex-direction:column",
      "gap:8px",
      "padding:12px",
      "background:#151619",
      "border:2px solid #F27D26",
      "border-radius:12px",
      "box-shadow:0 0 25px rgba(242,125,38,.6)",
      "font-family:sans-serif",
      "min-width:180px"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = "ESCRITOR AI PRO";
    title.style.cssText = "color:#F27D26;font-size:11px;font-weight:900;text-align:center;letter-spacing:1px";
    panel.appendChild(title);

    const btn = document.createElement("button");
    btn.textContent = "COPIAR TUDO";
    btn.style.cssText =
      "padding:10px 14px;background:#F27D26;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:12px;width:100%";

    btn.onclick = async (ev) => {
      ev.stopPropagation();
      btn.disabled = true;
      btn.textContent = "EXTRAINDO...";

      try {
        await openCriteria();
        await sleep(350);

        const finalText = extractText();

        await closeCriteria();

        const copied = await copyText(finalText);
        btn.textContent = copied ? "COPIADO" : "COPIE MANUAL";
      } catch (_) {
        btn.textContent = "ERRO";
      }

      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = "COPIAR TUDO";
      }, 2200);
    };

    panel.appendChild(btn);
    document.body.appendChild(panel);
  }

  function keepAlive() {
    buildPanel();
    setTimeout(keepAlive, 4000);
  }

  keepAlive();
})();