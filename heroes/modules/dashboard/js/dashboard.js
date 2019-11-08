define('app-dashboard', [
  'circular',
  '!modules/dashboard/css/index.css',
  'data-provider',
  'app-search'
], ({ Component }, styles, heroService) => Component({
  selector: 'app-dashboard',
  styles,
  template: `
    <div class="module">
      <h2>Top Heroes</h2>
      <div class="grid grid-pad clearfix">
        <a cr-for="heroes" class="col-1-4" href="#/detail/{{id}}">
          <div class="module hero">
            <h4>{{%name}}</h4>
          </div>
        </a>
      </div>
      <app-search></app-search>
    </div>`,
  subscribe$: { heroes: ['name'] },
}, class Dashboard {
  heroes = [];

  onLoad() {
    heroService.getHeroes().then(model => this.heroes = model.splice(0, 4));
  }
}));
