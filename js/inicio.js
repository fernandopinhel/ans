/* Triagem NIP: painel do dia (relógio da ANS, números do período e o que vence primeiro). */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;

  const u = G.shell({ ativo: 'inicio', titulo: 'Painel', migalhas: [{ label: 'Painel' }] });
  if (!u) return;

  const primeiro = u.nome.split(' ')[0];
  const hora = new Date().getHours();
  document.getElementById('pagina-titulo').textContent = (hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite') + ', ' + primeiro + '!';

  function diasUteisEntre(a, b) {
    let n = 0;
    let d = a;
    while (d < b) {
      d = G.somaDias(d, 1);
      if (!G.fimDeSemana(d)) n += 1;
    }
    return n;
  }

  /* ------------------------------------------------------- Boas-vindas */

  function renderHero() {
    const nips = G.db.all('nips');
    const minhas = nips.filter((n) => n.analistaId === u.id && n.status === 'Em análise').length;
    const triar = nips.filter((n) => n.status === 'Aguardando triagem' || n.status === 'Com problema').length;
    const hoje = nips.filter((n) => G.aberta(n) && G.prazo(n).dias === 0).length;
    const partes = [];
    partes.push(triar ? G.fmt.plural(triar, 'NIP espera', 'NIPs esperam') + ' triagem' : 'Nenhuma NIP espera triagem');
    if (hoje) partes.push(G.fmt.plural(hoje, 'vence', 'vencem') + ' hoje');
    document.getElementById('hero-texto').textContent = partes.join(' e ') + '. ' +
      (minhas ? 'Você acompanha ' + G.fmt.plural(minhas, 'NIP em análise', 'NIPs em análise') + '.' : 'Você não tem NIPs em análise agora.');
  }

  /* --------------------------------------------------------- Relógio */

  function renderRelogio() {
    const abertas = G.db.all('nips').filter(G.aberta);
    const dias = abertas.map((n) => G.prazo(n).dias);
    const blocos = [
      { n: dias.filter((d) => d < 0).length, um: 'em atraso', varios: 'em atraso', tom: 'danger', href: 'triagem.html?prazo=urgente' },
      { n: dias.filter((d) => d === 0).length, um: 'vence hoje', varios: 'vencem hoje', tom: 'warning', href: 'triagem.html?prazo=urgente' },
      { n: dias.filter((d) => d > 0 && d <= 2).length, um: 'vence em até 2 dias úteis', varios: 'vencem em até 2 dias úteis', tom: 'success', href: 'triagem.html' }
    ];
    document.getElementById('relogio').replaceChildren(...blocos.map((b) => h('li', null,
      h('a', { href: b.href, class: 'is-' + b.tom },
        h('strong', { text: String(b.n) }),
        h('span', { text: b.n === 1 ? b.um : b.varios })))));
  }

  /* ---------------------------------------------------------- Período */

  const formPeriodo = document.getElementById('periodo');
  const salvo = G.store.get('filtros:painel', null);
  const fIni = G.field({ id: 'p-inicio', label: 'De', tipo: 'date', required: true, rules: 'passado', span: 4, maxValor: G.hoje(), valor: salvo ? salvo.ini : G.somaDias(G.hoje(), -45) });
  const fFim = G.field({ id: 'p-fim', label: 'Até', tipo: 'date', required: true, rules: 'passado', span: 4, maxValor: G.hoje(), valor: salvo ? salvo.fim : G.hoje() });
  const aplicar = h('div', { class: 'field span-4 align-end' }, h('button', { type: 'submit', class: 'btn btn--primary' }, G.icon('filter'), 'Aplicar período'));
  document.getElementById('periodo-campos').append(fIni, fFim, aplicar);

  function periodo() { return { ini: fIni.control.value, fim: fFim.control.value }; }

  function barras(alvo, itens, total) {
    const ul = document.getElementById(alvo);
    ul.replaceChildren();
    if (!itens.length) {
      ul.appendChild(h('li', { class: 'muted', text: 'Nada no período escolhido.' }));
      return;
    }
    const max = Math.max(...itens.map((i) => i.n), 1);
    itens.forEach((i) => {
      const pct = total ? Math.round((i.n / total) * 100) : 0;
      ul.appendChild(h('li', { class: 'tom-' + (i.tom === undefined ? 'info' : i.tom) },
        h('span', { text: i.label }),
        h('span', { class: 'barras__num' }, String(i.n), h('span', { class: 'muted', text: ' · ' + pct + '%' })),
        h('span', { class: 'barras__trilho', 'aria-hidden': 'true' }, h('span', { class: 'barras__valor', 'data-pct': String(Math.round((i.n / max) * 100)) }))));
    });
    // Larguras via CSSOM: a CSP não permite atributo style no HTML.
    ul.querySelectorAll('.barras__valor').forEach((el) => { el.style.width = el.dataset.pct + '%'; });
  }

  function renderNumeros() {
    const p = periodo();
    const nips = G.db.all('nips').filter((n) => n.dataNotificacao >= p.ini && n.dataNotificacao <= p.fim);
    document.getElementById('periodo-texto').textContent = 'NIPs notificadas pela ANS de ' + G.fmt.date(p.ini) + ' a ' + G.fmt.date(p.fim) + '.';

    const comProblema = nips.filter((n) => n.historico.some((x) => x.acao === 'Importada com dados faltando')).length;
    const respondidas = nips.filter((n) => n.status === 'Respondida');
    const noPrazo = respondidas.filter((n) => G.prazo(n).texto === 'Respondida no prazo').length;
    const tempos = respondidas.map((n) => diasUteisEntre(n.dataNotificacao, n.resposta.em.slice(0, 10)));
    const medio = tempos.length ? tempos.reduce((s, x) => s + x, 0) / tempos.length : 0;
    const atrasadas = nips.filter((n) => G.aberta(n) && G.prazo(n).dias < 0).length;

    const kpis = [
      ['inbox', 'NIPs recebidas', G.fmt.int(nips.length), G.fmt.plural(nips.filter((n) => n.origem === 'Manual').length, 'cadastrada à mão', 'cadastradas à mão')],
      ['alert', 'Chegaram com problema', G.fmt.int(comProblema), nips.length ? G.fmt.pct(comProblema / nips.length) + ' das importações' : 'Nenhuma no período'],
      ['check-circle', 'Respondidas no prazo', respondidas.length ? G.fmt.pct(noPrazo / respondidas.length) : 'Sem respostas', G.fmt.plural(noPrazo, 'de ', 'de ') + respondidas.length + ' respondidas'],
      ['clock', 'Tempo médio de resposta', tempos.length ? medio.toFixed(1).replace('.', ',').replace(/,0$/, '') + ' dias úteis' : 'Sem respostas', 'Da notificação até a resposta'],
      ['flag', 'Abertas e em atraso', G.fmt.int(atrasadas), atrasadas ? 'Precisam de resposta hoje' : 'Tudo dentro do prazo']
    ];
    document.getElementById('kpis').replaceChildren(...kpis.map((k) => h('li', { class: 'kpi' },
      h('span', { class: 'kpi__label' }, G.icon(k[0]), k[1]),
      h('span', { class: 'kpi__valor', text: k[2] }),
      h('span', { class: 'kpi__nota', text: k[3] }))));

    const TOM = { 'Com problema': 'danger', 'Aguardando triagem': 'warning', 'Em análise': 'info', 'Respondida': 'success', 'Cancelada': '' };
    barras('por-situacao', G.STATUS_NIP.map((s) => ({ label: s, n: nips.filter((n) => n.status === s).length, tom: TOM[s] })).filter((x) => x.n), nips.length);
    barras('por-categoria', G.CATEGORIAS.map((c) => ({ label: c, n: nips.filter((n) => n.categoria === c).length, tom: c === 'Assistencial' ? 'info' : 'accent' })), nips.length);

    const contar = (lista, chave) => {
      const m = {};
      lista.forEach((n) => { const k = chave(n); if (k) m[k] = (m[k] || 0) + 1; });
      return Object.keys(m).map((k) => ({ label: k, n: m[k] })).sort((a, b) => b.n - a.n).slice(0, 6);
    };
    const classificadas = nips.filter((n) => n.temaId);
    barras('por-tema', contar(classificadas, (n) => G.caminhoTema(n.temaId)[1]).map((x) => Object.assign(x, { tom: 'accent' })), classificadas.length);
    const comArea = nips.filter((n) => n.areaId);
    barras('por-area', contar(comArea, (n) => G.nome.area(n.areaId)), comArea.length);
  }

  formPeriodo.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = G.validateForm(formPeriodo, {
      resumoTitulo: 'Para ver o período, confira:',
      extra(addErro) {
        const p = periodo();
        if (p.ini && p.fim && p.ini <= G.hoje() && p.fim <= G.hoje() && p.ini > p.fim) addErro(fFim.control, 'A data final vem depois da inicial.');
      }
    });
    if (!ok) return;
    G.store.set('filtros:painel', periodo());
    renderNumeros();
    G.announce('Números atualizados para o período de ' + G.fmt.date(periodo().ini) + ' a ' + G.fmt.date(periodo().fim) + '.');
  });

  /* --------------------------------------------------------- Urgentes */

  function renderUrgentes() {
    const lista = G.db.all('nips').filter(G.aberta).sort((a, b) => G.prazo(a).dias - G.prazo(b).dias).slice(0, 6);
    const alvo = document.getElementById('urgentes');
    if (!lista.length) {
      alvo.replaceChildren(h('div', { class: 'empty' }, G.icon('check-circle'), h('strong', { text: 'Nenhuma NIP aberta' }), h('p', { text: 'Quando chegar uma nova, ela aparece aqui.' })));
      return;
    }
    alvo.replaceChildren(h('ul', { class: 'lista-urgente' }, lista.map((n) => {
      const pz = G.prazo(n);
      const caminho = n.temaId ? G.caminhoTema(n.temaId) : [];
      return h('li', null, h('a', { href: 'triagem.html?id=' + n.id },
        h('strong', { text: n.beneficiario.nome }),
        G.badge(pz.texto, pz.tom),
        h('small', { text: n.status + ' · ' + (caminho.length ? caminho[caminho.length - 1] : n.categoria) })));
    })));
  }

  /* -------------------------------------------------------- Importação */

  document.getElementById('importar').addEventListener('click', () => {
    const novas = G.importaNovas();
    const problemas = novas.filter((x) => x.status === 'Com problema').length;
    renderTudo();
    const cont = document.querySelector('.rail__count');
    if (cont) cont.firstChild.textContent = String(G.db.all('nips').filter((n) => n.status === 'Aguardando triagem' || n.status === 'Com problema').length);
    G.toast(G.fmt.plural(novas.length, 'NIP nova chegou', 'NIPs novas chegaram') + ' da ANS' + (problemas ? ', uma com dados faltando' : '') + '. Abra a mesa de triagem para ver.');
  });

  function renderTudo() {
    renderHero();
    renderRelogio();
    renderNumeros();
    renderUrgentes();
  }
  renderTudo();
})();
