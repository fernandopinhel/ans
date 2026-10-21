/*
 * Triagem NIP: dados de exemplo, regras de negócio e esquemas das regras de triagem.
 * Tudo é fictício: operadora, beneficiários, CPFs, cartões, protocolos, e-mails e textos.
 * O "banco" vive no sessionStorage; restaurar recria estes dados.
 */
(function () {
  'use strict';

  const G = window.NIP;
  const VERSAO = 1;

  /* ------------------------------------------------------- Listas fixas */

  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  const STATUS = ['Ativo', 'Inativo'];
  const CATEGORIAS = ['Assistencial', 'Não assistencial'];
  // Prazo de resposta da NIP, em dias úteis a partir da notificação da ANS.
  const PRAZO_DIAS = { 'Assistencial': 5, 'Não assistencial': 10 };
  const STATUS_NIP = ['Com problema', 'Aguardando triagem', 'Em análise', 'Respondida', 'Cancelada'];
  const ABERTAS = ['Com problema', 'Aguardando triagem', 'Em análise'];
  const TIPOS_AREA = ['Assistencial', 'Não assistencial', 'Assistencial e não assistencial'];
  const RESULTADOS = ['Problema resolvido com o beneficiário', 'Negativa mantida, com justificativa', 'Orientação dada ao beneficiário'];
  const VARIAVEIS = [
    { chave: 'protocolo', descricao: 'Protocolo da ANS' },
    { chave: 'beneficiario', descricao: 'Nome do beneficiário' },
    { chave: 'tema', descricao: 'Tema de nível 3' },
    { chave: 'prazo', descricao: 'Data limite da resposta' },
    { chave: 'area', descricao: 'Nome da área' },
    { chave: 'analista', descricao: 'Quem acompanha a NIP' }
  ];

  const OPERADORA = {
    razaoSocial: 'Acolhe Saúde Operadora de Planos S.A.',
    nomeFantasia: 'Acolhe Saúde',
    regAns: '419372',
    cnpj: ''
  };

  /* --------------------------------------------- Gerador determinístico */

  let semente = 20200717;
  function rnd() {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    return semente / 2147483648;
  }
  const inteiro = (a, b) => Math.floor(a + rnd() * (b - a + 1));
  const sorteia = (lista) => lista[Math.floor(rnd() * lista.length)];
  const digitosAleatorios = (n) => Array.from({ length: n }, () => inteiro(0, 9)).join('');

  function cnpj(base8, filial) {
    const b = String(base8).padStart(8, '0') + String(filial || 1).padStart(4, '0');
    const dv = (s) => {
      let soma = 0;
      let peso = s.length - 7;
      for (let i = 0; i < s.length; i++) {
        soma += Number(s[i]) * peso--;
        if (peso < 2) peso = 9;
      }
      const r = soma % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = dv(b);
    const d2 = dv(b + d1);
    return G.masks.cnpj(b + d1 + d2);
  }

  function cpf(base9) {
    const b = String(base9).padStart(9, '0').slice(0, 9);
    const dv = (s) => {
      let soma = 0;
      for (let i = 0; i < s.length; i++) soma += Number(s[i]) * (s.length + 1 - i);
      const r = (soma * 10) % 11;
      return r === 10 ? 0 : r;
    };
    const d1 = dv(b);
    const d2 = dv(b + d1);
    return G.masks.cpf(b + d1 + d2);
  }

  OPERADORA.cnpj = cnpj(41937201);

  const cod = (n) => String(n).padStart(3, '0');

  // Volta k dias úteis a partir de hoje.
  function diaUtilAtras(k) {
    let d = G.hoje();
    while (G.fimDeSemana(d)) d = G.somaDias(d, -1);
    let falta = k;
    while (falta > 0) {
      d = G.somaDias(d, -1);
      if (!G.fimDeSemana(d)) falta -= 1;
    }
    return d;
  }

  /* --------------------------------------------- Pessoas e textos de exemplo */

  const NOMES = [
    ['Aline Correia Prado', 'F'], ['Benedito Ramos Teles', 'M'], ['Carla Menezes Doria', 'F'], ['Davi Antunes Leal', 'M'],
    ['Elisa Fonseca Rangel', 'F'], ['Fábio Quintela Moraes', 'M'], ['Glória Pires Albuquerque', 'F'], ['Heitor Sampaio Brito', 'M'],
    ['Iara Nogueira Bastos', 'F'], ['Joaquim Seixas Duarte', 'M'], ['Kátia Lemos Aragão', 'F'], ['Luís Otávio Prates', 'M'],
    ['Mirela Castanho Viana', 'F'], ['Nelson Arruda Paiva', 'M'], ['Olívia Batista Freire', 'F'], ['Paulo Henrique Sá', 'M'],
    ['Quitéria Alves Moura', 'F'], ['Rafael Dantas Coutinho', 'M'], ['Sônia Barreto Lima', 'F'], ['Tiago Mendonça Rios', 'M'],
    ['Úrsula Campos Neri', 'F'], ['Valter Siqueira Gama', 'M'], ['Wanda Torres Bueno', 'F'], ['Yuri Fagundes Lobo', 'M'],
    ['Zuleica Matos Peixoto', 'F'], ['Augusto Leme Cardoso', 'M'], ['Bianca Rocha Valente', 'F'], ['César Amaral Rezende', 'M'],
    ['Denise Falcão Ribeiro', 'F'], ['Emanuel Prado Couto', 'M'], ['Flávia Monteiro Sales', 'F'], ['Gustavo Lacerda Pinto', 'M'],
    ['Helena Vasques Toledo', 'F'], ['Igor Baptista Melo', 'M'], ['Janaína Rosa Figueira', 'F'], ['Kléber Aguiar Simões', 'M'],
    ['Lúcia Teixeira Abreu', 'F'], ['Márcio Bento Galvão', 'M'], ['Natália Cunha Esteves', 'F'], ['Osmar Viegas Paixão', 'M']
  ];

  const CIDADES = [
    ['São Paulo', 'SP', 'Vila Mariana', '04117'], ['Campinas', 'SP', 'Cambuí', '13025'], ['Rio de Janeiro', 'RJ', 'Tijuca', '20511'],
    ['Niterói', 'RJ', 'Icaraí', '24220'], ['Belo Horizonte', 'MG', 'Savassi', '30140'], ['Curitiba', 'PR', 'Batel', '80420'],
    ['Porto Alegre', 'RS', 'Menino Deus', '90150'], ['Salvador', 'BA', 'Pituba', '41830'], ['Recife', 'PE', 'Boa Viagem', '51020'],
    ['Fortaleza', 'CE', 'Aldeota', '60150'], ['Brasília', 'DF', 'Asa Norte', '70750'], ['Goiânia', 'GO', 'Setor Bueno', '74230']
  ];
  const RUAS = ['Rua das Acácias', 'Avenida dos Ipês', 'Rua Jacarandá', 'Rua do Bosque', 'Alameda das Palmeiras', 'Rua Sabiá', 'Rua Pau-Brasil', 'Avenida Aurora', 'Rua da Paineira', 'Travessa do Cedro'];
  const PRESTADORES = ['Hospital Vale Claro', 'Hospital Ponte Alta', 'Hospital Bom Repouso', 'Laboratório Lume', 'Hospital Serra Verde', 'Instituto Nova Aurora'];
  const MEDICOS = ['Dra. Lívia Aranha', 'Dr. Tomás Vilela', 'Dra. Clara Mourão', 'Dr. Renato Queiroga', 'Dra. Bárbara Linhares'];

  // Cada relato aponta para um tema de nível 3 e usa palavras que as regras reconhecem.
  const RELATOS = [
    ['Gerenciamento das ações de saúde por parte da operadora', 'O beneficiário questiona a negativa dos procedimentos de tratamento cirúrgico de pseudoartrose e autoenxerto ósseo, pedidos por {medico}. A operadora negou dizendo que os códigos não foram justificados, mas ele afirma que o médico mandou o relatório com a justificativa. A cirurgia seria no {prestador}. Pede análise da agência.'],
    ['Rol de procedimentos e coberturas', 'A beneficiária conta que a operadora negou a autorização da artroplastia de joelho pedida por {medico}, alegando que o procedimento não está no rol. Diz que a guia foi enviada com o laudo e os exames. Pede que a ANS reveja a negativa.'],
    ['Carência', 'A consumidora informa que teve o parto negado por carência no {prestador}. Diz que veio de outro plano por portabilidade e que já tinha cumprido todos os prazos de carência por lá.'],
    ['Consulta ou exame fora do prazo', 'O beneficiário tenta marcar consulta com cardiologista há 25 dias. A central de agendamento só oferece agenda para daqui a dois meses e nenhum credenciado próximo tem horário.'],
    ['Cirurgia eletiva fora do prazo', 'O paciente aguarda a autorização da cirurgia eletiva de vesícula há mais de 21 dias úteis, sem nenhuma resposta da operadora. A guia foi entregue pelo {prestador}.'],
    ['Descredenciamento de prestador', 'A beneficiária reclama que o {prestador} foi descredenciado sem aviso. Ela faz exames mensais lá e não encontrou outro credenciado no bairro que atenda pelo plano.'],
    ['Rede indisponível na região', 'O consumidor diz que não encontra pediatra credenciado na cidade onde mora e precisa viajar mais de 80 km para cada consulta do filho. Pede que a operadora indique a rede disponível.'],
    ['Valor de reembolso abaixo do contratado', 'O beneficiário pediu reembolso de sessões com psicóloga de livre escolha, apresentou a nota fiscal e recebeu menos da metade do valor previsto na tabela do contrato.'],
    ['Demora no pagamento do reembolso', 'A beneficiária enviou os recibos de fisioterapia há 45 dias e o reembolso ainda não caiu na conta. Já ligou duas vezes e recebeu a resposta de que o pedido está em análise.'],
    ['Reajuste anual', 'O consumidor contesta o reajuste anual de 24% aplicado na mensalidade do plano coletivo por adesão. Pede a memória de cálculo e diz que não recebeu nenhuma comunicação antes do boleto.'],
    ['Reajuste por faixa etária', 'O beneficiário completou 59 anos e teve a mensalidade aumentada em 38%. Questiona se o reajuste por faixa etária respeita o que está no contrato.'],
    ['Cobrança indevida', 'A beneficiária diz que recebeu boleto em duplicidade no mês passado, pagou os dois por engano e a cobrança indevida ainda não foi estornada.'],
    ['Cancelamento a pedido do beneficiário', 'O consumidor pediu o cancelamento do plano pelo telefone há 40 dias, recebeu um número de protocolo e continua recebendo boletos da mensalidade.'],
    ['Rescisão unilateral', 'O beneficiário está em tratamento oncológico no {prestador} e recebeu carta de rescisão do contrato coletivo empresarial. Pede que o tratamento não seja interrompido.'],
    ['Portabilidade negada', 'A consumidora fez o pedido de portabilidade de carências para um plano da operadora e teve o pedido negado sem explicação. Diz que cumpre todos os requisitos.'],
    ['Falta de resposta da operadora', 'O beneficiário afirma que abriu três protocolos no SAC sobre a autorização de um exame de ressonância e nunca teve resposta. Pede apoio da agência.'],
    ['Atendimento domiciliar', 'A filha de um beneficiário de 82 anos relata que {medico} prescreveu internação domiciliar (home care) depois da alta do {prestador}. A operadora ainda não deu retorno e o pai está sem os cuidados.'],
    ['Doenças ou lesões preexistentes', 'A beneficiária teve a cirurgia bariátrica negada por doença ou lesão preexistente. Diz que a condição não foi apontada na entrevista qualificada quando contratou o plano.']
  ];

  const RESPOSTAS = {
    'Problema resolvido com o beneficiário': 'Entramos em contato com o beneficiário, revisamos o caso com a área responsável e resolvemos a pendência. O beneficiário confirmou que o problema foi resolvido.',
    'Negativa mantida, com justificativa': 'Revisamos o pedido com a auditoria médica. A negativa foi mantida porque o procedimento não atende às diretrizes de utilização. Explicamos o motivo ao beneficiário por escrito e por telefone.',
    'Orientação dada ao beneficiário': 'Ligamos para o beneficiário, explicamos as regras do contrato e indicamos os canais e a rede disponível para o atendimento. Ele ficou de procurar a operadora se precisar de mais ajuda.'
  };

  /* ------------------------------------------------------ Dados de exemplo */

  function seed() {
    semente = 20200717;
    const hoje = G.hoje();
    const quando = (dia, hora) => dia + 'T' + (hora || '10:30') + ':00';
    const db = { versao: VERSAO, importacoes: 0 };
    const meta = (id, dias, quem) => ({
      id,
      codigo: cod(id),
      criadoEm: quando(G.somaDias(hoje, dias)),
      criadoPor: quem || 'Marina Duarte',
      alteradoEm: quando(G.somaDias(hoje, Math.min(0, dias + 60))),
      alteradoPor: quem || 'Marina Duarte',
      historico: [{ quando: quando(G.somaDias(hoje, dias)), quem: quem || 'Marina Duarte', acao: 'Cadastro criado' }]
    });

    db.usuarios = [
      ['A230417', 'Marina Duarte', 'Supervisão da triagem'],
      ['A198522', 'Caio Brandão', 'Análise de NIPs'],
      ['A204761', 'Helena Siqueira', 'Análise de NIPs'],
      ['A211390', 'Otávio Lins', 'Análise de NIPs'],
      ['A187245', 'Patrícia Moura', 'Análise de NIPs'],
      ['A176031', 'Rogério Nantes', 'Análise de NIPs', 'Inativo']
    ].map((u, i) => Object.assign(meta(i + 1, -900), { matricula: u[0], nome: u[1], perfil: u[2], status: u[3] || 'Ativo' }));
    const analistas = [2, 3, 4, 5];

    /* ---------- Áreas do CRM */
    db.areas = [
      ['Autorizações médicas', 'CRM-1040', 'Assistencial'],
      ['Rede credenciada', 'CRM-1052', 'Assistencial'],
      ['Reembolso', 'CRM-1063', 'Assistencial e não assistencial'],
      ['Cadastro e movimentação', 'CRM-2010', 'Não assistencial'],
      ['Financeiro e cobrança', 'CRM-2031', 'Não assistencial'],
      ['Atendimento domiciliar', '', 'Assistencial'],
      ['Ouvidoria', 'CRM-3001', 'Assistencial e não assistencial'],
      ['Saúde mental', 'CRM-1088', 'Assistencial', 'Inativo']
    ].map((a, i) => Object.assign(meta(i + 1, -880 + i), { nome: a[0], codigoCrm: a[1], tipo: a[2], status: a[3] || 'Ativo' }));
    const area = (nome) => db.areas.find((a) => a.nome === nome).id;

    /* ---------- Temas em 3 níveis */
    db.temas = [];
    const tema = (nome, paiId, status) => {
      const id = db.temas.length + 1;
      const pai = paiId ? db.temas.find((t) => t.id === paiId) : null;
      db.temas.push(Object.assign(meta(id, -870 + id), { nome, paiId: paiId || 0, nivel: pai ? pai.nivel + 1 : 1, status: status || 'Ativo' }));
      return id;
    };
    const ESTRUTURA = [
      ['Produto ou plano', [
        ['Cobertura', ['Gerenciamento das ações de saúde por parte da operadora', 'Rol de procedimentos e coberturas', 'Carência', 'Doenças ou lesões preexistentes']],
        ['Prazos máximos de atendimento', ['Consulta ou exame fora do prazo', 'Cirurgia eletiva fora do prazo']],
        ['Rede de atendimento', ['Descredenciamento de prestador', 'Rede indisponível na região']]
      ]],
      ['Financeiro', [
        ['Reembolso', ['Valor de reembolso abaixo do contratado', 'Demora no pagamento do reembolso']],
        ['Mensalidade e reajuste', ['Reajuste anual', 'Reajuste por faixa etária', 'Cobrança indevida']]
      ]],
      ['Contrato', [
        ['Contratação e cancelamento', ['Cancelamento a pedido do beneficiário', 'Rescisão unilateral']],
        ['Portabilidade de carências', ['Portabilidade negada']]
      ]],
      ['Atendimento', [
        ['Atendimento ao beneficiário', ['Falta de resposta da operadora', 'Atendimento domiciliar']],
        ['Canais antigos', ['Atendimento por fax'], 'Inativo']
      ]]
    ];
    ESTRUTURA.forEach((n1) => {
      const id1 = tema(n1[0]);
      n1[1].forEach((n2) => {
        const id2 = tema(n2[0], id1, n2[2]);
        n2[1].forEach((n3) => tema(n3, id2, n2[2]));
      });
    });
    const temaId = (nome) => db.temas.find((t) => t.nome === nome).id;

    // Assistencial: o que mexe com o atendimento à saúde. O resto é não assistencial.
    const CATEGORIA_N1 = { 'Produto ou plano': 'Assistencial', 'Atendimento': 'Assistencial', 'Financeiro': 'Não assistencial', 'Contrato': 'Não assistencial' };
    const categoriaDoTema = (id) => {
      let t = db.temas.find((x) => x.id === id);
      while (t && t.paiId) t = db.temas.find((x) => x.id === t.paiId);
      return CATEGORIA_N1[t.nome];
    };

    /* ---------- Áreas e temas */
    db.areasTemas = [
      ['Autorizações médicas', 'Cobertura'], ['Autorizações médicas', 'Prazos máximos de atendimento'],
      ['Rede credenciada', 'Rede de atendimento'], ['Reembolso', 'Reembolso'],
      ['Financeiro e cobrança', 'Mensalidade e reajuste'], ['Cadastro e movimentação', 'Contratação e cancelamento'],
      ['Cadastro e movimentação', 'Portabilidade de carências'], ['Ouvidoria', 'Atendimento ao beneficiário'],
      ['Atendimento domiciliar', 'Atendimento domiciliar'], ['Rede credenciada', 'Consulta ou exame fora do prazo', 'Inativo']
    ].map((r, i) => Object.assign(meta(i + 1, -800 + i), { areaId: area(r[0]), temaId: temaId(r[1]), status: r[2] || 'Ativo' }));

    /* ---------- Palavras-chave (contexto) */
    db.contextos = [
      ['Reembolso', ['reembolso', 'nota fiscal', 'recibo', 'livre escolha']],
      ['Autorizações médicas', ['autorização', 'negativa', 'negou', 'guia', 'junta médica']],
      ['Rede credenciada', ['descredenciado', 'credenciado', 'agendamento', 'agenda']],
      ['Financeiro e cobrança', ['reajuste', 'boleto', 'mensalidade', 'cobrança indevida']],
      ['Cadastro e movimentação', ['cancelamento', 'portabilidade', 'rescisão', 'carteirinha']],
      ['Atendimento domiciliar', ['home care', 'internação domiciliar']],
      ['Ouvidoria', ['sem resposta', 'protocolos no sac']],
      ['Saúde mental', ['psiquiatra', 'caps'], 'Inativo']
    ].map((c, i) => Object.assign(meta(i + 1, -780 + i), { areaId: area(c[0]), palavras: c[1], status: c[2] || 'Ativo' }));

    /* ---------- E-mails das áreas */
    db.emails = [
      ['Autorizações médicas', ['autorizacoes@acolhesaude.exemplo', 'regulacao.medica@acolhesaude.exemplo']],
      ['Rede credenciada', ['rede@acolhesaude.exemplo']],
      ['Reembolso', ['reembolso@acolhesaude.exemplo', 'fabio.reis@acolhesaude.exemplo']],
      ['Cadastro e movimentação', ['cadastro@acolhesaude.exemplo']],
      ['Financeiro e cobrança', ['cobranca@acolhesaude.exemplo', 'reajustes@acolhesaude.exemplo']],
      ['Ouvidoria', ['ouvidoria@acolhesaude.exemplo']]
    ].map((e, i) => Object.assign(meta(i + 1, -760 + i), { areaId: area(e[0]), enderecos: e[1], status: 'Ativo' }));

    /* ---------- Modelos de e-mail */
    db.modelosEmail = [
      ['Aviso padrão de NIP', 0, 'NIP {protocolo}: responder até {prazo}',
        'Olá, time de {area}!\n\nChegou uma NIP da ANS para vocês.\n\nBeneficiário: {beneficiario}\nTema: {tema}\n\nO prazo para responder à ANS termina em {prazo}. Mandem o retorno para {analista} até um dia útil antes, por favor, para dar tempo de revisar.\n\nObrigado!'],
      ['Negativa de cobertura', area('Autorizações médicas'), 'NIP {protocolo}: revisar negativa até {prazo}',
        'Olá, time de {area}!\n\nA ANS abriu uma NIP sobre uma negativa de cobertura de {beneficiario} ({tema}).\n\nPrecisamos do parecer da auditoria médica e do motivo da negativa por escrito. O prazo da resposta é {prazo}.\n\nQualquer dúvida, falem com {analista}.'],
      ['Reembolso com documentos', area('Reembolso'), 'NIP {protocolo}: reembolso de {beneficiario}',
        'Olá, time de {area}!\n\nRecebemos uma NIP sobre reembolso ({tema}).\n\nConfiram os documentos enviados por {beneficiario}, o valor calculado e a data prevista de pagamento. A resposta à ANS vence em {prazo}.\n\n{analista} acompanha o caso.'],
      ['Reajuste e mensalidade', area('Financeiro e cobrança'), 'NIP {protocolo}: dúvida sobre mensalidade',
        'Olá, time de {area}!\n\nA ANS mandou uma NIP de {beneficiario} sobre {tema}.\n\nPrecisamos da memória de cálculo e da comunicação enviada ao beneficiário. O prazo é {prazo}.\n\nObrigado! {analista}'],
      ['Aviso antigo, sem prazo', 0, 'Nova NIP recebida', 'Prezados, segue NIP para tratamento.', 'Inativo']
    ].map((m, i) => Object.assign(meta(i + 1, -740 + i), { nome: m[0], areaId: m[1], titulo: m[2], texto: m[3], status: m[4] || 'Ativo' }));

    /* ---------- NIPs */
    db.nips = [];
    db.lotes = [];
    // [dias úteis atrás, situação, índice do relato, analista, com problema?, resultado, fora do prazo?]
    const PLANO = [
      [0, 'Aguardando triagem', 0], [0, 'Aguardando triagem', 7], [0, 'Com problema', 12, 0, 'cpf'], [1, 'Aguardando triagem', 16],
      [1, 'Aguardando triagem', 9], [1, 'Com problema', 5, 0, 'cartao'], [2, 'Aguardando triagem', 2], [2, 'Aguardando triagem', 15],
      [3, 'Em análise', 1, 2], [3, 'Em análise', 10, 3], [4, 'Em análise', 3, 1], [4, 'Em análise', 8, 4],
      [5, 'Em análise', 4, 2], [5, 'Em análise', 6, 5], [6, 'Em análise', 13, 3], [6, 'Em análise', 16, 1],
      [7, 'Em análise', 17, 4], [8, 'Em análise', 11, 5], [9, 'Em análise', 14, 2],
      [1, 'Respondida', 12, 3, 0, 0], [2, 'Respondida', 4, 1, 0, 2], [3, 'Respondida', 7, 2, 0, 0],
      [5, 'Respondida', 9, 4, 0, 1], [7, 'Respondida', 0, 5, 0, 1], [9, 'Respondida', 2, 1, 0, 0, true],
      [11, 'Respondida', 5, 3, 0, 2], [12, 'Respondida', 16, 2, 0, 0], [14, 'Respondida', 10, 4, 0, 2],
      [16, 'Respondida', 1, 5, 0, 1, true], [18, 'Respondida', 8, 1, 0, 0], [20, 'Respondida', 13, 3, 0, 0],
      [23, 'Respondida', 3, 2, 0, 1], [26, 'Respondida', 6, 4, 0, 0], [30, 'Respondida', 11, 5, 0, 2],
      [10, 'Cancelada', 14, 2], [15, 'Cancelada', 9, 4]
    ];

    PLANO.forEach((p, i) => {
      const dataNotificacao = diaUtilAtras(p[0]);
      const relato = RELATOS[p[2]];
      const tId = temaId(relato[0]);
      const categoria = categoriaDoTema(tId);
      const n = novaNip(db, i, dataNotificacao, relato, categoria);
      const quem = (id) => db.usuarios.find((u) => u.id === id).nome;
      const historico = [{ quando: n.importadaEm, quem: 'Importação automática', acao: 'NIP importada do portal da ANS' }];
      n.status = p[1];

      if (p[4] === 'cpf') n.beneficiario.cpf = '';
      if (p[4] === 'cartao') n.beneficiario.cartao = '';
      if (p[4]) historico.push({ quando: n.importadaEm, quem: 'Importação automática', acao: 'Importada com dados faltando' });

      if (p[1] === 'Em análise' || p[1] === 'Respondida' || p[1] === 'Cancelada') {
        const analistaId = analistas[(p[3] || 1) - 1] || 2;
        n.analistaId = analistaId;
        if (p[1] !== 'Cancelada') {
          n.temaId = tId;
          n.areaId = areaParaTema(db, tId);
          // As mais recentes em análise foram triadas hoje e ainda esperam o envio ao CRM.
          const triadaEm = quando(p[1] === 'Em análise' && p[0] <= 4 ? hoje : diaUtilAtras(Math.max(0, p[0] - 1)), '09:40');
          n.triadaEm = triadaEm;
          historico.push({ quando: triadaEm, quem: quem(analistaId), acao: 'Classificada em "' + relato[0] + '"' });
          const emails = db.emails.find((e) => e.areaId === n.areaId);
          n.encaminhamentos.push({ em: triadaEm, areaId: n.areaId, para: emails ? emails.enderecos.slice() : [], modeloId: n.areaId === area('Autorizações médicas') ? 2 : 1, por: quem(analistaId) });
          historico.push({ quando: triadaEm, quem: quem(analistaId), acao: 'Encaminhada para ' + db.areas.find((a) => a.id === n.areaId).nome });
        }
      }

      if (p[1] === 'Respondida') {
        const limite = G.somaDiasUteis(dataNotificacao, PRAZO_DIAS[categoria]);
        let resp = p[6] ? G.somaDiasUteis(limite, 2) : G.somaDiasUteis(dataNotificacao, Math.max(1, PRAZO_DIAS[categoria] - 2));
        if (resp > hoje) resp = hoje;
        const resultado = RESULTADOS[p[5] || 0];
        const contatoEm = G.somaDias(resp, -1) < dataNotificacao ? dataNotificacao : G.somaDias(resp, -1);
        n.resposta = { resultado, texto: RESPOSTAS[resultado], contatoEm, em: quando(resp, '16:20'), por: quem(n.analistaId) };
        historico.push({ quando: n.resposta.em, quem: n.resposta.por, acao: 'Resposta registrada: ' + resultado.toLowerCase() });
      }

      if (p[1] === 'Cancelada') {
        n.cancelamento = { motivo: i % 2 ? 'NIP duplicada: o mesmo protocolo já está em tratamento.' : 'A ANS arquivou a demanda a pedido do beneficiário.', em: quando(diaUtilAtras(p[0] - 1), '11:05'), por: quem(n.analistaId) };
        historico.push({ quando: n.cancelamento.em, quem: n.cancelamento.por, acao: 'NIP cancelada' });
      }
      n.historico = historico;
      db.nips.push(n);
    });

    /*
     * Envios ao CRM: depois da triagem, a NIP sobe para a fila da área no CRM.
     * O envio automático roda todo dia útil às 6h com o que foi triado antes.
     * As triadas ontem à tarde foram enviadas à mão pela supervisão.
     */
    const ontem = diaUtilAtras(1);
    const triadas = db.nips.filter((n) => n.triadaEm).sort((a, b) => (a.triadaEm < b.triadaEm ? -1 : 1));
    const manual = triadas.filter((n) => n.triadaEm.slice(0, 10) === ontem).slice(0, 2);
    const porDia = {};
    triadas.forEach((n) => {
      if (manual.indexOf(n) >= 0) return;
      const dia = G.somaDiasUteis(n.triadaEm.slice(0, 10), 1);
      if (dia > hoje) return; // triada hoje: espera o próximo envio automático
      (porDia[dia] = porDia[dia] || []).push(n);
    });
    Object.keys(porDia).sort().forEach((dia) => {
      if (dia === hoje) return;
      registraLote(db, porDia[dia], 'Automática', quando(dia, '06:00'), 'Envio automático');
    });
    if (manual.length) registraLote(db, manual, 'Manual', quando(ontem, '15:12'), 'Marina Duarte');
    if (porDia[hoje]) registraLote(db, porDia[hoje], 'Automática', quando(hoje, '06:00'), 'Envio automático');
    db.nips.forEach((n) => n.historico.sort((a, b) => (a.quando < b.quando ? -1 : 1)));
    return db;
  }

  // Área sugerida pelo tema: a associação mais específica (nível mais fundo) vence.
  function areaParaTema(base, temaId) {
    let t = base.temas.find((x) => x.id === temaId);
    while (t) {
      const assoc = base.areasTemas.find((a) => a.temaId === t.id && a.status === 'Ativo');
      if (assoc) return assoc.areaId;
      t = t.paiId ? base.temas.find((x) => x.id === t.paiId) : null;
    }
    return 0;
  }

  function novaNip(base, i, dataNotificacao, relato, categoria) {
    const pessoa = NOMES[i % NOMES.length];
    const cidade = CIDADES[i % CIDADES.length];
    const nasc = G.somaDias(G.hoje(), -inteiro(19 * 365, 84 * 365));
    const primeiro = G.normaliza(pessoa[0].split(' ')[0]);
    const texto = relato[1].replace('{medico}', sorteia(MEDICOS)).replace('{prestador}', sorteia(PRESTADORES));
    const temInterlocutor = i % 4 === 1;
    return {
      id: base.nips.length + 1,
      protocolo: '419372' + dataNotificacao.replace(/-/g, '') + digitosAleatorios(6),
      demanda: String(inteiro(1200000, 4899999)),
      dataNotificacao,
      importadaEm: dataNotificacao + 'T06:' + String(inteiro(10, 40)) + ':00',
      origem: 'Importação',
      categoria,
      beneficiario: {
        nome: pessoa[0],
        sexo: pessoa[1],
        cpf: cpf(inteiro(100000000, 899999999)),
        cartao: G.masks.cartao('8419' + digitosAleatorios(12)),
        nascimento: nasc,
        telefone: G.masks.phone(['11', '19', '21', '31', '41', '51', '71', '81', '85', '61', '62'][i % 11] + '9' + digitosAleatorios(8)),
        email: primeiro + '.' + G.normaliza(pessoa[0].split(' ').pop()) + '@email.exemplo',
        endereco: {
          cep: cidade[3] + '-' + digitosAleatorios(3),
          logradouro: sorteia(RUAS),
          numero: String(inteiro(10, 1890)),
          bairro: cidade[2],
          cidade: cidade[0],
          uf: cidade[1]
        }
      },
      interlocutor: temInterlocutor ? { nome: sorteia(NOMES)[0], telefone: G.masks.phone('11' + '9' + digitosAleatorios(8)) } : { nome: '', telefone: '' },
      descricao: texto,
      perguntas: {
        dataSolicitacao: G.somaDias(dataNotificacao, -inteiro(6, 40)),
        impedimento: i % 3 ? 'Sim' : 'Não',
        previsaoContrato: i % 5 ? 'Sim' : 'Não',
        ufAtendimento: cidade[1],
        municipioAtendimento: cidade[0],
        pediuNegativa: i % 2 ? 'Sim' : 'Não',
        negativa48h: i % 2 ? (i % 4 === 1 ? 'Sim' : 'Não') : '',
        protocoloOperadora: '7' + digitosAleatorios(11)
      },
      temaId: 0,
      areaId: 0,
      analistaId: 0,
      status: 'Aguardando triagem',
      encaminhamentos: [],
      resposta: null,
      cancelamento: null,
      crm: { status: 'Não enviada', loteId: 0, erro: '' },
      historico: []
    };
  }

  // Grava um lote de envio ao CRM. A NIP só sobe se a área tiver código no CRM e estiver ativa.
  function registraLote(base, nips, origem, em, por) {
    const id = base.lotes.length + 1;
    const itens = nips.map((n) => {
      const a = base.areas.find((x) => x.id === n.areaId);
      let erro = '';
      if (!a) erro = 'A NIP ainda não tem área.';
      else if (a.status !== 'Ativo') erro = 'A área ' + a.nome + ' está inativa.';
      else if (!a.codigoCrm) erro = 'A área ' + a.nome + ' não tem código no CRM.';
      n.crm = { status: erro ? 'Falha no envio' : 'Enviada', loteId: id, erro, em };
      n.historico.push({ quando: em, quem: por, acao: erro ? 'Falha no envio ao CRM: ' + erro : 'Enviada ao CRM no lote ' + String(id).padStart(4, '0') });
      return { nipId: n.id, areaId: n.areaId, ok: !erro, erro };
    });
    const lote = { id, numero: String(id).padStart(4, '0'), origem, em, por, itens };
    base.lotes.push(lote);
    return lote;
  }

  /* ------------------------------------------------------------- Banco */

  let cache = null;
  function carregar() {
    if (cache) return cache;
    const salvo = G.store.get('db', null);
    cache = salvo && salvo.versao === VERSAO ? salvo : seed();
    if (!salvo || salvo.versao !== VERSAO) G.store.set('db', cache);
    return cache;
  }
  function persistir() { G.store.set('db', cache); }

  function agora() { return new Date().toISOString(); }
  function quemSou() { const u = G.usuario(); return u ? u.nome : 'Sistema'; }

  const db = {
    all(col) { return carregar()[col] || []; },
    get(col, id) { return db.all(col).find((r) => r.id === Number(id)) || null; },
    raw: () => carregar(),
    // Grava o registro e anota quem/quando no histórico.
    save(col, rec, acao) {
      const lista = carregar()[col];
      const quem = quemSou();
      const quando = agora();
      if (!rec.id) {
        rec.id = lista.reduce((m, r) => Math.max(m, r.id), 0) + 1;
        rec.codigo = cod(rec.id);
        rec.criadoEm = quando;
        rec.criadoPor = quem;
        rec.historico = [];
        lista.push(rec);
      } else {
        const i = lista.findIndex((r) => r.id === rec.id);
        if (i >= 0) lista[i] = rec; else lista.push(rec);
      }
      rec.alteradoEm = quando;
      rec.alteradoPor = quem;
      if (!rec.historico) rec.historico = [];
      if (acao) rec.historico.push({ quando, quem, acao });
      persistir();
      return rec;
    },
    remove(col, id) {
      const c = carregar();
      c[col] = c[col].filter((r) => r.id !== Number(id));
      persistir();
    },
    commit: persistir,
    reset() {
      cache = seed();
      persistir();
    }
  };

  /* ------------------------------------------------- Consultas e regras */

  const nome = {
    usuario: (id) => { const r = db.get('usuarios', id); return r ? r.nome : ''; },
    area: (id) => { const r = db.get('areas', id); return r ? r.nome : ''; },
    tema: (id) => { const r = db.get('temas', id); return r ? r.nome : ''; }
  };

  // Caminho do tema: ["Produto ou plano", "Cobertura", "Carência"].
  function caminhoTema(id) {
    const out = [];
    let t = db.get('temas', id);
    while (t) {
      out.unshift(t.nome);
      t = t.paiId ? db.get('temas', t.paiId) : null;
    }
    return out;
  }
  const temasFilhos = (paiId) => db.all('temas').filter((t) => t.paiId === Number(paiId || 0));
  const aberta = (n) => ABERTAS.indexOf(n.status) >= 0;

  // Prazo da resposta à ANS em dias úteis.
  function prazo(n) {
    const limite = G.somaDiasUteis(n.dataNotificacao, PRAZO_DIAS[n.categoria] || 5);
    if (n.status === 'Respondida' && n.resposta) {
      const no = n.resposta.em.slice(0, 10) <= limite;
      return { limite, dias: 0, status: no ? 'No prazo' : 'Em atraso', texto: no ? 'Respondida no prazo' : 'Respondida fora do prazo', tom: no ? 'success' : 'accent' };
    }
    if (n.status === 'Cancelada') return { limite, dias: 0, status: '', texto: 'Cancelada', tom: '' };
    const dias = G.diasUteisAte(limite);
    if (dias < 0) return { limite, dias, status: 'Em atraso', texto: 'Atrasada ' + G.fmt.plural(-dias, 'dia útil', 'dias úteis'), tom: 'danger' };
    if (dias === 0) return { limite, dias, status: 'Vence hoje', texto: 'Vence hoje', tom: 'warning' };
    return { limite, dias, status: 'No prazo', texto: (dias === 1 ? 'Falta 1 dia útil' : 'Faltam ' + dias + ' dias úteis'), tom: dias <= 2 ? 'warning' : 'success' };
  }

  // O que falta para a NIP sair de "Com problema".
  function problemas(n) {
    const b = n.beneficiario;
    const out = [];
    if (!b.cpf) out.push({ campo: 'cpf', msg: 'O CPF do beneficiário veio vazio na importação.' });
    else if (!G.valida.cpf(b.cpf)) out.push({ campo: 'cpf', msg: 'O CPF do beneficiário não é válido.' });
    if (!b.cartao) out.push({ campo: 'cartao', msg: 'O cartão do beneficiário não veio na importação.' });
    if (!b.nascimento) out.push({ campo: 'nascimento', msg: 'Falta a data de nascimento do beneficiário.' });
    if (!n.descricao || n.descricao.length < 30) out.push({ campo: 'descricao', msg: 'A descrição da NIP veio vazia ou cortada.' });
    return out;
  }

  /*
   * Sugestões de área para a NIP, com o motivo de cada uma:
   * palavras-chave encontradas na descrição e a associação com o tema.
   */
  function sugestoes(n, temaEscolhido) {
    const texto = G.normaliza(n.descricao);
    const mapa = {};
    const add = (areaId, motivo, peso) => {
      const a = db.get('areas', areaId);
      if (!a || a.status !== 'Ativo') return;
      if (!mapa[areaId]) mapa[areaId] = { areaId, motivos: [], peso: 0, palavras: [] };
      mapa[areaId].motivos.push(motivo);
      mapa[areaId].peso += peso;
    };
    const tId = temaEscolhido || n.temaId;
    if (tId) {
      const aId = areaParaTema(db.raw(), tId);
      if (aId) add(aId, 'cuida do tema "' + nome.tema(tId) + '"', 3);
    }
    db.all('contextos').filter((c) => c.status === 'Ativo').forEach((c) => {
      const achadas = c.palavras.filter((p) => texto.indexOf(G.normaliza(p)) >= 0);
      if (!achadas.length) return;
      add(c.areaId, 'o texto cita ' + achadas.map((p) => '"' + p + '"').join(', '), achadas.length);
      if (mapa[c.areaId]) mapa[c.areaId].palavras = mapa[c.areaId].palavras.concat(achadas);
    });
    return Object.keys(mapa).map((k) => mapa[k]).sort((a, b) => b.peso - a.peso);
  }

  // Todas as palavras-chave ativas, para destacar na descrição.
  const palavrasAtivas = () => db.all('contextos').filter((c) => c.status === 'Ativo' && db.get('areas', c.areaId) && db.get('areas', c.areaId).status === 'Ativo')
    .reduce((acc, c) => acc.concat(c.palavras), []);

  // Modelos que servem para a área: os dela primeiro, depois os gerais.
  const modelosDaArea = (areaId) => db.all('modelosEmail').filter((m) => m.status === 'Ativo' && (m.areaId === Number(areaId) || m.areaId === 0))
    .sort((a, b) => (b.areaId ? 1 : 0) - (a.areaId ? 1 : 0));

  function preencheModelo(texto, n, areaId) {
    const caminho = n.temaId ? caminhoTema(n.temaId) : [];
    const valores = {
      protocolo: n.protocolo,
      beneficiario: n.beneficiario.nome,
      tema: caminho[caminho.length - 1] || 'sem tema',
      prazo: G.fmt.date(prazo(n).limite),
      area: nome.area(areaId || n.areaId),
      analista: nome.usuario(n.analistaId) || quemSou()
    };
    return String(texto).replace(/\{([a-z]+)\}/g, (m, k) => (valores[k] !== undefined ? valores[k] : m));
  }

  const emailsDaArea = (areaId) => {
    const e = db.all('emails').find((x) => x.areaId === Number(areaId) && x.status === 'Ativo');
    return e ? e.enderecos.slice() : [];
  };

  function registra(n, acao) {
    n.historico.push({ quando: agora(), quem: quemSou(), acao });
    n.alteradoEm = agora();
    db.commit();
  }

  function enviaAoCrm(nips, origem) {
    const lote = registraLote(db.raw(), nips, origem, agora(), quemSou());
    db.commit();
    return lote;
  }

  // Busca novas NIPs no "portal da ANS": três por vez, uma delas com dados faltando.
  function importaNovas() {
    const base = db.raw();
    const ini = base.importacoes || 0;
    const novas = [];
    for (let k = 0; k < 3; k++) {
      const seq = 40 + ini * 3 + k;
      semente = 9000 + seq * 7;
      const relato = RELATOS[(seq * 5) % RELATOS.length];
      const t = base.temas.find((x) => x.nome === relato[0]);
      let raiz = t;
      while (raiz && raiz.paiId) raiz = base.temas.find((x) => x.id === raiz.paiId);
      const categoria = raiz && (raiz.nome === 'Financeiro' || raiz.nome === 'Contrato') ? 'Não assistencial' : 'Assistencial';
      const n = novaNip(base, seq, G.hoje(), relato, categoria);
      n.importadaEm = agora();
      n.historico = [{ quando: n.importadaEm, quem: 'Importação automática', acao: 'NIP importada do portal da ANS' }];
      if (k === 1) {
        n.beneficiario.cpf = '';
        n.status = 'Com problema';
        n.historico.push({ quando: n.importadaEm, quem: 'Importação automática', acao: 'Importada com dados faltando' });
      }
      base.nips.push(n);
      novas.push(n);
    }
    base.importacoes = ini + 1;
    db.commit();
    return novas;
  }

  /* --------------------------------------------------- Esquemas (regras) */

  const C = {
    status: { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS, required: true, padrao: 'Ativo', vazio: false, span: 4 }
  };
  const colStatus = { key: 'status', label: 'Status', sort: true, render: (r) => G.statusBadge(r.status) };
  const opcoesAreas = (comInativas) => db.all('areas').filter((a) => comInativas || a.status === 'Ativo')
    .map((a) => ({ value: String(a.id), label: a.nome + (a.status === 'Ativo' ? '' : ' (inativa)') }));
  const temaTexto = (id) => caminhoTema(id).join(' › ');

  const usoDaArea = (id) => {
    const n = db.all('nips').filter((x) => x.areaId === id).length;
    if (n) return 'Essa área já recebeu ' + G.fmt.plural(n, 'NIP', 'NIPs') + '. Para tirar de uso, mude o status para Inativo.';
    const ligados = [
      ['palavras-chave', db.all('contextos').some((c) => c.areaId === id)],
      ['e-mails', db.all('emails').some((c) => c.areaId === id)],
      ['associações com temas', db.all('areasTemas').some((c) => c.areaId === id)],
      ['modelos de e-mail', db.all('modelosEmail').some((c) => c.areaId === id)]
    ].filter((x) => x[1]).map((x) => x[0]);
    return ligados.length ? 'Essa área ainda tem ' + ligados.join(', ') + '. Exclua esses itens antes ou mude o status para Inativo.' : '';
  };

  const schemas = {
    temas: {
      titulo: 'Temas da ANS',
      singular: 'tema',
      novo: 'Novo tema',
      descricao: 'Os temas da ANS em 3 níveis. Toda NIP é classificada num tema de nível 3.',
      icone: 'layers',
      nomeRegistro: (r) => r.nome,
      secoes: [
        {
          titulo: 'Onde o tema fica',
          dica: 'Deixe em branco para criar um tema de nível 1. Escolha um tema de nível 1 para criar um de nível 2, e um de nível 2 para criar um de nível 3.',
          campos: [{ key: 'paiId', tipo: 'tema', ate: 2, label: 'Fica dentro de', opcional: true }]
        },
        {
          titulo: 'Dados do tema',
          campos: [
            { key: 'nome', label: 'Nome do tema', required: true, max: 120, span: 8 },
            C.status
          ]
        }
      ],
      prepara(dados) {
        const pai = dados.paiId ? db.get('temas', dados.paiId) : null;
        dados.paiId = pai ? pai.id : 0;
        dados.nivel = pai ? pai.nivel + 1 : 1;
      },
      regras(dados, addErro, campo, id) {
        const repetido = db.all('temas').some((t) => t.id !== id && t.paiId === Number(dados.paiId || 0) && G.normaliza(t.nome) === G.normaliza(dados.nome));
        if (repetido) addErro(campo('nome'), 'Já existe um tema com esse nome nesse mesmo lugar.');
        if (id && dados.paiId) {
          // Um tema não pode ficar dentro dele mesmo nem de um filho.
          let t = db.get('temas', dados.paiId);
          while (t) {
            if (t.id === id) { addErro(campo('paiId'), 'Um tema não pode ficar dentro dele mesmo.'); break; }
            t = t.paiId ? db.get('temas', t.paiId) : null;
          }
          const filhos = temasFilhos(id).length;
          const pai = db.get('temas', dados.paiId);
          if (filhos && pai && pai.nivel >= 2) addErro(campo('paiId'), 'Esse tema tem temas dentro dele e passaria do nível 3. Escolha um tema de nível 1.');
        }
      },
      filtros: [
        { key: 'nome', label: 'Nome do tema', tipo: 'text', match: (r, v) => G.normaliza(temaTexto(r.id)).indexOf(G.normaliza(v)) >= 0 },
        { key: 'nivel', label: 'Nível', tipo: 'select', opcoes: [{ value: '1', label: 'Nível 1' }, { value: '2', label: 'Nível 2' }, { value: '3', label: 'Nível 3' }] },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Tema', sort: (r) => temaTexto(r.id), link: true, sub: (r) => caminhoTema(r.id).slice(0, -1).join(' › ') },
        { key: 'nivel', label: 'Nível', sort: true, num: true },
        { key: 'filhos', label: 'Temas dentro', num: true, sort: (r) => temasFilhos(r.id).length, render: (r) => String(temasFilhos(r.id).length), csv: (r) => temasFilhos(r.id).length },
        { key: 'nips', label: 'NIPs', num: true, sort: (r) => db.all('nips').filter((n) => n.temaId === r.id).length, render: (r) => String(db.all('nips').filter((n) => n.temaId === r.id).length), csv: (r) => db.all('nips').filter((n) => n.temaId === r.id).length },
        colStatus
      ],
      emUso: (id) => {
        const f = temasFilhos(id).length;
        if (f) return 'Esse tema tem ' + G.fmt.plural(f, 'tema', 'temas') + ' dentro dele. Exclua ou mova esses temas antes, ou mude o status para Inativo.';
        const n = db.all('nips').filter((x) => x.temaId === id).length;
        if (n) return 'Esse tema já classifica ' + G.fmt.plural(n, 'NIP', 'NIPs') + '. Para tirar de uso, mude o status para Inativo.';
        return db.all('areasTemas').some((a) => a.temaId === id) ? 'Esse tema está associado a uma área. Exclua a associação antes ou mude o status para Inativo.' : '';
      }
    },

    contextos: {
      titulo: 'Palavras-chave',
      singular: 'grupo de palavras-chave',
      novo: 'Novas palavras-chave',
      descricao: 'Termos que, quando aparecem na descrição da NIP, sugerem a área que deve cuidar dela.',
      icone: 'search-text',
      nomeRegistro: (r) => 'Palavras de ' + nome.area(r.areaId),
      unico: [{ key: 'areaId', msg: 'Essa área já tem palavras-chave. Edite o cadastro dela em vez de criar outro.' }],
      secoes: [
        {
          titulo: 'Área e palavras',
          dica: 'Use termos curtos, do jeito que o beneficiário escreve. Acentos e maiúsculas não fazem diferença.',
          campos: [
            { key: 'areaId', label: 'Área de destino da NIP', tipo: 'select', ref: () => opcoesAreas(), required: true, numero: true, span: 8 },
            C.status,
            { key: 'palavras', tipo: 'tags', label: 'Palavra ou expressão', itens: 'palavras', required: true, max: 40, min: 3 }
          ]
        }
      ],
      regras(dados, addErro, campo, id) {
        const outras = db.all('contextos').filter((c) => c.id !== id && c.status === 'Ativo');
        (dados.palavras || []).forEach((p) => {
          const dona = outras.find((c) => c.palavras.some((x) => G.normaliza(x) === G.normaliza(p)));
          if (dona && dados.status === 'Ativo') addErro(campo('palavras'), '"' + p + '" já sugere a área ' + nome.area(dona.areaId) + '. Use outra palavra ou tire de lá primeiro.');
        });
      },
      filtros: [
        { key: 'areaId', label: 'Área', tipo: 'select', ref: () => opcoesAreas(true) },
        { key: 'texto', label: 'Palavra', tipo: 'text', match: (r, v) => r.palavras.some((p) => G.normaliza(p).indexOf(G.normaliza(v)) >= 0) },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'area', label: 'Área', sort: (r) => nome.area(r.areaId), link: true, linkText: (r) => nome.area(r.areaId), csv: (r) => nome.area(r.areaId) },
        { key: 'palavras', label: 'Palavras', render: (r) => G.h('span', { class: 'tags-inline' }, r.palavras.map((p) => G.h('span', { class: 'tag', text: p }))), csv: (r) => r.palavras.join(', ') },
        { key: 'qtd', label: 'Total', num: true, sort: (r) => r.palavras.length, render: (r) => String(r.palavras.length), csv: (r) => r.palavras.length },
        colStatus
      ]
    },

    areasTemas: {
      titulo: 'Áreas e temas',
      singular: 'associação',
      novo: 'Nova associação',
      descricao: 'Qual área cuida de cada tema. Vale para o tema escolhido e para todos os temas dentro dele.',
      icone: 'route',
      nomeRegistro: (r) => nome.area(r.areaId) + ' e ' + nome.tema(r.temaId),
      secoes: [
        {
          titulo: 'Associação',
          dica: 'Se um tema de nível 3 tiver associação própria, ela vale mais que a do nível de cima.',
          campos: [
            { key: 'areaId', label: 'Área', tipo: 'select', ref: () => opcoesAreas(), required: true, numero: true, span: 8 },
            C.status,
            { key: 'temaId', tipo: 'tema', ate: 3, label: 'Tema', required: true }
          ]
        }
      ],
      regras(dados, addErro, campo, id) {
        const dono = db.all('areasTemas').find((a) => a.id !== id && a.temaId === Number(dados.temaId) && a.status === 'Ativo');
        if (dono && dados.status === 'Ativo') addErro(campo('temaId'), 'Esse tema já é cuidado pela área ' + nome.area(dono.areaId) + '. Cada tema fica com uma área só.');
      },
      filtros: [
        { key: 'areaId', label: 'Área', tipo: 'select', ref: () => opcoesAreas(true) },
        { key: 'tema', label: 'Tema', tipo: 'text', match: (r, v) => G.normaliza(temaTexto(r.temaId)).indexOf(G.normaliza(v)) >= 0 },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'area', label: 'Área', sort: (r) => nome.area(r.areaId), link: true, linkText: (r) => nome.area(r.areaId), csv: (r) => nome.area(r.areaId) },
        { key: 'tema', label: 'Tema', sort: (r) => temaTexto(r.temaId), render: (r) => G.h('span', null, nome.tema(r.temaId), G.h('span', { class: 'cell-sub', text: caminhoTema(r.temaId).slice(0, -1).join(' › ') })), csv: (r) => temaTexto(r.temaId) },
        { key: 'nivel', label: 'Nível', num: true, sort: (r) => (db.get('temas', r.temaId) || {}).nivel, render: (r) => String((db.get('temas', r.temaId) || {}).nivel || ''), csv: (r) => (db.get('temas', r.temaId) || {}).nivel },
        colStatus
      ]
    },

    areas: {
      titulo: 'Áreas do CRM',
      singular: 'área',
      novo: 'Nova área',
      descricao: 'As áreas que recebem as NIPs. O código liga a área à fila dela no CRM de relacionamento.',
      icone: 'building',
      nomeRegistro: (r) => r.nome,
      unico: [{ key: 'nome', normaliza: true, msg: 'Já existe uma área com esse nome.' }, { key: 'codigoCrm', normaliza: true, msg: 'Esse código do CRM já é de outra área.' }],
      secoes: [
        {
          titulo: 'Dados da área',
          campos: [
            { key: 'nome', label: 'Nome da área', required: true, max: 80, span: 8 },
            C.status,
            { key: 'codigoCrm', label: 'Código no CRM', opcional: true, max: 8, span: 4, mask: 'upper', rules: 'codigoCrm', dica: 'Como CRM-1040. Sem o código, as NIPs da área não sobem para o CRM.', spellcheck: false },
            { key: 'tipo', label: 'Que tipo de NIP a área recebe', tipo: 'radio', opcoes: TIPOS_AREA, required: true, padrao: 'Assistencial', span: 12 }
          ]
        }
      ],
      filtros: [
        { key: 'nome', label: 'Nome', tipo: 'text' },
        { key: 'tipo', label: 'Tipo', tipo: 'select', opcoes: TIPOS_AREA },
        { key: 'crm', label: 'Código no CRM', tipo: 'select', opcoes: [{ value: 'com', label: 'Com código' }, { value: 'sem', label: 'Sem código' }], match: (r, v) => (v === 'com' ? !!r.codigoCrm : !r.codigoCrm) },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Área', sort: true, link: true, sub: (r) => r.codigoCrm || 'Sem código no CRM' },
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'abertas', label: 'NIPs abertas', num: true, sort: (r) => db.all('nips').filter((n) => n.areaId === r.id && aberta(n)).length, render: (r) => String(db.all('nips').filter((n) => n.areaId === r.id && aberta(n)).length), csv: (r) => db.all('nips').filter((n) => n.areaId === r.id && aberta(n)).length },
        colStatus
      ],
      emUso: usoDaArea
    },

    emails: {
      titulo: 'E-mails das áreas',
      singular: 'lista de e-mails',
      novo: 'Novos e-mails',
      descricao: 'Quem recebe o aviso quando uma NIP é encaminhada para a área.',
      icone: 'mail',
      nomeRegistro: (r) => 'E-mails de ' + nome.area(r.areaId),
      unico: [{ key: 'areaId', msg: 'Essa área já tem uma lista de e-mails. Edite a lista dela em vez de criar outra.' }],
      secoes: [
        {
          titulo: 'Área e destinatários',
          dica: 'Prefira e-mails de grupo, que continuam valendo quando alguém sai do time.',
          campos: [
            { key: 'areaId', label: 'Área', tipo: 'select', ref: () => opcoesAreas(), required: true, numero: true, span: 8 },
            C.status,
            { key: 'enderecos', tipo: 'tags', label: 'E-mail', itens: 'e-mails', required: true, rules: 'email', max: 80, inputType: 'email' }
          ]
        }
      ],
      filtros: [
        { key: 'areaId', label: 'Área', tipo: 'select', ref: () => opcoesAreas(true) },
        { key: 'email', label: 'E-mail', tipo: 'text', match: (r, v) => r.enderecos.some((e) => G.normaliza(e).indexOf(G.normaliza(v)) >= 0) },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'area', label: 'Área', sort: (r) => nome.area(r.areaId), link: true, linkText: (r) => nome.area(r.areaId), csv: (r) => nome.area(r.areaId) },
        { key: 'enderecos', label: 'E-mails', render: (r) => G.h('ul', { class: 'list-plain' }, r.enderecos.map((e) => G.h('li', { text: e }))), csv: (r) => r.enderecos.join(', ') },
        colStatus
      ]
    },

    modelosEmail: {
      titulo: 'Modelos de e-mail',
      singular: 'modelo',
      novo: 'Novo modelo',
      descricao: 'Textos prontos do aviso que a área recebe. As variáveis entre chaves são trocadas pelos dados da NIP.',
      icone: 'file-text',
      nomeRegistro: (r) => r.nome,
      unico: [{ key: 'nome', normaliza: true, msg: 'Já existe um modelo com esse nome.' }],
      secoes: [
        {
          titulo: 'Modelo',
          campos: [
            { key: 'nome', label: 'Nome do modelo', required: true, max: 80, span: 8, dica: 'Só para você achar o modelo. A área não vê esse nome.' },
            C.status,
            { key: 'areaId', label: 'Área', tipo: 'select', ref: () => [{ value: '0', label: 'Todas as áreas (modelo geral)' }].concat(opcoesAreas()), required: true, numero: true, span: 8, dica: 'O modelo da área tem prioridade sobre o geral.' }
          ]
        },
        {
          titulo: 'Texto do e-mail',
          dica: 'Clique numa variável para colocá-la onde está o cursor.',
          campos: [
            { key: 'titulo', label: 'Assunto', required: true, max: 120, span: 12 },
            { key: 'texto', label: 'Texto', tipo: 'textarea', required: true, max: 2000, span: 12, linhas: 10 },
            { key: 'variaveis', tipo: 'variaveis' }
          ]
        }
      ],
      regras(dados, addErro, campo) {
        const validas = VARIAVEIS.map((v) => v.chave);
        ['titulo', 'texto'].forEach((k) => {
          const usadas = (String(dados[k]).match(/\{([^}]*)\}/g) || []).map((m) => m.slice(1, -1));
          const erradas = usadas.filter((v) => validas.indexOf(v) < 0);
          if (erradas.length) addErro(campo(k), 'A variável {' + erradas[0] + '} não existe. Use uma das variáveis da lista.');
        });
      },
      filtros: [
        { key: 'areaId', label: 'Área', tipo: 'select', ref: () => [{ value: '0', label: 'Modelo geral' }].concat(opcoesAreas(true)) },
        { key: 'titulo', label: 'Nome ou assunto', tipo: 'text', match: (r, v) => G.normaliza(r.nome + ' ' + r.titulo).indexOf(G.normaliza(v)) >= 0 },
        { key: 'status', label: 'Status', tipo: 'select', opcoes: STATUS }
      ],
      colunas: [
        { key: 'nome', label: 'Modelo', sort: true, link: true, sub: (r) => r.titulo },
        { key: 'area', label: 'Área', sort: (r) => (r.areaId ? nome.area(r.areaId) : ''), render: (r) => (r.areaId ? nome.area(r.areaId) : 'Todas (geral)'), csv: (r) => (r.areaId ? nome.area(r.areaId) : 'Todas') },
        colStatus
      ],
      emUso: (id) => (db.all('nips').some((n) => n.encaminhamentos.some((e) => e.modeloId === id)) ? 'Esse modelo já foi usado para avisar áreas. Para tirar de uso, mude o status para Inativo.' : '')
    }
  };

  Object.assign(window.NIP, {
    db, schemas, nome, caminhoTema, temasFilhos, aberta, prazo, problemas, sugestoes, palavrasAtivas, modelosDaArea, preencheModelo,
    emailsDaArea, registra, enviaAoCrm, importaNovas, areaParaTema: (temaId) => areaParaTema(db.raw(), temaId),
    UFS, STATUS, CATEGORIAS, PRAZO_DIAS, STATUS_NIP, ABERTAS, TIPOS_AREA, RESULTADOS, VARIAVEIS, OPERADORA
  });
})();
