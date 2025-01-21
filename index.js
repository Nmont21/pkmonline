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
//-------------------------------------------------scarico immagine del pokemo-----------------------------------------------------------
async function fetchPokemon(nome) {
  const pokemonName = nome;
  if (!pokemonName) {
      alert("Inserisci un nome di Pokémon!");
      return;
  }

  try {
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      if (!response.ok) {
          throw new Error("Pokémon non trovato");
      }

      const data = await response.json();

      return data.sprites.front_default;

  } catch (error) {
      alert(error.message);
  }
}
//----------------------------------------------Aggiunta pokemon------------------------------------------------

async function addpokemon() {
    var nomep= document.getElementById('nomep').value;
    var nomea= document.getElementById('nomea').value;
    var tipo1=document.getElementById('tipo1').value;
    var tipo2=document.getElementById('tipo2').value;
    var attacco=document.getElementById('attacco').value;
    var attas=document.getElementById('attas').value;
    var difesa=document.getElementById('difesa').value;
    var difes=document.getElementById('difes').value;
    var vel =document.getElementById('vel').value;
    var dadomedio=document.getElementById('dadomedio').value;
    var esperienza=document.getElementById('esperienza').value;
    var immagine= await fetchPokemon(nomep.toLowerCase());
    var stat=document.getElementById('stato').value;
    var box=document.getElementById('box').checked;
    var sesso=document.querySelector('input[name="sesso"]:checked').value;
    var natura=document.getElementById('natura').value;
    var abilita=document.getElementById('abilita').value;
    var pv=document.getElementById('pv').value;
    var userData = {
        nome:nomep,
        allenatore:nomea,
        tipi:[tipo1,tipo2],
        atk:attacco,
        satk:attas,
        dif:difesa,
        sdif:difes,
        velocit:vel,
        dm:dadomedio,
        exp:esperienza,
        sprite:immagine,
        stato:stat,
        inbox:box,
        sex:sesso,
        mosse:[],
        natura:natura,
        abilita:abilita,
        puntivita:pv
    };

    try {
        const response = await fetch('/addpokemon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Pokemon aggiunto con successo!');
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
};

app.post('/addpokemon', async (req, res) => {

  try {
      const collection = db.collection('pokemon');

      // Creazione del nuovo utente
      const pkmn = {
        nome:req.body.nome,
        allenatore:req.body.allenatore,
        tipi:req.body.tipi,
        atk:req.body.atk,
        satk:req.body.satk,
        dif:req.body.dif,
        sdif:req.body.sdif,
        velocita:req.body.velocit,
        dm:req.body.dm,
        exp:req.body.exp,
        sprite:req.body.sprite,
        stato:req.body.stato,
        inbox:req.body.inbox,
        sesso:req.body.sex,
        natura:req.body.natura,
        abilita: req.body.abilita,
        mosse: [],
        evol1: 0,
        evol2:0,
        pv:req.body.puntivita,
        pvmax:req.body.puntivita
      };

      const result = await collection.insertOne(pkmn);
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
  var userData={
    email:mail
  }
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
          console.log(result);
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



function logout(){
  sessionStorage.removeItem("mail");
  window.location.href="/login.html";
}

//------------------------------------------------------Conversione da numero a dado-----------------------------------------------------------------
function classifyAttackStat(stat) {
  if (stat < 40) return 'd4-1';
  if (stat >= 40 && stat <= 59) return 'd4';
  if (stat >= 60 && stat <= 79) return 'd6';
  if (stat >= 80 && stat <= 99) return 'd8';
  if (stat >= 100 && stat <= 119) return 'd10';
  if (stat >= 120 && stat <= 139) return 'd12';
  if (stat >= 140 && stat <= 159) return 'd12+1';
  if (stat >= 160 && stat <= 179) return 'd12+2';
  if (stat >= 180 && stat <= 199) return 'd20-1';
  return 'd20';  // Per stat >= 200
}

// Funzione per classificare le statistiche di difesa (difesa, difesa speciale)
function classifyDefenseStat(stat) {
  if (stat < 40) return 't1';
  if (stat >= 40 && stat <= 59) return 't2';
  if (stat >= 60 && stat <= 79) return 't3';
  if (stat >= 80 && stat <= 99) return 't4';
  if (stat >= 100 && stat <= 119) return 't5';
  if (stat >= 120 && stat <= 139) return 't6';
  if (stat >= 140 && stat <= 159) return 't7';
  if (stat >= 160 && stat <= 179) return 't8';
  if (stat >= 180 && stat <= 199) return 't9';
  return 't10';  // Per stat >= 200
}

//-------------------------------------------------Get pokemon di un utente-------------------------------------------------------------------
async function getuserpkmn() {
  mail=sessionStorage.getItem('mail')
  var userData={
    email: mail
  }
  try {
      // Costruisci l'URL con la query string
      const response = await fetch('/getuserpkmn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
          const result = await response.json();
          console.log(result);
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


app.post('/getuserpkmn', async (req, res) => {
  try {
    const email = req.body.email;  // Ottieni l'email dalla query string
    if (!email) {
      return res.status(400).json('Email non fornita');
    }

    const collection = db.collection('pokemon');
    const presente = await collection.find({ allenatore: email }).toArray();

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

//--------------------------------------Prende i dati di un utente---------------------------------------------------

async function getuserdata() {
  mail=sessionStorage.getItem('mail')
  var userData={
    email: mail
  }
  try {
      // Costruisci l'URL con la query string
      const response = await fetch('/getuserdata', {
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


app.post('/getuserdata', async (req, res) => {
  try {
    const email = req.body.email;  // Ottieni l'email dalla query string
    if (!email) {
      return res.status(400).json('Email non fornita');
    }

    const collection = db.collection('utenti');
    const presente = await collection.find({ nome: email }).toArray();


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


//---------------------------------------Stampa quickteam--------------------------------------------------------------
async function stampaquickteam() {
  var pokemons= await getuserpkmn();

  const container = document.getElementById('colquickteam');
  pokemons.forEach(element => {
    const img = document.createElement('img');
          img.classList.add("imgquick"); // Aggiungi la classe CSS
          img.src = element.sprite; // URL dello sprite
          img.onclick = () => popquickteam(element);

          // Appendi l'immagine al contenitore
          container.appendChild(img);
  });
  
}

function popquickteam(dati){
  document.getElementById("divinterno").style.filter = "blur(2px)";
  const pop=document.createElement("div");
  pop.className="overlay-div";
  pop.innerHTML=`
  


    <div class='row'>
      <div class='col-sm-auto'>
        <img src='${dati.sprite}' class='imgquick' style='height:20vh'>
      </div>
      <div class='col'>
        <div class="row">
          <div class="col"><h5>Att: ${classifyAttackStat(dati.atk)}</h5></div>
          <div class="col"><h5>Dif: ${classifyDefenseStat(dati.dif)}</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>AttS: ${classifyAttackStat(dati.satk)}</h5></div>
          <div class="col"><h5>DifS: ${classifyDefenseStat(dati.sdif)}</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>Vel: ${classifyAttackStat(dati.velocita)}</h5></div>
          <div class="col"><h5>Stato: ${dati.stato}</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>dM: ${classifyAttackStat(dati.dm)}</h5></div>
          <div class="col"><h5>tM: ${classifyDefenseStat(dati.dm)}</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>PV: ${dati.pv}/${dati.pvmax}</h5></div>
          <div class="col"><h5></div>
          <div class="w-100"></div>
          <div class="col">

            <div class="row" style='margin-top:2%'>
              <div class="col-sm-auto"><h5>Sesso: ${dati.sesso}</h5></div>
              <div class="col-sm-auto"><h5>Natura: ${dati.natura}</h5></div>
              <div class="col-sm-auto"><h5>Abilita: ${dati.abilita}</h5></div>
              <div class="col-sm-auto" ><h5 id='tipo'></h5></div>
            </div>           
          </div>
        </div>
      </div>
    </div>
 <br>

  `;
  document.body.appendChild(pop);

  printmosse(dati);
  const container=document.getElementsByClassName('overlay-div')[0];
  const bottone=document.createElement("button");
  bottone.onclick = () => nascondipop();
  bottone.innerHTML="Chiudi";
  bottone.className="btn btn-secondary"
  bottone.style="margin-top:2%";
  container.appendChild(bottone)
  if(dati.tipi[1]=="")
    document.getElementById('tipo').innerHTML=dati.tipi[0];
  else
  document.getElementById('tipo').innerHTML=dati.tipi[0] + '/' + dati.tipi[1];


}
function nascondipop() {
  // Rimuove l'effetto blur dal contenitore principale
  document.getElementById("divinterno").style.filter = "blur(0px)";
  
  // Ottiene tutti gli elementi con la classe "overlay-div"
  const pops = document.getElementsByClassName("overlay-div");
  
  // Converte HTMLCollection in un array e itera
  Array.from(pops).forEach(element => {
    element.remove(); // Rimuove ogni elemento trovato
  });
}

//---------------------------------------Funzione che stampa gli oggetti-------------------------------------------------
async function stampaoggetti() {
  var oggetti= await getuserdata();

  const container = document.getElementById('colquickzaino');
  oggetti[0].inventario.forEach(element => {
    const img = document.createElement('div');
          img.classList.add("item"); // Aggiungi la classe CSS
          img.innerHTML=element.nome;
          img.onclick = () => popitem(element);

          // Appendi l'immagine al contenitore
          container.appendChild(img);
  });
  
}

//---------------funzione per usare item-----------------------

async function usaitem(itemName) {
  mail=sessionStorage.getItem('mail')
  var userData={
    email: mail,
    oggetto: itemName._id
  }
  try {
      // Costruisci l'URL con la query string
      const response = await fetch('/usaitem', {
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
      
  }
  
}

app.post('/usaitem', async (req, res) => {
  try {
    const email = req.body.email;  // Ottieni l'email dell'utente
    const oggettoId = req.body.oggetto; // Ottieni l'_id dell'oggetto
    if (!email || !oggettoId) {
      return res.status(400).json('Email o ID oggetto non forniti');
    }

    const collection = db.collection('utenti');
    const result = await collection.updateOne(
      { nome: email }, // Filtro per trovare l'utente
      { $pull: { inventario: { _id: new ObjectId(oggettoId) } } } // Rimuove l'oggetto con il _id specifico
    );

    if (result.modifiedCount > 0) {
      return res.status(200).json({ success: true, message: 'Oggetto rimosso con successo' });
    } else {
      return res.status(404).json({ success: false, message: 'Oggetto o utente non trovato' });
    }

  } catch (err) {
    console.error('Errore', err);
    res.status(500).send('Errore del server');
  }
});

//----------------funzione per card item------------------------------
function popitem(dati) {
  // Applica un effetto di sfocatura
  document.getElementById("divinterno").style.filter = "blur(2px)";

  // Crea un elemento popup
  const pop = document.createElement("div");
  pop.className = "overlay-div";

  // Aggiungi il contenuto del popup
  pop.innerHTML = `
    <h2>Vuoi utilizzare questo oggetto?</h2>
    <button id="btn-si" class='btn btn-outline-primary'>Si</button>
    <button onclick="nascondipop()" class='btn btn-outline-danger'>No</button>
  `;

  // Aggiungi il popup al body
  document.body.appendChild(pop);

  // Assegna l'evento al pulsante "Si"
  document.getElementById("btn-si").addEventListener("click", function () {
    usaitem(dati); // Passa direttamente l'oggetto dati
    nascondipop();
    window.location.href="homepage.html" // Nascondi il popup dopo aver usato l'oggetto
  });
}

//----------------------------------------Funzione per aggiungere un oggetto------------------------------------------------
async function additem() {
  var nomep= document.getElementById('nomep').value;
  var nomea= document.getElementById('nomea').value;
  
  var userData = {
      nome:nomep,
      allenatore:nomea
      
  };

  try {
      const response = await fetch('/additem', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
      });

      if (response.ok) {
          const result = await response.json();
          alert('Oggetto aggiunto con successo');
      } else {
          const error = await response.text();
          alert('Errore: ' + error);
      }
  } catch (error) {
      console.error('Errore nella richiesta:', error);
      alert('Errore nella richiesta');
  }
};

app.post('/additem', async (req, res) => {

  try {
      const collection = db.collection('utenti');

      // Creazione del nuovo utente


      const result = await collection.updateOne({
        nome:req.body.allenatore
      },{$push:{ inventario: {_id: new ObjectId(), nome: req.body.nome}}});
      res.status(201).json(result);
  } catch (err) {
      console.error('Errore nella creazione dell\'utente', err);
      res.status(500).send('Errore nella creazione dell\'utente');
  }
});

//----------------------------------------Funzione per aggiungere mossa ad un pokemon------------------------------------------
async function aggiungimossa() {
  var nomemossa= document.getElementById('nomemossa').value;
  var tipomossa= document.getElementById('tipomossa').value;
  var tipodanno= document.getElementById('tipodanno').value;
  var descrizionemossa=document.getElementById('descrizione').value;
  var pokeid=document.getElementById('pokemonid').value;
 
  var userData = {
      nome:nomemossa,
      tipom:tipomossa,
      tipod:tipodanno,
      descrizione:descrizionemossa,
      pokemonid:pokeid
  };

  try {
      const response = await fetch('/addmossa', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
      });

      if (response.ok) {
          const result = await response.json();
          alert('Mossa aggiunta con successo!');
      } else {
          const error = await response.text();
          alert('Errore: ' + error);
      }
  } catch (error) {
      console.error('Errore nella richiesta:', error);
      alert('Errore nella richiesta');
  }
}

app.post('/addmossa', async (req, res) => {

  try {
      const collection = db.collection('pokemon');

      // Creazione del nuovo utente


      const result = await collection.updateOne(
        {
          _id: new ObjectId(req.body.pokemonid) // Sostituisci con l'ObjectId del documento
      },
      {
          $push: {
              mosse: {
                nome:req.body.nome,
                tipod:req.body.tipod,
                tipom:req.body.tipom,
                desc:req.body.descrizione
              }
          }
      }
      );
      res.status(201).json(result);
  } catch (err) {
      console.error('Errore aggiunta mossa', err);
      res.status(500).send('Errore aggiunta mossa');
  }
});

function printmosse(element){
  const mosse=element.mosse;
  const container=document.getElementsByClassName('overlay-div')[0];
  mosse.forEach(mossa => {
    const riga = document.createElement('div');
    riga.className='row';
    riga.style="border-bottom:2px groove black; margin-top:2%";
    riga.innerHTML=   `
    <div class="col-sm-3"><h5>${mossa.nome}</h5></div>
    <div class="col-sm-3"><h5>${mossa.tipom}</h5></div>
    <div class="col-sm-2"><h5>${mossa.tipod}</h5></div>
    <div class="col-sm-4"><h5>${mossa.desc}</h5></div>
   `

  container.appendChild(riga);
  });
}