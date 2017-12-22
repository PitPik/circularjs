define('app-search', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular(),
        debounce = null,
        searchModel = {};

    circular.component('heroes-search', {
        model: [searchModel],
        eventListeners: {
            search: function(e, element, item) {
                clearTimeout(debounce);
                debounce = setTimeout(function() {
                    search(element.value);
                }, 300);
            }
        }
    });

    function search(text) {
        heroService.searchHeroes(text).then(setupList);
    }

    function setupList(model) {
        circular.component('heroes-search-list', {
            model: model,
            eventListeners: { select: resetSearch }
        });
    }

    function resetSearch() {
        searchModel.views.search.value = '';
        setupList([]);
    }
});

/**
 * 'heroes-search' is a component that has only one purpose. It
 * holds a view of an input field that listens to keyUp that triggers
 * 'search()'. This function tells heroService to look for heroes
 * via 'searchHeroes()' that again triggers 'setupList()'.
 *
 * 'setupList()' creates or updates the 'heroes-search-list' component
 * that gets rendered underneath the previous mentioned input field.
 * The list also listens to click so it can reset the view to an empty
 * list and empty the input field via 'resetSearch()'.
 */
