/*
 * Triagem NIP: relatórios de NIPs importadas e de envios ao CRM (manuais e automáticos).
 * Os filtros mudam conforme o relatório; o resultado vira planilha CSV.
 */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;

  const u = G.shell({ ativo: 'relatorios', titulo: 'Relatórios', migalhas: [{ label: 'Painel', href: 'inicio.html' }, { label: 'Relatórios' }] });
  if (!u) return;

  const TIPOS = [
    { value: 'importadas', label: 'NIPs importadas', dica: 'Todas as NIPs que chegaram, pela data da notificação.' },
    { value: 'Manual', label: 'Envios manuais ao CRM', dica: 'NIPs enviadas à mão pela equipe.' },
    { value: 'Automática', label: 'Envios automáticos ao CRM', dica: 'NIPs enviadas pela rotina diária das 6h.' }
  ];

  const form = document.getElementById('filtros');
  const grade = document.getElementById('filtros-campos');
  const salvos = G.store.get('filtros:relatorios', {});

  /* ------------------------------------------------------------ Tipos */

  const tiposEl = document.getElementById('tipos');
  TIPOS.forEach((t, i) => {
    const idr = 'tipo-' + i;
    tiposEl.appendChild(h('label', { class: 'tipo', for: idr },
      h('input', { type: 'radio', name: 'tipo', id: idr, value: t.value, checked: (salvos.tipo || 'importadas') === t.value }),
      h('span', null, h('strong', { text: t.label }), h('small', { text: t.dica }))));
  });
  const tipo = () => form.querySelector('[name="tipo"]:checked').value;

  /* ---------------------------------------------------------- Filtros */

  const campos = {};
  const add = (k, el) => { campos[k] = el.control; grade.appendChild(el); return el; };
  add('nipDe', G.field({ id: 'r-nip-de', label: 'Data da NIP: de', tipo: 'date', span: 3, rules: 'passado', maxValor: G.hoje(), valor: salvos.nipDe }));
  add('nipAte', G.field({ id: 'r-nip-ate', label: 'Data da NIP: até', tipo: 'date', span: 3, rules: 'passado', maxValor: G.hoje(), valor: salvos.nipAte }));
  const envDe = add('envDe', G.field({ id: 'r-env-de', label: 'Envio ao CRM: de', tipo: 'date', span: 3, rules: 'passado', maxValor: G.hoje(), valor: salvos.envDe }));
  const envAte = add('envAte', G.field({ id: 'r-env-ate', label: 'Envio ao CRM: até', tipo: 'date', span: 3, rules: 'passado', maxValor: G.hoje(), valor: salvos.envAte }));
  add('area', G.field({ id: 'r-area', label: 'Área', tipo: 'select', vazio: 'Todas', span: 4, opcoes: G.db.all('areas').map((a) => ({ value: String(a.id), label: a.nome })), valor: salvos.area }));
  const situacao = add('situacao', G.field({ id: 'r-situacao', label: 'Situação', tipo: 'select', vazio: 'Todas', span: 4, opcoes: [] }));
  add('categoria', G.field({ id: 'r-categoria', label: 'Categoria', tipo: 'select', vazio: 'Todas', span: 4, opcoes: G.CATEGORIAS, valor: salvos.categoria }));

  // Tema em cascata, opcional
  const temaSel = [1, 2, 3].map((nivel) => add('tema' + nivel, G.field({ id: 'r-tema-' + nivel, label: 'Tema nível ' + nivel, tipo: 'select', vazio: 'Todos', span: 4, opcoes: [] })).control);
  function preencheTema(nivel, paiId, valor) {
    const sel = temaSel[nivel - 1];
    const vazio = sel.options[0];
    sel.replaceChildren(vazio);
    sel.disabled = nivel > 1 && !paiId;
    if (sel.disabled) return;
    G.temasFilhos(paiId).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).forEach((t) => sel.appendChild(h('option', { value: String(t.id), text: t.nome })));
    sel.value = valor ? String(valor) : '';
  }
  preencheTema(1, 0, salvos.tema1);
  preencheTema(2, Number(salvos.tema1) || 0, salvos.tema2);
  preencheTema(3, Number(salvos.tema2) || 0, salvos.tema3);
  temaSel.forEach((sel, i) => sel.addEventListener('change', () => {
    for (let n = i + 2; n <= 3; n++) preencheTema(n, n === i + 2 ? Number(sel.value) : 0, 0);
  }));

  add('cartao', G.field({ id: 'r-cartao', label: 'Cartão do beneficiário', mask: 'cartao', inputmode: 'numeric', max: 19, span: 4, valor: salvos.cartao }));
  add('cpf', G.field({ id: 'r-cpf', label: 'CPF do beneficiário', mask: 'cpf', inputmode: 'numeric', max: 14, span: 4, valor: salvos.cpf, dica: 'Pode ser só uma parte dos números.' }));
  add('nome', G.field({ id: 'r-nome', label: 'Nome do beneficiário', max: 100, span: 4, valor: salvos.nome }));
  G.applyMasks(form);

  function ajustaTipo() {
    const t = tipo();
    const exp = t !== 'importadas';
    envDe.hidden = !exp;
    envAte.hidden = !exp;
    const atual = situacao.control.value;
    const vazio = situacao.control.options[0];
    situacao.control.replaceChildren(vazio);
    (exp ? ['Enviada', 'Falha no envio'] : G.STATUS_NIP).forEach((s) => situacao.control.appendChild(h('option', { value: s, text: s })));
    situacao.control.value = (exp ? ['Enviada', 'Falha no envio'] : G.STATUS_NIP).indexOf(atual) >= 0 ? atual : (salvos.situacao || '');
    salvos.situacao = '';
  }
  tiposEl.addEventListener('change', () => { ajustaTipo(); gerar(true); });
  ajustaTipo();

  /* ------------------------------------------------------------ Linhas */

  const temaN = (n, i) => (n.temaId ? G.caminhoTema(n.temaId)[i] || '' : '');

  function valores() {
    const v = {};
    Object.keys(campos).forEach((k) => { v[k] = campos[k].disabled ? '' : campos[k].value.trim(); });
    v.tipo = tipo();
    return v;
  }

  function filtraNip(n, v) {
    if (v.nipDe && n.dataNotificacao < v.nipDe) return false;
    if (v.nipAte && n.dataNotificacao > v.nipAte) return false;
    if (v.categoria && n.categoria !== v.categoria) return false;
    const temaAlvo = Number(v.tema3 || v.tema2 || v.tema1) || 0;
    if (temaAlvo) {
      let t = n.temaId ? G.db.get('temas', n.temaId) : null;
      let ok = false;
      while (t) { if (t.id === temaAlvo) { ok = true; break; } t = t.paiId ? G.db.get('temas', t.paiId) : null; }
      if (!ok) return false;
    }
    if (v.cartao && G.digitos(n.beneficiario.cartao).indexOf(G.digitos(v.cartao)) < 0) return false;
    if (v.cpf && G.digitos(n.beneficiario.cpf).indexOf(G.digitos(v.cpf)) < 0) return false;
    if (v.nome && G.normaliza(n.beneficiario.nome).indexOf(G.normaliza(v.nome)) < 0) return false;
    return true;
  }

  function linhas(v) {
    if (v.tipo === 'importadas') {
      return G.db.all('nips').filter((n) => filtraNip(n, v) &&
        (!v.area || String(n.areaId) === v.area) && (!v.situacao || n.status === v.situacao));
    }
    const out = [];
    G.db.all('lotes').filter((l) => l.origem === v.tipo).forEach((l) => {
      const dia = l.em.slice(0, 10);
      if (v.envDe && dia < v.envDe) return;
      if (v.envAte && dia > v.envAte) return;
      l.itens.forEach((i) => {
        const n = G.db.get('nips', i.nipId);
        if (!n || !filtraNip(n, v)) return;
        if (v.area && String(i.areaId) !== v.area) return;
        const sit = i.ok ? 'Enviada' : 'Falha no envio';
        if (v.situacao && sit !== v.situacao) return;
        out.push({ id: l.id + '-' + n.id, lote: l, nip: n, item: i, situacao: sit });
      });
    });
    return out;
  }

  const benef = (n) => h('span', null, h('a', { class: 'row-link', href: 'triagem.html?id=' + n.id, text: n.beneficiario.nome }), h('span', { class: 'cell-sub', text: n.beneficiario.cpf || 'CPF não informado' }));
  const COLS = {
    importadas: [
      { key: 'protocolo', label: 'Protocolo', sort: true, render: (n) => G.protocolo(n.protocolo, true), csv: (n) => n.protocolo },
      { key: 'dataNotificacao', label: 'Data da NIP', sort: true, render: (n) => G.fmt.date(n.dataNotificacao), csv: (n) => G.fmt.date(n.dataNotificacao), class: 'nowrap' },
      { key: 'nome', label: 'Beneficiário', sort: (n) => n.beneficiario.nome, render: benef, csv: (n) => n.beneficiario.nome },
      { key: 'cpf', label: 'CPF', hidden: true, csv: (n) => n.beneficiario.cpf },
      { key: 'categoria', label: 'Categoria', sort: true },
      { key: 'area', label: 'Área', sort: (n) => G.nome.area(n.areaId), render: (n) => G.nome.area(n.areaId) || 'Sem área', csv: (n) => G.nome.area(n.areaId) },
      { key: 't1', label: 'Tema nível 1', sort: (n) => temaN(n, 0), render: (n) => temaN(n, 0) || 'Sem tema', csv: (n) => temaN(n, 0) },
      { key: 't2', label: 'Tema nível 2', sort: (n) => temaN(n, 1), render: (n) => temaN(n, 1) || 'Sem tema', csv: (n) => temaN(n, 1) },
      { key: 't3', label: 'Tema nível 3', sort: (n) => temaN(n, 2), render: (n) => temaN(n, 2) || 'Sem tema', csv: (n) => temaN(n, 2) },
      { key: 'status', label: 'Situação', sort: true, render: (n) => G.statusBadge(n.status), csv: (n) => n.status },
      { key: 'prazo', label: 'Prazo', sort: (n) => G.prazo(n).limite, render: (n) => h('span', null, G.fmt.date(G.prazo(n).limite), h('span', { class: 'cell-sub', text: G.prazo(n).texto })), csv: (n) => G.fmt.date(G.prazo(n).limite) + ' (' + G.prazo(n).texto + ')' }
    ],
    envio: [
      { key: 'lote', label: 'Lote', sort: (r) => r.lote.numero, render: (r) => r.lote.numero, csv: (r) => r.lote.numero },
      { key: 'envio', label: 'Data do envio', sort: (r) => r.lote.em, render: (r) => G.fmt.dateTime(r.lote.em), csv: (r) => G.fmt.dateTime(r.lote.em), class: 'nowrap' },
      { key: 'dataNip', label: 'Data da NIP', sort: (r) => r.nip.dataNotificacao, render: (r) => G.fmt.date(r.nip.dataNotificacao), csv: (r) => G.fmt.date(r.nip.dataNotificacao), class: 'nowrap' },
      { key: 'nome', label: 'Beneficiário', sort: (r) => r.nip.beneficiario.nome, render: (r) => benef(r.nip), csv: (r) => r.nip.beneficiario.nome },
      { key: 'area', label: 'Área', sort: (r) => G.nome.area(r.item.areaId), render: (r) => G.nome.area(r.item.areaId), csv: (r) => G.nome.area(r.item.areaId) },
      { key: 't1', label: 'Tema nível 1', sort: (r) => temaN(r.nip, 0), render: (r) => temaN(r.nip, 0), csv: (r) => temaN(r.nip, 0) },
      { key: 't2', label: 'Tema nível 2', sort: (r) => temaN(r.nip, 1), render: (r) => temaN(r.nip, 1), csv: (r) => temaN(r.nip, 1) },
      { key: 't3', label: 'Tema nível 3', sort: (r) => temaN(r.nip, 2), render: (r) => temaN(r.nip, 2), csv: (r) => temaN(r.nip, 2) },
      { key: 'situacao', label: 'Situação do envio', sort: true, render: (r) => h('span', null, G.statusBadge(r.situacao), r.item.erro ? h('span', { class: 'cell-sub', text: r.item.erro }) : null), csv: (r) => r.situacao + (r.item.erro ? ': ' + r.item.erro : '') }
    ]
  };

  /* ---------------------------------------------------------- Gerar */

  let tabela = null;
  let colunasAtuais = [];
  let linhasAtuais = [];
  const total = document.getElementById('resultado-total');

  function gerar(anunciar) {
    const v = valores();
    const imp = v.tipo === 'importadas';
    colunasAtuais = imp ? COLS.importadas : COLS.envio;
    linhasAtuais = linhas(v);
    const nomeTipo = TIPOS.find((t) => t.value === v.tipo).label;
    document.getElementById('resultado-titulo').textContent = nomeTipo;
    tabela = G.dataTable({
      container: document.getElementById('resultado'),
      columns: colunasAtuais.filter((c) => !c.hidden),
      rows: linhasAtuais,
      caption: nomeTipo,
      rowKey: (r) => r.id,
      sortKey: imp ? 'dataNotificacao' : 'envio',
      sortDir: 'desc',
      emptyTitle: 'Nenhuma NIP com esses filtros',
      emptyText: 'Amplie o período ou limpe os filtros para ver mais resultados.'
    });
    total.textContent = G.fmt.plural(linhasAtuais.length, imp ? 'NIP encontrada' : 'NIP enviada', imp ? 'NIPs encontradas' : 'NIPs enviadas') +
      (imp ? '' : ' em ' + G.fmt.plural(new Set(linhasAtuais.map((r) => r.lote.id)).size, 'lote', 'lotes')) + '.';
    G.store.set('filtros:relatorios', v);
    if (anunciar) G.announce(nomeTipo + ': ' + total.textContent);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = G.validateForm(form, {
      resumoTitulo: 'Para gerar o relatório, confira:',
      extra(addErro) {
        const v = valores();
        const hoje = G.hoje();
        if (v.nipDe && v.nipAte && v.nipDe <= hoje && v.nipAte <= hoje && v.nipDe > v.nipAte) addErro(campos.nipAte, 'A data final da NIP vem depois da inicial.');
        if (v.tipo !== 'importadas' && v.envDe && v.envAte && v.envDe <= hoje && v.envAte <= hoje && v.envDe > v.envAte) addErro(campos.envAte, 'A data final do envio vem depois da inicial.');
      }
    });
    if (!ok) return;
    gerar(true);
  });
  form.addEventListener('reset', () => {
    window.setTimeout(() => {
      G.clearErrors(form);
      Object.keys(campos).forEach((k) => { campos[k].value = ''; });
      preencheTema(2, 0, 0);
      preencheTema(3, 0, 0);
      gerar(true);
    }, 0);
  });

  document.getElementById('exportar').addEventListener('click', () => {
    const v = valores();
    const nome = { importadas: 'nips-importadas', Manual: 'envios-manuais-crm', 'Automática': 'envios-automaticos-crm' }[v.tipo];
    G.downloadCsv(nome + '-' + G.hoje() + '.csv', colunasAtuais.map((c) => Object.assign({}, c, { csv: c.csv || ((r) => r[c.key]) })), tabela.rows());
  });
  document.getElementById('imprimir').addEventListener('click', () => window.print());

  gerar(false);
})();
