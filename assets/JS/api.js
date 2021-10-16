const PokemonList = document.getElementById("PokemonList");
const SearchBar = document.getElementById("searchBar");
let pokemonList = [];

SearchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value;
    const filteredPokemonList = pokemonList.filter( pokemon => {
        return pokemon.name.includes(searchString);
    });
    showPlist(filteredPokemonList);
});

async function getPlist() {
    try {
        const requestList = await fetch('https://pokeapi.co/api/v2/pokemon/?limit=2000000');
        const data = await requestList.json();
        pokemonList = data.results;
        
        showPlist(pokemonList);

    } catch (error) {
        console.error(error);
    }
}

async function showPlist(pokemons){
    let output = ''
    
    for( let pokemon of pokemons ){
        pokemonInfo = await fetch(pokemon.url);
        pokemonData = await pokemonInfo.json();
        output += ``
        output += `<li class="list-group-item"><img src="${pokemonData.sprites.front_default}"></img>${pokemon.name}</li>`
    }
    PokemonList.innerHTML = output;
}

//Fetch the pokemon list when the page is loaded
getPlist();

