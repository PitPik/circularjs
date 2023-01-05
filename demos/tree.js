define('tree', ['circular', '!tree.html'], ({ Component, Toolbox: { $ } }, template) => 

Component({
  selector: 'tree',
  template,
  subscribe$: { 'tree:childNodes': [] },
},
class Tree {
  constructor() {
    this.tree = [{
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
            }
          ]
        }
      ]
    }];
  }

  tree$Intersept(vomInst, item) {
    item.open = item.open || false;
    if (item.childNodes) item.childNodes.push({ name: '+' });
  }

  toggle(e, elm, item) {
    e.stopPropagation();
    if (item.childNodes) {
      item.open = !item.open;
    } else if (item.name === '+') {
      this.tree.insertBefore({ name: 'new stuff' }, item);
    }
  }

  addChildren(e, elm, item) {
    e.stopPropagation();
    if (!item.childNodes && item.name !== '+') {
      this.tree.replaceChild({ name: item.name, open: true, childNodes: [
        { name: 'new stuff' }
      ]}, item);
    }
  }

}));
