$('#datepickerHorasMinutos').datetimepicker({
    language:  'pt-BR',    
    format: 'HH:ii',    
    startView: 1,
    minView: 0,
    forceParse: 0
});

// input number
(function($) {
    "use strict";
  
    function customQuantity() {
      /** Custom Input number increment js **/
      jQuery(
        '<div class="pt_QuantityNav"><div class="pt_QuantityButton pt_QuantityUp">+</div><div class="pt_QuantityButton pt_QuantityDown">-</div></div>'
      ).insertAfter(".pt_Quantity input");
      jQuery(".pt_Quantity").each(function() {
        var spinner = jQuery(this),
          input = spinner.find('input[type="number"]'),
          btnUp = spinner.find(".pt_QuantityUp"),
          btnDown = spinner.find(".pt_QuantityDown"),
          min = input.attr("min"),
          max = input.attr("max"),
          valOfAmout = input.val(),
          newVal = 0;
  
        btnUp.on("click", function() {
          var oldValue = parseFloat(input.val());
  
          if (oldValue >= max) {
            var newVal = oldValue;
          } else {
            var newVal = oldValue + 1;
          }
          spinner.find("input").val(newVal);
          spinner.find("input").trigger("change");
        });
        btnDown.on("click", function() {
          var oldValue = parseFloat(input.val());
          if (oldValue <= min) {
            var newVal = oldValue;
          } else {
            var newVal = oldValue - 1;
          }
          spinner.find("input").val(newVal);
          spinner.find("input").trigger("change");
        });
      });
    }
    customQuantity();
})(jQuery);  
// fim input number

// Tela Tabelas
// Acompanhar Itens Em Negociação
$(".bread-negociacoes").addClass("d-none");
$(".bread-detalhes-negociacao").addClass("d-none");
$(".bread-contra-proposta").addClass("d-none");
$(".bread-contra-proposta-direto").addClass("d-none");
$(".bread-aceitar-proposta").addClass("d-none");
$(".bread-aceitar-proposta-direto").addClass("d-none");
$(".bread-recusar-proposta").addClass("d-none");
$(".bread-recusar-proposta-direto").addClass("d-none");

$(".etapa-negociacao").addClass("d-none");

$(".etapa-consulta-negociacoes").addClass("d-none");
$(".etapa-detalhes-consulta-negociacoes").addClass("d-none");
$(".etapa-aceitar-proposta").addClass("d-none");
$(".etapa-recusar-proposta").addClass("d-none");
$(".etapa-contra-proposta").addClass("d-none");

$(".c-negociacao").click(function(){
    $('.bread-negociacoes').removeClass('d-none');   
    $(".etapa-consulta-negociacoes").removeClass("d-none");
    $(".etapa-consulta").addClass("d-none");
    $(".etapa-negociacao").removeClass("d-none");
});

$(".d-consulta-negociacao").click(function(){
    $('.bread-negociacoes').addClass('d-none')    
    $('.bread-detalhes-negociacao').removeClass('d-none');   
    $(".etapa-consulta-negociacoes").addClass("d-none");
    $(".etapa-detalhes-consulta-negociacoes").removeClass("d-none");
});

$(".e-contra").click(function(){    
    $('.bread-detalhes-negociacao').addClass('d-none');   
    $('.bread-contra-proposta').removeClass('d-none');    
    $(".etapa-detalhes-consulta-negociacoes").addClass("d-none");
    $(".etapa-contra-proposta").removeClass("d-none");
});

$(".e-aceita").click(function(){    
    $('.bread-detalhes-negociacao').addClass('d-none');   
    $('.bread-aceitar-proposta').removeClass('d-none');    
    $(".etapa-detalhes-consulta-negociacoes").addClass("d-none");
    $(".etapa-aceitar-proposta").removeClass("d-none");
});

$(".e-recusa").click(function(){    
    $('.bread-detalhes-negociacao').addClass('d-none');   
    $('.bread-recusar-proposta').removeClass('d-none');    
    $(".etapa-detalhes-consulta-negociacoes").addClass("d-none");
    $(".etapa-recusar-proposta").removeClass("d-none"); 
});

