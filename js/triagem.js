/*
 * Triagem NIP: mesa de triagem (triagem.html?id=...).
 * À esquerda a fila; à direita a ficha da NIP escolhida, com a triagem
 * (tema, área e aviso), a resposta à ANS e o histórico.
 */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;

  const u = G.shell({
    ativo: G.param('prazo') === 'urgente' ? 'urgente' : 'triagem',
    titulo: 'Mesa de triagem',
    migalhas: [{ label: 'Painel', href: 'inicio.html' }, { label: 'Mesa de triagem' }]
  });
  if (!u) return;

  const mesa = document.getElementById('mesa');
  const filaEl = document.getElementById('fila');
  const detalhe = document.getElementById('detalhe');
  const chipsEl = document.getElementById('chips');
  const busca = document.getElementById('busca-texto');
  const soMinhas = document.getElementById('so-minhas');
  const ordem = document.getElementById('ordem');

  /* ------------------------------------------------------------ Estado */

  const salvos = G.store.get('filtros:triagem', {});
  const estado = {
    chip: G.param('prazo') === 'urgente' ? 'urgente' : (salvos.chip || 'abertas'),
    busca: salvos.busca || '',
    minhas: !!salvos.minhas,
    ordem: salvos.ordem || 'prazo',
    id: Number(G.param('id')) || 0
  };
  busca.value = estado.busca;
  soMinhas.checked = estado.minhas;
  ordem.value = estado.ordem;
  const guarda = () => G.store.set('filtros:triagem', { chip: estado.chip, busca: estado.busca, minhas: estado.minhas, ordem: estado.ordem });

  const urgente = (n) => G.aberta(n) && G.prazo(n).dias <= 1;
  const CHIPS = [
    { chave: 'abertas', label: 'Abertas', teste: (n) => G.aberta(n) },
    { chave: 'urgente', label: 'Prazo curto', teste: urgente },
    { chave: 'Com problema', label: 'Com problema', teste: (n) => n.status === 'Com problema' },
    { chave: 'Aguardando triagem', label: 'Para triar', teste: (n) => n.status === 'Aguardando triagem' },
    { chave: 'Em análise', label: 'Em análise', teste: (n) => n.status === 'Em análise' },
    { chave: 'Respondida', label: 'Respondidas', teste: (n) => n.status === 'Respondida' },
    { chave: 'Cancelada', label: 'Canceladas', teste: (n) => n.status === 'Cancelada' },
    { chave: 'todas', label: 'Todas', teste: () => true }
  ];

  function base() {
    const termo = G.normaliza(estado.busca);
    const digitos = G.digitos(estado.busca);
    return G.db.all('nips').filter((n) => {
      if (estado.minhas && n.analistaId !== u.id) return false;
      if (!termo) return true;
      return G.normaliza(n.beneficiario.nome).indexOf(termo) >= 0 ||
        (digitos.length >= 3 && (n.protocolo.indexOf(digitos) >= 0 || G.digitos(n.beneficiario.cpf).indexOf(digitos) >= 0));
    });
  }

  function ordena(lista) {
    const porPrazo = (a, b) => {
      const aa = G.aberta(a);
      const ab = G.aberta(b);
      if (aa !== ab) return aa ? -1 : 1;
      if (aa) return G.prazo(a).dias - G.prazo(b).dias || (a.importadaEm < b.importadaEm ? -1 : 1);
      return a.dataNotificacao < b.dataNotificacao ? 1 : -1;
    };
    const f = {
      prazo: porPrazo,
      recentes: (a, b) => (a.importadaEm < b.importadaEm ? 1 : -1),
      nome: (a, b) => a.beneficiario.nome.localeCompare(b.beneficiario.nome, 'pt-BR')
    }[estado.ordem] || porPrazo;
    return lista.slice().sort(f);
  }

  /* ------------------------------------------------------------- Fila */

  function renderChips(lista) {
    chipsEl.replaceChildren();
    CHIPS.forEach((c) => {
      const qtd = lista.filter(c.teste).length;
      const b = h('button', { type: 'button', class: 'chip', 'aria-pressed': String(estado.chip === c.chave) },
        c.label, h('span', { class: 'chip__n' }, h('span', { class: 'visually-hidden', text: ', ' }), String(qtd)));
      b.addEventListener('click', () => {
        estado.chip = c.chave;
        guarda();
        renderFila(true);
        chipsEl.querySelector('[aria-pressed="true"]').focus();
      });
      chipsEl.appendChild(b);
    });
  }

  function itemFila(n) {
    const pz = G.prazo(n);
    const caminho = n.temaId ? G.caminhoTema(n.temaId) : [];
    const a = h('a', {
      class: 'fila__item fila__item--' + (pz.tom || 'neutro'),
      href: 'triagem.html?id=' + n.id,
      'aria-current': n.id === estado.id ? 'true' : null,
      dataset: { id: String(n.id) }
    },
      h('span', { class: 'fila__top' }, h('span', { class: 'fila__nome', text: n.beneficiario.nome }), G.statusBadge(n.status)),
      h('span', { class: 'fila__tema', text: caminho.length ? caminho[caminho.length - 1] : n.descricao }),
      h('span', { class: 'fila__rodape' },
        G.protocolo(n.protocolo, true),
        h('span', { class: 'fila__prazo fila__prazo--' + (pz.tom || '') }, G.icon('clock'), pz.texto)));
    a.addEventListener('click', (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      ev.preventDefault();
      seleciona(n.id, true);
    });
    return h('li', null, a);
  }

  function renderFila(anunciar) {
    const lista = base();
    renderChips(lista);
    const chip = CHIPS.find((c) => c.chave === estado.chip) || CHIPS[0];
    const visiveis = ordena(lista.filter(chip.teste));
    filaEl.replaceChildren();
    if (!visiveis.length) {
      filaEl.appendChild(h('li', { class: 'fila__vazia' },
        h('strong', { text: estado.busca ? 'Nenhuma NIP com essa busca' : 'Nada por aqui' }),
        h('p', { text: estado.busca ? 'Confira o protocolo, o nome ou o CPF, ou procure em "Todas".' : 'Quando chegar uma NIP nessa situação, ela aparece aqui.' })));
    }
    visiveis.forEach((n) => filaEl.appendChild(itemFila(n)));
    if (anunciar) G.announce(G.fmt.plural(visiveis.length, 'NIP', 'NIPs') + ' em "' + chip.label + '".');
  }

  let buscaTimer;
  busca.addEventListener('input', () => {
    window.clearTimeout(buscaTimer);
    buscaTimer = window.setTimeout(() => {
      estado.busca = busca.value.trim();
      if (estado.busca && estado.chip !== 'todas') estado.chip = 'todas';
      guarda();
      renderFila(true);
    }, 250);
  });
  document.getElementById('busca').addEventListener('submit', (ev) => ev.preventDefault());
  soMinhas.addEventListener('change', () => { estado.minhas = soMinhas.checked; guarda(); renderFila(true); });
  ordem.addEventListener('change', () => { estado.ordem = ordem.value; guarda(); renderFila(true); });

  function atualizaContador() {
    const cont = document.querySelector('.rail__count');
    const qtd = G.db.all('nips').filter((n) => n.status === 'Aguardando triagem' || n.status === 'Com problema').length;
    if (cont) cont.firstChild.textContent = String(qtd);
  }

  /* ----------------------------------------------------------- Seleção */

  function seleciona(id, focar) {
    estado.id = id;
    const url = id ? 'triagem.html?id=' + id : 'triagem.html';
    window.history.replaceState(null, '', url);
    filaEl.querySelectorAll('.fila__item').forEach((a) => {
      if (Number(a.dataset.id) === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    renderDetalhe();
    if (focar) {
      const t = document.getElementById('detalhe-titulo');
      detalhe.scrollTop = 0;
      if (t) t.focus();
      if (window.matchMedia('(max-width: 1099.98px)').matches) window.scrollTo(0, 0);
    }
  }

  /* ------------------------------------------------------ Peças da ficha */

  // Marca as palavras-chave no relato sem mexer no texto original (acentos e maiúsculas).
  function destaca(texto, palavras) {
    let norm = '';
    const mapa = [];
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      for (let k = 0; k < c.length; k++) { norm += c[k]; mapa.push(i); }
    }
    const faixas = [];
    palavras.forEach((p) => {
      const alvo = G.normaliza(p);
      if (!alvo) return;
      let pos = norm.indexOf(alvo);
      while (pos >= 0) {
        faixas.push([mapa[pos], mapa[pos + alvo.length - 1] + 1]);
        pos = norm.indexOf(alvo, pos + alvo.length);
      }
    });
    faixas.sort((a, b) => a[0] - b[0]);
    const unidas = [];
    faixas.forEach((f) => {
      const ult = unidas[unidas.length - 1];
      if (ult && f[0] <= ult[1]) ult[1] = Math.max(ult[1], f[1]); else unidas.push(f.slice());
    });
    const out = [];
    let cursor = 0;
    unidas.forEach((f) => {
      if (f[0] > cursor) out.push(texto.slice(cursor, f[0]));
      out.push(h('mark', { text: texto.slice(f[0], f[1]) }));
      cursor = f[1];
    });
    out.push(texto.slice(cursor));
    return { nos: out, total: unidas.length };
  }

  function regua(n) {
    const pz = G.prazo(n);
    const total = G.PRAZO_DIAS[n.categoria] || 5;
    let gastos = total;
    if (G.aberta(n)) gastos = Math.max(0, Math.min(total, total - pz.dias));
    const dias = h('div', { class: 'regua__dias', 'aria-hidden': 'true' });
    for (let i = 0; i < total; i++) dias.appendChild(h('span', { class: 'regua__dia' + (i < gastos ? ' is-gasto' : '') }));
    return h('div', { class: 'regua regua--' + (pz.tom || 'success') + ' ficha__regua' },
      dias,
      h('div', { class: 'regua__texto' },
        h('span', { text: 'Prazo da ANS: ' + total + ' dias úteis, até ' + G.fmt.date(pz.limite) }),
        h('strong', { text: pz.texto })));
  }

  const dl = (pares, classe) => h('dl', { class: 'dl' + (classe ? ' ' + classe : '') },
    pares.filter(Boolean).map((p) => h('div', null, h('dt', { text: p[0] }), h('dd', null, p[1] === '' || p[1] === null || p[1] === undefined ? 'Não informado' : p[1]))));

  const secao = (icone, titulo, ...conteudo) => {
    const tid = G.uid('ficha');
    return h('section', { class: 'ficha__secao', 'aria-labelledby': tid }, h('h3', { id: tid }, G.icon(icone), titulo), conteudo);
  };

  const trilhaTema = (temaId) => h('ol', { class: 'trilha-tema', 'aria-label': 'Tema em 3 níveis' }, G.caminhoTema(temaId).map((t) => h('li', { text: t })));

  const idade = (iso) => {
    if (!iso) return '';
    const hoje = G.hoje();
    let anos = Number(hoje.slice(0, 4)) - Number(iso.slice(0, 4));
    if (hoje.slice(5) < iso.slice(5)) anos -= 1;
    return anos + ' anos';
  };

  function secaoBeneficiario(n) {
    const b = n.beneficiario;
    const e = b.endereco || {};
    const it = n.interlocutor || {};
    return secao('user', 'Beneficiário',
      dl([
        ['CPF', b.cpf || 'Não informado'],
        ['Cartão', b.cartao || 'Não informado'],
        ['Nascimento', b.nascimento ? G.fmt.date(b.nascimento) + ' (' + idade(b.nascimento) + ')' : 'Não informado'],
        ['Sexo', b.sexo === 'F' ? 'Feminino' : b.sexo === 'M' ? 'Masculino' : ''],
        ['Telefone', b.telefone],
        ['E-mail', b.email],
        ['Endereço', [e.logradouro, e.numero].filter(Boolean).join(', ') + (e.bairro ? ' · ' + e.bairro : '') + (e.cidade ? ' · ' + e.cidade + '/' + e.uf : '') + (e.cep ? ' · CEP ' + e.cep : '')],
        it.nome ? ['Interlocutor', it.nome + (it.telefone ? ' · ' + it.telefone : '')] : null
      ], 'dl--wide'));
  }

  function secaoPerguntas(n) {
    const p = n.perguntas || {};
    return secao('message', 'Perguntas obrigatórias da ANS',
      dl([
        ['Pediu à operadora em', G.fmt.date(p.dataSolicitacao)],
        ['Protocolo na operadora', p.protocoloOperadora],
        ['Onde precisou de atendimento', p.municipioAtendimento ? p.municipioAtendimento + '/' + p.ufAtendimento : ''],
        ['Houve impedimento ou falta de resposta?', p.impedimento],
        ['O contrato prevê o atendimento?', p.previsaoContrato],
        ['Pediu a negativa por escrito?', p.pediuNegativa],
        p.pediuNegativa === 'Sim' ? ['Recebeu em até 48 horas?', p.negativa48h] : null
      ], 'dl--wide'));
  }

  function secaoHistorico(n) {
    const lista = h('ol', { class: 'history' });
    n.historico.slice().reverse().forEach((x) => {
      lista.appendChild(h('li', null, h('strong', { text: x.acao }), ' · ' + x.quem, h('time', { datetime: x.quando, text: G.fmt.dateTime(x.quando) })));
    });
    return secao('history', 'Histórico', lista);
  }

  function secaoClassificacao(n) {
    const enc = n.encaminhamentos[n.encaminhamentos.length - 1];
    const crm = n.crm || {};
    return secao('route', 'Triagem',
      h('div', { class: 'stack' },
        trilhaTema(n.temaId),
        dl([
          ['Área', G.nome.area(n.areaId)],
          ['Acompanha', G.nome.usuario(n.analistaId)],
          ['Encaminhada em', enc ? G.fmt.dateTime(enc.em) : ''],
          ['Aviso por e-mail', enc ? (enc.para.length ? enc.para.join(', ') : 'Sem aviso: a área não tinha e-mail') : ''],
          ['CRM', h('span', null, G.statusBadge(crm.status || 'Não enviada'), crm.erro ? h('span', { class: 'cell-sub', text: crm.erro }) : null, crm.status === 'Enviada' && crm.em ? h('span', { class: 'cell-sub', text: 'Em ' + G.fmt.dateTime(crm.em) }) : null)]
        ], 'dl--wide')));
  }

  /* ---------------------------------------------- Diálogo do aviso por e-mail */

  function dialogoEmail(n, areaId, analistaId, temaId, reenvio) {
    const modelos = G.modelosDaArea(areaId);
    const para = G.emailsDaArea(areaId);
    const area = G.db.get('areas', areaId);
    // Dados provisórios para preencher as variáveis antes de salvar.
    const previaNip = Object.assign({}, n, { areaId, analistaId, temaId });
    return G.dialog({
      titulo: reenvio ? 'Reenviar o aviso para ' + area.nome : 'Encaminhar para ' + area.nome,
      icone: 'mail',
      tom: 'info',
      wide: true,
      confirmar: para.length ? (reenvio ? 'Reenviar aviso' : 'Encaminhar e avisar') : 'Encaminhar sem aviso',
      montar(corpo) {
        if (!para.length) {
          corpo.appendChild(h('div', { class: 'alert alert--warning' }, G.icon('alert'),
            h('div', { class: 'alert__body' },
              h('p', { class: 'alert__title', text: area.nome + ' ainda não tem e-mail cadastrado.' }),
              h('p', null, 'A NIP vai para a área e para o CRM, mas ninguém recebe aviso. Dá para ', h('a', { href: 'cadastro.html?tipo=emails', text: 'cadastrar os e-mails da área' }), ' depois e reenviar.'))));
        }
        const sel = G.field({ id: 'email-modelo', label: 'Modelo do e-mail', tipo: 'select', vazio: false, opcoes: modelos.map((m) => ({ value: String(m.id), label: m.nome + (m.areaId ? '' : ' (geral)') })) });
        const assunto = h('dd');
        const texto = h('p', { class: 'email__corpo' });
        const previa = h('div', { class: 'email', role: 'group', 'aria-label': 'Prévia do e-mail' },
          h('dl', { class: 'email__cab' },
            h('div', null, h('dt', { text: 'Para' }), h('dd', { text: para.length ? para.join(', ') : 'Ninguém' })),
            h('div', null, h('dt', { text: 'Assunto' }), assunto)),
          texto);
        const atualiza = () => {
          const m = G.db.get('modelosEmail', sel.control.value);
          assunto.textContent = m ? G.preencheModelo(m.titulo, previaNip, areaId) : '';
          texto.textContent = m ? G.preencheModelo(m.texto, previaNip, areaId) : '';
        };
        sel.control.addEventListener('change', atualiza);
        atualiza();
        corpo.append(h('div', { class: 'stack' }, sel, h('h3', { text: 'Prévia' }), previa));
      },
      aoConfirmar(form) {
        return { modeloId: Number(form.querySelector('#email-modelo').value), para };
      }
    });
  }

  /* --------------------------------------------------- Seletor de tema */

  function seletorTema(valorAtual, aoMudar) {
    const caminho = [];
    let t = valorAtual ? G.db.get('temas', valorAtual) : null;
    while (t) { caminho.unshift(t.id); t = t.paiId ? G.db.get('temas', t.paiId) : null; }
    const grade = h('div', { class: 'form-grid' });
    const selects = [1, 2, 3].map((nivel) => {
      const el = G.field({ id: 'tri-tema-' + nivel, label: 'Tema nível ' + nivel, tipo: 'select', opcoes: [], required: true, span: 4, vazio: 'Selecione' });
      grade.appendChild(el);
      return el.control;
    });
    function preenche(nivel, paiId, valor) {
      const sel = selects[nivel - 1];
      const vazio = sel.options[0];
      sel.replaceChildren(vazio);
      sel.disabled = nivel > 1 && !paiId;
      if (sel.disabled) return;
      G.temasFilhos(paiId).filter((x) => x.status === 'Ativo').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach((x) => sel.appendChild(h('option', { value: String(x.id), text: x.nome })));
      sel.value = valor ? String(valor) : '';
    }
    preenche(1, 0, caminho[0]);
    preenche(2, caminho[0] || 0, caminho[1]);
    preenche(3, caminho[1] || 0, caminho[2]);
    selects.forEach((sel, i) => sel.addEventListener('change', () => {
      for (let n = i + 2; n <= 3; n++) preenche(n, n === i + 2 ? Number(sel.value) : 0, 0);
      aoMudar(Number(selects[2].value) || 0);
    }));
    return { el: grade, valor: () => Number(selects[2].value) || 0, primeiro: selects[0], ultimo: selects[2] };
  }

  /* ------------------------------------------------ Triagem (formulário) */

  function formTriagem(n) {
    const form = h('form', { id: 'triagem-form', novalidate: true });
    const tituloId = G.uid('ficha');
    let temaId = n.temaId || 0;

    const areaSel = G.field({
      id: 'tri-area', label: 'Área que vai cuidar da NIP', tipo: 'select', required: true, span: 6,
      opcoes: G.db.all('areas').filter((a) => a.status === 'Ativo').map((a) => ({ value: String(a.id), label: a.nome }))
    });
    const analistaSel = G.field({
      id: 'tri-analista', label: 'Quem acompanha', tipo: 'select', required: true, span: 6, vazio: false,
      opcoes: G.db.all('usuarios').filter((x) => x.status === 'Ativo').map((x) => ({ value: String(x.id), label: x.nome + (x.id === u.id ? ' (você)' : '') })),
      valor: n.analistaId || u.id
    });

    const listaSug = h('ul', { class: 'sugestoes' });
    const textoSug = h('p', { class: 'hint' });
    // Enquanto a pessoa não escolhe a área à mão, ela acompanha a sugestão mais provável.
    let areaManual = false;
    function renderSugestoes(anunciar) {
      const sugs = G.sugestoes(n, temaId);
      if (!areaManual && sugs.length) areaSel.control.value = String(sugs[0].areaId);
      listaSug.replaceChildren();
      textoSug.textContent = sugs.length
        ? 'As regras de triagem sugerem ' + (sugs.length === 1 ? 'esta área' : 'estas áreas') + '. Clique para escolher.'
        : 'Nenhuma regra apontou uma área. Escolha o tema ou a área à mão.';
      sugs.forEach((s, i) => {
        const nomeArea = G.nome.area(s.areaId);
        const b = h('button', { type: 'button', class: 'sugestao', 'aria-pressed': String(areaSel.control.value === String(s.areaId)) },
          h('span', { class: 'sugestao__icone' }, G.icon(i === 0 ? 'sparkle' : 'route')),
          h('span', null, h('strong', { text: nomeArea + (i === 0 ? ' · mais provável' : '') }), h('small', { text: 'Porque ' + s.motivos.join(' e ') + '.' })),
          G.icon('check-circle', 'sugestao__check'));
        b.addEventListener('click', () => {
          areaManual = true;
          areaSel.control.value = String(s.areaId);
          areaSel.control.dispatchEvent(new Event('change', { bubbles: true }));
          G.announce('Área ' + nomeArea + ' escolhida.');
        });
        listaSug.appendChild(h('li', null, b));
      });
      if (anunciar && sugs.length) G.announce('Sugestão de área: ' + G.nome.area(sugs[0].areaId) + (areaManual ? '.' : ', já escolhida.'));
    }
    areaSel.control.addEventListener('change', (ev) => {
      if (ev.isTrusted) areaManual = true;
      listaSug.querySelectorAll('.sugestao').forEach((b, i) => {
        const s = G.sugestoes(n, temaId)[i];
        b.setAttribute('aria-pressed', String(!!s && areaSel.control.value === String(s.areaId)));
      });
    });

    const tema = seletorTema(temaId, (novo) => {
      temaId = novo;
      renderSugestoes(!!novo);
    });

    const cancelar = h('button', { type: 'button', class: 'btn btn--danger' }, G.icon('ban'), 'Cancelar NIP');
    cancelar.addEventListener('click', () => cancelaNip(n));

    form.append(
      h('div', { 'data-summary-anchor': '' }),
      h('div', { class: 'stack' },
        h('div', null, h('p', { class: 'field__label', text: 'Tema da ANS' }), h('p', { class: 'hint', text: 'Escolha até o nível 3. As opções de cada nível dependem do anterior.' })),
        tema.el,
        h('div', null, h('p', { class: 'field__label', text: 'Sugestões de área' }), textoSug),
        listaSug,
        h('div', { class: 'form-grid' }, areaSel, analistaSel)),
      h('div', { class: 'ficha__acoes' },
        h('button', { type: 'submit', class: 'btn btn--primary' }, G.icon('send'), 'Classificar e encaminhar'),
        cancelar));
    // A área mais provável já vem escolhida; a pessoa confirma ou troca.
    // Ao refazer a triagem, a área escolhida antes é mantida.
    if (n.areaId && G.db.get('areas', n.areaId) && G.db.get('areas', n.areaId).status === 'Ativo') {
      areaSel.control.value = String(n.areaId);
      areaManual = true;
    }
    renderSugestoes(false);

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const ok = G.validateForm(form, { resumoTitulo: 'Para encaminhar, falta:' });
      if (!ok) return;
      const areaId = Number(areaSel.control.value);
      const analistaId = Number(analistaSel.control.value);
      const escolhido = tema.valor();
      const r = await dialogoEmail(n, areaId, analistaId, escolhido, false);
      if (!r) return;
      const agora = new Date().toISOString();
      const quem = u.nome;
      n.temaId = escolhido;
      n.areaId = areaId;
      n.analistaId = analistaId;
      n.status = 'Em análise';
      n.triadaEm = agora;
      n.encaminhamentos.push({ em: agora, areaId, para: r.para, modeloId: r.modeloId, por: quem });
      G.registra(n, 'Classificada em "' + G.nome.tema(escolhido) + '"');
      G.registra(n, 'Encaminhada para ' + G.nome.area(areaId) + (r.para.length ? ', aviso para ' + G.fmt.plural(r.para.length, 'e-mail', 'e-mails') : ', sem aviso por e-mail'));
      atualizaContador();
      renderFila(false);
      seleciona(n.id, true);
      G.toast('NIP encaminhada para ' + G.nome.area(areaId) + '. Ela sobe para o CRM no próximo envio.');
    });

    return h('section', { class: 'ficha__secao', 'aria-labelledby': tituloId },
      h('h3', { id: tituloId }, G.icon('route'), 'Triagem'),
      form);
  }

  /* ---------------------------------------------------- Resposta à ANS */

  function formResposta(n) {
    const pz = G.prazo(n);
    const form = h('form', { id: 'resposta-form', novalidate: true });
    const tituloId = G.uid('ficha');
    const resultado = G.choiceGroup({ id: 'resp-resultado', name: 'resultado', label: 'Como a NIP foi resolvida', opcoes: G.RESULTADOS, required: true, box: true });
    const contato = G.field({ id: 'resp-contato', label: 'Quando a operadora falou com o beneficiário', tipo: 'date', required: true, rules: 'passado', span: 4, maxValor: G.hoje(), dica: 'De ' + G.fmt.date(n.dataNotificacao) + ' até hoje.' });
    const texto = G.field({ id: 'resp-texto', label: 'Resposta enviada à ANS', tipo: 'textarea', required: true, max: 3000, dica: 'Escreva para quem vai ler na ANS: o que foi feito, quando e o que o beneficiário disse. Pelo menos 60 caracteres.' });
    texto.control.rows = 6;
    const contador = h('p', { class: 'hint', 'aria-live': 'polite' });
    const conta = () => { contador.textContent = texto.control.value.trim().length + ' de 3000 caracteres.'; };
    texto.control.addEventListener('input', conta);
    conta();

    G.append(form, [
      h('div', { 'data-summary-anchor': '' }),
      pz.status === 'Em atraso' ? h('div', { class: 'alert alert--error' }, G.icon('alert'), h('div', { class: 'alert__body' },
        h('p', { class: 'alert__title', text: 'O prazo terminou em ' + G.fmt.date(pz.limite) + '.' }),
        h('p', { text: 'A resposta ainda pode ser registrada, mas vai constar como fora do prazo.' }))) : null,
      h('div', { class: 'stack' }, resultado, h('div', { class: 'form-grid' }, contato), texto, contador),
      h('div', { class: 'ficha__acoes' },
        h('button', { type: 'submit', class: 'btn btn--success-solid' }, G.icon('reply'), 'Registrar resposta à ANS'))]);

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const ok = G.validateForm(form, {
        resumoTitulo: 'Antes de registrar a resposta, confira:',
        extra(addErro) {
          const d = contato.control.value;
          if (d && d <= G.hoje() && d < n.dataNotificacao) addErro(contato.control, 'O contato com o beneficiário vem depois da notificação, que foi em ' + G.fmt.date(n.dataNotificacao) + '.');
          const t = texto.control.value.trim();
          if (t && t.length < 60) addErro(texto.control, 'A resposta está curta. Conte o que foi feito, com pelo menos 60 caracteres.');
        }
      });
      if (!ok) return;
      const res = form.querySelector('[name="resultado"]:checked').value;
      n.resposta = { resultado: res, texto: texto.control.value.trim(), contatoEm: contato.control.value, em: new Date().toISOString(), por: u.nome };
      n.status = 'Respondida';
      G.registra(n, 'Resposta registrada: ' + res.toLowerCase());
      renderFila(false);
      seleciona(n.id, true);
      const fora = G.prazo(n).texto === 'Respondida fora do prazo';
      G.toast(fora ? 'Resposta registrada, fora do prazo da ANS.' : 'Resposta registrada dentro do prazo. Bom trabalho!');
    });

    return h('section', { class: 'ficha__secao', 'aria-labelledby': tituloId },
      h('h3', { id: tituloId }, G.icon('reply'), 'Resposta à ANS'),
      form);
  }

  /* ----------------------------------------------------------- Ações */

  async function cancelaNip(n) {
    const motivos = ['NIP duplicada', 'Arquivada pela ANS', 'Beneficiário não é da operadora', 'Outro motivo'];
    const r = await G.dialog({
      titulo: 'Cancelar a NIP de ' + n.beneficiario.nome + '?',
      icone: 'ban',
      tom: 'danger',
      descricao: 'A NIP sai da fila e não pode ser reaberta. Use só quando ela não precisar de resposta.',
      confirmar: 'Cancelar NIP',
      cancelar: 'Voltar',
      tomBotao: 'danger',
      montar(corpo) {
        corpo.append(G.choiceGroup({ id: 'canc-motivo', name: 'motivo', label: 'Motivo', opcoes: motivos, required: true, box: true }),
          h('div', { class: 'mt' }, G.field({ id: 'canc-detalhe', label: 'Detalhes', tipo: 'textarea', opcional: true, max: 500, dica: 'Obrigatório quando o motivo for "Outro motivo".' })));
      },
      aoConfirmar(form) {
        const ok = G.validateForm(form, {
          extra(addErro) {
            const m = form.querySelector('[name="motivo"]:checked');
            const d = form.querySelector('#canc-detalhe');
            if (m && m.value === 'Outro motivo' && !d.value.trim()) addErro(d, 'Conte qual é o motivo do cancelamento.');
          }
        });
        if (!ok) return false;
        const m = form.querySelector('[name="motivo"]:checked').value;
        const d = form.querySelector('#canc-detalhe').value.trim();
        return m + (d ? ': ' + d : '.');
      }
    });
    if (!r) return;
    n.status = 'Cancelada';
    n.cancelamento = { motivo: r, em: new Date().toISOString(), por: u.nome };
    G.registra(n, 'NIP cancelada');
    atualizaContador();
    renderFila(false);
    seleciona(n.id, true);
    G.toast('NIP cancelada.');
  }

  async function refazTriagem(n) {
    const ok = await G.confirmDialog({
      titulo: 'Refazer a triagem?',
      descricao: 'A NIP volta para "Aguardando triagem" com o tema e a área atuais já preenchidos. Use quando a área responder que o caso não é dela.',
      confirmar: 'Refazer triagem'
    });
    if (!ok) return;
    n.status = 'Aguardando triagem';
    G.registra(n, 'Triagem reaberta');
    atualizaContador();
    renderFila(false);
    seleciona(n.id, true);
    G.toast('A NIP voltou para a triagem.');
  }

  async function reenviaAviso(n) {
    const r = await dialogoEmail(n, n.areaId, n.analistaId, n.temaId, true);
    if (!r) return;
    n.encaminhamentos.push({ em: new Date().toISOString(), areaId: n.areaId, para: r.para, modeloId: r.modeloId, por: u.nome });
    G.registra(n, r.para.length ? 'Aviso reenviado para ' + G.fmt.plural(r.para.length, 'e-mail', 'e-mails') : 'Encaminhamento registrado sem aviso');
    seleciona(n.id, false);
    G.toast(r.para.length ? 'Aviso reenviado para ' + G.nome.area(n.areaId) + '.' : 'A área continua sem e-mail para aviso.');
  }

  /* ------------------------------------------------------------- Ficha */

  function renderDetalhe() {
    mesa.classList.toggle('tem-selecao', !!estado.id);
    const n = estado.id ? G.db.get('nips', estado.id) : null;
    if (!n) {
      detalhe.setAttribute('aria-label', 'Ficha da NIP');
      const abertas = G.db.all('nips').filter(G.aberta).length;
      detalhe.replaceChildren(h('div', { class: 'empty' },
        G.icon('inbox'),
        h('h2', { id: 'detalhe-titulo', tabindex: '-1', text: estado.id ? 'Não encontramos essa NIP' : 'Escolha uma NIP na fila' }),
        h('p', { text: estado.id ? 'Ela pode ter sido apagada ao restaurar os dados de exemplo.' : G.fmt.plural(abertas, 'NIP aberta', 'NIPs abertas') + ' agora. A fila mostra primeiro as de prazo mais curto.' })));
      document.title = 'Mesa de triagem | Triagem NIP';
      return;
    }
    detalhe.removeAttribute('aria-label');
    detalhe.setAttribute('aria-labelledby', 'detalhe-titulo');
    document.title = n.beneficiario.nome + ' | Mesa de triagem | Triagem NIP';

    const voltar = h('button', { type: 'button', class: 'btn btn--ghost btn--sm mesa__voltar' }, G.icon('arrow-left'), 'Voltar para a fila');
    voltar.addEventListener('click', () => {
      const anterior = estado.id;
      seleciona(0, false);
      const item = filaEl.querySelector('[data-id="' + anterior + '"]');
      (item || busca).focus();
    });

    const cab = h('div', { class: 'ficha__head' },
      voltar,
      h('div', { class: 'ficha__titulo' },
        h('div', null,
          G.protocolo(n.protocolo),
          h('h2', { id: 'detalhe-titulo', tabindex: '-1', text: n.beneficiario.nome }),
          h('p', { text: 'Notificada em ' + G.fmt.date(n.dataNotificacao) + ' · Demanda ' + n.demanda + ' · ' + (n.origem === 'Manual' ? 'Cadastrada à mão' : 'Importada da ANS') })),
        h('div', { class: 'ficha__badges' }, G.statusBadge(n.status), G.statusBadge(n.categoria))),
      n.status !== 'Cancelada' ? regua(n) : null);

    const corpo = h('div', { class: 'ficha__corpo' });

    if (n.status === 'Com problema') {
      const probs = G.problemas(n);
      corpo.appendChild(h('div', { class: 'alert alert--error' }, G.icon('alert'), h('div', { class: 'alert__body' },
        h('p', { class: 'alert__title', text: 'Essa NIP chegou com dados faltando' }),
        h('ul', null, probs.map((p) => h('li', { text: p.msg }))),
        h('p', { text: 'Corrija os dados para ela entrar na fila de triagem. O prazo da ANS já está correndo.' }),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn btn--primary btn--sm', href: 'nip.html?id=' + n.id }, G.icon('edit'), 'Corrigir dados'),
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => cancelaNip(n) }, G.icon('ban'), 'Cancelar NIP')))));
    }

    if (n.status === 'Cancelada' && n.cancelamento) {
      corpo.appendChild(h('div', { class: 'alert alert--info' }, G.icon('info'), h('div', { class: 'alert__body' },
        h('p', { class: 'alert__title', text: 'NIP cancelada em ' + G.fmt.dateTime(n.cancelamento.em) + ' por ' + n.cancelamento.por }),
        h('p', { text: n.cancelamento.motivo }))));
    }

    // Relato com as palavras-chave em destaque
    const marcado = destaca(n.descricao, G.palavrasAtivas());
    corpo.appendChild(secao('message', 'Relato à ANS',
      h('blockquote', { class: 'relato' }, marcado.nos),
      marcado.total ? h('p', { class: 'relato__legenda' }, h('mark', { text: 'Em destaque' }), ' palavras que as regras de triagem reconhecem.') : null));

    if (n.status === 'Aguardando triagem') corpo.appendChild(formTriagem(n));

    if (n.status === 'Em análise' || n.status === 'Respondida') {
      const cls = secaoClassificacao(n);
      if (n.status === 'Em análise') {
        cls.appendChild(h('div', { class: 'ficha__acoes' },
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => reenviaAviso(n) }, G.icon('mail'), 'Reenviar aviso'),
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => refazTriagem(n) }, G.icon('undo'), 'Refazer triagem'),
          h('a', { class: 'btn btn--sm', href: 'nip.html?id=' + n.id }, G.icon('edit'), 'Corrigir dados')));
      }
      corpo.appendChild(cls);
    }

    if (n.status === 'Em análise') corpo.appendChild(formResposta(n));

    if (n.status === 'Respondida' && n.resposta) {
      const pz = G.prazo(n);
      corpo.appendChild(secao('reply', 'Resposta à ANS',
        h('div', { class: 'stack' },
          dl([
            ['Resultado', n.resposta.resultado],
            ['Registrada em', G.fmt.dateTime(n.resposta.em) + ' por ' + n.resposta.por],
            ['Contato com o beneficiário', G.fmt.date(n.resposta.contatoEm)],
            ['Prazo', G.badge(pz.texto, pz.tom)]
          ], 'dl--wide'),
          h('blockquote', { class: 'relato', text: n.resposta.texto }))));
    }

    corpo.append(secaoPerguntas(n), secaoBeneficiario(n), secaoHistorico(n));
    detalhe.replaceChildren(cab, corpo);
    G.applyMasks(detalhe);
  }

  /* ---------------------------------------------------------- Importação */

  document.getElementById('importar').addEventListener('click', () => {
    const novas = G.importaNovas();
    const problemas = novas.filter((x) => x.status === 'Com problema').length;
    estado.chip = 'abertas';
    estado.ordem = 'recentes';
    estado.busca = '';
    busca.value = '';
    ordem.value = 'recentes';
    guarda();
    atualizaContador();
    renderFila(false);
    G.toast(G.fmt.plural(novas.length, 'NIP nova chegou', 'NIPs novas chegaram') + ' da ANS' + (problemas ? ', ' + (problemas === 1 ? 'uma com dados faltando' : problemas + ' com dados faltando') : '') + '. Elas estão no topo da fila.');
  });

  renderFila(false);
  renderDetalhe();
  if (estado.id && window.matchMedia('(max-width: 1099.98px)').matches) {
    const t = document.getElementById('detalhe-titulo');
    if (t) t.focus({ preventScroll: true });
  }
})();
