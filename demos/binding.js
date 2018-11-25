define('app-binding', ['circular'], Circular => {
  class Binding {
    constructor(name, params = {}) {
      const circular = params.circular || new Circular();
      const options = Circular.extend({
        model: [{ value: '' }],
        listeners: ['value'],
        eventListeners: { input: this.input, clear: this.clear },
      }, params);

      this.component = circular.component(name, options);
    }

    input(e, elm, item) { // can be extended the Circular or ES6 way
      item.value = elm.value;
    }

    clear(e, elm, item) {
      item.value = '';
    }

    reset(model) {
      return this.component.reset(model);
    }
  }
  // demos usage as reusable js module
  define('Binding', [], () => Binding);
});

require(['Binding'], Binding => {
  const binding = new Binding('input-test');
});
