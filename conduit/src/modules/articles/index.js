define('app-articles', ['article-preview'], articlePreview =>
promise => promise.then(data => {
  articlePreview(data.cr, data.articles.articles, null, data.loggedIn);

  data.cr.component('pagination', { model: data.pagination });

  data.tags && data.cr.component('tag-list', {
    model: data.tags.tags.map(tag => ({ tag: tag })), // , offset: data.offset
  });

  data.cr.component('feed-toggle', {
    model: [{ user: data.user, tag: data.tag, ownFeed: data.ownFeed }],
    listeners: ['ownFeed'],
    subscribe: (prop, item, value, oldValue) => {
      const toggle = data.cr.Toolbox.toggleClass;
      const views = item.views;

      toggle(views['own'], 'hidden', !item.user);
      toggle(views['own-link'], 'active', !item.tag && item.ownFeed);
      toggle(views['global'], 'active', !item.tag && !item.ownFeed);
      toggle(views['tags'], 'hidden', !item.tag);
      views['tags-link'].textContent = item.tag ? `# ${item.tag}` : '';
    },
    eventListeners: {
      prerender: (e, elm, item) => { // speed up ui-feedback
        item.tag = '';
        item.ownFeed = elm === item.views['own-link'];
      }
    },
    onInit: self => (self.model[0].ownFeed = self.model[0].ownFeed, self.uncloak()),
  });
}));
