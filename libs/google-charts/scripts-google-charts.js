// Tipo Assistencial/Nao Assistencial
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

function drawChart() {

  var data = google.visualization.arrayToDataTable([
    ['Tipo', 'Valor'],
    ['Assistenciais', 65],
    ['Não Assistenciais', 35],
  ]);

  var options = {
    fontSize: 14,
    backgroundColor: 'transparent',       
    pieHole: 0.5,
    pieSliceText: 'value',
    pieSliceTextStyle: {
      color: 'white',
    },
    legend: 'block',
    legend: 'bottom',    
    colors: ['#212e4b', '#83858a'],
    height: 400
  };
  
  var chart = new google.visualization.PieChart(document.getElementById('nips2'));
  chart.draw(data, options);
}
// fim Tipo Assistencial/Nao Assistencial

// Tipo Exportação
google.charts.load("current", {packages:['corechart']});
google.charts.setOnLoadCallback(drawChart2);
function drawChart2() {
  var data = google.visualization.arrayToDataTable([
    ["Tipo da Exportação", "Tipos", { role: "style" } ],    
    ["Manualmente", 65, "#608918"],
    ["Automaticamente", 35, "#149dc1"],
    ["Pendente", 25, "#c86366"]
  ]);

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
    { calc: "stringify",
        sourceColumn: 1,        
        type: "string",
        role: "annotation" },
    2]);

  var options = {
    fontSize: 14,
    backgroundColor: 'transparent',    
    bar: {groupWidth: "25%"},          
    legend: { position: "none" },    
    height: 400
  };
  var chart = new google.visualization.ColumnChart(document.getElementById("tipos-class"));
  chart.draw(view, options);
}
// Fim Tipo Exportação

// Classificação NIPS
google.charts.load("current", {packages:['corechart']});
google.charts.setOnLoadCallback(drawChart3);
function drawChart3() {
  var data = google.visualization.arrayToDataTable([
    ['Element', 'Quantidade', { role: 'style' }],
    ['NIPS Assistenciais', 65, ''],            
    ['NIPS Não Assistenciais', 35, ''], 
  ]);

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
    { calc: "stringify",
        sourceColumn: 1,        
        type: "string",
        role: "annotation" },
    2]);

  var options = {
    fontSize: 14,
    backgroundColor: 'transparent',    
    bar: {groupWidth: "35%"},          
    legend: { position: "none" },    
  };
  var chart = new google.visualization.ColumnChart(document.getElementById("nips"));
  chart.draw(view, options);
}
// Fim Classificação NIPS

// Estatistica por Tema
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart4);

function drawChart4() {
  var data = google.visualization.arrayToDataTable([
    ['Mês/Ano', 'Gerenciamento das Ações de Saúde por Parte da Operadora', 'Rol de Procedimentos e Coberturas', 'Prazos Máximos para Atendimento', 'Reembolso', 'Rede de Atendimento'],
    ['jan/20',  140, 100, 20, 50, 80],
    ['fev/20',  100, 80, 120, 90, 35],
    ['mar/20',  80, 50, 45, 95, 98],
    ['abr/20',  60, 30, 25, 32, 100],
    ['mai/20',  75, 35, 120, 140, 95],
    ['jun/20',  65, 25, 70, 45, 35],
    ['jul/20',  20, 28, 36, 49, 55],
    ['ago/20',  90, 95, 135, 128, 132]
  ]);

  var options = {
    /*title: 'Company Performance',
    hAxis: {title: 'Year',  titleTextStyle: {color: '#333'}},
    vAxis: {minValue: 0}*/
    legend: 'block',
    legend: 'bottom',  
    fontSize: 14,
    height: 400,    
    chartArea: {
      width: '90%'
    },
  };

  var chart = new google.visualization.AreaChart(document.getElementById('estatistica-tema'));
  chart.draw(data, options);
}
// Fim Estatistica por Tema

$(window).resize(function(){
    drawChart();
    drawChart2();
    drawChart3();
    drawChart4();
});