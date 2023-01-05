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
        {{#each topFiveQueries}}
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
  subscribe$: { 'data:topFiveQueries': [] },
},
class App {
  constructor() {
    this.pingRenderRate = Monitoring.renderRate.ping;
    this.BoundUpdate = this.update.bind(this);
    this.data = this.getViewModel();

    setTimeout(this.BoundUpdate, ENV.timeout);
  }

  getViewModel() { // some mapping for viewModel
    let data = ENV.generateData().toArray();

    data.forEach(item => {
      item.topFiveQueries = item.lastSample.topFiveQueries;
      item.lastSample.queries = null;
    });

    return data;
  }

  update() {
    setTimeout(this.BoundUpdate, ENV.timeout);

    this.data.updateModel(this.getViewModel());
    this.pingRenderRate();
  }

}));
