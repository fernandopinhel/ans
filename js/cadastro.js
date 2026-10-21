/*
 * Triagem NIP: formulário genérico das regras de triagem
 * (cadastro.html?tipo=...&id=...). Os campos vêm do esquema em data.js.
 */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;
  const tipo = G.param('tipo');
  const id = Number(G.param('id')) || null;
  const schema = G.schemas[tipo];
  const grupoNav = G.NAV.find((g) => g.itens.some((i) => i.chave === tipo));
  const original = schema && id ? G.db.get(tipo, id) : null;

  const titulo = !schema ? 'Página não encontrada' : original ? schema.nomeRegistro(original) : schema.novo;
  const u = G.shell({
    ativo: tipo,
    titulo: schema ? titulo + ' | ' + schema.titulo : titulo,
    migalhas: [
      { label: 'Painel', href: 'inicio.html' },
      { label: grupoNav ? grupoNav.titulo : 'Regras de triagem' },
      schema ? { label: schema.titulo, href: 'consulta.html?tipo=' + tipo } : null,
      { label: original ? 'Editar' : 'Novo cadastro' }
    ].filter(Boolean)
  });
  if (!u) return;

  const main = document.getElementById('conteudo');
  if (!schema || (id && !original)) {
    main.replaceChildren(h('div', { class: 'card empty' },
      G.icon('alert'),
      h('h1', { text: schema ? 'Esse cadastro não existe mais' : 'Não encontramos essa página' }),
      h('p', { text: schema ? 'Ele pode ter sido excluído. Volte para a lista e tente de novo.' : 'O endereço pode estar incompleto.' }),
      h('a', { class: 'btn btn--primary', href: schema ? 'consulta.html?tipo=' + tipo : 'inicio.html', text: schema ? 'Voltar para a lista' : 'Voltar ao painel' })));
    return;
  }

  const rec = original ? JSON.parse(JSON.stringify(original)) : {};
  const tags = {};        // listas de itens (palavras, e-mails) por campo
  const temas = {};       // seletores de tema em cascata por campo

  /* ---------------------------------------------------------- Cabeçalho */

  document.getElementById('pagina-grupo').textContent = schema.titulo;
  document.getElementById('pagina-titulo').textContent = titulo;
  const desc = document.getElementById('pagina-descricao');
  if (original) {
    desc.replaceChildren(h('ul', { class: 'meta' },
      h('li', null, G.icon('tag'), 'Código ' + original.codigo),
      h('li', null, G.icon('clock'), 'Última alteração em ' + G.fmt.dateTime(original.alteradoEm) + ' por ' + original.alteradoPor),
      h('li', null, G.statusBadge(original.status))));
  } else {
    desc.textContent = schema.descricao + ' Os campos com * são obrigatórios.';
  }
  const voltar = document.getElementById('pagina-voltar');
  voltar.href = 'consulta.html?tipo=' + tipo;
  document.getElementById('cancelar').href = voltar.href;

  /* ------------------------------------------------------------ Campos */

  const form = document.getElementById('cadastro-form');
  const corpo = document.getElementById('cadastro-secoes');
  const fid = (key) => 'f-' + key;
  const campo = (key) => document.getElementById(fid(key));

  function campoSimples(c) {
    const valor = rec[c.key];
    const el = G.field({
      id: fid(c.key), name: c.key, label: c.label, tipo: c.tipo || 'text', opcoes: c.ref ? c.ref() : c.opcoes,
      required: c.required, opcional: c.opcional, rules: c.rules, mask: c.mask, max: c.max, dica: c.dica, span: c.span,
      spellcheck: c.spellcheck, vazio: c.vazio,
      valor: valor !== undefined && valor !== null && valor !== '' ? valor : (original ? '' : (c.padrao || ''))
    });
    if (c.linhas) el.control.rows = c.linhas;
    // Um registro ligado a uma área já inativa continua mostrando a área.
    if (c.tipo === 'select' && valor !== undefined && valor !== '' && el.control.value !== String(valor)) {
      const a = c.key === 'areaId' ? G.db.get('areas', valor) : null;
      if (a) {
        el.control.appendChild(h('option', { value: String(a.id), text: a.nome + ' (inativa)' }));
        el.control.value = String(a.id);
      }
    }
    return el;
  }

  function campoRadio(c) {
    const valor = rec[c.key] !== undefined && rec[c.key] !== '' ? rec[c.key] : c.padrao;
    return G.choiceGroup({ id: fid(c.key), name: c.key, label: c.label, opcoes: c.opcoes, required: c.required, valor, span: c.span, box: true });
  }

  /*
   * Tema em cascata: até 3 seletores, um por nível. O valor é o tema mais fundo escolhido.
   * Ao editar um tema, ele e os que estão dentro dele não aparecem como opção.
   */
  function campoTema(c) {
    const proibidos = new Set();
    if (tipo === 'temas' && id) {
      const marca = (tid) => { proibidos.add(tid); G.temasFilhos(tid).forEach((f) => marca(f.id)); };
      marca(id);
    }
    const atual = Number(rec[c.key]) || 0;
    const caminho = [];
    let t = atual ? G.db.get('temas', atual) : null;
    while (t) { caminho.unshift(t.id); t = t.paiId ? G.db.get('temas', t.paiId) : null; }

    const grade = h('div', { class: 'form-grid span-12' });
    const selects = [];
    for (let nivel = 1; nivel <= c.ate; nivel++) {
      const el = G.field({
        id: nivel === 1 ? fid(c.key) : fid(c.key) + '-' + nivel,
        name: c.key + '-' + nivel,
        label: (c.ate === 1 ? c.label : c.label + ': nível ' + nivel),
        tipo: 'select',
        opcoes: [],
        required: c.required && nivel === 1,
        opcional: !c.required && nivel === 1,
        vazio: nivel === 1 ? (c.required ? 'Selecione' : 'Nenhum, criar no nível 1') : 'Nenhum',
        span: c.ate === 3 ? 4 : 6,
        dataLabel: c.label + ' de nível ' + nivel
      });
      selects.push(el.control);
      grade.appendChild(el);
    }

    function preenche(nivel, paiId, valor) {
      const sel = selects[nivel - 1];
      const vazio = sel.options[0];
      sel.replaceChildren(vazio);
      if (nivel > 1 && !paiId) {
        sel.disabled = true;
        return;
      }
      sel.disabled = false;
      G.temasFilhos(paiId).filter((x) => !proibidos.has(x.id) && (x.status === 'Ativo' || x.id === valor))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
        .forEach((x) => sel.appendChild(h('option', { value: String(x.id), text: x.nome + (x.status === 'Ativo' ? '' : ' (inativo)') })));
      sel.value = valor ? String(valor) : '';
    }

    preenche(1, 0, caminho[0]);
    for (let n = 2; n <= c.ate; n++) preenche(n, caminho[n - 2] || 0, caminho[n - 1]);
    selects.forEach((sel, i) => {
      sel.addEventListener('change', () => {
        for (let n = i + 2; n <= c.ate; n++) preenche(n, n === i + 2 ? Number(sel.value) : 0, 0);
      });
    });
    temas[c.key] = () => {
      for (let i = selects.length - 1; i >= 0; i--) if (selects[i].value) return Number(selects[i].value);
      return 0;
    };
    return grade;
  }

  /* Lista de itens: um campo para digitar, o botão Adicionar e os itens com Remover. */
  function campoTags(c) {
    const itens = (rec[c.key] || []).slice();
    const entrada = G.field({ id: fid(c.key), name: c.key, label: c.label, tipo: c.inputType || 'text', max: c.max, required: c.required, dica: 'Escreva e aperte Enter ou o botão Adicionar.', spellcheck: c.inputType === 'email' ? false : null });
    const input = entrada.control;
    input.dataset.novalidate = '1';
    input.required = false;
    input.setAttribute('aria-required', c.required ? 'true' : 'false');
    const add = h('button', { type: 'button', class: 'btn' }, G.icon('plus'), 'Adicionar');
    const grupo = h('div', { class: 'input-group' });
    input.replaceWith(grupo);
    grupo.append(input, add);
    const listaId = fid(c.key) + '-lista';
    const lista = h('ul', { class: 'tags-list', id: listaId, 'aria-label': 'Itens adicionados' });
    const contagem = h('p', { class: 'hint', 'aria-live': 'polite' });

    function render() {
      lista.replaceChildren();
      itens.forEach((it, i) => {
        const rem = h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--sm', 'aria-label': 'Remover ' + it }, G.icon('x'));
        rem.addEventListener('click', () => {
          itens.splice(i, 1);
          render();
          G.announce('"' + it + '" removido.');
          const prox = lista.querySelectorAll('button')[Math.min(i, itens.length - 1)];
          (prox || input).focus();
        });
        lista.appendChild(h('li', null, h('span', { text: it }), rem));
      });
      contagem.textContent = itens.length ? G.fmt.plural(itens.length, 'item na lista', 'itens na lista') + '.' : 'Nenhum item ainda.';
    }

    // Retorna a mensagem de erro, ou '' se o item entrou na lista.
    function tenta(valor) {
      const v = valor.trim();
      if (!v) return 'Escreva algo antes de adicionar.';
      if (c.rules === 'email' && !G.valida.email(v)) return 'Esse e-mail parece incompleto. Use o formato nome@empresa.com.br.';
      if (c.min && v.length < c.min) return 'Use pelo menos ' + c.min + ' letras, para não sugerir a área por engano.';
      if (itens.some((x) => G.normaliza(x) === G.normaliza(v))) return '"' + v + '" já está na lista.';
      itens.push(c.rules === 'email' ? v.toLowerCase() : v);
      return '';
    }

    function adiciona() {
      const msg = tenta(input.value);
      G.setErro(input, msg);
      if (msg) { input.focus(); return; }
      const v = input.value.trim();
      input.value = '';
      render();
      G.announce('"' + v + '" adicionado. ' + contagem.textContent);
      input.focus();
    }
    add.addEventListener('click', adiciona);
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); adiciona(); }
    });
    input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') G.setErro(input, ''); });

    tags[c.key] = {
      itens: () => itens.slice(),
      input,
      pendente: () => input.value.trim(),
      tenta(valor) { const m = tenta(valor); if (!m) { input.value = ''; render(); } return m; },
      vazio: () => !itens.length
    };
    render();
    return h('div', { class: 'span-12 tags-field' }, entrada, contagem, lista);
  }

  /* Variáveis do modelo: um clique coloca {variavel} onde está o cursor, e a prévia mostra o resultado. */
  function campoVariaveis() {
    let alvo = null;
    const lista = h('ul', { class: 'variaveis', 'aria-label': 'Variáveis disponíveis' });
    G.VARIAVEIS.forEach((v) => {
      const b = h('button', { type: 'button', class: 'btn btn--sm', title: v.descricao }, '{' + v.chave + '}', h('span', { class: 'visually-hidden', text: ', inserir ' + v.descricao.toLowerCase() }));
      b.addEventListener('mousedown', (ev) => ev.preventDefault());
      b.addEventListener('click', () => {
        const el = alvo || campo('texto');
        const ini = el.selectionStart !== null && el.selectionStart !== undefined ? el.selectionStart : el.value.length;
        const fim = el.selectionEnd !== null && el.selectionEnd !== undefined ? el.selectionEnd : ini;
        el.value = el.value.slice(0, ini) + '{' + v.chave + '}' + el.value.slice(fim);
        el.focus();
        el.setSelectionRange(ini + v.chave.length + 2, ini + v.chave.length + 2);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        G.announce('{' + v.chave + '} inserida.');
      });
      lista.appendChild(h('li', null, b));
    });

    const exemplo = G.db.all('nips').find((n) => n.status === 'Em análise') || G.db.all('nips')[0];
    const assunto = h('dd');
    const corpoPrevia = h('p', { class: 'email__corpo' });
    const previa = h('div', { class: 'email', 'aria-label': 'Prévia com uma NIP de exemplo', role: 'group' },
      h('dl', { class: 'email__cab' },
        h('div', null, h('dt', { text: 'NIP' }), h('dd', { text: exemplo.protocolo + ', de exemplo' })),
        h('div', null, h('dt', { text: 'Assunto' }), assunto)),
      corpoPrevia);
    function atualiza() {
      const areaId = Number(campo('areaId').value) || exemplo.areaId;
      assunto.textContent = G.preencheModelo(campo('titulo').value || '(sem assunto)', exemplo, areaId);
      corpoPrevia.textContent = G.preencheModelo(campo('texto').value || '(o texto aparece aqui)', exemplo, areaId);
    }
    window.setTimeout(() => {
      ['titulo', 'texto'].forEach((k) => campo(k).addEventListener('focus', () => { alvo = campo(k); }));
      form.addEventListener('input', atualiza);
      form.addEventListener('change', atualiza);
      atualiza();
    }, 0);
    return h('div', { class: 'span-12 stack' },
      lista,
      h('div', null, h('h3', { text: 'Prévia' }), h('p', { class: 'hint', text: 'Com os dados de uma NIP de exemplo. Atualiza enquanto você escreve.' })),
      previa);
  }

  function renderCampo(c) {
    switch (c.tipo) {
      case 'radio': return campoRadio(c);
      case 'tema': return campoTema(c);
      case 'tags': return campoTags(c);
      case 'variaveis': return campoVariaveis(c);
      default: return campoSimples(c);
    }
  }

  schema.secoes.forEach((s, i) => {
    const tituloId = 'secao-' + i + '-titulo';
    const sec = h('section', { class: 'card', id: 'secao-' + i, 'aria-labelledby': tituloId },
      h('div', { class: 'card__head' }, h('div', null, h('h2', { id: tituloId, text: s.titulo }), s.dica ? h('p', { text: s.dica }) : null)));
    const grade = h('div', { class: 'form-grid' });
    s.campos.forEach((c) => grade.appendChild(renderCampo(c)));
    sec.appendChild(grade);
    corpo.appendChild(sec);
  });
  G.applyMasks(form);

  /* ------------------------------------------------------ Histórico */

  if (original && original.historico && original.historico.length) {
    const lista = h('ol', { class: 'history' });
    original.historico.slice().reverse().slice(0, 8).forEach((x) => {
      lista.appendChild(h('li', null, h('strong', { text: x.acao }), ' por ' + x.quem, h('time', { datetime: x.quando, text: G.fmt.dateTime(x.quando) })));
    });
    corpo.appendChild(h('section', { class: 'card', 'aria-labelledby': 'historico-titulo' },
      h('div', { class: 'card__head' }, h('h2', { id: 'historico-titulo', text: 'Histórico de alterações' })),
      lista));
  }

  /* -------------------------------------------------------- Coleta */

  function coleta() {
    const out = JSON.parse(JSON.stringify(rec));
    schema.secoes.forEach((s) => s.campos.forEach((c) => {
      switch (c.tipo) {
        case 'radio': {
          const m = form.querySelector('[name="' + c.key + '"]:checked');
          out[c.key] = m ? m.value : '';
          return;
        }
        case 'tema': out[c.key] = temas[c.key](); return;
        case 'tags': out[c.key] = tags[c.key].itens(); return;
        case 'variaveis': return;
        default: {
          const v = campo(c.key).value.trim();
          out[c.key] = c.numero ? Number(v) : v;
        }
      }
    }));
    return out;
  }

  /* ---------------------------------------------------------- Salvar */

  const dirty = G.guardDirty(form);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = G.validateForm(form, {
      extra(addErro) {
        // Texto digitado e não adicionado: tenta adicionar antes de reclamar.
        Object.keys(tags).forEach((k) => {
          const t = tags[k];
          if (t.pendente()) {
            const msg = t.tenta(t.pendente());
            if (msg) { addErro(t.input, msg); return; }
          }
          const c = schema.secoes.reduce((acc, s) => acc.concat(s.campos), []).find((x) => x.key === k);
          if (c.required && t.vazio()) addErro(t.input, 'Adicione pelo menos um item em "' + c.label + '".');
        });
        (schema.unico || []).forEach((regra) => {
          const el = campo(regra.key);
          if (!el || !el.value.trim() || el.getAttribute('aria-invalid') === 'true') return;
          const alvo = G.normaliza(el.value);
          const repetido = G.db.all(tipo).some((r) => r.id !== id && G.normaliza(r[regra.key]) === alvo);
          if (repetido) addErro(el, regra.msg);
        });
        if (schema.regras) schema.regras(coleta(), addErro, campo, id);
      }
    });
    if (!ok) return;

    const dados = coleta();
    if (schema.prepara) schema.prepara(dados, original);
    const salvo = G.db.save(tipo, dados, original ? 'Cadastro alterado' : 'Cadastro criado');
    dirty.clean();
    G.store.set('destaque', { tipo, id: salvo.id });
    G.flash(original
      ? 'Alterações salvas em "' + schema.nomeRegistro(salvo) + '".'
      : 'Prontinho! "' + schema.nomeRegistro(salvo) + '" foi cadastrado.');
    window.location.href = 'consulta.html?tipo=' + tipo;
  });

  /* ---------------------------------------------------------- Excluir */

  const excluir = document.getElementById('excluir');
  if (original) {
    excluir.hidden = false;
    excluir.addEventListener('click', async () => {
      const motivo = schema.emUso ? schema.emUso(id) : '';
      if (motivo) {
        await G.dialog({
          titulo: 'Não dá para excluir este cadastro',
          icone: 'info',
          tom: 'info',
          descricao: motivo,
          somenteOk: true,
          confirmar: 'Entendi'
        });
        return;
      }
      const ok = await G.confirmDialog({
        titulo: 'Excluir "' + schema.nomeRegistro(original) + '"?',
        descricao: 'Essa ação não pode ser desfeita. Se a ideia é só tirar de uso, mude o status para Inativo.',
        confirmar: 'Excluir',
        tomBotao: 'danger'
      });
      if (!ok) return;
      G.db.remove(tipo, id);
      dirty.clean();
      G.flash('"' + schema.nomeRegistro(original) + '" foi excluído.');
      window.location.href = 'consulta.html?tipo=' + tipo;
    });
  }
})();
