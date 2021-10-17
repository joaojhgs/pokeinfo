const PokemonList = document.getElementById("PokemonList");
const SearchBar = document.getElementById("searchBar");
let pokemonList = [];
const pokeInfoModal = document.getElementById('pokeInfoModal');

//Quando o Modal for aberto, vai pegar a info do pokemon e atualizar o conteudo.
pokeInfoModal.addEventListener('show.bs.modal', function (event) {
    updateModal(event);
});

async function updateModal(pokemon){
        // Button that triggered the modal
        var button = pokemon.relatedTarget
        // Get the id from the button
        var id = button.getAttribute('poke-id');
        // Get the pokeName from the button
        pokeName = button.getAttribute('poke-name')
        

        

        // Update the modal's content.
        var modalTitle = pokeInfoModal.querySelector('.modal-title');
        var pokeHeight = pokeInfoModal.querySelector('.pokeHeight');
        var pokeWeight = pokeInfoModal.querySelector('.pokeWeight');
        var pokeType = pokeInfoModal.querySelector('.pokeType');
        var pokeMoves = pokeInfoModal.querySelector('.pokeMoves');
        var pokeLearnableMoves = pokeInfoModal.querySelector('.pokeLearnableMoves');

        //var modalBodyInput = exampleModal.querySelector('.modal-body input')

        var pokeInfo = await getInfo('pokemon', id);
        console.log(pokeInfo);

        modalTitle.innerHTML = `<img class="img-fluid" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">${pokeName}</img>`

        pokeHeight.textContent = `Height: ${pokeInfo.weight}`;
        pokeWeight.textContent = `Weight: ${pokeInfo.height}`;
        pokeType.innerHTML = '';
        //Create a button (which will filter the list onclick) for each pokemon type the pokemon is part of
        for( let type of pokeInfo.types){
            pokeTypeId = type.type.url.replace("https://pokeapi.co/api/v2/type/","");
            pokeTypeId = pokeTypeId.replace("/", "");

            pokeType.innerHTML += `<button type="button" class="btn btn-outline-primary" onclick="filterByType(${pokeTypeId})" data-bs-dismiss="modal">${type.type.name}</button>`;
        }
        pokeLearnableMoves.textContent = pokeInfo.moves.length;
        //Create a list object for every move the pokemon can learn
        pokeMoves.innerHTML = '';
        for( let move of pokeInfo.moves){
            pokeMoves.innerHTML += `<li class="list-group-item">${move.move.name}</li>`;
        }


}

async function filterByType(id){
    var type = await getInfo('type', id);
    console.log(type);
    var pokemons = type.pokemon;

    let output = ''
    for( let pokemon of pokemons ){
        //No need to fetch the data on load anymore
        //pokemonInfo = await fetch(pokemon.url);
        //pokemonData = await pokemonInfo.json();

        //Get the id by removing the url
        id = pokemon.pokemon.url.replace("https://pokeapi.co/api/v2/pokemon/","");
        id = id.replace("/", "");

        //Load the sprite directly from their repository
        pokemonSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        output += ``
        output += `<button><li class="list-group-item" data-bs-toggle="modal" data-bs-target="#pokeInfoModal" poke-id="${id}" poke-name="${pokemon.pokemon.name}"><img src="${pokemonSprite}"></img>${pokemon.pokemon.name}</li></button>`
    }
    PokemonList.innerHTML = output;
}

SearchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value;
    const filteredPokemonList = pokemonList.filter( pokemon => {
        return pokemon.name.includes(searchString);
    });
    console.log(filteredPokemonList);
    showPlist(filteredPokemonList);
});

async function getInfo(kind, id) {
    const info = await fetch(`https://pokeapi.co/api/v2/${kind}/${id}`);
    var data = await info.json();
    return data;
}

async function getPlist() {
    try {
        //I'm usign a 898 limit because higher id pokemons are just variants / evolutions of the main ones (they'll be shown on the pokemon page)
        const requestList = await fetch('https://pokeapi.co/api/v2/pokemon/?limit=898');
        const data = await requestList.json();
        pokemonList = data.results;
        console.log(pokemonList);
        showPlist(pokemonList);

    } catch (error) {
        console.error(error);
    }
}

async function showPlist(pokemons){
    let output = ''
    for( let pokemon of pokemons ){
        //No need to fetch the data on load anymore
        //pokemonInfo = await fetch(pokemon.url);
        //pokemonData = await pokemonInfo.json();

        //Get the id by removing the url
        id = pokemon.url.replace("https://pokeapi.co/api/v2/pokemon/","");
        id = id.replace("/", "");

        //Load the sprite directly from their repository
        pokemonSprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
        output += ``
        output += `<button><li class="list-group-item" data-bs-toggle="modal" data-bs-target="#pokeInfoModal" poke-id="${id}" poke-name="${pokemon.name}"><img src="${pokemonSprite}"></img>${pokemon.name}</li></button>`
    }
    PokemonList.innerHTML = output;
}

//Fetch the pokemon list when the page is loaded
getPlist();

