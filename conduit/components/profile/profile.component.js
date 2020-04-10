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
  constructor(elm, crInst, input) {
    super(elm, crInst, input);

    this.profile = [];
    this.profileName = '';
    input(this);
  }

  follow(e, elm, item) {
    if (!this.isLoggedIn) return window.location.href = '#/sign-up';
    api.postFollow({
      author: { username: item.username, following: item.following }
    }).then(data => {
      item.following = !item.following;
    });
  }
}));