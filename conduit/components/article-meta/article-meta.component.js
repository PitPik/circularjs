require([
  'circular',
  '!article-meta.component.html',
  'template-helpers',
  'api.service',
], ({ Component }, template, helpers, api) => Component({
  selector: 'article-meta',
  template,
  styles: 'article-meta img { overflow: hidden; }',
  helpers,
  subscribe$: {
    this: ['metaData', 'trigger', 'routeParams', 'user'],
    model: ['*', 'author.*'],
  },
}, class ArticleMeta {
  constructor(elm, crInst, input) {
    this.metaData = {};
    this.user = {};
    this.routeParams = {};
    input(this);
    // if no metaData availabel then... take them from articles[idx];
    this.articles = {};
    this.trigger = false;
    this.idx = -1; // only for article list

    input(this);
    this.model = [];
    this.crInst = crInst;

    this.idx === -1 && crInst.installEvent(null, 'meta-click', (data => {
      const item = this.model[0];
      const activeItem = data.detail.item;
      const type = data.detail.type;
      if (!item || item === activeItem) return;

      if (type === 'follow') {
        api.postFollow({
          author: { username: item.author.username, following: item.author.following }
        }).then(data => {
          if (activeItem.author.following === item.author.following)
            item.author.following = !item.author.following;
          activeItem.author.following = !activeItem.author.following;
        });
      } else if (type === 'like') {
        api.postLike({ slug: item.slug, favorited: item.favorited }).then(data => {
          if (activeItem.favorited === item.favorited)
            item.favorited = !item.favorited;
          activeItem.favorited = !activeItem.favorited;
        });
      }
    }));
  }

  this$(prop, item, value) {
    if (prop === 'metaData') {
      this.model = [{
        isOwn: this.user && this.user.username === item.metaData.author.username,
        slug: this.routeParams.var0,
        ...item.model.getCleanModel(item.metaData),
      }];
    } else if (prop === 'trigger') {
      if (this.idx != value) return;
      const item = this.articles[this.idx];
      this.model = [{
        isSingle: true,
        isOwn: this.user && item.author.username === this.user.username,
        author: { ...item.author },
        favorited: item.favorited,
        favoritesCount: item.favoritesCount,
        createdAt: item.createdAt,
      }];
    }
  }

  model$(prop, item, value) {
    if (prop === 'favorited') {
      item.favoritesCount += value ? 1 : -1;
    }
  }

  follow(e, elm, item) {
    this.crInst.triggerEvent('meta-click', { item, type: 'follow' });
  }

  like(e, elm, item) {
    this.crInst.triggerEvent('meta-click', { item, type: 'like' });
  }

  likeSingle(e, elm, item) {
    if (this.user) {
      api.postLike({
        slug: this.articles[this.idx].slug,
        favorited: item.favorited,
      }).then(data => { item.favorited = !item.favorited });
    } else window.location.href = '#/sign-up';
  }

  delete(e, elm, item) {
    api.deleteArticle({ slug: this.routeParams.var0 })
      .then(data => window.location.href = '#/');
  }
}));