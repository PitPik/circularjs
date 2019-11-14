require(['circular', 'tree-helper', '!tree-control.html', '!tree-control.css'],
({ Component }, getHelpers, template, styles) => Component({
  selector: 'tree-control',
  template,
  styles,
  helpers: getHelpers(['i18n']),
  subscribe$: { this: ['searchValue', 'counter', 'all'] },
}, class TreeControl {
  name = '';
  treeToggle;
  tree = [];

  foundItems = [];
  debounce = 0;
  delay = 300;
  minsearch = 2;
  RegExp = {};
  counter = '';
  all = '';
  searchValue = '';

  constructor(elm, crInst, input) {
    input(this);
  }

  this$(prop) { // TODO: make 'search' its own component
    if (prop !== 'searchValue') return;
    clearTimeout(this.debounce);
    if (this.searchValue.length < this.minsearch) {
      this.counter = '';
      return this.mark(this.foundItems, false);
    }
    if (!this.all) this.all = this.tree.getElementsByProperty().length;

    this.debounce = setTimeout(() => {
      const txt = this.searchValue.split(/\s+/).filter(_ => _).join('))(?=.*(');
      this.RegExp = new RegExp(`(?=.*(${txt})).*`, 'i');
      const found = this.searchValue === '' ? [] : this.tree
        .getElementsByProperty('properties.title', _ => _.match(this.RegExp));
      this.foundItems = this.mark(this.foundItems
        .filter(item => !found.includes(item)), false); // reset old
      this.foundItems = this.mark(found, true);
      this.counter = found.length;
    }, this.delay);
  }

  mark(items, toggle) {
    items.forEach(item => {
      item.selected = toggle;
      item.title = toggle ? item.properties.title.replace(this.RegExp, function(_) {
        const args = [].slice.call(arguments, 1, arguments.length - 2);
        args.forEach(finding => _ = _.replace(finding, ($1 => `<b>${$1}</b>`)));
        return _;
      }) : item.properties.title;
    });
    return items;
  }

  clear(e) {
    if (e.key === 'Escape') {
      this.searchValue = '';
    }
  }

  input(e) {
    this.searchValue = e.target.value;
  }

  blurInput() {
    this.searchValue = '';
  }

  expand() {
    this.treeToggle(true);
  }

  collapse() {
    this.treeToggle(false);
  }
 }));
