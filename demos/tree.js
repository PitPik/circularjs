define('app-tree', ['circular', '!tree.html'],
({ Component, Toolbox: { $ } }, template) => {
  var data = {
    name: 'My Tree',
    open: true,
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

  return Component({
    selector: 'tree',
    template,
    subscribe$: { tree: ['open'] },
  }, class Tree {
    tree = [data];

    tree$Intersept(vomInst, item) {
      item.open = item.open || false;
      item.childNodes && item.childNodes.push({ name: '+' });
    }

    toggle(e, elm, item) {
      if (item.childNodes) {
        item.open = !item.open;
      } else if (item.name === '+') {
        this.tree.insertBefore({ name: 'new stuff' }, item);
      }
    }

    addChildren(e, elm, item) {
      if (!item.childNodes && item.name !== '+') {
        this.tree.replaceChild({ name: item.name, open: true, childNodes: [
          { name: 'new stuff' }
        ]}, item);
      }
    }
  });
});