$(".r-proposta").click(function(){    
    $(".etapa-consulta").addClass("d-none");
    $(".bread-recusar-proposta-inicio").removeClass("d-none");
    $(".etapa-recusar-proposta").removeClass("d-none");
    $(".etapa-negociacao").removeClass("d-none");
});

$(".bread-1").click(function(){    
    $(".etapa-consulta").removeClass("d-none");

    $(".bread-negociacoes").addClass("d-none");
    $(".bread-detalhes-negociacao").addClass("d-none");
    $(".bread-contra-proposta").addClass("d-none");
    $(".bread-aceitar-proposta").addClass("d-none");
    $(".bread-aceitar-proposta-direto").addClass("d-none");
    $(".bread-recusar-proposta").addClass("d-none");
    $(".bread-recusar-proposta-direto").addClass("d-none"); 
    $(".bread-contra-proposta-direto").addClass("d-none");

    $(".etapa-consulta-negociacoes").addClass("d-none");    
    $(".etapa-detalhes-consulta-negociacoes").addClass("d-none");   
    $(".etapa-aceitar-proposta").addClass("d-none");
    $(".etapa-recusar-proposta").addClass("d-none");
    $(".etapa-contra-proposta").addClass("d-none");
    $(".etapa-negociacao").addClass("d-none");
});

$(".bread-2").click(function(){    
    $(".etapa-consulta-negociacoes").removeClass("d-none");  
    $(".etapa-consulta").removeClass("d-none");

    $(".bread-negociacoes").removeClass("d-none");
    $(".etapa-negociacao").removeClass("d-none");

    $(".bread-detalhes-negociacao").addClass("d-none");
    $(".bread-contra-proposta").addClass("d-none");
    $(".bread-aceitar-proposta").addClass("d-none");
    $(".bread-recusar-proposta").addClass("d-none");
    $(".bread-recusar-proposta-inicio").addClass("d-none"); 


    $(".etapa-consulta").addClass("d-none"); 
    $(".etapa-detalhes-consulta-negociacoes").addClass("d-none");   
    $(".etapa-aceitar-proposta").addClass("d-none");
    $(".etapa-recusar-proposta").addClass("d-none");
    $(".etapa-contra-proposta").addClass("d-none");
});

$(".bread-3").click(function(){    
    $(".etapa-detalhes-consulta-negociacoes").removeClass("d-none");  
    
    $(".bread-detalhes-negociacao").removeClass("d-none");
    $(".etapa-negociacao").removeClass("d-none");

    $(".bread-negociacoes").addClass("d-none");
    $(".bread-contra-proposta").addClass("d-none");
    $(".bread-aceitar-proposta").addClass("d-none");
    $(".bread-recusar-proposta").addClass("d-none");
    $(".bread-recusar-proposta-inicio").addClass("d-none"); 
    
    
    $(".etapa-consulta").addClass("d-none"); 
    $(".etapa-consulta-negociacoes").addClass("d-none");  
    $(".etapa-aceitar-proposta").addClass("d-none");
    $(".etapa-recusar-proposta").addClass("d-none");
    $(".etapa-contra-proposta").addClass("d-none");
});

$(".e-contra-direto").click(function(){    
    $('.bread-contra-proposta-direto').removeClass('d-none');  
    $('.etapa-contra-proposta').removeClass('d-none');  
    $('.etapa-negociacao').removeClass('d-none'); 
    $(".etapa-consulta").addClass("d-none"); 
});

$(".e-aceita-direto").click(function(){    
    $('.bread-aceitar-proposta-direto').removeClass('d-none');       
    $(".etapa-aceitar-proposta").removeClass("d-none");
    $('.etapa-negociacao').removeClass('d-none');   
    $(".etapa-consulta").addClass("d-none"); 
});

