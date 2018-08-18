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

    function deleteHero(e, element, item) {
        heroService.deleteHero(item.id)
        .then(function() {
            heroList.removeChild(item);
        });
    }

    return function init(data, path) {
        heroService.getHeroes()
        .then(function(model) {
            heroList = circular.component('heroes-list', {
                model: model,
                eventListeners: { deleteHero: deleteHero }
            });
        });
    };
});
