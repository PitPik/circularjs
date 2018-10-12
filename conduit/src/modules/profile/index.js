define('app-profile', ['article-preview', 'app-data.srv'], (articlePreview, dataSrv) =>
promise => promise.then(data => {
  articlePreview(data.cr, data.articles.articles, 'articles', data.loggedIn);

  if (data.profile) {
    data.cr.component('profile', {
      model: [{ author: data.profile.profile }],
      extraModel: { user: data.user && data.user.username },
      listeners: ['author.following'],
      eventListeners: {
        follow: (e, elm, item) => data.loggedIn() ? dataSrv.postFollow({
            author: item.author
        }).then(response => {
          item.author.following = response.profile.following;
        }) : window.location.href = '#/login',
      },
    });
  }

  data.cr.component('profile-pagination', { model: data.pagination });

  data.cr.component('article-toggle', {
    model: [{
      user: data.user,
      ownFeed: !data.favorited,
      profileUser: data.cr.components['profile'].model[0].author.username,
    }],
    listeners: ['ownFeed'],
    subscribe: (prop, item, value, oldValue) => {
      const toggle = data.cr.Toolbox.toggleClass;
      const regex = /#\/profile\/[^/]+/;
      const profilePath = `#/profile/${item.profileUser}`;

      toggle(item.views['own-link'], 'active', item.ownFeed);
      toggle(item.views['favorite-link'], 'active', !item.ownFeed);

      item.views['own-link'].href = item.views['own-link'].href
        .replace(regex, () => profilePath);
      item.views['favorite-link'].href = item.views['favorite-link'].href
        .replace(regex, () => profilePath);
    },
    eventListeners: {
      prerender: (e, elm, item) => { // speed up ui-feedback
        item.ownFeed = elm === item.views['own-link'];
      }
    },
    onInit: self => (self.model[0].ownFeed = self.model[0].ownFeed, self.uncloak()),
  });
}));
