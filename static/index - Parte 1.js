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
                $("<div>").appendTo(td);
                $("<div>").appendTo(td);
                $("<div>").appendTo(td);
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


    function getDetails(_id) {
        let rq = inviaRichiesta("GET", `/api/${currentCollection}/${_id}`);
        rq.then((response) => {
            console.log(response.data);
            divDettagli.empty();

            for(let key in response.data)
            {
                $("<strong>").appendTo(divDettagli).text(`${key}: `);
                $("<span>").appendTo(divDettagli).text(response.data[key]);
                $("<br>").appendTo(divDettagli);
            }
        });
        rq.catch(errore);
    }


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

});