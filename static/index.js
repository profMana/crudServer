"use strict"
$(document).ready(function() {
let divIntestazione = $("#divIntestazione")
let divFilters = $(".card").eq(0)
let divCollections = $("#divCollections")
let table = $("#mainTable")
let divDettagli = $("#divDettagli")
let currentCollection = "";

divFilters.hide()
$("#lstHair").prop("selectedIndex", -1);


// Elenco collezioni
let request = inviaRichiesta("get", "/api/getCollections");
request.fail(errore)
request.done(function(collections) {
	let label = divCollections.children("label")
	for (let collection of collections) {
		let clone = label.clone().appendTo(divCollections)
		clone.children("span").text(collection.name)
		clone.children("input").val(collection.name).on("click", function(){
			currentCollection = collection.name
			getCollection();
		})
		$("<br>").appendTo(divCollections)
	}
	label.remove()
})


			
// Richiedi elenco records
function getCollection(){
	let request = inviaRichiesta("get", "/api/" + currentCollection)
	request.fail(errore)
	request.done(aggiornaTabella)		
}
function aggiornaTabella(data) {
	let tbody = table.children("tbody");
	tbody.empty();
	divIntestazione.find("strong").eq(0).text(currentCollection);
	divIntestazione.find("strong").eq(1).text(data.length);		
	for (const item of data) {
		let tr = $("<tr>").appendTo(tbody);
		$("<td>").appendTo(tr).prop("_id", item._id)
		   .text(item._id)	
           .prop("action","get")		   
		   .on("click", setDetails);
		$("<td>").appendTo(tr).prop("_id", item._id)
		   .text(item.val)			   
		   .prop("action","get")
		   .on("click", setDetails);
		// pulsantini
		let td = $("<td>").appendTo(tr);
		$("<div>").appendTo(td).prop("_id", item._id)			   
		   .prop("action","patch")
		   .on("click", setDetails);			
		$("<div>").appendTo(td).prop("_id", item._id)			   
		   .prop("action","put")
		   .on("click", setDetails);			
		$("<div>").appendTo(td).prop("_id", item._id)
		   .on("click", _delete);
	}
	if (currentCollection == "unicorns") {
		divFilters.show();
	} 
	else {
		divFilters.hide();
	}	
	divDettagli.empty()
}



// Richiedi e visualizza dettagli
function setDetails() {
	let action = $(this).prop("action")
	let id = $(this).prop("_id")		
	divDettagli.empty();
	let request = inviaRichiesta("get", "/api/"+currentCollection+"/"+ id)
	request.fail(errore)
	request.done(function(data) {
		// get : semplice visulizzazione dettagli
		if (action=="get"){
			let str = ""
			for (let key in data)  
				str+= "<strong>"+key+"</strong> : " + 
										  JSON.stringify(data[key]) + "<br>"
			divDettagli.html(str)
		}
		// patch e put
		else{  
			// ID non è modificabil quindi NON deve essere inviato al server
			delete(data["_id"])
			let textArea = $("<textArea>").appendTo(divDettagli)
			textArea.val(JSON.stringify(data, null, 2))
			// Imposto altezza textArea al valore del contenuto
			textArea.css("height", textArea.get(0).scrollHeight + "px")
			aggiungiButton(action, id)
		}	
	})
}



// Aggiungi record
$("#btnAdd").on("click", function(){
	divDettagli.empty();
	let textArea = $("<textArea>").val("{  }").appendTo(divDettagli)
	// In un primo tempo scrivere il codice di buttonInvia qui IN LOCO
	aggiungiButton("post")			
})

function aggiungiButton(method, id="") {
	$("<button>").appendTo(divDettagli)
	   .addClass("btn btn-success")
	   .text("invia")
	   .on("click",function(){
			let params = divDettagli.children("textarea").val();
			try {
				params = JSON.parse(params)
			} 
			catch { 
				alert("Formato Dati non valido"); 
				return;  
			}			
			let rq = inviaRichiesta(method, "/api/"+currentCollection+"/"+id, 
			                                                         {params})
			request.fail(errore)
			request.done(function(data) {
				alert("Operazione eseguita correttamente")
				getCollection()
			})
	})
}





function _delete() {
	let id = $(this).prop("_id")
	if (confirm("vuoi veramente cancellare il record " + id + "?")) {
		let rq = inviaRichiesta("delete", "/api/"+ currentCollection+"/"+ id)
		request.fail(errore)
		request.done(function(data) {
			alert("Record rimosso correttamente")
			getCollection()
		})
	}
}


$("#btnFind").on("click", function(){
	let filter = {}
	let hair = $("#lstHair").children("option:selected").val()
	if (hair)
		filter["hair"]=hair.toLowerCase();
	
	let male = divFilters.find("input[type=checkbox]").first()
			.is(":checked")
	let female = divFilters.find("input[type=checkbox]").last()
			.is(":checked")
	if(male && !female)
		filter["gender"]='m';
	else if(female && !male)
		filter["gender"]='f';
	
	let request = inviaRichiesta("get", "/api/" + currentCollection, filter)
	request.fail(errore)
	request.done(function(data){
		aggiornaTabella(data)			
	})
})
});