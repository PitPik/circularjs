define('app-binding', ['circular'], function(Circular) {
  new Circular().component('input-test', {
    model: [{ value: '' }],
    listeners: ['value'],
    eventListeners: {
      input: function(e, elm, item) {
        item.value = elm.value;
      },
      clear: function(e, elm, item) {
        item.value = '';
      }
    }
  });
});
