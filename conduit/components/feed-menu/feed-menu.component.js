require(['circular', '!feed-menu.component.html'],
({ Component }, template) => Component({
  selector: 'feed-menu',
  template,
  subscribe$: { model: ['*'], this: ['activeFeed', 'tag', 'isLoggedIn', 'profileName', 'routeParams'] },
  styles: 'feed-menu { display: block }',
}, class FeedMenu {
  constructor(elm, crInst, input) { // TODO: this component stinks! experimental...
    this.tag = '';
    this.isLoggedIn = false;
    this.profileName = '';
    this.routeParams = {};
    input(this);
    this.model = []; // approach using full component...
    this.activeFeed = {};
    this.setLinks();
    this.activeFeed.active = true;
  }

  setLinks() { // TODO: this is confusing stuff; clean up...
    const hasRouteParams = this.routeParams.appName !== undefined;
    const isProfile = !!this.profileName;
    const title0 = isProfile ? 'My Articles' : 'Your Feed';
    const title1 = isProfile ? 'Favorited Articles' : 'Global Feed';
    const isOwn = this.tag === 'my-feed';
    const profileLink = `profile/${this.profileName}/0`;
    const root = isProfile ? profileLink : 'articles/0/';
    const myFeed = isProfile ? '' : 'my-feed';
    const out = [{
      link:  isProfile ? root + '/favorites' : '', title: title1, active: false,
    }];

    if (this.isLoggedIn || isProfile)
      out.unshift({ link: root + myFeed, title: title0, active: false });
    if (this.tag && !isOwn)
      out.push({ link: root + this.tag, title: '#' + this.tag, active: true });
    if (!hasRouteParams) {
      this.activeFeed = this.tag && !isOwn ? out[out.length - 1] :
        isOwn || !this.isLoggedIn && !this.routeParams.var2 ? out[0] :
        out[1];
    }
    this.model = out;
    if (hasRouteParams) this.activeFeed = this.model[!this.routeParams.var2 ? 0 : 1];
  }

  this$(prop, item, value, oldValue) {
    if (prop === 'activeFeed') {
      if (oldValue) oldValue.active = false;
      if (value) value.active = true;
    }
    if (value === oldValue) return;
    if (prop === 'tag' || prop === 'isLoggedIn' && !this.profileName) this.setLinks();
    if (prop === 'profileName') this.setLinks();
    if (prop === 'routeParams' && value.appName === 'profile') {
      this.activeFeed = this.model[!value.var2 ? 0 : 1];
    }
  }

  toggle(e, elm, item) {
    this.activeFeed = item;
  }
}));