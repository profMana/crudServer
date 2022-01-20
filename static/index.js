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
    
	let request = inviaRichiesta("get", "/api/getCollections");
    request.fail(errore)
    request.done(function(collections) {
        let label = divCollections.children("label")
        for (let collection of collections) {
            let clone = label.clone().appendTo(divCollections)
            clone.children("span").text(collection.name)
            clone.children("input").val(collection.name)
			divCollections.append("<br>")
        }
        label.remove()
    })


    divCollections.on("click", "input[type=radio]", function() {
		currentCollection = $(this).val()
		if(currentCollection=="unicorns")
		    divFilters.show()
		else
			divFilters.hide()
		richiediElenco()
    })

	
	// Questa procedura sarà riutilizzata più volte
	function richiediElenco(){
        let request = inviaRichiesta("get", "/api/" + currentCollection)
        request.fail(errore)
        request.done(aggiornaTabella)		
	}

	
	// Anche quest'altra procedura sarà riutilizzata più volte
    function aggiornaTabella(data) {
        divIntestazione.find("strong").first().html(currentCollection)
        divIntestazione.find("strong").last().html(data.length)
        table.children("tbody").empty();
        if (data.length != 0) {
            for (let item of data) {
                let tr = $("<tr>").appendTo(table.children("tbody"))
                $("<td>").appendTo(tr).text(item._id).prop("cod",item["_id"])
					            .prop("method","get").on("click", details)
                $("<td>").appendTo(tr).text(item.name).prop("cod",item["_id"])
					            .prop("method","get").on("click", details)
                // pulsantini
				let td = $("<td>").appendTo(tr)				
				$("<div>").appendTo(td).prop("cod", item["_id"])
				        .prop("method","patch").on("click", details)
				$("<div>").appendTo(td).prop("cod", item["_id"])
				          .prop("method","put").on("click", details)
				$("<div>").appendTo(td).prop("cod", item["_id"])
				          .on("click", elimina)
			}
		}
		divDettagli.empty();
    }



    function details() {
		let method = $(this).prop("method")
		let cod = $(this).prop("cod")		
        let resource = "/api/" + currentCollection + "/" + cod
        let request = inviaRichiesta("get", resource)
        request.fail(errore)
		request.done(function(data) {
			if (method=="get"){
				let content = ""
				for (let key in data)  
					content+= "<strong>"+key+"</strong> : " + 
				                              JSON.stringify(data[key]) + "<br>"
				divDettagli.html(content)
			}
			else{  // ******* DOPO *******
				// ID non è modificabil quindi NON deve essere inviato al server
				delete(data["_id"])
				divDettagli.empty();
				let textArea = $("<textArea>").appendTo(divDettagli)
				textArea.val(JSON.stringify(data, null, 2))
				// Imposto altezza textArea al valore del contenuto
				textArea.css("height", textArea.get(0).scrollHeight + "px")
				aggiungiButtonInvia(method, cod)
			}	
        })
    }
	

	$("#btnAdd").on("click", function(){
		divDettagli.empty();
		let textArea = $("<textArea>").val("{  }").appendTo(divDettagli)
		// In un primo tempo scrivere il codice di buttonInvia qui IN LOCO
		aggiungiButtonInvia("post", "")			
	})


    function elimina() {
        let cod = $(this).prop("cod")
        if (confirm("vuoi veramente cancellare il record " + cod + "?")) {
            let request = inviaRichiesta("delete", "/api/" + currentCollection
                                                           + "/" + cod)
            request.fail(errore)
            request.done(function(data) {
                alert("Record rimosso correttamente")
                richiediElenco()
            })
        }
    }

	
	function aggiungiButtonInvia(method, cod="") {
        $("<button>").text("invia").appendTo(divDettagli).on("click",function(){
            let param;
            try {
                param = JSON.parse($(this).prev().val())
            } 
			catch { 
				alert("JSON non valido"); 
				return;  
			}			
            let request = inviaRichiesta(method, "/api/" + currentCollection 
			                                             + "/" + cod, param)
            request.fail(errore)
            request.done(function(data) {
                alert("Operazione eseguita correttamente")
				richiediElenco()
            })
        })
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