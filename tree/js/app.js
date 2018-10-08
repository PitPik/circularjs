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
    model: [data],
    listeners: ['open'],
    preRecursionCallback: function(item) {
      item.open = item.open || false;
      this.addProperty('open', item);
      if (item.childNodes) {
        item.childNodes.push({ name: '+', adder: true });
      }
    },
    eventListeners: {
      toggle: function(e, elm, item) {
        if (item.childNodes) {
          item.open = !item.open;
        } else if (item.adder) {
          this.insertBefore({ name: 'new stuff' }, item);
        }
      },
      addChildren: function(e, elm, item) {
        if (!item.childNodes && !item.adder) {
          this.appendChild({ name: 'new stuff' }, item);
          item.open = true;
          this.replaceChild(this.getCleanModel(item), item);
        }
      }
    }
  });
});
