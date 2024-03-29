define('app-heroes', ['circular', 'data-provider', '!modules/heroes/css/index.css'],
({ Component }, heroService, styles) => Component({
  selector: 'app-heroes',
  styles,
  template: `
    <h2>My Heroes</h2>
    <form cr-event="submit: addHero">
      <label>Hero name: <input name="hero" type="text" /></label>
      <button type="submit">add</button>
    </form>
    <ul>
    {{#each %heroList}}
      <li>
        <a href="#/detail/{{%id}}">
          <span class="badge">
            {{%id}}
          </span>
          {{~%name}}
        </a>
        <button class="delete" title="delete hero" cr-event="click: deleteHero">x</button>
      </li>
    {{/each}}
    </ul>
  `,
  subscribe$: { 'heroList:': [] },
}, class HeroList {
  constructor() {
    this.heroList = [];
  }

  onLoad() {
    heroService.getHeroes().then(model => this.heroList = model);
  }

  addHero(e, element, item) {
    const name = element.hero.value.trim();

    e.preventDefault(); // don't submit form
    name && heroService.addHero(name).then(model => {
      this.heroList.push(model);
      element.hero.value = '';
    });
  }

  deleteHero(e, element, item) {
    heroService.deleteHero(item.id).then(() => this.heroList.remove(item));
  }
}));
