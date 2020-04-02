define('app-detail', ['circular', 'data-provider', '!modules/detail/css/index.css'],
({ Component }, heroService, styles) => Component({
  selector: 'app-detail',
  styles,
  template: `
    <div cr-template>
      <h2><span cr-view="name">{{%name}}</span> Details</h2>
      <div><span>id: </span>{{#if %id}}{{%id}}{{else}}--{{/if}}</div>
      <label>name:
        <input cr-event="input: updateName; keyup: cancel" placeholder="name" value="{{%name}}" />
      </label>
      <button cr-event="click: goBack">go back</button>
      {{#if %dirty}}<button cr-event="click: save" disabled="{{%name}}">save</button>{{/if}}
    </div>`,
  subscribe$: { this: ['name', 'id', 'dirty'] },
}, class Details {
  constructor(elm, crInst) {
    this.name = '';
    this.initialName = '';
    this.id = '';
    this.dirty = false;
  
    crInst.addRoute({
      path: '/detail(/:heroId)',
      callback: data => heroService
        .getHero(parseInt(data.parameters.heroId))
        .then(model => {
          this.name = this.initialName = model.name;
          this.id = model.id;
          this.dirty = false;
        })
    }, true);
  }

  updateName(e, element, item) {
    this.name = element.value.trim();
    this.dirty = this.initialName !== this.name;
  }

  save() {
    (this.id === undefined ?
      heroService.addHero(this.name) :
      heroService
        .updateHero(this.id, this.name))
        .then(this.goBack);
  }

  cancel(e) {
    if (e.key === 'Escape') {
      this.name = this.initialName;
      this.dirty = false;
      e.target.blur();
    }
  }

  goBack(e, element, item) {
    window.history.back();
  }
}));
