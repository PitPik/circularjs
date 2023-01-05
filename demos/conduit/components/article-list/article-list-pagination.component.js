require(['circular'], ({ Component }) => Component({
  selector: 'article-list-pagination',
  template: `
  <ul>
    <li class="page-item{{#if %active}} active{{/if}}" cr-for="pagination">
      <a class="page-link" href="#/{{#if author}}profile/{{%author}}{{else
          }}articles{{/if}}/{{index}}{{#if %tag}}/{{%tag}}{{/if}}{{#if %favorited}}/favorites{{/if}}">
        {{@counter}}
      </a>
    </li>
  </ul>`,
  styles: 'article-list-pagination ul { padding: 0; margin: 2em 0 0; clear: both; }',
  subscribe$: { pagination: ['active', 'tag', 'author', 'favorited'] },
}, class ArticleListPagination {
  constructor(elm, crInst, input) {
    this.pagination = [];
    input(this);
  }
}));