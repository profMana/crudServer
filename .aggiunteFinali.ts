import dotenv from "dotenv";
dotenv.config({ path: ".env" });

// Variabili relative a MongoDB ed Express
import { MongoClient, ObjectId } from "mongodb";
const connectionString:string = process.env.connectionStringAtlas;
const DBNAME = process.env.DBNAME
const app = _express();

// Creazione e avvio del server
const PORT:number = parseInt(process.env.PORT)
let paginaErrore;
const server = _http.createServer(app);
server.listen(PORT, () => {
    init();
    console.log(`Il Server è in ascolto sulla porta ${PORT}`);
});


// 5 - CORS Policy
// Senza le CORS Policy l'accesso da Angular produce un CORS ERROR
const corsOptions = {
    origin: function(origin, callback) {
          return callback(null, true);
    },
    credentials: true
};
app.use("/", cors(corsOptions));





FILE  .env
/* ************************************************************************* */
connectionStringAtlas="mongodb+
      srv://admin:admin@cluster0.xoopk.mongodb.net/?retryWrites=true&w=majority"
connectionStringLocal=mongodb://127.0.0.1:27017
DBNAME = "5B"
PORT = 3000
/*
 Con o senza virgolette è indifferente.
 In ogni caso .env restituisce sempre una STRINGA
 Il punto e virgola finale produce invece errore
 Aggiungere .env nel gitignore

/* ************************************************************************* */




  Accesso all'ID
/*Per come il server è stato strutturato, da per scontato che l'ID sia 
  un objectId valido e lo si converte in ObjectId:
  let objId = new ObjectId(id)
  
  Però con mongo è anche possibile utilizzare degli ID personali come
  2 o "2" (esercizio Angular automobili) e, in questo caso, 
  la conversione in objectId va in errore.
  
  Si tratta allora di modificare ovunque la riga precedente nel seguente modo:
  
	let id = req["params"].id
    let objId;
	if(ObjectId.isValid(id)) 
		objId = new ObjectId(id)
	else
		objId = id as unknown as ObjectId;	    
  
  