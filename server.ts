import * as http from "http";
import * as fs from "fs";
import * as bodyParser from "body-parser";
import * as mongodb from "mongodb";
import express from "express";
const app=express();
import cors from "cors";

// mongo
const mongo = require("mongodb");
const mongoClient = mongo.MongoClient;
const ObjectId = mongo.ObjectId;
// const CONNECTIONSTRING =  "mongodb://127.0.0.1:27017";
// const CONNECTIONSTRING =  "mongodb+srv://admin:admin@cluster0.xoopk.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const CONNECTIONSTRING = process.env.MONGODB_URI
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };
const dbNAME = "recipeBook"
const PORT = process.env.PORT || 1337


/* ***************************** Avvio Server ****************************** */

const server = http.createServer(app)
server.listen(PORT, function() {
    console.log("Server in ascolto sulla porta " + PORT);
	console.log("CONNECTIONSTRING="+CONNECTIONSTRING)
    init();
});

let paginaErrore = "";
function init() {
    fs.readFile("./static/error.html", function(err, data) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>"
    });	
}



/* ************************** SEZIONE 1 : Middleware ********************** */

// 1. Request log
app.use("/", function (req,res,next) {
    console.log(req.method + " : " + req.originalUrl);
    next();
});

// 3 - route risorse statiche
app.use("/", express.static('./static'));

// 4 - routes di lettura dei parametri post
app.use("/", bodyParser.json());   
app.use("/", bodyParser.urlencoded({extended: true })); 

// 6 - log dei parametri 
app.use("/", function (req, res, next) {
	// if(req.query != {}) NOK perchè i puntatori sono diversi
    if(Object.keys(req.query).length != 0)
	    console.log("------> Parametri GET: " + JSON.stringify(req.query));
	if(Object.keys(req.body).length != 0)
	    console.log("------> Parametri BODY: " +JSON.stringify(req.body));
    next();
});


// 7 - CORS Policy
app.use("/", function(req, res, next) {
    /* res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "*"); */
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
	next()
})
const whitelist = [ "http://localhost:1337", 
				   "https://my-crud-server.herokuapp.com",
                    "http://localhost:4200"
				  ];
const corsOptions = {
    origin: function(origin, callback) {
        if (!origin)
            return callback(null, true);
        if (whitelist.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        } 
	  else
            return callback(null, true);
    },
    credentials: true
};
app.use("/", cors(corsOptions));






/* ********************** (SEZIONE 2) CLIENT REQUEST  *********************** */

// apertura della connessione
app.use("/api/", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, function(err, client) {
        if (err) {
            let msg = "Errore di connessione al db"
            res.status(503).send(msg)
        } 
		else {
			req["client"]=client;
			next();
		}
	})	
})
 
 
// elenco collezioni
app.get('/api/getCollections', function(req, res, next) {
	let db = req["client"].db(dbNAME);
	db.listCollections().toArray(function(err, collections) {
		if (err) {
			res.status(500).send("Errore lettura elenco collezioni")
		} 
		else {
			res.send(collections)
		}
		req["client"].close();
	})
}); 
 

// Lettura collection e id (per qualsiasi metodo: get, post, put, etc)
let currentCollection
let currentId;
app.use("/api/:collection/:id?", function(req, res, next) {
    currentCollection = req.params.collection
    currentId = req.params.id  // se non c'è sarà undefined
    next()
})









/* ************************************************************************** */

/* GET REQUEST
   /api/ davanti all'ASTERISCO NON può essere tolto perchè altrimenti, 
   se l'utente richiede una risorsa statica che non viene trovata, 
   poi il runtime esegue questa route e va in errore                */   

app.get('/api/*', function(req, res, next) {
	let db = req["client"].db(dbNAME);
	let collection = db.collection(currentCollection);
	// Elenco
	if (!currentId) {
		collection.find(req.query).toArray(function(err, data) {
			if (err) {
				res.status(500).send("Errore esecuzione query")
			} 
			else {
				res.send(data)
			}
			req["client"].close();
		})
	} 

	// dettagli
	else {
		let oid = new ObjectId(currentId); 
		collection.findOne({ "_id": oid }, function(err, data) {
			if (err) {
				res.status(500).send("Errore esecuzione query")
			} else {
				res.send(data)
			}
			req["client"].close();
		})
	}
});


app.post('/api/*', function(req, res, next) {
	let record = req.body
	let db = req["client"].db(dbNAME);
	let collection = db.collection(currentCollection);
	collection.insertOne(record, function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} else {
			res.send(data)
		}
		req["client"].close();
	})
});


app.delete('/api/*', function(req, res, next) {
	let db = req["client"].db(dbNAME);
	let collection = db.collection(currentCollection);
	let oid = new ObjectId(currentId);
	collection.deleteOne({ "_id": oid }, function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} else {
			res.send(data)
		}
		req["client"].close();
	})
});


app.patch('/api/*', function(req, res, next) {
	let record = req.body
	let db = req["client"].db(dbNAME);
	let collection = db.collection(currentCollection);
	let oid = new ObjectId(currentId);
	collection.updateOne({ "_id": oid }, { "$set": record },
		function(err, data) {
			if (err) {
				res.status(500).send("Errore esecuzione query")
			} else {
				res.send(data)
			}
			req["client"].close();
		}
	)
});

app.put('/api/*', function(req, res, next) {
	let record = req.body
	let db = req["client"].db(dbNAME);
	let collection = db.collection(currentCollection);
	console.log(currentCollection)
	console.log(currentId)
	console.log(record)
	let oid = new ObjectId(currentId);
	collection.replaceOne({ "_id": oid }, record, function(err, data) {		
		if (err) {
			console.log(err)
			res.status(500).send("Errore esecuzione query")
		} else {
			res.send(data)
		}
		req["client"].close();
	}) 
});





/* ********************** (Sezione 3) DEFAULT ROUTE  ************************ */

// 2 - default route
app.use('/', function (req, res, next) {
    res.status(404)
    if (req.originalUrl.startsWith("/api/")) {
        // se status != 200 mando una semplice stringa
        res.send("Risorsa non trovata");
		req["client"].close();
    }
    else  
		res.send(paginaErrore);
});


// gestione degli errori
app.use(function(err, req, res, next) {	
	 console.log("***** SERVER ERROR ****** : ",  err.message);  
});
