define('app-heroes', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular();
    var heroList = null;

    circular.component('heroes', {
        model: [{}],
        eventListeners: { addHero: addHero }
    });

    function addHero(e, element, item) {
        var name = element.hero.value.trim();

        e.preventDefault(); // don't submit form
        name && heroList && heroService.addHero(name)
        .then(function(model) {
            heroList.appendChild(model);
            element.hero.value = '';
        });
    }

    function init(data, path) {
        heroService.getHeroes()
        .then(function(model) {
            heroList = circular.component('heroes-list', {
                model: model,
                eventListeners: { deleteHero: deleteHero }
            });
        });
    }

    function deleteHero(e, element, item) {
        heroService.deleteHero(item.id)
        .then(function() {
            heroList.removeChild(item);
        });
    }

    return init;
});

/**
 * 'heroes' is the component that listens to the form for adding
 * heroes by calling 'addHero()'.
 * 'addHero()' tells 'heroService' to add a hero and then clears
 * the form and appends the new hero to the 'heroes-list'.
 *
 * 'heroes-list' is created on init as its wrapped function is
 * returned as an initiation function and gets called when the
 * whole module is (re-)loaded.
 * The items in the 'heroes-list' have an eventListener on click
 * to delete items with 'deleteHero()'.
 *
 * 'addHero()' and 'deleteHero()' use VOM's API to manipulate the
 * model in 'heroes-list' to append and remove children that then
 * triggers a re-rendering automatically.
 */
