define('app-dashboard', [
  'circular',
  '!modules/dashboard/css/index.css',
  'data-provider',
  'app-search'
], ({ Component }, styles, heroService) => Component({
  selector: 'app-dashboard',
  styles,
  template: `
    <h2>Top Heroes</h2>
    <div class="grid grid-pad clearfix">
    {{#each %heroes}}
      <a class="col-1-4" href="#/detail/{{%id}}">
        <div class="module hero">
          <h4>{{%name}}</h4>
        </div>
      </a>
    {{/each}}
    </div>
    <app-search></app-search>
  `,
  subscribe$: { 'heroes:': [] },
}, class Dashboard {
  constructor() {
    this.heroes = [];
  }

  onLoad() {
    heroService.getHeroes().then(model => this.heroes = model.splice(0, 4));
  }
}));
