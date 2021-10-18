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
        var pokeAbilities = pokeInfoModal.querySelector('.pokeAbilities');
        var pokeStats = pokeInfoModal.querySelector('.pokeStats');

        //var modalBodyInput = exampleModal.querySelector('.modal-body input')

        var pokeInfo = await getInfo('pokemon', id);
        console.log(pokeInfo);

        modalTitle.innerHTML = `<img class="img-fluid" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">${pokeName}</img>`

        pokeHeight.textContent = `Height: ${pokeInfo.height} cm`;
        pokeWeight.textContent = `Weight: ${pokeInfo.weight} kg`;
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
            pokeMoves.innerHTML += `<li class="list-group-item">${(move.move.name.charAt(0).toUpperCase() + move.move.name.slice(1)).replace("-"," ")}</li>`;
        }
        pokeAbilities.innerHTML = '';
        for( let ability of pokeInfo.abilities){
            pokeAbilities.innerHTML += `
            <li class="list-group-item">${(ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)).replace("-"," ")}</li>`;
        }
        pokeStats.innerHTML = '';
        for( let stat of pokeInfo.stats){
            let color = 'bg-success';
            if(stat.stat.name == 'hp') color = 'bg-danger';
            if(stat.stat.name == 'speed') color = 'bg-info';
            if(stat.stat.name == 'attack') color = 'bg-warning';
            if(stat.stat.name == 'defense') color = 'bg-primary';

            pokeStats.innerHTML += `
            <div class="progress vertical">
                <div class="progress-bar ${color} progress-bar-striped" role="progressbar" style="width: ${stat.base_stat}%" aria-valuenow="${stat.base_stat}" aria-valuemin="0" aria-valuemax="100"><strong class="pl-2">${stat.base_stat} ${(stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)).replace("-"," ")}</strong></div>
            </div>`;
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
        output += `
        <li id="pokemon" class="list-group-item shadow-lg card p-2 bd-highlight" data-bs-toggle="modal" data-bs-target="#pokeInfoModal" poke-id="${id}" poke-name="${(pokemon.pokemon.name.charAt(0).toUpperCase() + pokemon.pokemon.name.slice(1)).replace("-"," ")}">
            <center>
                    <img src="${pokemonSprite}"></img>
                        <div class="card-body">
                            <h5 class="card-title">${(pokemon.pokemon.name.charAt(0).toUpperCase() + pokemon.pokemon.name.slice(1)).replace("-"," ")}</h5>
                            <span class="badge bg-secondary">Nº ${id}</span>
                        </div>
            </center>
        </li>
        `
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
        output += `

        <li id="pokemon" class="list-group-item shadow-lg card p-2 bd-highlight" data-bs-toggle="modal" data-bs-target="#pokeInfoModal" poke-id="${id}" poke-name="${(pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)).replace("-"," ")}">
            <center>
                    <img src="${pokemonSprite}"></img>
                        <div class="card-body">
                            <h5 class="card-title">${(pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)).replace("-"," ")}</h5>
                            <span class="badge bg-secondary">Nº ${id}</span>
                        </div>
            </center>
        </li>
        `
    }
    PokemonList.innerHTML = output;
}

//Fetch the pokemon list when the page is loaded
getPlist();