define('app-search', ['circular', 'data-provider'],
({ Component }, heroService) => Component({
  selector: 'app-search',
  template: `
    <h4>Hero Search</h4>
    <input id="search-box" cr-view="search" cr-event="keyup: search" />
    <ul class="search-result" cr-event="click: select">
    {{#each %searchList}}
      <li cr-for="searchList"><a href="#/detail/{{%id}}">{{%name}}</a></li>
    {{/each}}
    </ul>
  `,
  subscribe$: { 'searchList:': [] },
}, class AppSearch {
  constructor() {
    this.searchList = [];
    this.searchInput = {};
    this.debounce;
  }

  onInit(elm, crInst, items) {
    this.searchInput = crInst.getView('search', elm);
  }

  search(e, elm) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(value =>
      heroService.searchHeroes(value).then(data => this.searchList = data),
    300, elm.value);
  }

  select() {
    this.searchInput.value = '';
    setTimeout(() => this.searchList = []); // Let <a> take it's time.
  }
}));
