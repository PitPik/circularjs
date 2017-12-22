define('app-detail', ['circular', 'data-provider'],
function(Circular, heroService) {
    'use strict';

    var circular = new Circular();
    var heroDetail = circular.component('hero-detail', {
            model: [{}],
            eventListeners: {
                updateName: updateName,
                save: updateHero,
                goBack: goBack
            }
        });

    function updateName(e, element, item) {
        item.name = item.views.name.textContent = element.value.trim();
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

/**
 * 'hero-detail' is the component that listenes to mouse event of
 * htree different HTML-Elements: the input field for renaming the
 * current hero, the 'save' button and the 'go back' button and
 * referring to the according functions.
 *
 * 'updateName()' adds 'name' to the model and updates the view
 * 'name' on key up, which is the headline.
 *
 * 'updateHero()' is called when the form is submitted and then
 * adds a new hero or updates a hero via 'heroService.updateHero()'
 *
 * The router's callback gets according to 'detail/id' the hero model
 * and then replaces the model of 'hero-detail' so it can re-render
 * automatically.
 */
