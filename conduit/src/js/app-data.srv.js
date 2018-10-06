define('app-data.srv', ['toolbox'], function(Toolbox) {
  const Promise = window.Promise || Toolbox.Promise;
  const rootURL = 'https://conduit.productionready.io/api/';
  const tokenName = 'jwtToken';
  const getToken = () => localStorage.getItem(tokenName);
  const loggedIn = () => !!dataService.appData.user;
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
    .map(Number.call, Object)
    .map((v, i) => ({
      value: i + 1 + '',
      active: data.offset !== undefined && data.offset == i,
      tag: data.tag,
      ownFeed: data.ownFeed,
      author: data.author,
      favorited: data.favorited,
    }));

  const dataService = {
    appData: undefined,
    // -- FETCH -------------------------------------------- //
    'user' : options => getUser(options),
    'default': options => getUser(options).then(data => ({
      cr: options.cr,
      user: data,
      isRegister: options.isRegister,
    })),
    'articles': options => Promise.all([
      fetch(`${rootURL}articles${options.ownFeed ?
        '/feed' : ''}?limit=${options.limit}&offset=${options.offset *
        options.limit}${options.tag ? '&tag=' + options.tag : ''}`, getToken())
      .catch(() => window.location.href = '#/login'),
      options.isSameApp ? dummyPromise : fetch(`${rootURL}tags`, false, 30000),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      articles: data[0],
      tags: data[1],
      user: data[2],
      loggedIn: loggedIn,
      tag: options.tag,
      ownFeed: options.ownFeed,
      pagination: getPaginaionModel(options, data[0].articlesCount),
    })),
    'article': options => Promise.all([
      fetch(`${rootURL}articles/${options.article}`, getToken()),
      fetch(`${rootURL}articles/${options.article}/comments`),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      article: data[0],
      comments: data[1],
      user: data[2],
      loggedIn: loggedIn,
    })),
    'editor': options => Promise.all([
      options.article ? fetch(`${rootURL}articles/${options.article}`, getToken()) : dummyPromise,
    ]).then(data => ({
      cr: options.cr,
      article: data[0],
    })),
    'profile': options => Promise.all([
      options.isSameAuthor ? dummyPromise : fetch(`${rootURL}profiles/${options.author}`, getToken()),
      fetch(`${rootURL}articles?${options.favorited ? 'favorited' : 'author'}=${encodeURIComponent(
        options.author)}&limit=${options.limit}&offset=${options.offset * options.limit}`, getToken()),
      getUser(options),
    ]).then(data => ({
      cr: options.cr,
      profile: data[0],
      articles: data[1],
      user: data[2],
      loggedIn: loggedIn,
      tag: options.tag,
      favorited: options.favorited,
      pagination: getPaginaionModel(options, data[1].articlesCount),
    })),
    // -- PUT ----------------------------------------- //
    'userLogin': data => put(`${rootURL}users/login`, null, data).then(normalizeUserData),
    'userLogout': data => new Promise(resolve => {
      localStorage.removeItem(tokenName);
      dataService.appData.user = undefined;
      resolve();
    }),
    'userSignup': data => put(`${rootURL}users`, null, data).then(normalizeUserData),
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