require(['circular'], ({ Module }) => Module({
  selector: 'app',
  template: `
  <table class="table table-striped latest-data">
    <tbody>
      <tr cr-for="data">
        <td class="dbname">
          {{dbname}}
        </td>
        <td class="query-count">
          <span class="{{%lastSample.countClassName}}">
            {{%lastSample.nbQueries}}
          </span>
          {{#each %lastSample.topFiveQueries}}
        </td>
        <td class="{{%elapsedClassName}}">
          {{%formatElapsed}}
          <div class="popover left">
            <div class="popover-content">{{%query}}</div>
            <div class="arrow"></div>
          </div>
          {{/each}}
        </td>
      </tr>
    </tbody>
  </table>`,
  subscribe$: {
    data: [
      'lastSample.countClassName',
      'lastSample.nbQueries',
      'lastSample.topFiveQueries.*.elapsedClassName',
      'lastSample.topFiveQueries.*.formatElapsed',
      'lastSample.topFiveQueries.*.query',
    ]
  },
}, class App {
  constructor() {
    const generateData = ENV.generateData;

    this.getData = () => generateData().toArray();
    this.pingRenderRate = Monitoring.renderRate.ping;
    this.$update = this.update.bind(this);

    this.data = this.getData();

    this.update();
  }

  update() {
    setTimeout(this.$update);

    this.data = this.getData();
    this.pingRenderRate();
  }
}));
