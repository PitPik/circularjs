require(['circular', 'data-provider', 'tree-helper'],
({ Component }, { actions }, getHelpers) => Component({
  selector: 'tree-actions',
  template: `
    <i
      class="material-icons icon {{%class}}"
      title="{{i18n title}} {{i18n kind}}"
      cr-for="actionModel"
      cr-event="click: {{event}}"
    >
      {{aIcon}}
    </i>`,
    helpers: getHelpers(['i18n']),
}, class TreeActions {
  hasActions = false;
  item = {};
  tree = [];

  actionModel = [];

  constructor(elm, crInst, input) {
    input(this);
    this.actionModel = this.hasActions ?
      this.buildModel(this.item, []) : [];
  }

  buildModel(item, out) {
    item.kind === 'container' && out.push({
      ...actions.closeInnerFolders,
      kind: '',
    });
    item.parentNode.kind && out.push({
      ...actions.deleteItem,
      kind: item.kind,
    });
    return out;
  }

  deleteItem(e) {
    e.preventDefault();
    const parent = this.item.parentNode;
    this.tree.removeChild(this.item);
    if (!parent.childNodes.length) {
      parent.isOpen = false;
    }
  }

  closeInnerFolders(e) {
    e.preventDefault();
    this.item.childNodes.forEach(item => {
      if (item.childNodes.length) item.isOpen = false;
    });
  }
}));