//Constant global variables that refer to important parts of the index.html;
const PokemonList = document.getElementById("PokemonList");
const SearchBar = document.getElementById("searchBar");
const pokeInfoModal = document.getElementById('pokeInfoModal');

//This class is used to create the filter array
function Filter(kind, filterContent) {
    this.kind = kind;
    this.filterContent = filterContent;
}

//Global variables used across functions and classes
var pokemonList = [];
var ActiveFilters = [];

//SearchBar Listener
SearchBar.addEventListener('keyup', (e) => {
    let searchString;
    //Search for the index of the current SearchString on the Filter Array
    let index = ActiveFilters.findIndex(obj => obj.kind=='searchString');

    //If there's pre-existent entry on the array, remove it and add the new one
    if(index == -1){
        searchString = e.target.value;
        ActiveFilters.push(new Filter('searchString', searchString));
    } else {
        ActiveFilters.splice(index, 1);
        searchString = e.target.value;
        ActiveFilters.push(new Filter('searchString', searchString));
    }
    //Calls the filterHandler
    filterHandle();
});


function filterByType(id){
    //loops through the ActiveFilters array to find the ammount of active type filters
    let i=0;
    for(let filter of ActiveFilters){
        if(filter.kind == 'type'){
            i++;
        }
    }

    //It'll only allow up to 2 filters to be added
    if(i < 2){
        //verify if there's one or more filters, if it does, verifies if the user is not trying to add a duplicate type filter
        if(i > 1){
            for(let filter of ActiveFilters){
                if(!filter.filterContent.includes(id)){
                    ActiveFilters.push(new Filter('type', id));
                    console.log(ActiveFilters);
                    filterHandle();
                }
            }
        } else {
            //Otherwise, just add the filter
            ActiveFilters.push(new Filter('type', id));
            console.log(ActiveFilters);
            filterHandle();
        }
    }
}

async function filterHandle(){
    //Global variables for searchFiltered and typeFiltered
    let finalFilteredList = [];
    let filteredPokemonListSearch = [];

    //Find if there's an active searchBar filter on the array before filtering
    let index = ActiveFilters.findIndex(obj => obj.kind=='searchString');
    if(index > -1){
        if(ActiveFilters[index].kind == 'searchString'){
            filteredPokemonListSearch = pokemonList.filter( pokemon => {
                //Return results if the searchString matches a pokemon name or ID (Striped URL)
                return pokemon.name.toLowerCase().includes(ActiveFilters[index].filterContent.toLowerCase()) || ((pokemon.url.replace("https://pokeapi.co/api/v2/pokemon/","")).replace("/","")).includes(ActiveFilters[index].filterContent);
            });
        }
    }

    //Goes through the ActiveFilters array in order to find all the active typeFilters and add their results to an array

    let typeFilteredLists = [];
    for(let filter of ActiveFilters){
        
        if(filter.kind == 'type'){
            let filteredPokemonListType = [];
            var type = await getInfo('type', filter.filterContent);
            for(let pokemon of type.pokemon){
                filteredPokemonListType.push(pokemon.pokemon);
            }
            typeFilteredLists.push(filteredPokemonListType);
        }
    }

    //Verifies if there's simultaneous different kind of filters active, matching their results for each case
    //It's currently limited to at most 2 different simultaneous "type" filters and the search bar in order to preserve my mental health
    if(ActiveFilters.length >= 1){
        
        //Deals with the case when there's 2 different "type" filters active + searchbar
        if(typeFilteredLists.length == 2){

            finalFilteredList = typeFilteredLists[0].filter(t =>
                typeFilteredLists[1].some(s => s.name == t.name)
            );

            if(filteredPokemonListSearch.length > 0){
                finalFilteredList = finalFilteredList.filter(t =>
                    filteredPokemonListSearch.some(s => s.name == t.name)
                );
            }

        //Deals with the case when there's 1 "type" filter active + searchbar
        } else if(typeFilteredLists.length == 1){
            if(filteredPokemonListSearch.length > 0){
                finalFilteredList = typeFilteredLists[0].filter(t =>
                    filteredPokemonListSearch.some(s => s.name == t.name)
                );
            } else {
                finalFilteredList = typeFilteredLists[0];
            }
        } else {
            finalFilteredList = filteredPokemonListSearch;
        }
    }

    //Calls the function to update the frontpage with the final filtered list
    showPlist(finalFilteredList);
    return;
}

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
            let skillData = await fetch(ability.ability.url);
            let skillDescription = await skillData.json();
            console.log(skillDescription);
            
            for(let description of skillDescription.effect_entries){
                if(description.language.name == 'en') {
                    pokeAbilities.innerHTML += `
                    <div class="popover-div col">
                        <button type="button" class="btn btn-outline-primary col">
                            ${(ability.ability.name.charAt(0).toUpperCase() + ability.ability.name.slice(1)).replace("-"," ")}
                        </button>
                    <center>
                    <div class="popover-body shadow-lg rounded-3 border">
                      <p class="popover-content">${description.short_effect}</p>
                    </div>
                    </center>
                  </div>`;
                    
                }
            }
        }
        pokeStats.innerHTML = '';
        for( let stat of pokeInfo.stats){
            let color = 'bg-success';
            if(stat.stat.name == 'hp') color = 'bg-danger';
            if(stat.stat.name == 'speed') color = 'bg-info';
            if(stat.stat.name == 'attack') color = 'bg-warning';
            if(stat.stat.name == 'defense') color = 'bg-primary';

            pokeStats.innerHTML += `
            <div class="progress mb-1">
                <div class="progress-bar ${color} progress-bar-striped" role="progressbar" style="width: ${stat.base_stat}%" aria-valuenow="${stat.base_stat}" aria-valuemin="0" aria-valuemax="100"><strong class="pl-2">${stat.base_stat} ${(stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)).replace("-"," ")}</strong></div>
            </div>`;
        }
        

}

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


function showPlist(pokemons){
    console.log(pokemons);
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