$(".e-recusa-direto").click(function(){    
    $(".bread-recusar-proposta-direto").removeClass("d-none"); 
    $(".etapa-consulta").addClass("d-none"); 
    $(".etapa-recusar-proposta").removeClass("d-none"); 
    $('.etapa-negociacao').removeClass('d-none');   
});
// FIM Tela Tabelas
// FIM Acompanhar Itens Em Negociação

// Tela Soclicitação de Compras
$(".selecionar-item").click(function(){    
    $(".bread-solicitacao-1").addClass("d-none");  
});


$(".bread-orcamento-2").addClass("d-none");
$(".bread-orcamento-3").addClass("d-none");
$(".bread-orcamento-4").addClass("d-none");
$(".bread-orcamento-5").addClass("d-none");
$(".bread-orcamento-6").addClass("d-none");
$(".bread-orcamento-7").addClass("d-none");
$(".bread-orcamento-8").addClass("d-none");
$(".bread-orcamento-9").addClass("d-none");
$(".bread-orcamento-10").addClass("d-none");
$(".bread-orcamento-11").addClass("d-none");
$(".box-orcamento-2").addClass("d-none");
$(".box-orcamento-3").addClass("d-none");
$(".box-orcamento-4").addClass("d-none");
$(".box-orcamento-5").addClass("d-none");
$(".box-orcamento-6").addClass("d-none");
$(".box-orcamento-7").addClass("d-none");
$(".box-orcamento-8").addClass("d-none");
$(".box-orcamento-9").addClass("d-none");
$(".box-orcamento-10").addClass("d-none");
$(".box-orcamento-11").addClass("d-none");

$(".btn-cadastrar-orcamento").click(function(){    
    $(".box-orcamento-1").addClass("d-none");
    $(".bread-orcamento-1").addClass("d-none");
    $(".box-orcamento-2").removeClass("d-none");
    $(".bread-orcamento-2").removeClass("d-none");
});

$(".btn-salvar-orcamento").click(function(){    
    $(".box-orcamento-1").removeClass("d-none");
    $(".bread-orcamento-1").removeClass("d-none");
    $(".box-orcamento-2").addClass("d-none");
    $(".bread-orcamento-2").addClass("d-none");
});

$(".btn-incluir-item-orcamento").click(function(){    
    $(".box-orcamento-1").addClass("d-none");
    $(".bread-orcamento-1").addClass("d-none");
    $(".box-orcamento-2").addClass("d-none");
    $(".bread-orcamento-2").addClass("d-none");
    $(".box-orcamento-3").removeClass("d-none");
    $(".bread-orcamento-3").removeClass("d-none");
});

$(".btn-salvar-item-orcamento").click(function(){    
    $(".box-orcamento-2").removeClass("d-none");
    $(".bread-orcamento-2").removeClass("d-none");
    $(".box-orcamento-3").addClass("d-none");
    $(".bread-orcamento-3").addClass("d-none");
});

$(".btn-salvar-item-sel-orcamento").click(function(){    
    $(".box-orcamento-3").removeClass("d-none");
    $(".bread-orcamento-3").removeClass("d-none");
    $(".box-orcamento-4").addClass("d-none");
    $(".bread-orcamento-4").addClass("d-none");
});

$(".btn-aprovar-item-sel-orcamento").click(function(){    
    $(".box-orcamento-6").removeClass("d-none");
    $(".bread-orcamento-6").removeClass("d-none");
    $(".box-orcamento-8").addClass("d-none");
    $(".bread-orcamento-8").addClass("d-none");
});

$(".btn-aprovar-item-sel-orcamento-2").click(function(){    
    $(".box-orcamento-5").removeClass("d-none");
    $(".bread-orcamento-5").removeClass("d-none");
    $(".box-orcamento-10").addClass("d-none");
    $(".bread-orcamento-10").addClass("d-none");
});

$(".btn-reprovar-item-sel-orcamento").click(function(){    
    $(".box-orcamento-6").removeClass("d-none");
    $(".bread-orcamento-6").removeClass("d-none");
    $(".box-orcamento-8").addClass("d-none");
    $(".bread-orcamento-8").addClass("d-none");
    $(".box-orcamento-9").addClass("d-none");
    $(".bread-orcamento-9").addClass("d-none");
});

