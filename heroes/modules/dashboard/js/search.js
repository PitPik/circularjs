define('app-search', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular(),
        searchModel = {},
        heroesList = null;

    circular.component('heroes-search', {
        model: [searchModel],
        eventListeners: {
            search: function(e, element, item) {
                clearTimeout(this.debounce);
                this.debounce = setTimeout(function(value) {
                    search(value);
                }, 300, element.value);
            }
        },
        onInit: function() {
            setupList();
        }
    });

    function search(text) {
        heroService.searchHeroes(text).then(setupList);
    }

    function setupList(model) {
        if (heroesList) {
            heroesList.model = model;
            return;
        }
        heroesList = circular.component('heroes-search-list', {
            model: model,
            eventListeners: { select: resetSearch }
        });
    }

    function resetSearch() {
        searchModel.views.search.value = '';
        setupList([]);
    }
});
