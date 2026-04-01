javascript:(function(){
    /* --- PARTE 1: DESBLOQUEIO TOTAL (GOD MODE) --- */
    const eventosTrava = ['paste','copy','cut','contextmenu','selectstart','mousedown','mouseup'];
    eventosTrava.forEach(ev => {
        document.addEventListener(ev, e => { e.stopImmediatePropagation() }, !0);
    });

    const liberarAtributos = () => {
        document.querySelectorAll('input,textarea,[contenteditable="true"],body,html').forEach(el => {
            eventosTrava.forEach(ev => {
                if(el['on'+ev]) el['on'+ev] = null;
                el.removeAttribute('on'+ev);
            });
        });
    };

    const style = document.createElement('style');
    style.innerHTML = '*{user-select:auto!important;-webkit-user-select:auto!important}';
    (document.head || document.documentElement).appendChild(style);

    const oldAdd = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(t, n, r) {
        if (eventosTrava.includes(t)) return;
        return oldAdd.apply(this, arguments);
    };

    new MutationObserver(() => liberarAtributos()).observe(document.documentElement, {childList:true, subtree:true});
    liberarAtributos();

    /* --- PARTE 2: LÓGICA ESCRITOR AI PRO --- */
    const sitesEscola = ['saladofuturo','educacao.sp.gov.br','sp.gov.br','ip.tv'];
    const noSiteEscola = () => sitesEscola.some(s => window.location.href.includes(s));
    const noMeuSite = () => window.location.href.includes('redatorproooo.uk');

    if (noSiteEscola()) {
        // Se já existir resposta salva, ele tenta colar automaticamente (A Volta)
        const respostaSalva = localStorage.getItem('resposta_escritor');
        if (respostaSalva) {
            const res = JSON.parse(respostaSalva);
            const inputTitulo = document.querySelector('input[placeholder*="Titulo"]') || document.querySelector('input.MuiInputBase-input');
            const areaTexto = document.querySelector('.ql-editor') || document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');

            if (inputTitulo && res.titulo) {
                inputTitulo.value = '';
                inputTitulo.value = res.titulo;
                inputTitulo.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (areaTexto && res.corpo) {
                areaTexto.innerHTML = res.corpo; // Para editores ricos
                if(areaTexto.tagName === 'TEXTAREA') areaTexto.value = res.corpo;
                areaTexto.dispatchEvent(new Event('input', { bubbles: true }));
            }
            localStorage.removeItem('resposta_escritor');
            return;
        }

        // Painel Flutuante (A Ida)
        if (!document.getElementById('escritor-ai-panel')) {
            const panel = document.createElement('div');
            panel.id = 'escritor-ai-panel';
            panel.style = 'position:fixed;bottom:20px;right:20px;z-index:999999;padding:15px;background:#151619;border:2px solid #F27D26;border-radius:15px;box-shadow:0 0 30px rgba(242,125,38,0.7);font-family:sans-serif;text-align:center;';
            
            const btn = document.createElement('button');
            btn.innerText = '🚀 EXTRAIR E RESOLVER';
            btn.style = 'background:#F27D26;color:white;border:none;padding:12px 20px;border-radius:8px;font-weight:bold;cursor:pointer;text-transform:uppercase;';
            
            btn.onclick = async () => {
                btn.innerText = '⏳ PROCESSANDO...';
                const tema = document.body.innerText.match(/Gênero:\s*([^\n]+)/i)?.[0] || "Dissertativo";
                const qlEditor = document.querySelector('.ql-editor');
                const textoExtraido = qlEditor ? qlEditor.innerText : document.body.innerText.substring(0, 1500);

                localStorage.setItem('dados_escritor', JSON.stringify({
                    tema: tema,
                    corpo: textoExtraido
                }));

                window.open('https://redatorproooo.uk/?auto=true', '_blank');
                setTimeout(() => { btn.innerText = '🚀 EXTRAIR E RESOLVER' }, 2000);
            };

            panel.appendChild(btn);
            document.body.appendChild(panel);
        }
    }

    // --- LÓGICA DENTRO DO SEU SITE ---
    if (noMeuSite()) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('auto')) {
            const dadosStr = localStorage.getItem('dados_escritor');
            if (dadosStr) {
                const dados = JSON.parse(dadosStr);
                // Procura o textarea do Espião no seu site
                const textareaEspiao = document.querySelector('textarea[placeholder*="Cole aqui"]') || document.querySelector('textarea.w-full');
                if (textareaEspiao) {
                    textareaEspiao.value = `[TEMA]: ${dados.tema}\n\n[CONTEÚDO]: ${dados.corpo}`;
                    textareaEspiao.dispatchEvent(new Event('input', { bubbles: true }));
                    textareaEspiao.focus();
                    console.log('✅ Dados injetados no Espião com sucesso!');
                }
            }
        }
    }
})();