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
    this.data = ENV.generateData().toArray();
    this.perfMonitor = perfMonitor;
    this._update = this.update.bind(this);
  
    this.perfMonitor.startFPSMonitor();
    this.perfMonitor.startMemMonitor();
    this.perfMonitor.initProfiler("render");

    this.update();
  }

  update() {
    const data = ENV.generateData().toArray();

    this.perfMonitor.startProfile("render");
    this.data = data;
    this.perfMonitor.endProfile("render");

    setTimeout(this._update);
  }
}));
