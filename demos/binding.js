define('app-binding', ['circular'], Circular => {
  return class Binding {
    constructor(selector, params = {}) {
      const circular = params.circular || new Circular();
      const options = Circular.extend({
        model: [{ value: '' }],
        element: selector,
        listeners: ['value'],
        eventListeners: { input: this.input, clear: this.clear },
      }, params);

      this.component = circular.component(options);
    }

    input(e, elm, item) { // can be extended the Circular or ES6 way
      item.value = elm.value;
    }

    clear(e, elm, item) {
      item.value = '';
    }

    reset(model) { // not used, just for demo
      return this.component.reset(model);
    }
  };
});

require(['app-binding'], Binding => {
  const binding = new Binding('.demo.binding');
});
