require([
  'circular',
  '!./tree.component.html',
  'tree-helper',
  'data-provider',
  'dnd.plugin',
  'tree-actions.component',
  'control-box',
  'tree-control',
], ({ Module }, template, getHelpers, dataProvider, dnd) => Module({
  selector: 'tree',
  template,
  helpers: getHelpers(),
  subscribe$: {
    tree: ['title', 'isOpen', 'hovered', 'selected', 'active', 'linkClass', 'class'],
  },
}, class Tree {
  tree = [];
  isOpen = false;
  hasActions = false;
  name = 'the-tree';
  noHover = { toggle: false };
  activeItem = {};

  constructor(elm, crInst, input) {
    input(this);
    dataProvider.getTree(this.name).then(data => {
      this.tree = data;
      if (!data[0].isOpen) {
        this.treeToggle(this.isOpen);
      }
    });
  }

  tree$(prop, item, value, oldValue, internal) {
    if (value === oldValue) return;
    if (prop === 'active') {
      this.activeItem.active = false;
      this.activeItem = item;
    } else if (prop === 'isOpen') {
      dataProvider.storeToggle(item, this.name);
    }
    if (value && prop.match(/active|selected|hovered/)) {
      this.openParents(item);
    }
  }

  treeToggle(toggle) {
    const leaveOpen = {};
    let leaf = this.tree.length === 1 && !toggle && this.tree[0] || {};

    while (leaf.childNodes && leaf.childNodes.length === 1) {
      leaveOpen[leaf['cr-id']] = leaf.isOpen = true;
      leaf = leaf.childNodes[0];
    }
    leaf.isOpen = true;
    this.tree.getElementsByProperty('isOpen', !toggle).forEach(item => {
      if (
        leaveOpen[item['cr-id']] === true ||
        leaveOpen[item.parentNode['cr-id']] === true ||
        item.childNodes === undefined ||
        item.childNodes[0] === undefined
      ) return;
      item['isOpen'] = toggle;
    });
  }

  openParents(item) {
    setTimeout(() => {
      while (item = item.parentNode) if (!item.isOpen) item.isOpen = true;
    });
  }

  hover(e, elm, item) {
    return e.target === elm && !this.noHover.toggle ?
      item.hovered = true : null;
  }

  blur(e, elm, item) {
    return e.target === elm ? item.hovered = false : null;
  }

  select(e, elm, item) {
    item.active = true;
  }

  toggle(e, elm, item) {
    return item.isOpen = !item.isOpen, false;
  }
}));
