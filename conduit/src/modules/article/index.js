define('app-article', ['app-data.srv'], dataSrv => promise => promise.then(data => {
  const comments = data.cr.component('comments', {
    model: data.comments.comments.map(item => {
      item.slug = data.article.article.slug;
      return item;
    }),
    extraModel: data.user,
    eventListeners: {
      delete: function(e, elm, item) {
        dataSrv.deleteComment({ id: item.id, slug: item.slug })
          .then(response => this.removeChild(item));
      },
    },
  });

  data.cr.component('form', {
    model: [{ user: data.user || {}, slug: data.article.article.slug }],
    extraModel: { author: data.article.article.author },
    eventListeners: {
      submit: function(e, elm, item) {
        const text = item.views.textarea.value.trim();

        e.preventDefault();
        text && dataSrv.postComment({
          comment: { comment: { body: text } },
          slug: item.slug,
        }).then(response => {
          response.comment.slug = item.slug;
          comments.prependChild(response.comment);
          item.views.textarea.value = '';
        });
      }
    },
  });

  data.cr.component('article', {
    listeners: ['favoritesCount', 'favorited', 'author.following'],
    model: [data.article.article],
    extraModel: {
      loggedIn: !!data.user,
      isMine: data.user && data.user.username === data.article.article.author.username
    },
    eventListeners: {
      like: (e, elm, item) => data.loggedIn() ? dataSrv.postLike(item).then(response => {
        item.favoritesCount += item.favorited ? -1 : 1;
        item.favorited = !item.favorited;
      }) : window.location.href = '#/login',
      follow: (e, elm, item) => data.loggedIn() ? dataSrv.postFollow(item).then(response => {
        item.author.following = !item.author.following;
      }) : window.location.href = '#/login',
      delete: (e, elm, item) => dataSrv.deleteArticle(item).then(response => {
        window.location.href = `#/profile/${data.user.username}`;
      }),
    },
  });
}));
