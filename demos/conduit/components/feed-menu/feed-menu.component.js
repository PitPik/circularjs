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
    input(this);
    this.model = []; // approach using full component...
    this.activeFeed = {};
    this.setLinks();
  }

  setLinks(prop) { // TODO: this is confusing stuff; clean up...
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

    if (isProfile && this.tag || !isProfile && this.tag === '') return;
    if (this.isLoggedIn || isProfile)
      out.unshift({ link: root + myFeed, title: title0, active: false });
    if (this.tag && !isOwn)
      out.push({ link: root + this.tag, title: '#' + this.tag, active: true });
    if (!isProfile) {
      this.activeFeed = this.tag && !isOwn ? out[out.length - 1] :
        isOwn || !this.isLoggedIn && !this.tag ? out[0] :
        out[1];
    }
    this.model = out;
    if (isProfile) this.activeFeed = this.model[!this.tag ? 0 : 1];
    this.activeFeed.active = true;
  }

  this$(prop, item, value, oldValue) {
    if (prop === 'activeFeed') {
      if (oldValue) oldValue.active = false;
      if (value) value.active = true;
    }
    if (value === oldValue) return;
    if (prop === 'tag' || prop === 'isLoggedIn' && !this.profileName) this.setLinks(prop);
    if (prop === 'profileName') this.setLinks(prop);
  }

  toggle(e, elm, item) {
    this.activeFeed = item;
  }
}));