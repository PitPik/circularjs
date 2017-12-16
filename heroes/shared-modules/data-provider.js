define('data-provider', ['toolbox'], function(Toolbox) {
    'use strict';

    var heroes = [
            { id: 11, name: 'Mr. Nice' },
            { id: 12, name: 'Narco' },
            { id: 13, name: 'Bombasto' },
            { id: 14, name: 'Celeritas' },
            { id: 15, name: 'Magneta' },
            { id: 16, name: 'RubberMan' },
            { id: 17, name: 'Dynama' },
            { id: 18, name: 'Dr IQ' },
            { id: 19, name: 'Magma' },
            { id: 20, name: 'Tornado' }
        ],
        getHero = function(id, name) {
            for (var n = heroes.length; n--; ) {
                if (heroes[n].id === id || heroes[n].name === name) {
                    return heroes[n];
                }
            }
        },
        getHeroes = function() {
            var output = [];

            for (var n = 0, m = heroes.length; n < m; n++) {
                output.push(createItem(heroes[n].id, heroes[n].name));
            }
            return getPromise(output);
        },
        getNextId = function() {
            for (var id = 0, n = heroes.length; n--; ) {
                if (heroes[n].id >= id) {
                    id = heroes[n].id + 1;
                }
            }
            return id;
        },
        getPromise = function(data) {
            return new Toolbox.Promise(function(resolve, reject) {
                resolve(data);
            });
        },
        createItem = function(id, name) {
            return { id: id, name: name };
        };


    return {
        getHeroes: getHeroes,
        getHero: function(id) {
            var hero = getHero(id) || {};

            return getPromise(createItem(hero.id, hero.name));
        },
        addHero: function(name) {
            var id = getNextId();

            heroes.push(createItem(id, name));
            return getPromise(createItem(id, name));
        },
        updateHero: function(id, name) {
            getHero(id).name = name;
            return getPromise(createItem(id, name));
        },
        deleteHero: function(id) {
            for (var n = heroes.length; n--; ) {
                if (heroes[n].id === id) {
                    return getPromise(heroes.splice(n, 1)[0]);
                }
            }
        },
        searchHeroes: function(text) {
            var out = [],
                name = '';

            if (!text) return getPromise(out);

            text = text.toLowerCase();
            for (var n = heroes.length; n--; ) {
                name = heroes[n].name.toLowerCase();
                if (name.indexOf(text) !== -1) {
                    out.push(createItem(heroes[n].id, heroes[n].name));
                }
            }
            return getPromise(out);
        }
    };
});