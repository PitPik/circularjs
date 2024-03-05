define('tree', ['circular', '!tree.html'], ({ Component }, template) => 

Component({
  selector: 'tree',
  template,
  subscribe$: { 'tree:children': [] },
},
class Tree {
  constructor() {
    this.tree = [{
      name: 'My Tree',
      open: true,
      children: [
        { name: 'hello' },
        { name: 'some more' },
        {
          name: 'child folder',
          children: [
            {
              name: 'child folder',
              children: [ { name: 'hello' } ]
            }
          ]
        }
      ]
    }];
  }

  tree$PR(item, parentItem, parent, root) {
    item.open = item.open || false;
    if (item.children) item.children.push({ name: '+' });
  }

  toggle(e, elm, item, model) {
    e.stopPropagation();
    if (item.name === '+') {
      // model.splice(item.index, 0, ...); or
      model.move({ name: 'new stuff' }, item.index);
    } else {
      item.open = !item.open;
    }
  }

  addChildren(e, elm, item, model) {
    e.stopPropagation();
    if (item.name !== '+' && !item.children.length) {
      // model.splice(item.index, 1, ...); or
      model.replace({ name: item.name, open: true, children: [
        { name: 'new stuff' },
        { name: '+' }
      ]}, item.index);
    }
  }

}));
