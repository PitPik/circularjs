define('app-tree', ['circular'], ({ Component, Toolbox: { $ } }) => {
  var elm = $('[cr-component="tree"]');
  var templateElm = elm.removeChild(elm.firstElementChild);
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

  Component({
    selector: 'tree',
    template: templateElm.outerHTML,
    subscribe$: { tree: ['open'] },
  }, class Tree {
    tree = [data];

    tree$PR(vomInst, item, elm) {
      item.open = item.open || false;
      vomInst.addProperty('open', item);
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
  }).init(elm);
});
