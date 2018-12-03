define('app-tree', ['circular'], function(Circular) {
  var data = {
    name: 'My Tree',
    childNodes: [
      { name: 'hello' },
      { name: 'some more' },
      {
        name: 'child folder',
        childNodes: [
          {
            name: 'child folder',
            childNodes: [ { name: 'hello' } ]
          },
          { name: 'hello' },
          {
            name: 'child folder',
            childNodes: [ { name: 'hello' } ]
          }
        ]
      }
    ]
  };

  new Circular().component('tree', {
    model: [data, { name: '+' }],
    listeners: ['open'],
    preRecursionCallback: function(item) { // enhance initial model
      item.open = item.open || false;
      this.addProperty('open', item);
      item.childNodes && item.childNodes.push({ name: '+' });
    },
    eventListeners: {
      toggle: function(e, elm, item) {
        if (item.childNodes) {
          item.open = !item.open;
        } else if (item.name === '+') {
          this.insertBefore({ name: 'new stuff' }, item);
        }
      },
      addChildren: function(e, elm, item) {
        if (!item.childNodes && item.name !== '+') {
          this.replaceChild({ name: item.name, open: true, childNodes: [
            { name: 'new stuff' }
          ]}, item);
        }
      }
    }
  });
});
