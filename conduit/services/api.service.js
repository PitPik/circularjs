require(['toolbox'], function(Toolbox) {
  const Promise = window.Promise || Toolbox.Promise;
  const rootURL = 'https://conduit.productionready.io/api/';
  const tokenName = 'jwtToken';
  const getToken = () => localStorage.getItem(tokenName);
  const postHeader = { 'Content-Type': 'application/json; charset=utf-8' };
  const baseConfig = { dataType: 'json' };
  const getConfig = (type, needHeader, config) => {
    const token = getToken();

    config.type = type && type.toUpperCase() || 'GET';
    if (needHeader) {
      config.headers = Object.assign({}, postHeader);
      if (token) {
        config.headers.Authorization = 'Token ' + token;
      }
    }
    return config;
  };
  const normalizeUserData = data => {
    if (data.user.image === null) data.user.image = '';
    if (data.user.bio === null) data.user.bio = '';
    localStorage.setItem(tokenName, data.user.token);
    dataService.appData.user = data.user;
    return data.user;
  };
  const fetch = (url, needHeader, cache, resetCache) =>
    Toolbox.ajax(url, getConfig('GET', needHeader,
      Object.assign({ cache: cache, resetCache: resetCache }, baseConfig)));
  const put = (url, type, data) => Toolbox.ajax(url, getConfig(type || 'POST', true,
    Object.assign(data ? { data: JSON.stringify(data || {}) } : {}, baseConfig)));
  const getUser = options => options.user || !getToken() ?
    new Promise(resolve => resolve(options.user && JSON.parse(JSON.stringify(options.user)))) :
    fetch(`${rootURL}user`, true, 500).then(normalizeUserData) // 500 -> debounce
      .catch(() => localStorage.removeItem(tokenName));
  const dummyPromise = new Promise(resolve => resolve());
  const getPaginaionModel = (data, count) => Array.apply(null,
      { length: Math.ceil((count < data.limit + 1 ? 0 : count) / data.limit) })
    .map((v, i) => ({
      active: data.offset !== undefined && data.offset == i,
      tag: data.tag || '',
      ownFeed: data.ownFeed,
      author: data.author,
      favorited: data.favorited || '',
    }));

  const dataService = {
    appData: {},
    // -- FETCH -------------------------------------------- //
    'user' : options => getUser(options),
    'default': options => getUser(options).then(data => ({
      user: data,
      isRegister: options.isRegister,
    })),
    'articles': options => Promise.all([
      options.author ?
        fetch(`${rootURL}articles?${options.favorited ? 'favorited' : 'author'}=${encodeURIComponent(
          options.author)}&limit=${options.limit}&offset=${options.offset * options.limit}`, getToken()) :
        fetch(`${rootURL}articles${options.ownFeed ?
          '/feed' : ''}?limit=${options.limit}&offset=${options.offset *
          options.limit}${options.tag ? '&tag=' + options.tag : ''}`, getToken())
        .catch(() => window.location.href = '#/login'),
      options.isSameApp ? dummyPromise : fetch(`${rootURL}tags`, false, 30000),
      getUser(options),
    ]).then(data => ({
      articles: data[0].articles,
      tags: data[1].tags,
      user: dataService.appData.user = data[2],
      pagination: getPaginaionModel(options, data[0].articlesCount),
    })),
    'article': options => Promise.all([
      fetch(`${rootURL}articles/${options.article}`, getToken()),
      fetch(`${rootURL}articles/${options.article}/comments`),
      getUser(options),
    ]).then(data => ({
      article: data[0].article,
      comments: data[1].comments,
      user: dataService.appData.user = data[2],
    })),
    'editor': options => Promise.all([
      options.article ? fetch(`${rootURL}articles/${options.article}`, getToken()) : dummyPromise,
    ]).then(data => ({
      article: data[0],
    })),
    'profile': options => Promise.all([
      options.isSameAuthor ? dummyPromise : fetch(`${rootURL}profiles/${options.author}`, getToken()),
      fetch(`${rootURL}articles?${options.favorited ? 'favorited' : 'author'}=${encodeURIComponent(
        options.author)}&limit=${options.limit}&offset=${options.offset * options.limit}`, getToken()),
      getUser(options),
    ]).then(data => ({
      profile: data[0].profile,
      articles: data[1].articles,
      user: dataService.appData.user = data[2],
      pagination: getPaginaionModel(options, data[1].articlesCount),
    })),
    // -- PUT ----------------------------------------- //
    'sign-in': data => put(`${rootURL}users/login`, null, data).then(normalizeUserData)
      .then(data => dataService.appData.user = data),
    'userLogout': data => new Promise(resolve => {
      localStorage.removeItem(tokenName);
      dataService.appData.user = undefined;
      resolve();
    }),
    'sign-up': data => put(`${rootURL}users`, null, data).then(normalizeUserData)
      .then(data => dataService.appData.user = data),
    'putSettings': data => put(`${rootURL}user`, 'PUT', data.user),
    'postArticle': data => !data.slug ? put(`${rootURL}articles`, 'POST', data) :
       put(`${rootURL}articles/${data.slug}`, 'PUT', data),
    'deleteArticle': data => put(`${rootURL}articles/${data.slug}`, 'DELETE'),
    'postComment': data => put(`${rootURL}articles/${data.slug}/comments`, 'POST', data.comment),
    'deleteComment': data => put(`${rootURL}articles/${data.slug}/comments/${data.id}`, 'DELETE'),
    'postLike': data => put(`${rootURL}articles/${data.slug}/favorite`,
      data.favorited ? 'DELETE' : 'POST'),
    'postFollow': data => put(`${rootURL}profiles/${data.author.username}/follow`,
      data.author.following ? 'DELETE' : 'POST'),
  };
  return dataService;
});
