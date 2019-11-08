define('app-search', ['circular', 'data-provider'],
({ Component }, heroService) => Component({
  selector: 'app-search',
  template: `
    <section>
      <h4>Hero Search</h4>
      <input id="search-box" cr-view="search" cr-event="keyup: search" />
      <ul class="search-result" cr-event="click: select">
        <li cr-for="searchList"><a href="#/detail/{{id}}">{{name}}</a></li>
      </ul>
    </section>`,
}, class AppSearch {
  searchList = [];
  searchInput = {};
  debounce;

  onInit(elm, crInst, items) {
    this.searchInput = items.views.search;
  }

  search(e, elm) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(value =>
      heroService.searchHeroes(value).then(data => this.searchList = data),
    300, elm.value);
  }

  select() {
    this.searchInput.value = '';
    this.searchList = [];
  }
}));
