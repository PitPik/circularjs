require(['circular', '!navbar.comp.html', 'data.service'],
({ Component }, template, dataService) => Component({
  selector: 'navbar',
  template,
  styles: `navbar .hidden { display: none; }`,
  subscribe$: {
    navigation: ['active', 'visible', 'title', 'link', 'image'],
    this: ['activeLink', 'user'],
  },
}, class NavBar {
  constructor(elm , crInst, input) {
    this.activeLink = {};
    this.user = {};
    input(this);
    this.navigation = dataService.getLinks();
  }

  this$(prop, item, value, oldValue = {}) {
    if (prop === 'user') {
      value = value || {};
      if (value.id !== oldValue.id || !value) this.navigation
        .forEach(item => {
          if (item.image !== false) item.image = this.user ? this.user.image : '';
          if (item.link.indexOf('profile') !== -1) {
            item.link = 'profile/' + value.username;
            item.title = value.username;
          }
          if (item.manage !== undefined) {
            var on = !item.manage ? !value.username : !!value.username;
            item.visible = on;
          } else item.visible = true;
        });
    }
    if (prop === 'activeLink') {
      oldValue.active = false;
      value.active = true;
    }
  }
}));