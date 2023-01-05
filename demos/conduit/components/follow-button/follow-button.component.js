define('follow-button.component', ['circular'], ({ Component }) => Component({
  selector: 'follow-button',
  template: `
  <wrap>
    <button
      cr-for="model"
      cr-event="click: follow"
      class="btn btn-sm btn{{#unless %following}}-outline{{/unless}}-secondary action-btn"
    >
      <i class="{{#if %following}}ion-minus-round{{else}}ion-plus-round{{/if}}"></i>
      <span>{{#if %following}}Unfollow{{else}}Follow{{/if}} {{%username}}</span>
    </button>
  </wrap>`,
  subscribe$: { this: ['triggerProfile'], model: ['*'] },
}, class FollowButton {
  constructor(elm, crInst, input) { // not in use due to ...
    this.triggerProfile = false;
    this.profile = {};
    input(this);
    this.model = [{}];
    console.log(this.profile);
  }

  this$(prop, item, value) {
    this.model = [{ ...this.profile[0] }];
  }

  follow(e, elm, item) {
    item.following = !item.following;
  }
}));