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
        abilita:abilita
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
        sesso:req.body.sex
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
    <div class='row'>
      <div class='col-sm-auto'>
        <img src='${dati.sprite}' class='imgquick' style='height:20vh'>
      </div>
      <div class='col'>
        <div class="row">
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="w-100"></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="col"><h5>att: d4-1</h5></div>
          <div class="w-100"></div>
          <div class="col">
            <div class="row" style='margin-top:2%'>
              <div class="col-sm-auto"><h5>Sesso: M</h5></div>
              <div class="col-sm-auto"><h5>Natura: Tranquilla</h5></div>
              <div class="col-sm-auto"><h5>Abilita: Aiutofuoco</h5></div>
              <div class="col-sm-auto"><h5>Stato: Normale</h5></div>
            </div> 
          </div>
        </div>
      </div>
    </div>
 </div><br>
 <div class='row' style='border-bottom:2px groove black'>
   <div class="col-sm-4" ><h5>Attacco d'ala</h5></div>
   <div class="col-sm-4"><h5>Normale</h5></div>
   <div class="col-sm-4 "><h5>Probabilita confisio antonio mamma mia  del 30%</h5></div>
 </div>
  <div class='row' style='border-bottom:2px groove black'>
   <div class="col-sm-4" ><h5>Attacco d'ala</h5></div>
   <div class="col-sm-4"><h5>Normale</h5></div>
   <div class="col-sm-4 "><h5>Probabilita confisio antonio mamma mia  del 30%</h5></div>
 </div>

 

      <button class="btn btn-secondary " id="btnannulla" onclick="nascondipop()">Chiudi</button>
  `;
  document.body.appendChild(pop);

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
