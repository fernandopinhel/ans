/*
 * Triagem NIP: cadastro manual de NIP (nip.html) e correção de dados
 * de uma NIP importada com problema (nip.html?id=...).
 */
(function () {
  'use strict';

  const G = window.NIP;
  const h = G.h;
  const id = Number(G.param('id')) || null;
  const original = id ? G.db.get('nips', id) : null;
  const titulo = original ? 'Corrigir NIP' : 'Cadastrar NIP';

  const u = G.shell({
    ativo: original ? 'triagem' : 'nova',
    titulo,
    migalhas: [
      { label: 'Painel', href: 'inicio.html' },
      { label: 'Mesa de triagem', href: 'triagem.html' },
      { label: titulo }
    ]
  });
  if (!u) return;

  const main = document.getElementById('conteudo');
  if (id && !original) {
    main.replaceChildren(h('div', { class: 'card empty' },
      G.icon('alert'),
      h('h1', { text: 'Não encontramos essa NIP' }),
      h('p', { text: 'O endereço pode estar incompleto, ou os dados de exemplo foram restaurados.' }),
      h('a', { class: 'btn btn--primary', href: 'triagem.html', text: 'Voltar para a mesa' })));
    return;
  }
  if (original && !G.aberta(original)) {
    main.replaceChildren(h('div', { class: 'card empty' },
      G.icon('lock'),
      h('h1', { text: 'Essa NIP não pode mais ser alterada' }),
      h('p', { text: 'Ela já foi ' + original.status.toLowerCase() + '. Os dados ficam guardados como estavam no fechamento.' }),
      h('a', { class: 'btn btn--primary', href: 'triagem.html?id=' + id, text: 'Ver a ficha da NIP' })));
    return;
  }

  const n = original ? JSON.parse(JSON.stringify(original)) : {
    beneficiario: { endereco: {} }, interlocutor: {}, perguntas: {}, categoria: ''
  };
  const b = n.beneficiario;

  /* ---------------------------------------------------------- Cabeçalho */

  document.getElementById('pagina-titulo').textContent = titulo;
  const voltar = document.getElementById('pagina-voltar');
  if (original) {
    voltar.href = 'triagem.html?id=' + id;
    voltar.lastChild.textContent = ' Voltar para a ficha';
    document.getElementById('cancelar').href = voltar.href;
    document.getElementById('pagina-descricao').replaceChildren(h('ul', { class: 'meta' },
      h('li', null, G.protocolo(original.protocolo, true)),
      h('li', null, G.icon('user'), original.beneficiario.nome),
      h('li', null, G.statusBadge(original.status))));
  }

  /* ------------------------------------------------------------ Campos */

  const form = document.getElementById('nip-form');
  const corpo = document.getElementById('nip-secoes');
  const condicionais = [];

  const simNao = ['Sim', 'Não'];
  const secao = (tituloSec, dica, ...conteudo) => {
    const tid = G.uid('sec');
    return h('section', { class: 'card', 'aria-labelledby': tid },
      h('div', { class: 'card__head' }, h('div', null, h('h2', { id: tid, text: tituloSec }), dica ? h('p', { text: dica }) : null)),
      conteudo);
  };
  const grade = (...campos) => h('div', { class: 'form-grid' }, campos);
  const radio = (key, label, opcoes, valor, span, required) => G.choiceGroup({ id: 'n-' + key, name: key, label, opcoes, valor, span, required: required !== false, box: true });

  // Notificação
  const fProtocolo = G.field({ id: 'n-protocolo', label: 'Protocolo da ANS', required: true, rules: 'protocolo', mask: 'digits', inputmode: 'numeric', max: 20, span: 4, valor: n.protocolo, dica: '20 números, como aparece no portal da ANS.', readOnly: !!original, spellcheck: false });
  if (original) fProtocolo.querySelector('.hint').textContent = 'O protocolo não muda depois que a NIP entra no sistema.';
  corpo.appendChild(secao('Notificação da ANS', null,
    grade(
      fProtocolo,
      G.field({ id: 'n-demanda', label: 'Número da demanda', required: true, rules: 'demanda', mask: 'digits', inputmode: 'numeric', max: 9, span: 4, valor: n.demanda }),
      G.field({ id: 'n-dataNotificacao', label: 'Data da notificação', tipo: 'date', required: true, rules: 'passado', span: 4, valor: n.dataNotificacao, maxValor: G.hoje(), dica: 'O prazo começa a contar daqui.' }),
      radio('categoria', 'Categoria da NIP', G.CATEGORIAS, n.categoria, 12),
      h('p', { class: 'hint span-12', text: 'Assistencial tem 5 dias úteis para resposta. Não assistencial, 10 dias úteis.' })),
    h('dl', { class: 'dl card card--soft mt' },
      h('div', null, h('dt', { text: 'Operadora notificada' }), h('dd', { text: G.OPERADORA.nomeFantasia })),
      h('div', null, h('dt', { text: 'Razão social' }), h('dd', { text: G.OPERADORA.razaoSocial })),
      h('div', null, h('dt', { text: 'Registro na ANS' }), h('dd', { text: G.OPERADORA.regAns })),
      h('div', null, h('dt', { text: 'CNPJ' }), h('dd', { text: G.OPERADORA.cnpj })))));

  // Beneficiário
  const e = b.endereco || {};
  corpo.appendChild(secao('Beneficiário', 'Quem fez a reclamação na ANS.',
    grade(
      G.field({ id: 'n-nome', label: 'Nome completo', required: true, max: 100, span: 8, valor: b.nome, autocomplete: 'off' }),
      G.field({ id: 'n-nascimento', label: 'Data de nascimento', tipo: 'date', required: true, rules: 'passado', span: 4, valor: b.nascimento, maxValor: G.hoje() }),
      G.field({ id: 'n-cpf', label: 'CPF', required: true, rules: 'cpf', mask: 'cpf', inputmode: 'numeric', max: 14, span: 4, valor: b.cpf }),
      G.field({ id: 'n-cartao', label: 'Cartão do beneficiário', required: true, rules: 'cartao', mask: 'cartao', inputmode: 'numeric', max: 19, span: 4, valor: b.cartao, dica: 'Os 16 números da carteirinha.' }),
      radio('sexo', 'Sexo', [{ value: 'F', label: 'Feminino' }, { value: 'M', label: 'Masculino' }], b.sexo, 4),
      G.field({ id: 'n-telefone', label: 'Telefone', tipo: 'tel', required: true, rules: 'phone', mask: 'phone', inputmode: 'tel', max: 15, span: 4, valor: b.telefone }),
      G.field({ id: 'n-email', label: 'E-mail', tipo: 'email', opcional: true, rules: 'email', max: 100, span: 8, valor: b.email, spellcheck: false }),
      G.field({ id: 'n-cep', label: 'CEP', required: true, rules: 'cep', mask: 'cep', inputmode: 'numeric', max: 9, span: 3, valor: e.cep }),
      G.field({ id: 'n-logradouro', label: 'Endereço', required: true, max: 120, span: 6, valor: e.logradouro }),
      G.field({ id: 'n-numero', label: 'Número', required: true, max: 10, span: 3, valor: e.numero }),
      G.field({ id: 'n-bairro', label: 'Bairro', required: true, max: 60, span: 4, valor: e.bairro }),
      G.field({ id: 'n-cidade', label: 'Município', required: true, max: 60, span: 4, valor: e.cidade }),
      G.field({ id: 'n-uf', label: 'UF', tipo: 'select', opcoes: G.UFS, required: true, span: 4, valor: e.uf }))));

  // Interlocutor
  const it = n.interlocutor || {};
  corpo.appendChild(secao('Interlocutor', 'Só se outra pessoa falou com a ANS em nome do beneficiário, como um familiar.',
    grade(
      G.field({ id: 'n-interlocutor-nome', label: 'Nome do interlocutor', opcional: true, max: 100, span: 8, valor: it.nome }),
      G.field({ id: 'n-interlocutor-telefone', label: 'Telefone do interlocutor', tipo: 'tel', opcional: true, rules: 'phone', mask: 'phone', inputmode: 'tel', max: 15, span: 4, valor: it.telefone }))));

  // Relato
  const fDescricao = G.field({ id: 'n-descricao', label: 'O que o beneficiário contou à ANS', tipo: 'textarea', required: true, max: 4000, valor: n.descricao, dica: 'Copie o texto da notificação. As palavras-chave do relato ajudam a sugerir a área.' });
  fDescricao.control.rows = 7;
  corpo.appendChild(secao('Relato', null, grade(fDescricao)));

  // Perguntas obrigatórias
  const p = n.perguntas || {};
  const f48 = radio('negativa48h', 'O documento com o motivo foi entregue em até 48 horas?', simNao, p.negativa48h, 12);
  condicionais.push({ el: f48, quando: () => (form.querySelector('[name="pediuNegativa"]:checked') || {}).value === 'Sim' });
  corpo.appendChild(secao('Respostas às perguntas obrigatórias', 'Como o beneficiário respondeu às perguntas do formulário da ANS.',
    grade(
      G.field({ id: 'n-dataSolicitacao', label: 'Quando o beneficiário pediu à operadora', tipo: 'date', required: true, rules: 'passado', span: 4, valor: p.dataSolicitacao, maxValor: G.hoje() }),
      G.field({ id: 'n-protocoloOperadora', label: 'Protocolo do pedido na operadora', required: true, mask: 'digits', inputmode: 'numeric', max: 20, span: 4, valor: p.protocoloOperadora, dica: 'De 6 a 20 números.' }),
      G.field({ id: 'n-ufAtendimento', label: 'UF onde precisou de atendimento', tipo: 'select', opcoes: G.UFS, required: true, span: 4, valor: p.ufAtendimento }),
      G.field({ id: 'n-municipioAtendimento', label: 'Município onde precisou de atendimento', required: true, max: 60, span: 6, valor: p.municipioAtendimento }),
      radio('impedimento', 'Houve impedimento para fazer algum procedimento ou falta de resposta da operadora?', simNao, p.impedimento, 12),
      radio('previsaoContrato', 'O contrato ou o regulamento prevê esse atendimento?', simNao, p.previsaoContrato, 12),
      radio('pediuNegativa', 'O beneficiário pediu o motivo da negativa por escrito?', simNao, p.pediuNegativa, 12),
      f48)));

  // Arquivo
  const arquivo = h('input', { class: 'input', type: 'file', id: 'n-arquivo', accept: 'application/pdf,.pdf', 'aria-describedby': 'n-arquivo-dica', 'data-novalidate': '1' });
  corpo.appendChild(secao('Arquivo da notificação', null,
    h('div', { class: 'field' },
      h('label', { for: 'n-arquivo' }, 'PDF da notificação ', h('span', { class: 'opt', text: '(opcional)' })),
      arquivo,
      h('p', { class: 'hint', id: 'n-arquivo-dica', text: n.arquivo ? 'Arquivo atual: ' + n.arquivo + '. Escolha outro para trocar.' : 'O arquivo fica só neste navegador. O protótipo guarda apenas o nome.' }))));

  function atualizaCondicionais() {
    condicionais.forEach((c) => { c.el.hidden = !c.quando(); });
  }
  form.addEventListener('change', atualizaCondicionais);
  atualizaCondicionais();
  G.applyMasks(form);

  /* Problemas da importação: aviso no topo com links para cada campo. */
  if (original && original.status === 'Com problema') {
    const probs = G.problemas(original);
    if (probs.length) {
      const alerta = h('div', { class: 'alert alert--warning', role: 'group', 'aria-labelledby': 'problemas-titulo' },
        G.icon('alert'),
        h('div', { class: 'alert__body' },
          h('p', { class: 'alert__title', id: 'problemas-titulo', text: 'A importação trouxe ' + G.fmt.plural(probs.length, 'problema', 'problemas') + ':' }),
          h('ul', null, probs.map((x) => h('li', null, h('a', {
            href: '#n-' + x.campo,
            text: x.msg,
            onClick(ev) { ev.preventDefault(); G.focusField(document.getElementById('n-' + x.campo)); }
          })))),
          h('p', { text: 'Quando estiver tudo certo, a NIP volta para a fila de triagem.' })));
      corpo.prepend(alerta);
    }
  }

  /* -------------------------------------------------------- Coleta */

  const val = (k) => document.getElementById('n-' + k).value.trim();
  const marcado = (k) => { const m = form.querySelector('[name="' + k + '"]:checked'); return m ? m.value : ''; };

  function coleta() {
    const out = JSON.parse(JSON.stringify(n));
    out.protocolo = val('protocolo');
    out.demanda = val('demanda');
    out.dataNotificacao = val('dataNotificacao');
    out.categoria = marcado('categoria');
    out.beneficiario = {
      nome: val('nome'), sexo: marcado('sexo'), cpf: val('cpf'), cartao: val('cartao'), nascimento: val('nascimento'),
      telefone: val('telefone'), email: val('email'),
      endereco: { cep: val('cep'), logradouro: val('logradouro'), numero: val('numero'), bairro: val('bairro'), cidade: val('cidade'), uf: val('uf') }
    };
    out.interlocutor = { nome: val('interlocutor-nome'), telefone: val('interlocutor-telefone') };
    out.descricao = val('descricao');
    const pediu = marcado('pediuNegativa');
    out.perguntas = {
      dataSolicitacao: val('dataSolicitacao'), impedimento: marcado('impedimento'), previsaoContrato: marcado('previsaoContrato'),
      ufAtendimento: val('ufAtendimento'), municipioAtendimento: val('municipioAtendimento'),
      pediuNegativa: pediu, negativa48h: pediu === 'Sim' ? marcado('negativa48h') : '', protocoloOperadora: val('protocoloOperadora')
    };
    if (arquivo.files && arquivo.files[0]) out.arquivo = arquivo.files[0].name;
    return out;
  }

  /* ---------------------------------------------------------- Salvar */

  const dirty = G.guardDirty(form);
  const el = (k) => document.getElementById('n-' + k);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = G.validateForm(form, {
      extra(addErro) {
        const prot = val('protocolo');
        if (!original && G.valida.protocolo(prot) && G.db.all('nips').some((x) => x.protocolo === prot)) {
          addErro(el('protocolo'), 'Já existe uma NIP com esse protocolo. Procure por ele na mesa de triagem.');
        }
        const nasc = val('nascimento');
        if (nasc && nasc <= G.hoje() && nasc < G.somaDias(G.hoje(), -120 * 365)) addErro(el('nascimento'), 'Essa data de nascimento parece antiga demais. Pode conferir?');
        const sol = val('dataSolicitacao');
        const notif = val('dataNotificacao');
        if (sol && notif && sol <= G.hoje() && sol > notif) addErro(el('dataSolicitacao'), 'O pedido à operadora vem antes da notificação da ANS. Confira as duas datas.');
        const desc = val('descricao');
        if (desc && desc.length < 30) addErro(el('descricao'), 'O relato está curto demais. Copie o texto completo da notificação.');
        const po = val('protocoloOperadora');
        if (po && !/^\d{6,20}$/.test(po)) addErro(el('protocoloOperadora'), 'O protocolo da operadora tem de 6 a 20 números.');
        const iNome = val('interlocutor-nome');
        const iTel = val('interlocutor-telefone');
        if (iNome && !iTel) addErro(el('interlocutor-telefone'), 'Coloque o telefone do interlocutor, ou apague o nome se não houver interlocutor.');
        if (iTel && !iNome && G.valida.phone(iTel)) addErro(el('interlocutor-nome'), 'Coloque o nome do interlocutor, ou apague o telefone.');
        const arq = arquivo.files && arquivo.files[0];
        if (arq && !/\.pdf$/i.test(arq.name)) addErro(arquivo, 'O arquivo precisa ser um PDF.');
      }
    });
    if (!ok) return;

    const dados = coleta();
    let salvo;
    if (original) {
      const eraProblema = original.status === 'Com problema';
      if (eraProblema && !G.problemas(dados).length) dados.status = 'Aguardando triagem';
      Object.assign(original, dados);
      G.registra(original, eraProblema && original.status === 'Aguardando triagem' ? 'Dados corrigidos, NIP liberada para triagem' : 'Dados da NIP corrigidos');
      salvo = original;
      G.flash(eraProblema && salvo.status === 'Aguardando triagem' ? 'Dados corrigidos. A NIP voltou para a fila de triagem.' : 'Dados da NIP salvos.');
    } else {
      Object.assign(dados, {
        origem: 'Manual', importadaEm: new Date().toISOString(), status: 'Aguardando triagem',
        temaId: 0, areaId: 0, analistaId: 0, encaminhamentos: [], resposta: null, cancelamento: null,
        crm: { status: 'Não enviada', loteId: 0, erro: '' }
      });
      salvo = G.db.save('nips', dados, 'NIP cadastrada à mão');
      G.flash('Prontinho! A NIP de ' + salvo.beneficiario.nome + ' entrou na fila de triagem.');
    }
    dirty.clean();
    window.location.href = 'triagem.html?id=' + salvo.id;
  });
})();
