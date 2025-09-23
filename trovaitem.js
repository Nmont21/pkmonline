async function fetchPokemon(numero) {
  try {
      const response = await fetch(`https://pokeapi.co/api/v2/item/${numero}`);
      if (!response.ok) {
          console.error(`Pokémon ${numero} non trovato`);
          return null; // Restituisci null per gestire l'errore
      }
      const data = await response.json();
      return data; // Restituisce il nome del Pokémon
  } catch (error) {
      console.error("Errore nella richiesta:", error);
      return null;
  }
}

// Funzione async per il ciclo
async function fetchAllPokemon() {
  for (let index = 17; index <= 98; index++) { // Inizia da 1 (il primo Pokémon è Bulbasaur)
      const oggetto = await fetchPokemon(index);
      if (oggetto) { // Stampa solo se il Pokémon esiste
          console.log(`${index} - ${oggetto.name} - ${oggetto.sprites.default}`);
      }
  }
}

// Esegui la funzione
fetchAllPokemon();