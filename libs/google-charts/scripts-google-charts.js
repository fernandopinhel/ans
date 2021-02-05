// Categorias
google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart1);

      function drawChart1() {

        var data = google.visualization.arrayToDataTable([
          ['Tipo', 'Valor'],
          ['Assistênciais', 66],
          ['Não Assistênciais', 13],          
        ]);

        var options = {
          fontSize: 12,
          legend: 'block',
          legend: 'bottom',    
          colors: ['#4a55b9', '#e04c4c'],
          height: 400
        };

        var chart = new google.visualization.PieChart(document.getElementById('nips2'));

        chart.draw(data, options);
      }
// fim Categorias

// Situação NIPS
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart5);

function drawChart5() {

  var data = google.visualization.arrayToDataTable([
    ['Tipo', 'Valor'],
    ['Dentro do Prazo', 66],
    ['Fora do Prazo', 13],
    ['Próximo do Prazo', 21]
  ]);

  var options = {
    fontSize: 12,
    legend: 'block',
    legend: 'bottom',    
    colors: ['#6dc711', '#e04c4c', '#f2ab1b'],
    height: 400
  };
  
  var chart = new google.visualization.PieChart(document.getElementById('nips3'));
  chart.draw(data, options);
}
// fim situação NIPS

// Tipo Cadastro
google.charts.load("current", {packages:['corechart']});
google.charts.setOnLoadCallback(drawChart2);
function drawChart2() {
  var data = google.visualization.arrayToDataTable([
    ["Tipo da Exportação", "Tipos", { role: "style" } ],    
    ["Automático", 65, "#11b4c7"],
    ["Manual", 35, "#11c794"]    
  ]);

  var view = new google.visualization.DataView(data);
  view.setColumns([0, 1,
    { calc: "stringify",
        sourceColumn: 1,        
        type: "string",
        role: "annotation" },
    2]);

  var options = {
    fontSize: 12,
    backgroundColor: 'transparent',    
    bar: {groupWidth: "45%"},          
    legend: { position: "none" },    
    height: 400
  };
  var chart = new google.visualization.ColumnChart(document.getElementById("tipos-cadastro"));
  chart.draw(view, options);
}
// Fim Tipo Cadastro

// 
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
// Fim

// Estatistica por Tema
google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(drawMultSeries);

function drawMultSeries() {
      var data = google.visualization.arrayToDataTable([
        ['Tipo', 'Valor'],
        ['DIP, CPT, Agravo', 5],
        ['Carência', 10],
        ['Rede de Atendimento (Rede Conveniada)', 15],
        ['Reembolso)', 20],
        ['Prazos Máximos por Atendimento)', 25],
        ['Prazos Máximos por Atendimento)', 30],
        ['Rol de Procedimentos e Coberturas', 35],
        ['Gerenciamento das Ações de Saúde por Parte da Operadora', 40]
      ]);

      var options = {
        fontSize: 12,        
        legend: { position: "none" },
        height: 540,
        backgroundColor: 'transparent'
        // bar: {groupWidth: "20%"}
      };

      var chart = new google.visualization.BarChart(document.getElementById('estatistica-tema'));
      chart.draw(data, options);
    }
// Fim Estatistica por Tema

$(window).resize(function(){
    drawChart();
    drawChart2();
    drawChart3();
    drawChart4();
});