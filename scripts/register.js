/**
 * How to use register.js
 * 
 * Example:
 * node register.js -p ./myProject -c js/amd.cfg.js -f my-component
 * 
 * This will scan the folder defined by -f add paths entries
 * to "js/amd.cfg.js" defined by -c.
 * The scanner assumes to call the component the same as the file...
 * If you decide to rename your definition part (not the path though) in
 * the configuration, the scan will still ignore it.
 * Example:
 * "my-app.component": "components/my-app/my-app.component"
 * "my-app": "components/my-app/my-app.component"
 * 
 * Options:
 * --path | -p: path of project
 * --cfg | -c: path to amd configuration file (relative to --path)
 * --folder | -f: path (relative to --path) to scanned folder
 */

const fs = require('fs');
const compressor = require('node-minify');

const params = process.argv.slice(2);
const options = {
  path: '',
  cfg: '',
  folder: '',
  plainFolder: '',
  help: false,
};
for (let j = 0; j < params.length; j++) {
  if (params[j] === '--path' || params[j] === '-p') {
    options.path = params[j + 1];
  }
  if (params[j] === '--cfg' || params[j] === '-c') {
    options.cfg = params[j + 1];
  }
  if (params[j] === '--folder' || params[j] === '-f') {
    options.folder = params[j + 1];
    options.plainFolder = params[j + 1];
  }
  if (params[j] === '--help' || params[j] === '-h') {
    options.help = true;
  }
}
if (!params.length || options.help) {
  console.log(`How to use register.js

Example:
node register.js -p ./myProject -c js/amd.cfg.js -f my-component

This will scan the folder defined by -f add paths entries
to "js/amd.cfg.js" defined by -c.
The scanner assumes to call the component the same as the file...
If you decide to rename your definition part (not the path though) in
the configuration, the scan will still ignore it.
Example:
"my-app.component": "components/my-app/my-app.component"
"my-app": "components/my-app/my-app.component"

Options:
--path | -p: path of project
--cfg | -c: path to amd configuration file (relative to --path)
--folder | -f: path (relative to --path) to scanned folder`);
  return;
}
if (!options.cfg) {
  throw 'No configuration (--cfg) defined';
}
options.path = options.path || './';
options.cfg = (options.path + '/' + options.cfg).replace('//', '/');
options.folder = (options.path + '/' + options.folder).replace('//', '/');

fs.readFile(options.cfg, 'utf-8', (err, data) => {
  if (err) { throw err; }

  const require = { // local overwrite...
    config: cfgData => {
      fs.readdir(options.folder, (err, items) => {
        let count = 0;
        if (!items) {
          console.log(`The are no files in "${options.folder}" or the folder doesn't exist`);
          return;
        }
        for (let i = 0; i < items.length; i++) {
          let file = options.plainFolder + '/' + items[i];
          const isJS = file.match(/\.js$/);
          
          if (isJS) {
            file = file.replace(/\.js$/, '');
          }
          // const key = (isJS ? '' : '!') + file.split('/').pop();
          const key = file.split('/').pop();
          let cont = false;

          if (cfgData[key]) continue;
          for (var item in cfgData.paths) { // check path
            if (cfgData.paths[item] === file) {
              cont = true;
            }
          }
          if (cont) continue;

          count++;

          if (isJS) {
            cfgData.paths[key] = file;
          } else {
            cfgData.paths['!' + key] = file;
          }
        }

        const output = JSON.stringify(cfgData).replace(/"/g, "'");
        if (!count) {
          console.log('No items added!');
          return;
        }
        fs.writeFile(
          options.cfg,
          'require.config(' + output + ');',
          err => {
            if (err) throw err;
            console.log(count + ' item(s) successfully added!');
            console.log(options.cfg + ' successfully saved!');
  
            compressor.minify({ // beatify
              compressor: 'terser',
              input: options.cfg,
              output: options.cfg,
              options: {
                output: {
                  beautify: true,
                  quote_style: 1,
                  indent_level: 2,
                  indent_start: 0,
                  width: 80,
                  max_line_len: 80,
                },
              },
              callback: (err, min) => {
                if (err) throw err;
                console.log(options.cfg + ' successfully formatted and saved!');
              }
            });
          }
        );
      });
    },
  };
  eval(data);
});