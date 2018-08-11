define('app-detail', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular();
    var heroDetail = circular.component('hero-detail', {
            listeners: ['name'],
            model: [{}],
            eventListeners: {
                updateName: updateName,
                save: updateHero,
                goBack: goBack
            }
        });

    function updateName(e, element, item) {
        item.name = element.value.trim();
    }

    function updateHero(e, element, item) {
        (item.id === undefined ? heroService.addHero(item.name) :
            heroService.updateHero(item.id, item.name))
        .then(goBack);
    }

    function goBack() {
        window.history.back();
    }

    circular.addRoute({
        path: '/detail(/:heroId)',
        callback: function(data) {
            heroService.getHero(parseInt(data.parameters.heroId))
            .then(function(model) {
                heroDetail.replaceChild(model, heroDetail.model[0]);
            });
        }
    }, true);
});
