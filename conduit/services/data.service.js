require([], () => {
  const dataService = {
    navigation: [
      { title: 'Home', link: '', icon: '', image: false, active: false, visible: true, app: 'home.component' }, // articles/0/my-feed
      { title: 'New Post', link: 'new', icon: 'compose', image: false, active: false, manage: true, visible: false, app: 'new-post.component' },
      { title: 'Settings', link: 'settings', icon: 'gear-a', image: false, active: false, manage: true, visible: false, app: 'settings.component' },
      { title: 'Sign up', link: 'sign-up', icon: '', image: false, active: false, manage: false, visible: true, app: 'sign-in.component' },
      { title: 'Sign in', link: 'sign-in', icon: '', image: false, active: false, manage: false, visible: true, app: 'sign-in.component' },
      { title: 'myName', link: 'profile', icon: '', image: '', active: false, manage: true, visible: false, app: 'profile.component' },

      { link: 'articles', app: 'home.component' },
      { link: 'article', app: 'article.component' },
      { link: 'profile', app: 'profile.component' },
    ],
    getLink: (app) => dataService.navigation.find(nav => nav.link === (app || '') && nav),
    getLinks: () => dataService.navigation.filter(item => item.active !== undefined),
    // getApp: (app) => (dataService.getLink(app) || {}).app,
  };

  return dataService;
});