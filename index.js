const { MongoClient, ServerSession } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const bodyParser = require('body-parser');
var cors = require('cors');
const express = require('express');
const path = require('path');
const { log } = require('console');
const { getRandomValues } = require('crypto');
const uri = "mongodb+srv://argentonik:pe2SXS5YdMmYThoc@clusterpkmn.cpxpx.mongodb.net/?retryWrites=true&w=majority&appName=Clusterpkmn";



const app = express();
app.use(cors());
app.use(express.json())

app.use(express.static(__dirname + '/')); //senno non trova gli altri file compresi i css e le altre pagine html

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/login.html'));
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
function utenteloggato() {
    const utente = sessionStorage.getItem("mail");
    if (utente == null)
        return false;
    else
        return true;
}

async function login() {
    const mail = document.getElementById("emaillogin").value;
    const pass = document.getElementById("passlogin").value;
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
            sessionStorage.setItem("mail", mail);
            alert("loggato");
            window.location.href = "/homepage.html";
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

            if (presente.password == req.body.password) {
                res.status(201).json(presente);
            }
            else {
                return res.status(400).json('Credenziali errate');

            }

        }

        else {
            return res.status(400).json('Credenziali errate');

        }


    } catch (err) {
        console.error('Errore durante il login', err);
        res.status(500).send('Errore durante il login');
    }
});

