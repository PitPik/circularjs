require(['circular'], ({ Component }) => Component({
  selector: 'tag-list',
  template: `
    <div class="tag-list">
      <a cr-for="tags" href="#/articles/0/{{%key}}" class="tag-pill tag-default">{{%key}}</a>
    </div>`,
  subscribe$: { tags: ['key'] },
}, class TagList {
  constructor(elm, crInst, input) {
    this.tags = [];
    input(this);
  }
}));