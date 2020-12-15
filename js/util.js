// function buscaNome(valor){
// 	if (valor.length >3) {
// 		var lista = '<ul id="country-list">';
// 		var lista2 = "";
// 		$.ajax({
// 			type : "GET",
// 			url : "listarMarcas.action",
// 			data : "nome=" + valor,						
// 			success : function(data) {
// 				console.log(data);
				
// 				for(var prop in data){
// 					console.log(data[prop].nome);
// 					lista2 = lista2 + '<li onClick="selecionarNome(\''+data[prop].nome+'\');">'+data[prop].nome+'</li>';
// 				}
// 				lista = lista + lista2 + '</ul>';
// 				$("#suggesstion-box").show();
// 				$("#suggesstion-box").html(lista);
// 			}
// 		});
// 	}

// };

// function selecionarNome(val) {
// 	$("#descricao").val(val);
// 	$("#suggesstion-box").hide();
// }

function buscaNome(valor){
	if (valor.length >3) {
		var lista = '<ul id="country-list">';
		var lista2 = "";
		
		
		lista2 = '<li onClick="selecionarNome(\'teste1\');">teste1</li>';
		lista2 = lista2 + '<li onClick="selecionarNome(\'teste2\');">teste2</li>';
		lista2 = lista2 + '<li onClick="selecionarNome(\'teste3\');">teste3</li>';
		lista2 = lista2 + '<li onClick="selecionarNome(\'teste4\');">teste4</li>';
		lista2 = lista2 + '<li onClick="selecionarNome(\'teste5\');">teste5</li>';
		lista = lista + lista2 + '</ul>';
		$("#suggesstion-box").show();
		$("#suggesstion-box").html(lista);
	
	}

};