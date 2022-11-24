// import 
import http from "http";
import url from "url";
import fs from "fs";
import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import express from "express";  // @types/express
import cors from "cors"         // @types/cors

// config
const PORT = process.env.PORT || 1337
dotenv.config({ path: ".env" });
const app = express();
const connectionString:string = process.env.connectionString;
const DBNAME = "5B";
declare global {
	namespace Express {
		interface Request {
			client : any  // ? means optional
		}
		interface Response {
			log : (err:any)=> any 
		}	
	}
}


/* ****************** Creazione ed Avvio del Server ************************ */
let server = http.createServer(app);
let paginaErrore: string = "";

server.listen(PORT, () => {
  init();
  console.log("Server in ascolto sulla porta " + PORT);
});

function init() {
    fs.readFile("./static/error.html", function(err:any, data:any) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>"
    });
}


/* **************************** MIDDLEWARE ********************************* */
// 1 request log
app.use("/", (req: any, res: any, next: any) => {
  console.log(req.method + ": " + req.originalUrl);
  next();
});

// fare subito la default route finale


// 2 gestione delle risorse statiche
app.use("/", express.static("./static"));


// 3 lettura dei parametri POST
// Il limit serve per upload base64
// da express 4.16 (oggi 2022 4.18)
app.use("/", express.json({"limit":"50mb"}))
app.use("/", express.urlencoded({"limit":"50mb", "extended": true }))




// Lettura dei parametri get inviati in formato JSON
app.use(function (req, res, next) {
	let _url = url.parse(req.url, false)
	let params = _url.query || "";
	params = decodeURIComponent(params);
	try { req["query"] = JSON.parse(params)	}
	catch (error) {	}
	next();
});


// 4 log dei parametri get e post
app.use("/", (req: any, res: any, next: any) => {
  if (Object.keys(req.query).length != 0) {
	  console.log("------> Parametri GET: " + JSON.stringify(req.query));
  }
  if (Object.keys(req.body).length != 0) {
	  console.log("------> Parametri BODY: " +JSON.stringify(req.body));
  }
  next();
});

// 5 - per far sì che i json restituiti al client abbiano indentazione 4 chr
app.set("json spaces", 4)

// 6 - CORS Policy
const whitelist = [ 
			"http://localhost:1337", 
			"https://localhost:1338", 
			"http://robertomana-crudserver.onrender.com",
			"https://robertomana-crudserver.onrender.com",			
            "http://localhost:4200"
				  ];
const corsOptions = {
    origin: function(origin, callback) {
        if (!origin)
            return callback(null, true);
		console.log("<----- origin --->", origin)
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



// apertura della connessione
app.use("/api/", function (req, res, next) {
	let connection = new MongoClient(connectionString);
    connection.connect()
	.catch((err: any) => {
		let msg = "Errore di connessione al db"
		res.status(503).send(msg)
	}) 
	.then((client: any) => {
		req["client"]=client;
		next();
	})
})







/* ********************** ELENCO DELLE CLIENT ROUTES  *********************** */
 
// elenco collezioni
app.get('/api/getCollections', function(req, res, next) {
	let db = req["client"].db(DBNAME);
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
 

// Elenco Record 
app.get('/api/:collection', function(req, res, next) {
	let collectionSelected = req.params.collection;
	let collection = req.client.db(DBNAME).collection(collectionSelected);
	collection.find(req.query).toArray(function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} 
		else {
			let response = [];
			for (const item of data) {
				// prendo SOLO la prima chiave dopo ID
				let key = Object.keys(item)[1];
				response.push({ _id: item["_id"], val: item[key] });
			}
			res.send(response);
		}
		req["client"].close();
	})
}) 


// Dettagli	
app.get("/api/:collection/:id", (req: any, res: any, next: any) => {
    let collectionSelected = req.params.collection;
    let id = new ObjectId(req.params.id);	
	let collection = req.client.db(DBNAME).collection(collectionSelected);	
	collection.findOne({ "_id": id }, function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} 
		else {
			res.send(data)
		}
		req["client"].close();
	})
});


// Aggiungi
app.post("/api/:collection", (req: any, res: any, next: any) => {
    let collectionSelected = req.params.collection;
    let params = req.body.params;
	let collection = req.client.db(DBNAME).collection(collectionSelected);
	collection.insertOne(params, function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} 
		else {
			res.send(data)
		}
		req["client"].close();
	})
});


app.delete("/api/:collection/:id", (req: any, res: any, next: any) => {
    let collectionSelected = req.params.collection;
    let id = new ObjectId(req.params.id);	
	let collection = req.client.db(DBNAME).collection(collectionSelected);
	collection.deleteOne({ "_id": id }, function(err, data) {
		if (err) {
			res.status(500).send("Errore esecuzione query")
		} 
		else {
			res.send(data)
		}
		req["client"].close();
	})
});


app.patch('/api/:collection/:id', function(req, res, next) {
    let collectionSelected = req.params.collection;
	let id = new ObjectId(req.params.id);	
    let params = req.body.params;
	let collection = req.client.db(DBNAME).collection(collectionSelected);
	collection.updateOne({ "_id": id }, { "$set": params },
		function(err, data) {
			if (err) {
				res.status(500).send("Errore esecuzione query")
			} 
			else {
				res.send(data)
			}
			req["client"].close();
		}
	)
});

app.put('/api/:collection/:id', function(req, res, next) {
    let collectionSelected = req.params.collection;
	let id = new ObjectId(req.params.id);	
    let params = req.body.params;
	let collection = req.client.db(DBNAME).collection(collectionSelected);
	collection.replaceOne({ "_id": id }, params, function(err, data) {		
		if (err) {
			console.log(err)
			res.status(500).send("Errore esecuzione query")
		} 
		else {
			res.send(data)
		}
		req["client"].close();
	}) 
});




/* ********************** (Sezione 3) DEFAULT ROUTE  *********************** */

// Default route
app.use('/', function (req, res, next) {
    res.status(404)
    if (req.originalUrl.startsWith("/api/")) {
        res.send("Risorsa non trovata");
		req["client"].close();
    }
    else  
		res.send(paginaErrore);
});


// Gestione degli errori
app.use("/", (err: any, req: any, res: any, next: any) => {
  console.log("SERVER ERROR " + err.stack);
  res.status(500);
   res.send("ERRR: " + err.message);
});
