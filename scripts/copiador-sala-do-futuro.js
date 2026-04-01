(function(){
    /* --- 1. REGRAS DE NAVEGAÇÃO --- */
    const isEscola = ['saladofuturo','educacao.sp.gov.br','sp.gov.br','ip.tv'].some(s => window.location.href.includes(s));
    const isRedator = window.location.href.includes('redatorproooo.uk');

    if (!isEscola && !isRedator) return;

    /* --- 2. DESBLOQUEIO DE TRAVAS (GOD MODE) --- */
    const eventosTrava = ['paste','copy','cut','contextmenu','selectstart','mousedown','mouseup'];
    eventosTrava.forEach(ev => document.addEventListener(ev, e => e.stopImmediatePropagation(), true));

    const liberarAtributos = () => {
        document.querySelectorAll('input,textarea,[contenteditable="true"],body,html').forEach(el => {
            eventosTrava.forEach(ev => { if(el['on'+ev]) el['on'+ev] = null; el.removeAttribute('on'+ev); });
            el.style.userSelect = 'auto'; el.style.webkitUserSelect = 'auto';
        });
    };

    const oldAdd = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(t, n, r) {
        if (eventosTrava.includes(t)) return;
        return oldAdd.apply(this, arguments);
    };

    setInterval(liberarAtributos, 2000);
    liberarAtributos();

    /* --- FUNÇÃO AUXILIAR DE ESPERA --- */
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /* --- 3. LÓGICA DA ESCOLA (SALA DO FUTURO) --- */
    if (isEscola) {
        // Escuta a devolução do texto vinda do Redator Pro
        window.addEventListener('message', function(event) {
            if(event.data && event.data.acao === 'preencher_redacao') {
                const areaTexto = document.querySelector('.ql-editor') || document.querySelector('textarea') || document.querySelector('[contenteditable="true"]');
                if (areaTexto) {
                    if(areaTexto.classList.contains('ql-editor')) areaTexto.innerHTML = event.data.corpo;
                    else areaTexto.value = event.data.corpo;
                    areaTexto.dispatchEvent(new Event('input', { bubbles: true }));
                    alert('✅ Redação injetada com sucesso!');
                }
            }
        });

        if (!document.getElementById('btn-ida-mobile')) {
            const btn = document.createElement('button');
            btn.id = 'btn-ida-mobile';
            btn.innerText = '🚀 GERAR NO REDATOR PRO';
            btn.style = 'position:fixed;bottom:20px;left:5%;width:90%;z-index:999999;background:#F27D26;color:white;border:none;padding:18px;border-radius:12px;font-size:16px;font-weight:900;text-transform:uppercase;box-shadow:0 8px 30px rgba(242,125,38,0.5);cursor:pointer;font-family:sans-serif;letter-spacing:1px;';
            
            btn.onclick = async () => {
                btn.innerText = '⏳ EXTRAINDO...';
                
                try {
                    // 3.1. TENTA ABRIR O PAINEL DE CRITÉRIOS
                    let btnOlho = document.querySelector('svg[data-testid="RemoveRedEyeOutlinedIcon"]') || 
                                  document.querySelector('button i.fa-eye') || 
                                  Array.from(document.querySelectorAll('button,span,svg,i')).find(e => e.innerText && e.innerText.toLowerCase().includes('critério'));
                    
                    if (btnOlho) {
                        const clicavel = btnOlho.tagName === 'svg' ? (btnOlho.closest('button') || btnOlho.parentElement || btnOlho) : btnOlho;
                        clicavel.click();
                        await sleep(1500); // Espera abrir a gaveta no celular (mais lento)
                    }

                    // 3.2. EXTRAI O TEXTO (Procura no painel aberto, ou no corpo inteiro se falhar)
                    let painelAtivo = document.querySelector('.MuiDrawer-paper') || document.querySelector('.offcanvas') || document.body;
                    
                    let enunciado = '';
                    let diretrizes = '';

                    // Procura blocos de texto específicos
                    const textosGerais = Array.from(painelAtivo.querySelectorAll('p, span, div'))
                        .map(e => e.innerText?.trim())
                        .filter(t => t && t.length > 20); // Filtra lixo

                    // Tenta capturar Enunciado e Diretrizes de forma genérica
                    for (let i = 0; i < textosGerais.length; i++) {
                        const txtUpper = textosGerais[i].toUpperCase();
                        if (txtUpper.includes('ENUNCIADO')) {
                            enunciado = textosGerais[i] + (textosGerais[i+1] ? '\n' + textosGerais[i+1] : '');
                        }
                        if (txtUpper.includes('DIRETRIZES') || txtUpper.includes('CRITÉRIO')) {
                            diretrizes = textosGerais[i] + (textosGerais[i+1] ? '\n' + textosGerais[i+1] : '');
                        }
                    }

                    // Fallback se a estrutura mudou: pega o maior bloco de texto da tela
                    if (!enunciado) {
                        const maiorTexto = textosGerais.reduce((a, b) => a.length > b.length ? a : b, '');
                        enunciado = maiorTexto.substring(0, 1000); // Limita para não explodir a URL
                    }

                    const corpoTodo = document.body.innerText;
                    const matchMin = corpoTodo.match(/mínimo de\s*(\d+)\s*caracteres/i);
                    const limite = matchMin ? 'Mínimo de ' + matchMin[1] + ' caracteres.' : 'Mínimo de 500 caracteres.';
                    
                    const matchGen = corpoTodo.match(/Gênero:\s*([^\n]+)/i);
                    const genero = matchGen ? matchGen[0].trim() : 'Gênero: Dissertativo.';

                    const dadosFinais = `[TEMA/ENUNCIADO]\n${enunciado.trim()}\n\n[REQUISITOS]\n${limite}\n${diretrizes}\n\n[GENERO]\n${genero}`;

                    // 3.3. FECHA O PAINEL DE CRITÉRIOS (Para não atrapalhar quando voltar)
                    let btnFechar = document.querySelector('svg[data-testid="CloseIcon"]') || 
                                    document.querySelector('button[aria-label="close"]') || 
                                    Array.from(document.querySelectorAll('button')).find(e => e.innerText && e.innerText.toUpperCase() === 'FECHAR');
                    
                    if (btnFechar) {
                        const fecharClicavel = btnFechar.tagName === 'svg' ? (btnFechar.closest('button') || btnFechar.parentElement || btnFechar) : btnFechar;
                        fecharClicavel.click();
                        await sleep(500); // Espera fechar
                    } else {
                        // Força fechar clicando no fundo se não achar o X (Mui-Backdrop comum no Material UI)
                        let backdrop = document.querySelector('.MuiBackdrop-root');
                        if(backdrop) backdrop.click();
                    }
                    
                    // 3.4. ENVIA OS DADOS E ABRE O SITE
                    const payload = encodeURIComponent(JSON.stringify({ corpo: dadosFinais }));
                    window.open('https://redatorproooo.uk/?auto=true#' + payload, '_blank');
                    
                } catch(err) {
                    alert('Erro ao extrair texto: ' + err.message);
                }
                
                setTimeout(() => { btn.innerText = '🚀 GERAR NO REDATOR PRO' }, 2000);
            };
            document.body.appendChild(btn);
        }
    }

    /* --- 4. LÓGICA NO REDATOR PRO (O SEU SITE) --- */
    if (isRedator) {
        const hash = window.location.hash.substring(1);
        if (hash && window.location.search.includes('auto=true')) {
            
            try {
                const dados = JSON.parse(decodeURIComponent(hash));
                
                const injetarDados = () => {
                    const textareas = document.querySelectorAll('textarea');
                    if (textareas.length > 0) {
                        const targetBox = textareas[0];
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                        nativeSetter.call(targetBox, dados.corpo);
                        targetBox.dispatchEvent(new Event('input', { bubbles: true }));
                    } else {
                        setTimeout(injetarDados, 500);
                    }
                };
                setTimeout(injetarDados, 1000);
            } catch(e) {}

            if (!document.getElementById('btn-volta-mobile')) {
                const btnVolta = document.createElement('button');
                btnVolta.id = 'btn-volta-mobile';
                btnVolta.innerText = '🔙 DEVOLVER PARA A ESCOLA';
                btnVolta.style = 'position:fixed;bottom:20px;left:5%;width:90%;z-index:999999;background:#10b981;color:white;border:none;padding:18px;border-radius:12px;font-size:16px;font-weight:900;text-transform:uppercase;box-shadow:0 8px 30px rgba(16,185,129,0.5);cursor:pointer;font-family:sans-serif;letter-spacing:1px;';
                
                btnVolta.onclick = async () => {
                    const tas = document.querySelectorAll('textarea');
                    const textoGerado = tas.length > 1 ? tas[tas.length - 1].value : tas[0].value; 

                    const copiarRobusto = async (texto) => {
                        try{ if(navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texto); return true; } }catch(e){}
                        try{
                            const t = document.createElement("textarea");
                            t.value = texto; t.style.position = "fixed"; t.style.left = "-9999px";
                            document.body.appendChild(t); t.focus(); t.select();
                            const ok = document.execCommand("copy");
                            document.body.removeChild(t);
                            if(ok) return true;
                        }catch(e){}
                        return false;
                    };

                    if (window.opener && !window.opener.closed) {
                        window.opener.postMessage({ acao: 'preencher_redacao', corpo: textoGerado }, '*');
                        btnVolta.innerText = '✅ ENVIADO! FECHE ESSA ABA.';
                        btnVolta.style.background = '#059669';
                    } else {
                        const copiou = await copiarRobusto(textoGerado);
                        if(copiou) {
                            btnVolta.innerText = '✅ COPIADO! VOLTE E COLE.';
                            alert('A aba da escola se desconectou do seu celular.\n\nA redação foi COPIADA COM SUCESSO! 📋\n\nVolte na Sala do Futuro, segure o dedo na caixa e clique em COLAR.');
                        } else {
                            prompt('Erro ao copiar sozinho. Copie manualmente abaixo:', textoGerado);
                        }
                    }
                };
                document.body.appendChild(btnVolta);
            }
        }
    }
})();