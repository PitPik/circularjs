require(['circular', 'tree-helper'], ({ Component }, getHelpers) => Component({
  selector: 'tree-control',
  template: `
    <div class="toolbox">
      <div class="context-menu extra">
        <span cr-event="click: expand" title="{{i18n Expand}} {{name}}">
          {{i18n Expand all}}
        </span>
        <span cr-event="click: collapse" title="{{i18n Collapse}} {{name}}">
          {{i18n Collapse}}
        </span>
      </div>
      <div class="tree-search">
        <input
          placeholder="{{i18n Select by search}}"
          cr-event="keyup: clear; input: input; blur: blurInput"
          value="{{%searchValue}}"
        >
        {{#if %searchValue}}
          <i class="material-icons search-icon">close</i>
        {{else}}
          <i class="material-icons search-icon">search</i>
        {{/if}}
      </div>
    </div>`,
  styles: `
    tree-control { display: block; position: relative; }
    .extra { width: 100%; text-align: right; }
    .tree-search {
      position: absolute;
      padding: 3px 5px;
      background: #2b2b2b;
      width: 36px;
      transition: width .14s;
    }
    .tree-search:hover, .tree-search:active { width: 100% }
    .search-icon {
      position: absolute;
      width: 25px;
      right: -2px;
      top: 5px;
      line-height: 1.8em;
    }
    .tree-search input { opacity: 0; transition: opacity .14s; outline: none; }
    .tree-search:hover input { opacity: 1; }
    b { color: #4faeff; font-weight: normal; }`,
  helpers: getHelpers(['i18n']),
  subscribe$: { this: ['searchValue'] },
}, class TreeControl {
  name = '';
  treeToggle;
  tree = [];

  debounce = 0;
  delay = 300;
  foundItems = [];
  RegExp = {};

  searchValue = '';

  constructor(elm, crInst, input) {
    input(this);
  }

  this$() { // TODO: make 'search' its own component
    clearTimeout(this.debounce);
    if (this.searchValue.length < 3) {
      return this.mark(false);
    }
    this.debounce = setTimeout(() => {
      this.mark(false);
  
      this.RegExp = new RegExp(this.searchValue, 'i');
      this.foundItems = this.searchValue === '' ? [] :
        this.tree.getElementsByProperty('properties.title', this.RegExp);
      this.mark(true);
    }, this.delay);
  }

  mark(toggle) {
    this.foundItems.forEach(item => {
      item.selected = toggle;
      item.title = toggle ?
        item.properties.title.replace(this.RegExp, $1 => `<b>${$1}</b>`) :
        item.properties.title;
    });
  }

  clear(e, elm, item) {
    if (e.key === 'Escape') {
      this.searchValue = '';
    }
  }

  input(e, elm, item) {
    this.searchValue = e.target.value;
  }

  blurInput() {
    this.searchValue = '';
  }

  expand(e, elm, item) {
    this.treeToggle(true);
  }

  collapse(e, elm, item) {
    this.treeToggle(false);
  }
 }));
