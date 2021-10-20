//Constant global variables that refer to important parts of the index.html;
const PokemonList = document.getElementById("PokemonList");
const SearchBar = document.getElementById("searchBar");
const pokeInfoModal = document.getElementById('pokeInfoModal');

//This class is used to create the filter array
function Filter(kind, filterContent, name) {
    this.kind = kind;
    this.filterContent = filterContent;
    this.name = '';
    this.name = name;

}

//
function Pokemon(name, url){
    this.name = name;
    this.url = url;

}

function Evolution(cName, cId, cSpriteUrl, nName, nId, nSpriteUrl, totalEvolutions, currentIndex){
    this.cName = cName;
    this.cId = cId;
    this.cSpriteUrl = cSpriteUrl;
    this.nName = nName;
    this.nId = nId;
    this.nSpriteUrl = nSpriteUrl;
    this.totalEvolutions = totalEvolutions;
    this.cIndex = currentIndex;

}
//Global variables used across functions and classes
var pokemonList = [];
var ActiveFilters = [];

/********************************
 * Input Layer' functions
*/

//SearchBar Listener
SearchBar.addEventListener('keyup', (e) => {
    let searchString;
    //Search for the index of the current SearchString on the Filter Array
    let index = ActiveFilters.findIndex(obj => obj.kind=='searchString');

    //If there's pre-existent entry on the array, remove it and add the new one
    if(index == -1){
        searchString = e.target.value;
        ActiveFilters.push(new Filter('searchString', searchString, searchString));
    } else {
        ActiveFilters.splice(index, 1);
        searchString = e.target.value;
        ActiveFilters.push(new Filter('searchString', searchString, searchString));
    }
    //Calls the filterHandler
    filterHandle();
});

//Modal open listener
pokeInfoModal.addEventListener('show.bs.modal', function (event) {
    updateModal('btn', event, '', '');
});


/********************************
 * Processing Layer' functions
*/

function filterByType(id, name){
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
                    ActiveFilters.push(new Filter('type', id, name));
                    console.log(ActiveFilters);
                    filterHandle();
                }
            }
        } else {
            //Otherwise, just add the filter
            ActiveFilters.push(new Filter('type', id, name));
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

    if(ActiveFilters.length == 0){
        finalFilteredList = pokemonList;
    }
    //Calls the function to update the frontpage with the final filtered list

    showPlist(finalFilteredList);
    updateFiltersInfo();
    return;
}

//Fetches generic data from the API.
async function getInfo(kind, id) {
    const info = await fetch(`https://pokeapi.co/api/v2/${kind}/${id}`);
    var data = await info.json();
    return data;
}

//Initial Data Fetch
async function getPlist() {
    try {
        //I'm usign a 898 limit because higher id pokemons are just variants / evolutions of the main ones (they'll be shown on the pokemon page)
        const requestList = await fetch('https://pokeapi.co/api/v2/pokemon/?limit=1000000');
        const data = await requestList.json();
        pokemonList = data.results;
        console.log(pokemonList);
        showPlist(pokemonList);

    } catch (error) {
        console.error(error);
    }
}

function removeFilter(filterContent){
    let index = ActiveFilters.findIndex(obj => obj.filterContent==filterContent);
    if(index > -1){
        ActiveFilters.splice(index, 1);
    }
    console.log(ActiveFilters);
    filterHandle();
    updateFiltersInfo();
}