$(".btn-reprovar-item-sel-orcamento-2").click(function(){    
    $(".box-orcamento-5").removeClass("d-none");
    $(".bread-orcamento-5").removeClass("d-none");
    $(".box-orcamento-11").addClass("d-none");
    $(".bread-orcamento-11").addClass("d-none");
});

$(".btn-salvar-contra-proposta-orcamento").click(function(){    
    $(".box-orcamento-6").removeClass("d-none");
    $(".bread-orcamento-6").removeClass("d-none");
    $(".box-orcamento-7").addClass("d-none");
    $(".bread-orcamento-7").addClass("d-none");
    $(".box-orcamento-8").addClass("d-none");
    $(".bread-orcamento-8").addClass("d-none");
    $(".box-orcamento-9").addClass("d-none");
    $(".bread-orcamento-9").addClass("d-none");
});

$(".selecionar-item-orcamento").click(function(){    
    $(".box-orcamento-3").addClass("d-none");
    $(".bread-orcamento-3").addClass("d-none");
    $(".bread-orcamento-4").removeClass("d-none");
    $(".box-orcamento-4").removeClass("d-none");
    $(".bread-orcamento-4").removeClass("d-none");
});

$(".detalhes-orcamento").click(function(){    
    $(".box-orcamento-1").addClass("d-none");
    $(".bread-orcamento-1").addClass("d-none");
    $(".bread-orcamento-5").removeClass("d-none");
    $(".box-orcamento-5").removeClass("d-none");
});

$(".d-orcamento-item").click(function(){    
    $(".box-orcamento-5").addClass("d-none");
    $(".bread-orcamento-5").addClass("d-none");
    $(".bread-orcamento-6").removeClass("d-none");
    $(".box-orcamento-6").removeClass("d-none");
});

$(".contra-proposta-orcamento").click(function(){    
    $(".box-orcamento-6").addClass("d-none");
    $(".bread-orcamento-6").addClass("d-none");
    $(".box-orcamento-7").addClass("d-none");
    $(".bread-orcamento-7").addClass("d-none");
    $(".bread-orcamento-7").removeClass("d-none");
    $(".box-orcamento-7").removeClass("d-none");
});

$(".aprovar-itens-orcamento").click(function(){    
    $(".box-orcamento-6").addClass("d-none");
    $(".bread-orcamento-6").addClass("d-none");
    $(".box-orcamento-7").addClass("d-none");
    $(".bread-orcamento-7").addClass("d-none");
    $(".bread-orcamento-8").removeClass("d-none");
    $(".box-orcamento-8").removeClass("d-none");
});

$(".aprovar-itens-orcamento-2").click(function(){    
    $(".box-orcamento-5").addClass("d-none");
    $(".bread-orcamento-5").addClass("d-none");
    $(".box-orcamento-10").removeClass("d-none");
    $(".bread-orcamento-10").removeClass("d-none");
});

$(".reprovar-proposta-orcamento").click(function(){    
    $(".box-orcamento-6").addClass("d-none");
    $(".bread-orcamento-6").addClass("d-none");
    $(".box-orcamento-7").addClass("d-none");
    $(".bread-orcamento-7").addClass("d-none");
    $(".bread-orcamento-8").addClass("d-none");
    $(".box-orcamento-8").addClass("d-none");
    $(".bread-orcamento-9").removeClass("d-none");
    $(".box-orcamento-9").removeClass("d-none");
});

$(".reprovar-proposta-orcamento-2").click(function(){    
    $(".box-orcamento-5").addClass("d-none");
    $(".bread-orcamento-5").addClass("d-none");
    $(".box-orcamento-11").removeClass("d-none");
    $(".bread-orcamento-11").removeClass("d-none");
});

$(".btn-salvar-resposta-negociacao").click(function(){    
    $(".box-orcamento-1").removeClass("d-none");
    $(".bread-orcamento-1").removeClass("d-none");
    $(".bread-orcamento-5").addClass("d-none");
    $(".box-orcamento-5").addClass("d-none");
});

