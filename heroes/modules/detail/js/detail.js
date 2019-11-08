define('app-detail', ['circular', 'data-provider', '!modules/detail/css/index.css'],
({ Component }, heroService, styles) => Component({
  selector: 'app-detail',
  styles,
  template: `
    <div cr-template>
      <h2><span cr-view="name">{{%name}}</span> Details</h2>
      <div><span>id: </span>{{#if %id}}{{id}}{{else}}--{{/if}}</div>
      <label>name:
        <input cr-event="input: updateName" placeholder="name" value="{{%name}}" />
      </label>
      <button cr-event="click: goBack">go back</button>
      <button cr-event="click: save" disabled="{{%name}}">save</button>
    </div>`,
  subscribe$: { this: ['name', 'id'] },
}, class Details {
  name = '';
  id = '';

  constructor(elm, crInst) {
    crInst.addRoute({
      path: '/detail(/:heroId)',
      callback: data => heroService
        .getHero(parseInt(data.parameters.heroId))
        .then(model => {
          this.name = model.name;
          this.id = model.id;
        })
    }, true);
  }

  updateName(e, element, item) {
    this.name = element.value.trim();
  }

  save(e, element, item) {
    (item.id === undefined ?
      heroService.addHero(item.name) :
      heroService
        .updateHero(item.id, item.name))
        .then(this.goBack);
  }

  goBack(e, element, item) {
    window.history.back();
  }
}));
