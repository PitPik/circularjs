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