$(".box-orcamento-6 > div > button.btn-voltar").click(function(){    
    $(".box-orcamento-5").removeClass("d-none");
    $(".bread-orcamento-5").removeClass("d-none");
    $(".bread-orcamento-6").addClass("d-none");
    $(".box-orcamento-6").addClass("d-none");
});
// Fim Tela Soclicitação de Compras

// script interações itens
$(".busca-tipo-itens").click(function(){
    $('.busca-tipo-itens-table').toggleClass('d-block')
    $('.incluir-tipo-itens').toggleClass('d-none')
});

$(".incluir-tipo-itens").click(function(){
    $('.busca-tipo-itens-table').addClass('d-none')
    $('.incluir-tipo-itens').addClass('d-none')
    $('.busca-tipo-itens-table').removeClass('d-block')
});

$(".busca-tipo-fabricante").click(function(){
    $('.resultado-tipo-fabricante').removeClass('d-none')    
});
// fim script interações itens

// script Toggle
$(document).ready(function () {
    $('#sidebarCollapse').on('click', function () {
        $('#sidebar').toggleClass('active');
        $(this).toggleClass('active');
        $("#sidebar").css("transition", "all 0.6s cubic-bezier(0.945, 0.020, 0.270, 0.665)");
    });
});
// fim script Toggle

// script Tooltip
$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
})
// fim script Tooltip

// Script Popover
$(document).ready(function(){
    $('[data-toggle="popover"]').popover();
});

$(document).ready(function () {
    $("[data-toggle=popover]")
    .popover({html:true})
})
// fim script Popover

// scripts mensagens alertas
$(".b-incluir").click(function(){
    $('#msg-inclusao').removeClass('d-none')
});

$(".close-inclusao").click(function(){
    $('#msg-inclusao').addClass('d-none')
});

$(".close-cadastro").click(function(){
    $('#msg-cadastro').addClass('d-none')
});

$(".b-cadastro").click(function(){
    $('#msg-cadastro').removeClass('d-none')
});

$(".close-error").click(function(){
    $('#msg-input-error').addClass('d-none')
});
// fim scripts mensagens alertas

// inicializando select(combo-box)
$(document).ready(function() {
    $('select').niceSelect();
});
// fim inicializando select(combo-box)

// script datepicker
$('.form_date').datetimepicker({
    language:  'pt-BR',
    autoclose: 1,
    minView: 2,
    format: "dd/mm/yyyy"
});
// fim script datepicker

// script add contato
$("#radio_no").click(function(){
    $('#endereco-entrega').removeClass('d-none')
});
$("#radio_yes").click(function(){
    $('#endereco-entrega').addClass('d-none')
});

// Unidade de Negócio
$('.btn-adicionar').click(function(){
    $('.b-contato').removeClass('d-none')
    $('.btn-adicionar-2').removeClass('d-none')
    $('.btn-adicionar').addClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-1 td.tel').append(telValue)
    $('.t-contato tbody .tr-1 td.email').append(emailValue)
});

$('.btn-adicionar-2').click(function(){
    $('.btn-adicionar-2').addClass('d-none')
    $('.btn-adicionar-3').removeClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-2 td.tel').append(telValue)
    $('.t-contato tbody .tr-2 td.email').append(emailValue)
    $('.tr-2').removeClass('d-none')
});

$('.btn-adicionar-3').click(function(){
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato tbody .tr-3 td.tel').append(telValue)
    $('.t-contato tbody .tr-3 td.email').append(emailValue)
    $('.tr-3').removeClass('d-none')
});
// Fim Unidade de Negócio

// Fornecedor Contato
$('.btn-adicionar').click(function(){
    $('.b-contato').removeClass('d-none')
    $('.btn-adicionar-2').removeClass('d-none')
    $('.btn-adicionar').addClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-1 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-1 td.email').append(emailValue)
});