//-----------------------------------Gestione inventario---------------------------------------
//riempimento inventario
async function getuserdata() {
    mail = sessionStorage.getItem('mail')
    var userData = {
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
            return res.status(400).json('Email non fornita acnan');
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

async function stampaoggetti() {
    try {
        const userData = await getuserdata();
        const inventario = userData[0].inventario;
        const container = document.querySelector('.inventory-grid'); // Usa il container esistente
        document.getElementById('nomeallenatore').innerHTML = userData[0].nome;
        document.getElementById('livelloallenatore').innerHTML = userData[0].livello;

        // Aggiorna i soldi
        document.getElementById("hdenari").textContent = `₽${userData[0].soldi}`;

        // Pulisci la griglia
        container.innerHTML = '';

        // Genera gli slot per ogni oggetto
        inventario.forEach(oggetto => {
            const itemSlot = document.createElement('div');
            itemSlot.className = 'inventory-slot';
            itemSlot.innerHTML = `
        <div class="item-icon"></div>
        <div class="item-name">
          <img src="${oggetto.immagine}" 
               alt="${oggetto.nome}" 
               class="item-img"
               onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'">
        </div>
        <div class="item-quantity">${oggetto.nome}</div>
      `;
            itemSlot.onclick = () => { popitem(oggetto); sessionStorage.setItem('item', JSON.stringify(oggetto)) };
            container.appendChild(itemSlot);
        });

    } catch (error) {
        console.error('Errore nel caricamento inventario:', error);
        document.querySelector('.inventory-grid').innerHTML = `
      <div class="error">
        Errore nel caricamento degli oggetti
      </div>
    `;
    }
}

function popitem(oggetto) {
    const pop = document.createElement("div");
    pop.className = "confirmation-overlay";

    // Aggiungi il contenuto del popup
    pop.innerHTML = `
    <div class="confirmation-dialog">
        <h3 class="dialog-title">Vuoi usare questo oggetto?</h3>
        <div class="dialog-buttons">
            <button class="confirm-button yes-button" onclick=usaitem()>Sì</button>
            <button class="confirm-button no-button" onclick=nascondipop()>No</button>
        </div>
    </div>
  `;

    // Aggiungi il popup al body
    document.body.appendChild(pop);
}

function nascondipop() {
    var pop = document.getElementsByClassName('confirmation-overlay')[0];
    sessionStorage.removeItem('item');
    pop.remove();
}

async function usaitem() {
    mail = sessionStorage.getItem('mail')
    itemName = JSON.parse(sessionStorage.getItem('item'));
if(itemName.nome.includes("Ball"))
    alert("Risultato del d100: " + (Math.floor(Math.random() * 100) + 1));
    var userData = {
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
            location.reload();
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


async function additem() {
    var nomep = document.getElementById('nomep').value;
    var nomea = document.getElementById('nomea').value;
    var img = document.getElementById('immagine').value;

    var userData = {
        nome: nomep,
        allenatore: nomea,
        immagine: img

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
            nome: req.body.allenatore
        }, {
            $push: {
                inventario: {
                    _id: new ObjectId(),
                    nome: req.body.nome,
                    immagine: req.body.immagine
                }
            }
        });
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});


//------------------------------------Gestione dei pokemon------------------
async function addpokemon() {
    var nomep = document.getElementById('nomep').value;
    var nomea = document.getElementById('nomea').value;
    var tipo1 = document.getElementById('tipo1').value;
    var tipo2 = document.getElementById('tipo2').value;
    var attacco = document.getElementById('attacco').value;
    var attas = document.getElementById('attas').value;
    var difesa = document.getElementById('difesa').value;
    var difes = document.getElementById('difes').value;
    var vel = document.getElementById('vel').value;
    var dadomedio = document.getElementById('level').value;
    var esperienza = document.getElementById('esperienza').value;
    var immagine = document.getElementById('pokemonImage').value;
    var sesso = document.getElementById('sesso').value;
    var natura = document.getElementById('natura').value;
    var abilita = document.getElementById('abilita').value;
    var pv = document.getElementById('hp').value;
    var hitpointmax = document.getElementById('maxHP').value;
    var evaf = document.getElementById('physEvade').value;
    var evas = document.getElementById('specEvade').value;
    var evav = document.getElementById('speedEvade').value;
    var overland = document.getElementById('over').value;
    var nuoto = document.getElementById('swim').value;
    var volo = document.getElementById('fly').value;
    var infoabilit=document.getElementById('infoabilita').value;
    var infort = '0';
    var userData = {
        nome: nomep,
        allenatore: nomea,
        tipi: [tipo1, tipo2],
        atk: attacco,
        satk: attas,
        dif: difesa,
        sdif: difes,
        velocit: vel,
        dm: dadomedio,
        exp: esperienza,
        sprite: immagine,
        stato: [],
        inbox: '0',
        sex: sesso,
        mosse: [],
        natura: natura,
        abilita: abilita,
        infoabilita: infoabilit,
        puntivita: pv,
        hpmax: hitpointmax,
        evafisica: evaf,
        evaspeciale: evas,
        evavel: evav,
        infortuni: infort,
        over: overland,
        swim: nuoto,
        fly: volo
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
            nome: req.body.nome,
            allenatore: req.body.allenatore,
            tipi: req.body.tipi,
            atk: req.body.atk,
            satk: req.body.satk,
            dif: req.body.dif,
            sdif: req.body.sdif,
            velocita: req.body.velocit,
            livello: req.body.dm,
            exp: req.body.exp,
            sprite: req.body.sprite,
            stato: [],
            inbox: req.body.inbox,
            sesso: req.body.sex,
            natura: req.body.natura,
            abilita: req.body.abilita,
            infoabilita: req.body.infoabilita,
            mosse: [],
            hp: req.body.puntivita,
            pvmax: req.body.puntivita,
            hpmax: req.body.hpmax,
            hpnow: req.body.hpmax,
            evafisica: req.body.evafisica,
            evaspeciale: req.body.evaspeciale,
            evavel: req.body.evavel,
            infortuni: req.body.infortuni,
            over: req.body.over,
            swim: req.body.swim,
            fly: req.body.fly
        };

        const result = await collection.insertOne(pkmn);
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function getuserpkmn() {
    mail = sessionStorage.getItem('mail')
    var userData = {
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
            return res.status(400).json('Email non fornita iuuu');
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

async function stampabox() {
    var pokemons = await getuserpkmn();

    const container = document.getElementById('grigliateambox');
    pokemons.forEach(element => {
        if (element.inbox == 1) {
            const img = document.createElement('div');
            img.classList.add("team-slot"); // Aggiungi la classe CSS
            img.innerHTML = `<img src="${element.sprite}"
            class="pokemon-img-home" >
                <div class="pokemon-info">
                    <div class="pokemon-name">${element.nome}</div>
                    <div class="pokemon-level">Lv. ${element.livello}</div>
                </div>`
            img.onclick = () => {
                sessionStorage.setItem('pokemon', JSON.stringify(element));
                popitembox(element._id, "Vuoi prelevare questo Pokémon?");



            };

            // Appendi l'immagine al contenitore
            container.appendChild(img);
        }

    });

}


async function stampadeposita() {
    var pokemons = await getuserpkmn();

    const container = document.getElementById('grigliateam');
    pokemons.forEach(element => {
        if (element.inbox == 0) {
            const img = document.createElement('div');
            img.classList.add("team-slot"); // Aggiungi la classe CSS
            img.innerHTML = `<img src="${element.sprite}"
            class="pokemon-img-home" >
                <div class="pokemon-info">
                    <div class="pokemon-name">${element.nome}</div>
                    <div class="pokemon-level">Lv. ${element.livello}</div>
                </div>`
            img.onclick = () => {
                sessionStorage.setItem('pokemon', JSON.stringify(element));
                popitembox(element._id, "Vuoi depositare questo Pokémon?");


            };

            // Appendi l'immagine al contenitore
            container.appendChild(img);
        }

    });

}

function popinfoabilita() {

    const pop = document.createElement("div");
    pop.className = "confirmation-overlay";
    const infoabilita=JSON.parse(sessionStorage.getItem('pokemon')).infoabilita;
    const abilita=JSON.parse(sessionStorage.getItem('pokemon')).abilita;

    // Aggiungi il contenuto del popup
    pop.innerHTML = `
    <div class="confirmation-dialog">
        <h3 class="dialog-title">${abilita}</h3>
        ${infoabilita}            
        <div class="dialog-buttons">
            <button class="confirm-button no-button" onclick=nascondiinfostato()>Chiudi</button>
        </div>
    </div>
  `;

    // Aggiungi il popup al body
    document.body.appendChild(pop);
}


function popitembox(id, frase) {
    const pop = document.createElement("div");
    pop.className = "confirmation-overlay";

    // Aggiungi il contenuto del popup
    if (frase == 'Vuoi depositare questo Pokémon?') {
        pop.innerHTML = `
    <div class="confirmation-dialog">
        <h3 class="dialog-title">${frase}</h3>
        <div class="dialog-buttons">
            <button class="confirm-button yes-button" onclick=depositapokemon('${id}')>Sì</button>
            <button class="confirm-button no-button" onclick=nascondipop()>No</button>
        </div>
    </div>
  `;
    }
    else {
        pop.innerHTML = `
    <div class="confirmation-dialog">
        <h3 class="dialog-title">${frase}</h3>
        <div class="dialog-buttons">
            <button class="confirm-button yes-button" onclick=prelevapokemon('${id}')>Sì</button>
            <button class="confirm-button no-button" onclick=nascondipop()>No</button>
        </div>
    </div>
  `;
    }

    // Aggiungi il popup al body
    document.body.appendChild(pop);
}

function nascondipop() {
    var pop = document.getElementsByClassName('confirmation-overlay')[0];
    sessionStorage.removeItem('item');
    pop.remove();
}

async function stampaquickteam() {
    var pokemons = await getuserpkmn();

    const container = document.getElementById('grigliateam');
    pokemons.forEach(element => {

        if (element.inbox == 0 && parseInt(element.hpnow) > 0) {
            const img = document.createElement('div');
            img.classList.add("team-slot"); // Aggiungi la classe CSS
            img.innerHTML = `<img src="${element.sprite}"
            class="pokemon-img-home" >
                <div class="pokemon-info">
                    <div class="pokemon-name">${element.nome}</div>
                    <div class="pokemon-level">Lv. ${element.livello}</div>
                </div>`
            img.onclick = () => {
                sessionStorage.setItem('pokemon', JSON.stringify(element));
                location.href = "controlli.html";


            };

            // Appendi l'immagine al contenitore
            container.appendChild(img);
        }

    });

}

async function stampaquickteamselvatici() {
    var pokemons = await getuserpkmn();

    const container = document.getElementById('grigliateam');
    pokemons.forEach(element => {
        if (element.inbox == 0 && parseInt(element.hpnow) > 0) {
            const img = document.createElement('div');
            img.classList.add("team-slot"); // Aggiungi la classe CSS
            img.innerHTML = `<img src="${element.sprite}"
            class="pokemon-img-home" >
                <div class="pokemon-info">
                    <div class="pokemon-name">${element.nome}</div>
                    <div class="pokemon-level">Lv. ${element.livello}</div>
                </div>`
            img.onclick = () => {
                sessionStorage.setItem('pokemon', JSON.stringify(element));
                location.href = "selvatici.html";


            };

            // Appendi l'immagine al contenitore
            container.appendChild(img);
        }

    });

}


async function stampatuttipokemon() {
    var pokemons = await getuserpkmn();

    const container = document.getElementById('grigliateam');
    pokemons.forEach(element => {

        const img = document.createElement('div');
        img.classList.add("team-slot"); // Aggiungi la classe CSS
        img.innerHTML = `<img src="${element.sprite}"
            class="pokemon-img-home" >
                <div class="pokemon-info">
                    <div class="pokemon-name">${element.nome}</div>
                    <div class="pokemon-level">Lv. ${element.livello}</div>
                </div>`
        img.onclick = () => {
            sessionStorage.setItem('pokemon', JSON.stringify(element));
            location.href = "readonly.html";


        };

        // Appendi l'immagine al contenitore
        container.appendChild(img);


    });

}


function stampapokemon() {
    const pokemon = JSON.parse(sessionStorage.getItem('pokemon'));
    document.getElementById('nome').innerHTML = pokemon.nome;
    document.getElementById('livello').innerHTML = pokemon.livello;
    document.getElementById('esperienza').innerHTML = pokemon.exp;
    document.getElementById('sesso').innerHTML = pokemon.sesso;
    document.getElementById('natura').innerHTML = pokemon.natura;
    document.getElementById('abilita').innerHTML = pokemon.abilita;
    document.getElementById('sprite').src = pokemon.sprite;

    document.getElementById('hpnow').innerHTML = pokemon.hpnow;
    document.getElementById('hp').innerHTML = pokemon.pvmax;
    document.getElementById('atk').innerHTML = pokemon.atk;
    document.getElementById('satk').innerHTML = pokemon.satk;
    document.getElementById('def').innerHTML = pokemon.dif;
    document.getElementById('sdef').innerHTML = pokemon.sdif;
    document.getElementById('vel').innerHTML = pokemon.velocita;
    document.getElementById('fev').innerHTML = pokemon.evafisica;
    document.getElementById('sev').innerHTML = pokemon.evaspeciale;
    document.getElementById('vev').innerHTML = pokemon.evavel;
    document.getElementById('over').innerHTML = pokemon.over;
    document.getElementById('swim').innerHTML = pokemon.swim;
    document.getElementById('fly').innerHTML = pokemon.fly;
    document.getElementById('infortuni').innerHTML = pokemon.infortuni;

    var hpmax = parseInt(pokemon.hpmax);
    hpmax = parseInt(hpmax - (hpmax * 0.1 * parseInt(pokemon.infortuni)));

    document.getElementById('hpmax').innerHTML = hpmax;

    //stampo tipi dei pokemon
    const container = document.getElementById('grigliatipi');
    const tipi = JSON.parse(sessionStorage.getItem('pokemon')).tipi;
    if (tipi[0] != '') {
        const img = document.createElement('span');
        img.classList.add('type-badge');
        img.classList.add(supportoclasse(tipi[0]));
        // Aggiungi la classe CSS
        img.innerHTML = tipi[0];
        container.appendChild(img);
    }
    if (tipi[1] != '') {
        const img = document.createElement('span');
        img.classList.add('type-badge');
        img.classList.add(supportoclasse(tipi[1]));
        img.innerHTML = tipi[1];
        container.appendChild(img);
    }

}

function stampapokemonselvatici() {
    const pokemon = JSON.parse(sessionStorage.getItem('pokemon'));
    document.getElementById('nome').innerHTML = pokemon.nome;
    document.getElementById('livello').innerHTML = pokemon.livello;
    document.getElementById('esperienza').innerHTML = pokemon.exp;
    document.getElementById('sesso').innerHTML = pokemon.sesso;
    document.getElementById('natura').innerHTML = pokemon.natura;
    document.getElementById('abilita').innerHTML = pokemon.abilita;
    document.getElementById('sprite').src = pokemon.sprite;

    document.getElementById('hpnow').value = pokemon.hpnow;
    document.getElementById('hp').value = pokemon.pvmax;
    document.getElementById('atk').value = pokemon.atk;
    document.getElementById('satk').value = pokemon.satk;
    document.getElementById('def').value = pokemon.dif;
    document.getElementById('sdef').value = pokemon.sdif;
    document.getElementById('vel').value = pokemon.velocita;
    document.getElementById('fev').value = pokemon.evafisica;
    document.getElementById('sev').value = pokemon.evaspeciale;
    document.getElementById('vev').value = pokemon.evavel;
    document.getElementById('infortuni').value = pokemon.infortuni;

    var hpmax = parseInt(pokemon.hpmax);
    hpmax = parseInt(hpmax - (hpmax * 0.1 * parseInt(pokemon.infortuni)));

    document.getElementById('hpmax').value = hpmax;

    //stampo tipi dei pokemon
    const container = document.getElementById('grigliatipi');
    const tipi = JSON.parse(sessionStorage.getItem('pokemon')).tipi;
    if (tipi[0] != '') {
        const img = document.createElement('span');
        img.classList.add('type-badge');
        img.classList.add(supportoclasse(tipi[0]));
        // Aggiungi la classe CSS
        img.innerHTML = tipi[0];
        container.appendChild(img);
    }
    if (tipi[1] != '') {
        const img = document.createElement('span');
        img.classList.add('type-badge');
        img.classList.add(supportoclasse(tipi[1]));
        img.innerHTML = tipi[1];
        container.appendChild(img);
    }

}

function calcolavalorecs(valore){
    if (valore == '-6')
        return 0.4;
    if (valore == '-5')
        return 0.5;
    if (valore == '-4')
        return 0.6;
    if (valore == '-3')
        return 0.7;
    if (valore == '-2')
        return 0.8;
    if (valore == '-1')
        return 0.9;
    if (valore == '0')
        return 1;
    if (valore == '+1')
        return 1.2;
    if (valore == '+2')
        return 1.4;
    if (valore == '+3')
        return 1.6;
    if (valore == '+4')
        return 1.8;
    if (valore == '+5')
        return 2;
    if (valore == '+6')
        return 2.2;
    
}

function getpokemonstat(stat){
    const pokemon=JSON.parse(sessionStorage.getItem('pokemon'));
    if (stat=='atk')
        return parseInt(pokemon.atk);
    if (stat=='def')
        return parseInt(pokemon.dif);
    if (stat=='satk')
        return parseInt(pokemon.satk);
    if (stat=='sdef')
        return parseInt(pokemon.sdif);
    if (stat=='vel')
        return parseInt(pokemon.velocita);
}

function combatstage(tipo,valore){

    var valoreattuale=getpokemonstat(tipo);
    var aggiornato= parseInt(valoreattuale*calcolavalorecs(valore));
    document.getElementById(tipo).innerHTML=aggiornato;
}

function combatstageselvatico(tipo,valore){
     ricalcolaselvatico();
    var valoreattuale=document.getElementById(tipo).value;
    var aggiornato= parseInt(valoreattuale*calcolavalorecs(valore));
    document.getElementById(tipo).value=aggiornato;
}

function ricalcolaselvatico(){
        let poke = JSON.parse(sessionStorage.getItem("pokemon")); // Assicurati che sia salvato con questa chiave
    if (!poke) return;

    let livello = parseInt(document.getElementById("livelloselvatico").value);

    let stats = [
        { nome: "HP", val: parseInt(poke.hp) },
        { nome: "ATK", val: parseInt(poke.atk) },
        { nome: "DEF", val: parseInt(poke.dif) },
        { nome: "SPATK", val: parseInt(poke.satk) },
        { nome: "SPDEF", val: parseInt(poke.sdif) },
        { nome: "VEL", val: parseInt(poke.velocita) }
    ];

    let punti = livello + 10;
    let ordine = [...stats].sort((a, b) => b.val - a.val);

    function mantieneGerarchia() {
        let ordAttuale = [...ordine].sort((a, b) => b.val - a.val);
        for (let i = 0; i < ordAttuale.length - 1; i++) {
            if (ordAttuale[i].val < ordAttuale[i+1].val) return false;
        }
        return true;
    }

    // Distribuzione base
    let tentativi = 0;
    while (punti > 0 && tentativi < 10000) {
        tentativi++;
        for (let i = 0; i < ordine.length && punti > 0; i++) {
            let candidato = ordine[i];
            candidato.val++;
            if (mantieneGerarchia()) {
                punti--;
            } else {
                candidato.val--; // rollback
            }
        }
    }

    // Fallback distribuzione a blocchi
    while (punti > 0) {
        let assegnato = false;
        for (let i = 0; i < ordine.length && punti > 0; i++) {
            let candidato = ordine[i];
            let toAdd = Math.min(2, punti);
            candidato.val += toAdd;
            if (mantieneGerarchia()) {
                punti -= toAdd;
                assegnato = true;
            } else {
                candidato.val -= toAdd;
            }
        }
        if (!assegnato) break;
    }

    // Calcolo statistiche derivate
    let hpFinal = ordine.find(o => o.nome === "HP").val;
    let defFinal = ordine.find(o => o.nome === "DEF").val;
    let spdefFinal = ordine.find(o => o.nome === "SPDEF").val;
    let velFinal = ordine.find(o => o.nome === "VEL").val;

    let hpmax = livello + (hpFinal * 3) + 10;

    function calcEvasion(statVal) {
        const base = Math.floor(statVal / 5);
        const bonus = Math.min(6, base);
        return base + bonus;
    }

    let evafisica = calcEvasion(defFinal);
    let evaspeciale = calcEvasion(spdefFinal);
    let evavel = calcEvasion(velFinal);

    // Aggiorna la pagina
    document.getElementById("hp").value = hpFinal;
    document.getElementById("atk").value = ordine.find(o => o.nome === "ATK").val;
    document.getElementById("def").value = defFinal;
    document.getElementById("satk").value = ordine.find(o => o.nome === "SPATK").val;
    document.getElementById("sdef").value = spdefFinal;
    document.getElementById("vel").value = velFinal;
    document.getElementById("hpmax").value = hpmax;
    document.getElementById("hpnow").value = hpmax;
    document.getElementById("fev").value = evafisica;
    document.getElementById("sev").value = evaspeciale;
    document.getElementById("vev").value = evavel;
}

async function getpkmn() {
    itemName = JSON.parse(sessionStorage.getItem('pokemon'));
    var userData = {
        oggetto: itemName._id
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/getpkmn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            sessionStorage.setItem('pokemon', JSON.stringify(result[0]));
            location.reload();

            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/getpkmn', async (req, res) => {
    try {
        const oggettoId = req.body.oggetto; // Ottieni l'_id dell'oggetto
        if (!oggettoId) {
            return res.status(400).json('Email o ID oggetto non forniti');
        }

        const collection = db.collection('pokemon');
        const presente = await collection.find({ _id: new ObjectId(oggettoId) }).toArray();


        if (presente) {
            return res.status(200).json(presente);  // 200 significa "successo"
        } else {
            return res.status(404).json('pokemon non trovato');  // Usa 404 per "non trovato"
        }


    } catch (err) {
        console.error('Errore', err);
        res.status(500).send('Errore del server');
    }
});

function stampastati() {
    const stati = JSON.parse(sessionStorage.getItem('pokemon')).stato;
    if (stati.length > 0) {
        stati.forEach(element => {
            document.getElementById(element).checked = true
            var label = 'label' + element;
            var classe = supportostato(element);
            document.getElementById(label).classList = "status-label " + classe;

        });
    }
}

function popinfostato() {

    const pop = document.createElement("div");
    pop.className = "confirmation-overlay";

    // Aggiungi il contenuto del popup
    pop.innerHTML = `
    <div class="confirmation-dialog">
        <h3 class="dialog-title">Leggenda stati</h3>
            <div style='border-bottom: inherit; margin-bottom:5px'> Bruciato: -2 CS in Difesa; perde 1 Tick a fine turno se compie (o fallisce) 
                un'azione standard. I Pokémon Fuoco sono immuni.</div>
            <div style='border-bottom: inherit; margin-bottom:5px'>Congelato: impossibile agire; tiro salvezza DC 16 per scongelarsi. Tipo Fuoco 
                ha DC 11, tipo Ghiaccio è immune.</div>
                <div style='border-bottom: inherit; margin-bottom:5px'>Paralizzato: -4 CS in Velocità; tiro salvezza DC 5 a inizio turno per agire. Tipo 
Elettro è immune.</div>
                <div style='border-bottom: inherit; margin-bottom:5px'> Avvelenato: -2 CS in Difesa Speciale; perde 1 TICK se compie o fallisce 
un'azione standard. Tipo Veleno e Acciaio sono immuni.</div>
                <div style='border-bottom: inherit; margin-bottom:5px'> Confuso:  All'inizio del proprio turno, un bersaglio confuso deve effettuare 
un tiro salvezza:<br>
 - Con un risultato di 1-8, il bersaglio colpisce se stesso con un attacco fisico 
senza tipo come azione standard. Non può compiere altre azioni in questo 
turno. Questo attacco colpisce automaticamente e infligge danni come se fosse resistito di 1 grado.<br>
 - Con un risultato di 9-15, il bersaglio può agire normalmente.<br>
 - Con un risultato di 16 o superiore, il bersaglio viene curato dalla confusione.</div>


            
        <div class="dialog-buttons">
            <button class="confirm-button no-button" onclick=nascondiinfostato()>Chiudi</button>
        </div>
    </div>
  `;

    // Aggiungi il popup al body
    document.body.appendChild(pop);
}

function nascondiinfostato() {
    var pop = document.getElementsByClassName('confirmation-overlay')[0];
    pop.remove();
}


async function modificastato(stato) {
    if (document.getElementById(stato).checked) {
        await addstato(stato);
        await getpkmn();


    }
    else {
        await removestato(stato);
        await getpkmn();
    }
}


async function addstato(stato) {

    idpokemon = JSON.parse(sessionStorage.getItem('pokemon'))._id;
    var userData = {
        aggiunta: stato,
        id: idpokemon

    };

    try {
        const response = await fetch('/addstato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
}

app.post('/addstato', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne({
            _id: new ObjectId(req.body.id)
        }, {
            $push: {
                stato: req.body.aggiunta
            }
        });
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function removestato(stato) {

    idpokemon = JSON.parse(sessionStorage.getItem('pokemon'))._id;
    var userData = {
        aggiunta: stato,
        id: idpokemon

    };

    try {
        const response = await fetch('/removestato', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
}

app.post('/removestato', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne({
            _id: new ObjectId(req.body.id)
        }, {
            $pull: {
                stato: req.body.aggiunta
            }
        });
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function modificahp(valore) {
    var hpattuali = JSON.parse(sessionStorage.getItem('pokemon')).hpnow;
    hpattuali = parseInt(hpattuali) + valore;
    hpattuali = hpattuali.toString();
    idpokemon = JSON.parse(sessionStorage.getItem('pokemon'))._id;
    var userData = {
        hp: hpattuali,
        id: idpokemon
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/modificahp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            if (parseInt(hpattuali) <= 0) {
                alert(JSON.parse(sessionStorage.getItem('pokemon')).nome + ' è svenuto');
                location.href = '/homepage.html';
                sessionStorage.removeItem('pokemon');
                return result;
            }
            await getpkmn();
            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/modificahp', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne(
            { _id: new ObjectId(req.body.id) },
            { $set: { hpnow: req.body.hp } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nell aggiornamento degli hp', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function modificainfortuni(valore) {
    var hpattuali = JSON.parse(sessionStorage.getItem('pokemon')).infortuni;
    hpattuali = parseInt(hpattuali) + valore;
    hpattuali = hpattuali.toString();
    idpokemon = JSON.parse(sessionStorage.getItem('pokemon'))._id;
    var userData = {
        hp: hpattuali,
        id: idpokemon
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/modificainfortuni', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            await getpkmn();
            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/modificainfortuni', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne(
            { _id: new ObjectId(req.body.id) },
            { $set: { infortuni: req.body.hp } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nell aggiornamento degli hp', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

//---------------------------crezione tipi------------------------------

function supportoclasse(valore) {
    if (valore == 'Elettro')
        return "type-electric";
    if (valore == 'Normale')
        return "type-normal";
    if (valore == 'Fuoco')
        return "type-fire";
    if (valore == 'Acqua')
        return "type-water";
    if (valore == 'Erba')
        return "type-grass";
    if (valore == 'Ghiaccio')
        return "type-ice";
    if (valore == 'Lotta')
        return "type-fighting";
    if (valore == 'Veleno')
        return "type-poison";
    if (valore == 'Terra')
        return "type-ground";
    if (valore == 'Volante')
        return "type-flying";
    if (valore == 'Psico')
        return "type-psychic";
    if (valore == 'Coleottero')
        return "type-bug";
    if (valore == 'Roccia')
        return "type-rock";
    if (valore == 'Spettro')
        return "type-ghost";
    if (valore == 'Drago')
        return "type-dragon";
    if (valore == 'Buio')
        return "type-dark";
    if (valore == 'Acciaio')
        return "type-steel";
    if (valore == 'Folletto')
        return "type-fairy";
}


function supportostato(valore) {
    if (valore == 'Avvelenato')
        return "type-poison";
    if (valore == 'Paralizzato')
        return "type-electric";
    if (valore == 'Addormentato')
        return "type-normal";
    if (valore == 'Scottato')
        return "type-fighting";
    if (valore == 'Congelato')
        return "type-ice";
    if (valore == 'Confuso')
        return "type-psychic";

}

//----------------------------------------depositare pokemon----------------------
async function depositapokemon(idpokemon) {
    var userData = {

        id: idpokemon
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/depositapokemon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            location.reload();
            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/depositapokemon', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne(
            { _id: new ObjectId(req.body.id) },
            { $set: { inbox: '1' } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nell aggiornamento degli hp', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function prelevapokemon(idpokemon) {
    var userData = {

        id: idpokemon
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/prelevapokemon', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            location.reload();
            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/prelevapokemon', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente
        const result = await collection.updateOne(
            { _id: new ObjectId(req.body.id) },
            { $set: { inbox: '0' } }
        );
        if (result.matchedCount === 0) {
            return res.status(404).send('Pokémon non trovato');
        }
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nell aggiornamento degli hp', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

///--------------------Aggiunta mosse------------------------------
async function aggiungimossa() {
    var idpokemon = document.getElementById('idpokemon').value;
    var imossa = document.getElementById('nomemossa').value;

    var userData = {
        id: idpokemon,
        mossa: imossa
    }

    try {
        const response = await fetch('/aggiungimossa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Mossa aggiunto con successo');
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
};

app.post('/aggiungimossa', async (req, res) => {

    try {
        const collection = db.collection('pokemon');

        // Creazione del nuovo utente


        const result = await collection.updateOne({
            _id: new ObjectId(req.body.id)
        }
            , {
                $push: {
                    mosse: req.body.mossa                    
                }
            });
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function caricamossa() {
    var imossa = document.getElementById('nomemossa').value;
    var ifrequenza = document.getElementById('freq').value + ' '+ document.getElementById('quantita').value;;
    var iac = document.getElementById('ac').value;
    var idanno = document.getElementById('danno').value;
    var iclasse = document.getElementById('classe').value ;
    var irange = document.getElementById('range').value;
    var itipo = document.getElementById('tipo').value;
    var iinformazioni = document.getElementById('informazioni').value;
    var userData = {
        mossa: imossa,
        frequenza: ifrequenza,
        ac: iac,
        danno: idanno,
        classe: iclasse,
        range: irange,
        tipo: itipo,
        informazioni: iinformazioni
    }

    try {
        const response = await fetch('/caricamossa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            alert('Mossa aggiunto con successo');
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }
};

app.post('/caricamossa', async (req, res) => {

    try {
        const collection = db.collection('mosse');

        // Creazione del nuovo utente
        const aggiunta={
                
                        mossa: req.body.mossa,
                        frequenza: req.body.frequenza,
                        ac: req.body.ac,
                        danno: req.body.danno,
                        classe: req.body.classe,
                        range: req.body.range,
                        tipo: req.body.tipo,
                        informazioni: req.body.informazioni
                    
                }

        const result = await collection.insertOne(aggiunta);
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function getmossa(nomemossa) {
    var userData = {
        mossa: nomemossa
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/getmossa', {
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


app.post('/getmossa', async (req, res) => {
    try {
        const email = req.body.mossa;
    
         // Ottieni l'email dalla query string
        if (!email) {
            return res.status(400).json('Email non fornitarinorino');
        }

        const collection = db.collection('mosse');
        const presente = await collection.find({ mossa: email }).toArray();


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

async function stampamosse() {
    const poke = JSON.parse(sessionStorage.getItem('pokemon'));
    const mosse = poke.mosse;
    const tipo1 = poke.tipi[0];
    const tipo2 = poke.tipi[1];

    console.log(mosse);

    const container = document.getElementById('grigliamosse');
    container.innerHTML = ""; // pulizia prima di stampare

    for (const mossa of mosse) {
        
        const elemento = await getmossa(mossa);
        const element=elemento[0];

        let damagebase;
        if (element.tipo === tipo1 || element.tipo === tipo2)
            damagebase = stampadadomossa(parseInt(element.danno) + 2);
        else
            damagebase = stampadadomossa(parseInt(element.danno));

        const card = document.createElement('div');
        card.className = "move-card";
        card.innerHTML = ` 
            <div class="move-header">
                <h3 class="move-name">${element.mossa}</h3>
                <span class="move-type ${supportoclasse(element.tipo)}">${element.tipo}</span>
            </div>
            <div class="move-details">
                <div class="move-detail">
                    <h4>Freq.</h4>
                    <div class="read-only-value">${element.frequenza}</div>
                </div>
                <div class="move-detail">
                    <h4>AC</h4>
                    <div class="read-only-value">${element.ac}</div>
                </div>
                <div class="move-detail">
                    <h4>Danno</h4>
                    <div class="read-only-value">${damagebase}</div>
                </div>
                <div class="move-detail">
                    <h4>Classe</h4>
                    <div class="read-only-value">${element.classe}</div>
                </div>
                <div class="move-detail">
                    <h4>Range</h4>
                    <div class="read-only-value">${element.range}</div>
                </div>
            </div>
            <div class="move-detail">
            <h4>Informazioni</h4>
                <div class="read-only-value">${element.informazioni}</div>
            </div>`;
        
        container.appendChild(card);
    }
}


function stampadadomossa(damagebase) {
    if (damagebase == 1)
        return '1d6+1'
    if (damagebase == 2)
        return '1d6+3'
    if (damagebase == 3)
        return '1d6+5'
    if (damagebase == 4)
        return '1d8+6'
    if (damagebase == 5)
        return '1d8+8'
    if (damagebase == 6)
        return '2d6+8'
    if (damagebase == 7)
        return '2d6+10'
    if (damagebase == 8)
        return '2d8+10'
    if (damagebase == 9)
        return '2d10+10'
    if (damagebase == 10)
        return '3d8+10'
    if (damagebase == 11)
        return '3d10+10'
    if (damagebase == 12)
        return '3d12+10'
    if (damagebase == 13)
        return '4d10+10'
    if (damagebase == 14)
        return '4d10+15'
    if (damagebase == 15)
        return '4d10+20'
    if (damagebase == 16)
        return '5d10+20'
    if (damagebase == 17)
        return '5d12+25'
    if (damagebase == 18)
        return '6d12+25'
    if (damagebase == 19)
        return '6d12+30'
    if (damagebase == 20)
        return '6d12+35'
    if (damagebase == 21)
        return '6d12+40'
    if (damagebase == 22)
        return '6d12+45'
    if (damagebase == 23)
        return '6d12+50'
    if (damagebase == 24)
        return '6d12+55'
    if (damagebase == 25)
        return '6d12+60'
    if (damagebase == 26)
        return '7d12+65'
    if (damagebase == 27)
        return '8d12+70'
    if (damagebase == 28)
        return '8d12+80'
    else
        return '-'
}

//---------------------------------cura team-------------------------------
async function curateam() {
    var team = await getuserpkmn();
    team.forEach(element => {
        if (element.inbox == '0') {
            cura(element);
        }
        alert('Il tuo team è stato curato!')

    });
}

async function cura(element) {
    var userData = {
        idpokemon: element._id,
        hpnow: element.hpmax,
        stato: []
    }
    try {
        const response = await fetch('/cura', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);
        alert('Errore nella richiesta');
    }


}

app.post('/cura', async (req, res) => {
    try {


        // Verifica ID valido
        if (!ObjectId.isValid(req.body.idpokemon)) {
            return res.status(400).send('ID non valido');
        }

        const collection = db.collection('pokemon');

        // Aggiornamento del documento
        const result = await collection.updateOne(
            { _id: new ObjectId(req.body.idpokemon) },
            { $set: { hpnow: req.body.hpnow, stato: req.body.stato, infortuni:"0" } }
        );

        // Controllo del risultato
        if (result.matchedCount === 0) {
            return res.status(404).send('Documento non trovato');
        }

        res.status(201).json(result);
    } catch (err) {
        console.error('Errore durante l\'aggiornamento del documento', err);
        res.status(500).send('Errore del server');
    }
});

//----------------------------------Gestione mercato----------------------------
async function stampasoldi() {
    const utente = await getuserdata();
    document.getElementById('soldimercato').innerHTML = ` ₽${utente[0].soldi}`

}

async function acquistaoggetto(oggetto, costo) {
    const imgElement = oggetto.querySelector('img');
    const nomeo = oggetto.getElementsByClassName('item-icon')[0].innerHTML;
    const src = imgElement.getAttribute('src');
    const nomea = sessionStorage.getItem('mail');
    var disposizione = await getuserdata();


    if (costo > disposizione[0].soldi)
        return alert('Non hai abbastanza soldi');
    else {



        var userData = {
            nome: nomeo,
            allenatore: nomea,
            immagine: src

        };

        try {
            const response = await fetch('/compraoggetto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const result = await response.json();
                await spendi(costo);
                alert('Acquisto avvenuto con successo');

            } else {
                const error = await response.text();
                alert('Errore: ' + error);
            }
        } catch (error) {
            console.error('Errore nella richiesta:', error);
            alert('Errore nella richiesta');
        }
    }



};

app.post('/compraoggetto', async (req, res) => {

    try {
        const collection = db.collection('utenti');

        // Creazione del nuovo utente


        const result = await collection.updateOne({
            nome: req.body.allenatore
        }, {
            $push: {
                inventario: {
                    _id: new ObjectId(),
                    nome: req.body.nome,
                    immagine: req.body.immagine
                }
            }
        });
        res.status(201).json(result);
    } catch (err) {
        console.error('Errore nella creazione dell\'utente', err);
        res.status(500).send('Errore nella creazione dell\'utente');
    }
});

async function spendi(costo) {
    const utente = await getuserdata();
    soldi = utente[0].soldi;
    nuovosaldo = soldi - costo;
    nomeu = sessionStorage.getItem('mail');


    var userData = {
        email: nomeu,
        soldi: nuovosaldo
    }
    try {
        // Costruisci l'URL con la query string
        const response = await fetch('/spendi', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            location.reload();
            return result;
        } else {
            const error = await response.text();
            alert('Errore: ' + error);
        }
    } catch (error) {
        console.error('Errore nella richiesta:', error);

    }

}

app.post('/spendi', async (req, res) => {
    try {
        const email = req.body.email;  // Ottieni l'email dell'utente

        if (!email) {
            return res.status(400).json('Email o ID oggetto non forniti');
        }

        const collection = db.collection('utenti');
        const result = await collection.updateOne(
            { nome: email }, // Filtro per trovare l'utente
            { $set: { soldi: req.body.soldi } } // Rimuove l'oggetto con il _id specifico
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