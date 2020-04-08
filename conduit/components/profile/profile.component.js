require([
  'circular',
  '!profile.component.html',
  'home.component',
  'api.service',
  // 'follow-button.component',
], ({ Component }, template, Home, api) => Component({
  selector: 'profile',
  template,
  subscribe$: {
    this: Home.subscribe$.this.concat('profileName'),
    profile: ['*'],
  },
}, class Profile extends Home.Klass {
  constructor(elm, crInst, input, getRoot) {
    super(elm, crInst, input, getRoot, 'profile');

    this.profile = [];
    this.profileName = '';
    this.getProfile();
  }

  getProfile(offset = 0) {
    if (this.routeParams.appName !== 'profile') return;
    const author = this.routeParams.var0;
    const sameAuthor = (this.profile[0] || {}).username === author;
    const isFavorites = this.routeParams.var2 === 'favorites';
    if (!sameAuthor) api.profile({ author }).then(data => {
      const profile = data.profile.profile;
      this.profile = [{
        isUser: data.user && profile.username === data.user.username,
        ...profile,
        bio: profile.bio || '',
      }];
      this.profileName = profile.username;
    });
    this.getArticles(offset, '', 5, author, isFavorites);
  }

  this$$(prop, item, value) {
    if (prop === 'routeParams') {
      this.getProfile(+value.var1 - 1);
    }
  }

  follow(e, elm, item) {
    api.postFollow({
      author: { username: item.username, following: item.following }
    }).then(data => {
      item.following = !item.following;
    });
  }
}));