async function evolutionFinder(pokeInfo){
    let pokeSpecie = await fetch(pokeInfo.species.url);
    pokeSpecie = await pokeSpecie.json();
    let evolutionChain = await (await fetch(pokeSpecie.evolution_chain.url)).json();
    let evolutions = [];
    console.log(evolutionChain);
    //Push the first (current pokemon) to the evolution chain array before starting the recursive branch exploration
    evolutions.push(new Pokemon(evolutionChain.chain.species.name, evolutionChain.chain.species.url));
    function recursiveEvolutionChain(chain){
        //Loops through all the members of the evolves_to array, in order to detect different possible branches of evolution
        for(let branch of chain.evolves_to){
            if(branch.evolves_to.length >= 0){
                evolutions.push(new Pokemon(branch.species.name, branch.species.url));
                //Calls the recursive function to explore the next evolves_to
                recursiveEvolutionChain(branch);
            } else {
                //Reached the end of the tree, then return.
                return;
            }
        }
    }
    
    //chamada inicial da função recursiva
    recursiveEvolutionChain(evolutionChain.chain);

    console.log(evolutions);
    //Encontra em que parte da evolution_chain o pokemon sendo visualisado se encontra no momento
    let currentIndex = evolutions.findIndex(obj => obj.name==pokeInfo.name);
    let cId = evolutions[currentIndex].url.replace('https://pokeapi.co/api/v2/pokemon-species/', '').replace('/', '');
    let nId = evolutions[currentIndex+1].url.replace('https://pokeapi.co/api/v2/pokemon-species/', '').replace('/', '');

    let pokemonEvolution = new Evolution(evolutions[currentIndex].name, cId, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${cId}.png`, evolutions[currentIndex+1].name, nId, `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nId}.png`, evolutions.length, currentIndex);

    console.log(evolutions[currentIndex]);
    console.log(evolutions[currentIndex+1]);
    console.log(pokemonEvolution);

    return pokemonEvolution;
}

/********************************
 * Output Layer' functions
*/

//Dynamically sets all the HTML and data based on the requested pokemon
async function updateModal(kind, pokemon, pokemonN, idN){
    let button;
    let id;
    let pokeName;

        if(kind == 'btn'){
            // Button that triggered the modal
            button = pokemon.relatedTarget;
            // Get the id from the button
            id = button.getAttribute('poke-id');
            // Get the pokeName from the button
            pokeName = button.getAttribute('poke-name')
        } else if(kind == 'param'){
            // Get the id 
            id = idN;
            // Get the pokeName
            pokeName = pokemonN;
        }
        
        
        // Get important html elements by their selectors
        let modalTitle = pokeInfoModal.querySelector('.modal-title');
        let pokeHeight = pokeInfoModal.querySelector('.pokeHeight');
        let pokeWeight = pokeInfoModal.querySelector('.pokeWeight');
        let pokeType = pokeInfoModal.querySelector('.pokeType');
        let pokeMoves = pokeInfoModal.querySelector('.pokeMoves');
        let pokeLearnableMoves = pokeInfoModal.querySelector('.pokeLearnableMoves');
        let pokeAbilities = pokeInfoModal.querySelector('.pokeAbilities');
        let pokeStats = pokeInfoModal.querySelector('.pokeStats');
        let modalFooter = document.getElementById('pokeEvolutionFooter');

        let pokeInfo = await getInfo('pokemon', id);
        console.log(pokeInfo);

        //Update the Modal HTML dynamically with the request pokemon info.

        //Defines the modal title
        modalTitle.innerHTML = `<img class="img-fluid" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png">${pokeName}</img>`
        //Defines Weight and Height
        pokeHeight.textContent = `Height: ${pokeInfo.height} cm`;
        pokeWeight.textContent = `Weight: ${pokeInfo.weight} kg`;

        //Create a clickable list of Types the pokemon is part of (Can trigger a filter)
        pokeType.innerHTML = '';
        for( let type of pokeInfo.types){
            let pokeTypeId = type.type.url.replace("https://pokeapi.co/api/v2/type/","");
            pokeTypeId = pokeTypeId.replace("/", "");

            pokeType.innerHTML += `<button type="button" class="btn btn-outline-primary" onclick="filterByType(${pokeTypeId}, '${type.type.name}')" data-bs-dismiss="modal">${type.type.name}</button>`;
        }
        //Create a list of abilites the pokemon has by default, and displays the ability's short_description using a popover
        pokeAbilities.innerHTML = '';
        //Loops through all the abilites
        for( let ability of pokeInfo.abilities){
            //Fetch each one's specific data in order to create the short_description popover
            let skillData = await fetch(ability.ability.url);
            let skillDescription = await skillData.json();
            
            //Loops through all the skilldescription entries in order to finde the correct language (en)
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
        //Uses the previously fetched stats data in order to create a bars graph to display the pokemon statistics
        pokeStats.innerHTML = '';
        //Loops through all the stats and dynamically create their bars
        for( let stat of pokeInfo.stats){
            let color = 'bg-success';
            //Verifies the stat name in order to personalize the bar color
            if(stat.stat.name == 'hp') color = 'bg-danger';
            if(stat.stat.name == 'speed') color = 'bg-info';
            if(stat.stat.name == 'attack') color = 'bg-warning';
            if(stat.stat.name == 'defense') color = 'bg-primary';

            pokeStats.innerHTML += `
            <div class="progress mb-1">
                <div class="progress-bar ${color} progress-bar-striped" role="progressbar" style="width: ${stat.base_stat}%" aria-valuenow="${stat.base_stat}" aria-valuemin="0" aria-valuemax="100"><strong class="pl-2">${stat.base_stat} ${(stat.stat.name.charAt(0).toUpperCase() + stat.stat.name.slice(1)).replace("-"," ")}</strong></div>
            </div>`;
        }
        
        //Create an Accordion with all the moves the pokemon can learn
        pokeLearnableMoves.textContent = pokeInfo.moves.length;
        pokeMoves.innerHTML = '';
        for( let move of pokeInfo.moves){
            pokeMoves.innerHTML += `<li class="list-group-item">${(move.move.name.charAt(0).toUpperCase() + move.move.name.slice(1)).replace("-"," ")}</li>`;
        }
        console.log(pokeInfo);
        let evolution = evolutionFinder(pokeInfo);

        let output = '';
        if((await evolution).cName == 'Eeve'){

        } else if((await evolution).cIndex < (await evolution).totalEvolutions-1){
            output = `
            <button href="#" class="btn btn-primary" onclick="animateEvolution(${(await evolution).cId}, ${(await evolution).nId}, '${(await evolution).cSpriteUrl}', '${(await evolution).nSpriteUrl}', '${(await evolution).nName.charAt(0).toUpperCase() + (await evolution).nName.slice(1).replace("-"," ")}')">Evolve</button>
            `;
        }
        modalFooter.innerHTML = output;
}

function showPlist(pokemons){
    //Sets the Badge number to show the ammount of results
    let pokelistResults = document.getElementById('pokelistResults');
    pokelistResults.textContent = pokemons.length;


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

function updateFiltersInfo(){
    let pokeFilters = document.getElementById('pokeFilters');
    let output = '';
    for(let filter of ActiveFilters){
        if(filter.kind != 'searchString'){
            output += `
            <button type="button" class="btn btn-danger col-6 pokeFilter" onclick="removeFilter(${filter.filterContent})">${filter.name.charAt(0).toUpperCase() + filter.name.slice(1)}</button>
            `;
        }
    }
    pokeFilters.innerHTML = output;

}

async function defineFiltersDropdown(){
    let filtersDropdown = document.getElementById('dropdownFilters');
    let filters = await getInfo('type', '');
    console.log(filters);
    let output = '';
    for(let filter of filters.results){
        let pokeTypeId = filter.url.replace("https://pokeapi.co/api/v2/type/","");
        pokeTypeId = pokeTypeId.replace("/", "");

        output += `
        <li type="button" class="btn btn-outline-primary" onclick="filterByType(${pokeTypeId}, '${filter.name}')">${filter.name}</li>
        `;
    }
    filtersDropdown.innerHTML = output;
}

function animateEvolution(cId, nId, cImg, nImg, nName){
    scrollTo(top);
    let animation = document.getElementById('animation');
    animation.innerHTML = `
    <img id="cImg" class="animationImg" src="${cImg}">
    <img id="nImg" class"animationImg" src="${nImg}">
    `;
    animation.style.visibility = "visible";
    updateModal('param', '', nName, nId)
    new Audio('assets/evolution.mp3').play()
    function animateC(){
        document.getElementById('cImg').style.visibility = "visible";
        document.getElementById('nImg').style.visibility = "hidden";
        animateN();
    }
    function animateN(){
        document.getElementById('nImg').style.visibility = "visible";
        document.getElementById('cImg').style.visibility = "hidden";
        animateC();
    }
    for(let i = 0; i < 30; i++){
        setTimeout(animateC, 500);
        setTimeout(animateN, 500);
    }
    setTimeout(animationDestroyer, 4000);
    
    function animationDestroyer(){
        animation.style.visibility = "hidden";
        document.getElementById('cImg').style.visibility = "hidden";
        document.getElementById('nImg').style.visibility = "hidden";
    }
}

//Fetch the pokemon list when the page is loaded
getPlist();
defineFiltersDropdown();