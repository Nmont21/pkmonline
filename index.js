const mongoClient = require('mongodb').MongoClient;
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;          
const bodyParser = require('body-parser');      
var cors = require('cors');                         
const express = require('express');                 
const path = require('path');
const { log } = require('console');
const uri="mongodb+srv://argentonik:pe2SXS5YdMmYThoc@clusterpkmn.cpxpx.mongodb.net/?retryWrites=true&w=majority&appName=Clusterpkmn";



const app = express();
app.use(cors());
app.use(express.json())

app.use(express.static(__dirname + '/')); //senno non trova gli altri file compresi i css e le altre pagine html

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname+ '/login.html'));
});


app.listen(10000, "0.0.0.0", () => {
    console.log("Server partito porta 10000")
})

// Middleware per parsare il corpo delle richieste come JSON
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Connessione al server una sola volta
MongoClient.connect(uri)
  .then(client => {
    db = client.db('pkmn');
    console.log('Connesso a MongoDB');
  })
  .catch(error => console.error('Errore nella connessione a MongoDB:', error))

//--------------------------------------Controllo che l'utente sia loggato------------------------------
function utenteloggato(){
  const utente=sessionStorage.getItem("mail");
  if(utente==null)
    return false;
  else
  return true;
} 

//-------------------------------------Controllo che l'utente abbia completato la configurazione del profilo
async function checkstatogenere(){
  const mail=sessionStorage.getItem("mail");
  utente = await finduser(mail);
  return utente.statog;
}
async function checkstatocantanti(){
  const mail=sessionStorage.getItem("mail");
  utente = await finduser(mail);
  return utente.statoc;
}


//----------------------------------------------Aggiunta utente------------------------------------------------

async function addUser() {
    var mail = document.getElementById("emaillogin").value;
    var username = document.getElementById("username").value;
    var pass = document.getElementById("passlogin").value;
    mail.replace(/\s+/g, '');


    var userData = {
        email: mail,
        nome: username,
        password: pass
    };

    try {
        const response = await fetch('/creaUtente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Utente creato con successo!');
            sessionStorage.setItem("mail",mail);
            window.location.href="/overlap.html";
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
};

app.post('/creaUtente', async (req, res) => {

  try {
      const collection = db.collection('utenti');

      // Controllo dell'email
      const presente = await collection.findOne({ email: req.body.email });

      // Controllo del nome utente in modo case-insensitive
      const userpres = await collection.findOne({
          nome: { $regex: new RegExp(`^${req.body.nome}$`, 'i') }  // 'i' è il flag case-insensitive
      });

      var passhash = await bcrypt.hash(req.body.password, 10);

      if (presente) {
          return res.status(400).json('Mail usata per un altro account');
      }

      if (userpres) {
          return res.status(400).json('Questo nome utente esiste già');
      }

      // Creazione del nuovo utente
      const user = {
          nome: req.body.nome,
          email: req.body.email,
          password: passhash,
          statog: 0,
          statoc: 0,
          generip: [],
          cantantip: [],
          playlist: [],
          pimportate: []
      };

      const result = await collection.insertOne(user);
      res.status(201).json(result);
  } catch (err) {
      console.error('Errore nella creazione dell\'utente', err);
      res.status(500).send('Errore nella creazione dell\'utente');
  }
});


//-----------------------------------------Funzione per login--------------------------------------------------
async function login(){
  const mail=document.getElementById("emaillogin").value;
  const pass=document.getElementById("passlogin").value;
  mail.replace(/\s+/g, '');
  var userData = {
    email: mail,
    password: pass
};

try {
    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
    });

    if (response.ok) {
        const result = await response.json();
        sessionStorage.setItem("mail",mail);
        alert("loggato");
        window.location.href="/homepage.html";
    } else {
        const error = await response.text();
        alert('Errore: ' + error);
    }
} catch (error) {
    console.error('Errore nella richiesta:', error);
    alert('Errore nella richiesta');
}
}

app.post('/login', async (req, res) => {
      
      
  try {
    const collection = db.collection('utenti');
    const presente = await collection.findOne({ nome: req.body.email });

    if (presente) {
      
      if(presente.password==req.body.password)
      {
        res.status(201).json(presente);
      }
      else{
        return res.status(400).json('Credenziali errate' );
       
      }

    }
    
    else{
      return res.status(400).json('Credenziali errate' );
     
    }
      

  } catch (err) {
    console.error('Errore durante il login', err);
    res.status(500).send('Errore durante il login');
  } 
});


//-------------------------------------------------ricerca di un utente tramite mail-------------
async function finduser(mail) {
  try {
      // Costruisci l'URL con la query string
      const response = await fetch('/finduser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
          const result = await response.json();
          return result; 
      } else {
          const error = await response.text();
          alert('Errore: ' + error);
      }
  } catch (error) {
      console.error('Errore nella richiesta:', error);
      alert('Errore nella richiesta');
  }
}


async function getnome(mail){
  utente = await finduser(mail);
  return utente.nome;

}

async function welcome(){
  let mail=sessionStorage.getItem("mail");
  let nome= await getnome(mail);
  document.getElementById("h1login").innerHTML="Benvenuto, " + nome;

}

function logout(){
  sessionStorage.removeItem("mail");
  window.location.href="/login.html";
}


app.post('/finduser', async (req, res) => {
  try {
    const email = req.body.email;  // Ottieni l'email dalla query string
    if (!email) {
      return res.status(400).json('Email non fornita');
    }

    const collection = db.collection('utenti');
    const presente = await collection.findOne({ nome: email });

    if (presente) {
      return res.status(200).json(presente);  // 200 significa "successo"
    } else {
      return res.status(404).json('Utente non trovato');  // Usa 404 per "non trovato"
    }

  } catch (err) {
    console.error('Errore', err);
    res.status(500).send('Errore del server');
  } 
});

