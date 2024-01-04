"use strict"
$(document).ready(function() {
    let divIntestazione = $("#divIntestazione");
    let divFilters = $(".card").eq(0);
    let divCollections = $("#divCollections");
    let table = $("#mainTable");
    let divDettagli = $("#divDettagli");
    let currentCollection = "";

    divFilters.hide();
	$("#lstHair").prop("selectedIndex", -1);
    $("#btnAdd").prop("disabled", true);

    /* ******************** start from here ************************** */	
    getCollections();
    function getCollections() {
        let rq = inviaRichiesta("GET", "/api/getCollections");
        rq.then((response) => {
            console.log(response.data);
            let label = divCollections.children("label");
            response.data.forEach((collection, i) => {
                let clonedLabel = label.clone().appendTo(divCollections);
                clonedLabel.children("span").text(collection.name);
                clonedLabel.children("input:radio").on("click", function() {
                    currentCollection = collection.name;
                    $("#btnAdd").prop("disabled", false);
                    getDataCollection();
                });
            });
            label.remove();
        });
        rq.catch(errore);
    }

    $("#btnFind").on("click", () => {
        let hair = $("#lstHair").val();
        let gender = "";
        if(divFilters.find("input:checkbox:checked").length == 1)
            gender = divFilters.find("input:checkbox:checked").val();

        let filters = {};
        if(hair)
            filters["hair"] = hair.toLowerCase();
        if(gender)
            filters["gender"] = gender.toLowerCase();
        getDataCollection(filters);
    });

    $("#btnAdd").on("click", () => {
        divDettagli.empty();
        $("<textarea>").appendTo(divDettagli)
		               .prop("placeholder", '{"nome": "Pippo"}');
        $("<button>").addClass("btn btn-success btn-sm").appendTo(divDettagli)
		             .text("INVIA").on("click", function() {
            let newRecord = divDettagli.children("textarea").val();
            try {
                newRecord = JSON.parse(newRecord);
            } 
			catch (error) {
                alert(`JSON non valido:\n${error}`);
                return;
            }
           let rq=inviaRichiesta("POST", `/api/${currentCollection}`, newRecord)
            rq.then((response) => {
                console.log(response.data);
                alert("Record inserito correttamente");
                getDataCollection();
            });
            rq.catch(errore);
        });
    });

    /*
	   1) delete (terzo pulsantino). delete è però un nome riservato!!
	   2) patch e put che richiamano SEMPRE getDetails()
	*/

    function getDataCollection(filters = {}) {
        let rq = inviaRichiesta("GET", `/api/${currentCollection}`, filters);
        rq.then((response) => {
            console.log(response.data);
            divIntestazione.find("strong").eq(0).text(currentCollection);
            divIntestazione.find("strong").eq(1).text(response.data.length);
            let _tbody = table.children("tbody");
            _tbody.empty();
            response.data.forEach((item, i) => {
                let tr = $("<tr>").appendTo(_tbody);
                $("<td>").appendTo(tr).text(item._id).on("click", function() {
                    getDetails(item._id);
                });
                $("<td>").appendTo(tr).text(item.name).on("click", function() {
                    getDetails(item._id);
                });
				// pulsantini
                let td = $("<td>").appendTo(tr);
                $("<div>").appendTo(td).on("click", function() {
					getDetails(item._id, "patch")
				})
                $("<div>").appendTo(td).on("click", function() {
					getDetails(item._id, "put")
				})
                $("<div>").appendTo(td).on("click", function() {
					remove(item._id)
				})
            });
            if(currentCollection == "unicorns")
                divFilters.show();
            else
            {
                divFilters.hide();
                divFilters.find("input:checkbox").prop("checked", false);
                $("#lstHair").prop("selectedIndex", -1);
            }
            divDettagli.empty();
        });
        rq.catch(errore);
    }


    function getDetails(_id, method="get") {
        let rq = inviaRichiesta("GET", `/api/${currentCollection}/${_id}`);
        rq.then((response) => {
            console.log(response.data);
            divDettagli.empty();
			if(method=="get") {
				for(let key in response.data)
				{
					$("<strong>").appendTo(divDettagli).text(`${key}: `);
					$("<span>").appendTo(divDettagli)
					           .text(JSON.stringify(response.data[key]))
					$("<br>").appendTo(divDettagli);
				}
			}









			else{  // patch or put
				delete(response.data["_id"])
				let textArea = $("<textArea>").appendTo(divDettagli)
				if(method.toLowerCase()=="patch")
					textArea.val(JSON.stringify({$set:{"residenza":"fossano"}}))
				else
				    textArea.val(JSON.stringify(response.data, null, 2))
				// Imposto altezza textArea al valore del contenuto
				textArea.css("height", textArea.get(0).scrollHeight + "px")
				$("<button>").appendTo(divDettagli)
				   .addClass("btn btn-success btn-sm")
				   .text("invia")
				   .on("click",function(){
						let action = divDettagli.children("textarea").val();
						try {
							action = JSON.parse(action)
						} 
						catch { 
							alert("Formato Dati non valido"); 
							return;  
						}			
						let rq = inviaRichiesta(method, 
						    "/api/"+currentCollection+"/"+_id, action)
						rq.catch(errore)
						rq.then(function(data) {
							console.log(response.data);
							alert("Operazione eseguita correttamente")
							getDataCollection()
						})
				})
			}
        });
        rq.catch(errore);
    }
	
	
	// lato server si potrebbe anche prevedere un servizio che cancelli i record
	// sulla base di un filtro invece che sulla base dell'ID
	function remove(_id) {
		if (confirm("vuoi veramente cancellare il record " + _id + "?")) {
			let rq = inviaRichiesta("DELETE", "/api/"+currentCollection+"/"+_id)
			rq.catch(errore)
			rq.then(function(response) {
				console.log(response.data);
				alert("Record rimosso correttamente")
				getDataCollection()
			})
		}
	}	


});