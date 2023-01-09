require(['circular'], ({ Component }) =>

Component({
  selector: 'app',
  initialize: true,
  template: `
  <table class="table table-striped latest-data">
    <tbody>
    {{#each data}}
      <tr>
        <td class="dbname">
          {{dbname}}
        </td>
        <td class="query-count">
          <span class="{{%lastSample.countClassName}}">
            {{%lastSample.nbQueries}}
          </span>
        </td>
        {{#each lastSample.topFiveQueries}}
        <td class="{{%elapsedClassName}}">
          {{%formatElapsed}}
          <div class="popover left">
            <div class="popover-content">{{%query}}</div>
            <div class="arrow"></div>
          </div>
        </td>
        {{/each}}
      </tr>
    {{/each}}
    </tbody>
  </table>`,
  subscribe$: { 'data': [] },
},
class App {
  constructor() {
    this.data = ENV.generateData().toArray();

    setTimeout(() => this.update(), ENV.timeout);
  }

  update() {
    this.data.updateModel(ENV.generateData().toArray());
    Monitoring.renderRate.ping();

    setTimeout(() => this.update(), ENV.timeout);
  }

}));