$('.btn-adicionar-2').click(function(){
    $('.btn-adicionar-2').addClass('d-none')
    $('.btn-adicionar-3').removeClass('d-none')
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-2 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-2 td.email').append(emailValue)
    $('.tr-contato-2').removeClass('d-none')
    $('.s-contato-1').removeClass('d-none')
});

$('.btn-adicionar-3').click(function(){
    var telValue = $('#telefone-add').val()
    var emailValue = $('#email-add').val()
    $('.t-contato-2 tbody .tr-contato-3 td.tel').append(telValue)
    $('.t-contato-2 tbody .tr-contato-3 td.email').append(emailValue)
    $('.tr-contato-3').removeClass('d-none')
    $('.s-contato-2').removeClass('d-none')
    $('.s-contato-3').removeClass('d-none')
});
// Fim Fornecedor Contato

// Marcas e Fornecedores
$('.bt-add').click(function(){
    $('#conteudo-marcas-fornecedores').removeClass('d-none')
    $('.bt-add').addClass('d-none')
    $('.bt-add-2').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-1 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-1 td.date-mf').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-2').click(function(){
    $('.bt-add-2').addClass('d-none')
    $('.bt-add-3').removeClass('d-none')
    $('.lista-mf tbody .tr-2').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-2 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-2 td.date-mf').append(date +'/'+ day +'/'+ ano);
    $('.s-mf-1').removeClass('d-none')
});

$('.bt-add-3').click(function(){
    $('.bt-add-3').addClass('d-none')
    $('.bt-add').removeClass('d-none')
    $('.lista-mf tbody .tr-3').removeClass('d-none')
    var selectMf = $('#add-mf :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-mf tbody .tr-3 td.mf').append(selectMf)
    $('.lista-mf tbody .tr-3 td.date-mf').append(date +'/'+ day +'/'+ ano);
    $('.s-mf-2').removeClass('d-none')
    $('.s-mf-3').removeClass('d-none')
});
// Fim Marcas e Fornecedores

// Especialidades
$('.bt-add-e').click(function(){
    $('#conteudo-especialidades').removeClass('d-none')
    $('.bt-add-e').addClass('d-none')
    $('.bt-add-e-2').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-1 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-1 td.date-esp').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-e-2').click(function(){
    $('.bt-add-e-2').addClass('d-none')
    $('.bt-add-e-3').removeClass('d-none')
    $('.lista-e tbody .tr-2').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-2 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-2 td.date-esp').append(date +'/'+ day +'/'+ ano);
});

$('.bt-add-e-3').click(function(){
    $('.bt-add-e-3').addClass('d-none')
    $('.bt-add-e').removeClass('d-none')
    $('.lista-e tbody .tr-3').removeClass('d-none')
    var selectE = $('#add-e :selected').text();
    var dateValue = new Date();
    var day = dateValue.getDay()
    var date = dateValue.getDate()
    var mes =  dateValue.getMonth()
    var ano =  dateValue.getFullYear()
    var horas =  dateValue.getHours()
    var minutos =  dateValue.getMinutes()
    $('.lista-e tbody .tr-3 td.especialidade').append(selectE)
    $('.lista-e tbody .tr-3 td.date-esp').append(date +'/'+ day +'/'+ ano);
});
// Fim Especialidades
$('#btn-add-associacoes').click(function(){
    $('#conteudo-associacoes').removeClass('d-none')
});
$('#btn-busca-lista-assoc').click(function(){
    $('#conteudo-associacoes-2').toggleClass('d-none')
});
$('#btn-close-lista-assoc').click(function(){
    $('#conteudo-associacoes-2').toggleClass('d-none')
});

$('.busca-assoc').click(function(){
    $('#conteudo-associacoes').removeClass('d-none')
});


$('#btn-add-especialidades').click(function(){
    $('#conteudo-especialidades').removeClass('d-none')
});
$('#btn-busca-lista-especi').click(function(){
    $('#conteudo-especialidade-2').toggleClass('d-none')
});
$('#btn-close-lista-especi').click(function(){
    $('#conteudo-especialidade-2').toggleClass('d-none')
});


$('#btn-add-procedimentos').click(function(){
    $('#conteudo-procedimentos').removeClass('d-none')
});
$('#btn-busca-lista-proce').click(function(){
    $('#conteudo-procedimentos-2').toggleClass('d-none')
});
$('#btn-close-lista-proce').click(function(){
    $('#conteudo-procedimentos-2').toggleClass('d-none')
});


$('#reutilizavel-sim').click(function(){
    $('.n-reutilizavel').removeClass('d-none')
});

$('#reutilizavel-nao').click(function(){
    $('.n-reutilizavel').addClass('d-none')
});

$('#reanalise-sim').click(function(){
    $('.n-reanalise').removeClass('d-none')
});

$('#reanalise-nao').click(function(){
    $('.n-reanalise').addClass('d-none')
});
// Itens 

// Fim Itens 

$(".excluir").click(function() {
    $(this).parents('tr').remove();
});

$("#btn-busca-lista").click(function(){
    $("#conteudo-contato-2").toggleClass("d-none");
});

$("#btn-close-lista").click(function(){
    $("#conteudo-contato-2").toggleClass("d-none");
});

$("#btn-busca-lista-2").click(function(){
    $("#conteudo-marcas-fornecedores-2").toggleClass("d-none");
});

$("#btn-close-lista-2").click(function(){
    $("#conteudo-marcas-fornecedores-2").toggleClass("d-none");
});
// fim script add contato

// carregando divs do select
$(function() { //onload aqui
    $('#opcoes').on('change', function() {
      $('.sel').hide();
      let idSelecionado = $(this).val(); //construir o id
      if (idSelecionado != "") $("#" + idSelecionado).show(); //mostrar o elemento
    });
  
    $('#opcoes').trigger("change"); //aplicar a lógica do change
  })
  // fim carregando divs do select
  

  // inputs animado

//   var $inputDateTimeMinutes = $('input[type="time"]::-webkit-datetime-edit-minute-field');
//   $inputDateTimeMinutes.css("display", "none");

  $(window, document, undefined).ready(function() {
    $('.input-date').change(function() {
        $(this).focus();
    })
    
    $('input').blur(function() {
      var $this = $(this);
      if ($this.val())
        $this.addClass('used');
      else
        $this.removeClass('used');
    });

    $('input[type=radio').blur(function() {
        var $this = $(this);
        if ($this.val())
          $this.removeClass('used');
        else
          $this.removeClass('used');
      });

      $('input[type=checkbox').blur(function() {
        var $this = $(this);
        if ($this.val())
          $this.removeClass('used');
        else
          $this.removeClass('used');
      });
  
    var $ripples = $('.ripples');
  
    $ripples.on('click.Ripples', function(e) {
  
      var $this = $(this);
      var $offset = $this.parent().offset();
      var $circle = $this.find('.ripplesCircle');
  
      var x = e.pageX - $offset.left;
      var y = e.pageY - $offset.top;
  
      $circle.css({
        top: y + 'px',
        left: x + 'px'
      });
  
      $this.addClass('is-active');
  
    });
  
    $ripples.on('animationend webkitAnimationEnd mozAnimationEnd oanimationend MSAnimationEnd', function(e) {
        $(this).removeClass('is-active');
    });
  });


$('input[type=checkbox').removeClass('used')
  // fim Inputs animado

$(".buscar-item").click(function(){
    $(".tabela-busca-item").toggleClass("d-none");
});

$(".selecionar-item").click(function(){
    $(".tabela-busca-item").addClass("d-none");
    $(".consultar-novos-itens").addClass("d-none");
    $(".consulta-itens-selecionados").toggleClass("d-none");
    $(".itens-editar-selecionados").toggleClass("d-none");
});

$(".mostrar-itens-section").click(function(){
    $(".tabela-busca-item").toggleClass("d-none");
    $(".show-itens-sections").toggleClass("d-none");
});

// marcar todos checkbox
function marcarTodos(marcardesmarcar){
    $('.marcar').each(function () {
        this.checked = marcardesmarcar;
    });
}

