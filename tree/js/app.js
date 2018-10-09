require(['circular'],  Circular => {
  const data = {
    name: 'My Tree',
    childNodes: [
      { name: 'hello' },
      { name: 'wat' },
      {
        name: 'child folder',
        childNodes: [
          {
            name: 'child folder',
            childNodes: [
              { name: 'hello' },
              { name: 'wat' }
            ]
          },
          { name: 'hello' },
          { name: 'wat' },
          {
            name: 'child folder',
            childNodes: [
              { name: 'hello' },
              { name: 'wat' }
            ]
          }
        ]
      }
    ]
  };

  new Circular().component('tree', {
    model: [data, { name: '+' }],
    listeners: ['open'],
    preRecursionCallback: function(item) {
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
          this.appendChild({ name: 'new stuff' }, item);
          item.open = true;
          this.replaceChild(this.getCleanModel(item), item);
        }
      }
    }
  });
});
