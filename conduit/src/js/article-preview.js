define('article-preview', ['app-data.srv'], dataSrv => (circular, articles, name, loggedIn) => {
  circular.component({
    name: name || 'article-preview',
    listeners: ['favoritesCount', 'favorited'],
    model: articles,
    eventListeners: {
      like: (e, elm, item) => loggedIn() ?
        dataSrv.postLike(item).then(response => {
          item.favoritesCount += item.favorited ? -1 : 1;
          item.favorited = !item.favorited;
        }) : window.location.href = '#/login',
      getTag: (e, elm, item) => {
        e.preventDefault();
        window.location.href = '#/articles/0/' + elm.textContent;
      },
    },
  });
});
