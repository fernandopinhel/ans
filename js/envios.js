/* Triagem NIP: envio das NIPs triadas para a fila das áreas no CRM de relacionamento. */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;

  const u = G.shell({ ativo: 'envios', titulo: 'Envios ao CRM', migalhas: [{ label: 'Painel', href: 'inicio.html' }, { label: 'Envios ao CRM' }] });
  if (!u) return;

  const botaoEnviar = document.getElementById('enviar');
  const origemSel = document.getElementById('lotes-origem');

  const linkNip = (n) => h('span', null,
    h('a', { class: 'row-link', href: 'triagem.html?id=' + n.id, text: n.beneficiario.nome }),
    h('span', { class: 'cell-sub', text: 'Protocolo ' + n.protocolo }));
  const temaCurto = (n) => { const c = G.caminhoTema(n.temaId); return c[c.length - 1] || ''; };
  const areaCelula = (n) => {
    const a = G.db.get('areas', n.areaId);
    if (!a) return 'Sem área';
    return h('span', null, a.nome, h('span', { class: 'cell-sub', text: a.codigoCrm || 'Sem código no CRM' }));
  };

  // Próximo dia útil às 6h.
  function proximoAutomatico() {
    let d = G.somaDias(G.hoje(), 1);
    while (G.fimDeSemana(d)) d = G.somaDias(d, 1);
    return d === G.somaDias(G.hoje(), 1) ? 'amanhã às 6h' : G.fmt.date(d) + ' às 6h';
  }

  /* ---------------------------------------------------------- Prontas */

  const prontas = () => G.db.all('nips').filter((n) => n.areaId && (n.status === 'Em análise' || n.status === 'Respondida') && n.crm.status === 'Não enviada');

  const tabProntas = G.dataTable({
    container: document.getElementById('prontas'),
    columns: [
      { key: 'nome', label: 'Beneficiário', sort: (n) => n.beneficiario.nome, render: linkNip },
      { key: 'area', label: 'Área no CRM', sort: (n) => G.nome.area(n.areaId), render: areaCelula },
      { key: 'tema', label: 'Tema', sort: temaCurto, render: temaCurto },
      { key: 'triada', label: 'Triada em', sort: (n) => n.triadaEm || '', render: (n) => G.fmt.dateTime(n.triadaEm), class: 'nowrap' }
    ],
    rows: [],
    caption: 'NIPs prontas para enviar ao CRM',
    selectable: true,
    rowKey: (n) => n.id,
    rowLabel: (n) => 'NIP de ' + n.beneficiario.nome,
    sortKey: 'triada',
    emptyIcon: 'check-circle',
    emptyTitle: 'Nada esperando envio',
    emptyText: 'Quando uma NIP for triada, ela aparece aqui até o próximo envio automático.',
    onSelect(sel) {
      botaoEnviar.disabled = !sel.length;
      botaoEnviar.lastChild.textContent = sel.length ? ' Enviar ' + G.fmt.plural(sel.length, 'NIP', 'NIPs') + ' agora' : ' Enviar agora';
      if (sel.length) G.announce(G.fmt.plural(sel.length, 'NIP selecionada', 'NIPs selecionadas') + '.');
    }
  });

  botaoEnviar.addEventListener('click', async () => {
    const nips = tabProntas.selected().map((id) => G.db.get('nips', id));
    const semCodigo = nips.filter((n) => { const a = G.db.get('areas', n.areaId); return !a || !a.codigoCrm || a.status !== 'Ativo'; });
    const ok = await G.confirmDialog({
      titulo: 'Enviar ' + G.fmt.plural(nips.length, 'NIP', 'NIPs') + ' ao CRM agora?',
      icone: 'send',
      tom: 'info',
      montar(corpo) {
        corpo.append(h('p', { text: 'Elas entram na fila das áreas sem esperar o envio automático de ' + proximoAutomatico() + '.' }));
        if (semCodigo.length) {
          corpo.append(h('div', { class: 'alert alert--warning' }, G.icon('alert'), h('div', { class: 'alert__body' },
            h('p', { class: 'alert__title', text: G.fmt.plural(semCodigo.length, 'NIP não vai subir', 'NIPs não vão subir') }),
            h('p', { text: 'A área ' + G.nome.area(semCodigo[0].areaId) + ' não tem código no CRM. Elas aparecem na lista de falhas para você corrigir.' }))));
        }
      },
      confirmar: 'Enviar agora',
      focoNoConfirmar: true
    });
    if (!ok) return;
    const lote = G.enviaAoCrm(nips, 'Manual');
    const falhas = lote.itens.filter((i) => !i.ok).length;
    renderTudo();
    G.toast('Lote ' + lote.numero + ' enviado: ' + G.fmt.plural(lote.itens.length - falhas, 'NIP no CRM', 'NIPs no CRM') + (falhas ? ' e ' + falhas + ' com falha.' : '.'), falhas ? 'error' : undefined);
    document.getElementById('prontas-titulo').focus();
  });
  document.getElementById('prontas-titulo').setAttribute('tabindex', '-1');

  /* ----------------------------------------------------------- Falhas */

  const comFalha = () => G.db.all('nips').filter((n) => n.crm.status === 'Falha no envio');

  async function trocaArea(n) {
    const opcoes = G.db.all('areas').filter((a) => a.status === 'Ativo' && a.codigoCrm && a.id !== n.areaId);
    const novo = await G.dialog({
      titulo: 'Trocar a área da NIP de ' + n.beneficiario.nome,
      icone: 'route',
      tom: 'info',
      descricao: 'Só aparecem áreas que já têm código no CRM. Se a área atual estiver certa, é melhor cadastrar o código dela.',
      confirmar: 'Trocar e enviar',
      montar(corpo) {
        corpo.append(G.field({ id: 'troca-area', label: 'Nova área', tipo: 'select', required: true, opcoes: opcoes.map((a) => ({ value: String(a.id), label: a.nome + ' · ' + a.codigoCrm })) }));
      },
      aoConfirmar(form) {
        if (!G.validateForm(form)) return false;
        return Number(form.querySelector('#troca-area').value);
      }
    });
    if (!novo) return;
    const antes = G.nome.area(n.areaId);
    n.areaId = novo;
    G.registra(n, 'Área trocada de ' + antes + ' para ' + G.nome.area(novo));
    reenvia(n);
  }

  function reenvia(n) {
    const lote = G.enviaAoCrm([n], 'Manual');
    renderTudo();
    const ok = lote.itens[0].ok;
    G.toast(ok ? 'A NIP de ' + n.beneficiario.nome + ' subiu para o CRM.' : 'Ainda não deu: ' + lote.itens[0].erro, ok ? undefined : 'error');
    document.getElementById('falhas-titulo').focus();
  }
  document.getElementById('falhas-titulo').setAttribute('tabindex', '-1');

  const tabFalhas = G.dataTable({
    container: document.getElementById('falhas'),
    columns: [
      { key: 'nome', label: 'Beneficiário', sort: (n) => n.beneficiario.nome, render: linkNip },
      { key: 'area', label: 'Área', sort: (n) => G.nome.area(n.areaId), render: areaCelula },
      { key: 'erro', label: 'O que travou', render: (n) => n.crm.erro },
      {
        key: 'acoes', label: 'Ações', srOnly: true, render: (n) => {
          const a = G.db.get('areas', n.areaId);
          const de = (txt) => h('span', { class: 'visually-hidden', text: txt });
          return h('div', { class: 'btn-row' },
            a && !a.codigoCrm ? h('a', { class: 'btn btn--sm', href: 'cadastro.html?tipo=areas&id=' + a.id }, G.icon('edit'), 'Cadastrar código', de(' no CRM da área ' + a.nome)) : null,
            h('button', { type: 'button', class: 'btn btn--sm', onClick: () => trocaArea(n) }, G.icon('route'), 'Trocar área', de(' da NIP de ' + n.beneficiario.nome)),
            h('button', { type: 'button', class: 'btn btn--sm btn--primary', onClick: () => reenvia(n) }, G.icon('refresh'), 'Tentar de novo', de(' a NIP de ' + n.beneficiario.nome)));
        }
      }
    ],
    rows: [],
    caption: 'NIPs que não subiram para o CRM',
    rowKey: (n) => n.id,
    emptyIcon: 'check-circle',
    emptyTitle: 'Nenhuma falha',
    emptyText: 'Todas as NIPs enviadas chegaram ao CRM.'
  });

  /* ------------------------------------------------------------ Lotes */

  function verLote(l) {
    G.dialog({
      titulo: 'Lote ' + l.numero,
      icone: 'send',
      tom: 'info',
      wide: true,
      somenteOk: true,
      confirmar: 'Fechar',
      descricao: (l.origem === 'Automática' ? 'Envio automático' : 'Envio manual por ' + l.por) + ' em ' + G.fmt.dateTime(l.em) + '.',
      montar(corpo) {
        const lista = h('div');
        corpo.append(lista);
        G.dataTable({
          container: lista,
          columns: [
            { key: 'nome', label: 'Beneficiário', render: (i) => { const n = G.db.get('nips', i.nipId); return n ? linkNip(n) : 'NIP removida'; } },
            { key: 'area', label: 'Área', render: (i) => G.nome.area(i.areaId) },
            { key: 'ok', label: 'Resultado', render: (i) => h('span', null, G.statusBadge(i.ok ? 'Enviada' : 'Falha no envio'), i.erro ? h('span', { class: 'cell-sub', text: i.erro }) : null) }
          ],
          rows: l.itens,
          caption: 'NIPs do lote ' + l.numero,
          paginate: false,
          compact: true
        });
      }
    });
  }

  const tabLotes = G.dataTable({
    container: document.getElementById('lotes'),
    columns: [
      { key: 'numero', label: 'Lote', sort: true, render: (l) => h('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'aria-label': 'Ver as NIPs do lote ' + l.numero, onClick: () => verLote(l) }, l.numero) },
      { key: 'em', label: 'Quando', sort: true, render: (l) => G.fmt.dateTime(l.em), class: 'nowrap' },
      { key: 'origem', label: 'Tipo', sort: true, render: (l) => G.statusBadge(l.origem) },
      { key: 'por', label: 'Por', sort: true },
      { key: 'qtd', label: 'NIPs', num: true, sort: (l) => l.itens.length, render: (l) => String(l.itens.length) },
      { key: 'falhas', label: 'Falhas', num: true, sort: (l) => l.itens.filter((i) => !i.ok).length, render: (l) => { const f = l.itens.filter((i) => !i.ok).length; return f ? G.badge(String(f), 'danger') : '0'; } }
    ],
    rows: [],
    caption: 'Histórico de envios ao CRM',
    rowKey: (l) => l.id,
    sortKey: 'em',
    sortDir: 'desc',
    emptyTitle: 'Nenhum envio com esse filtro'
  });
  origemSel.addEventListener('change', () => { renderLotes(); G.announce(document.getElementById('lotes-total').textContent); });

  function renderLotes() {
    const lotes = G.db.all('lotes').filter((l) => !origemSel.value || l.origem === origemSel.value);
    tabLotes.update(lotes);
    const nips = lotes.reduce((s, l) => s + l.itens.length, 0);
    document.getElementById('lotes-total').textContent = G.fmt.plural(lotes.length, 'envio', 'envios') + ', ' + G.fmt.plural(nips, 'NIP', 'NIPs') + ' no total.';
  }

  function renderTudo() {
    const p = prontas();
    tabProntas.update(p);
    document.getElementById('prontas-total').textContent = p.length
      ? G.fmt.plural(p.length, 'NIP triada espera', 'NIPs triadas esperam') + ' o envio automático de ' + proximoAutomatico() + '. Se for urgente, selecione e envie agora.'
      : 'Nada esperando. O próximo envio automático é ' + proximoAutomatico() + '.';
    tabFalhas.update(comFalha());
    renderLotes();
  }
  renderTudo();
})();
