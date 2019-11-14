require(['circular', 'data-provider', 'tree-helper'],
({ Component }, { getIcon, actions }, getHelpers) => Component({
  selector: 'control-box',
  template: `
    <h2>
      <i class="material-icons" title="{{name}}">{{icon}}</i>{{i18n name}}
      <span class="pull-right">
        <i
          cr-for="actionModel"
          cr-event="click: {{event}}"
          class="material-icons"
          title="{{i18n title}}"
        >{{aIcon}}</i>
      </span>
    </h2>`,
  styles: `control-box { display: block }`,
  helpers: getHelpers(['i18n']),
}, class ControlBox {
  name = '';
  icon = '';

  actionModel = [];

  constructor(elm, crInst, input) {
    input(this);
    this.icon = getIcon(this.icon);
    this.actionModel = this.buidModel([]);
  }

  buidModel(out) {
    out.push({
      ...actions.showTree,
    });
    out.push({
      ...actions.closeTab,
      title: `${actions.closeTab.title} ${this.name}`,
    });
    return out;
  }

  closeTab() {
    console.log(this.name, 'closeTab');
  }

  showTree() {
    console.log(this.name, 'showTree');
  }
}));