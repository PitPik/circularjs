/**
 * How to use package.js
 * 
 * Example:
 * node package.js
 * 
 * This will return further help
 */

const fs = require('fs');
const compressor = require('node-minify');

const fileRegexp = /\.(?:html|css|json|txt)$/;

const collection = {};
const jsCollection = {};

const html = [];
const css = [];
const json = [];
const js = [];

const getRealPath = itemPath => {
  let path = (options.path + '/' + itemPath).replace('//', '/');
  if (!path.match(fileRegexp)) {
    path += '.js';
  }
  return path;
};

const collectDeps = (data, rootPath) => {
  data.forEach(item => {
    // make UMD go for define()...
    const exports = 'string'; // needed...
    const module = 'string'; // needed...
    // ... and fake define to get dependencies
    const require = (name, deps) => { // local overwrite...
      if (typeof name !== 'string') {
        deps = name;
      }
      if (typeof deps === 'function') {
        deps = [];
      }
      item.deps = deps;
      item.type = 'js';
      collection[item.key] = item;
      jsCollection[item.key] = item;
    };
    const define = require; // needed...
    define.amd = true; // needed...

    const path = getRealPath(item.path);
    const content = fs.readFileSync(path, 'utf-8', (err) => {
      if (err) { throw err; }
    });
    if (!path.match(/\.js$/)) {
      item.deps = [];
      item.type = path.match(fileRegexp)[0].replace('.', '');
      if (item.type === 'css') {
        css.push(item);
      } else if (item.type === 'html') {
        html.push(item);
      } else if (item.type === 'json') {
        json.push(item);
      }
      collection[item.key] = item;
    } else {
      eval(content);
    }
  });
};


const depsSorter = dependencies => {
  let keys = Object.keys(dependencies);
  const used = new Set();
  const result = [];
  let items = [];
  let length = 0;

  do {
    length = keys.length;
    items = [];
    keys = keys.filter(k => {
      if (!dependencies[k].every(Set.prototype.has, used)) return true;
      items.push(k);
    });
    result.push(...items);
    items.forEach(Set.prototype.add, used);
  } while (keys.length && keys.length !== length)

  result.push(...keys);

  return result;
}

const sortOutput = items => {
  const out = {};

  items.forEach(item => {
    if (item.type === 'css' || item.type === 'html') return;
    const deps = [];
    if (!item.deps) {
      console.log(`[SKIP-NONE] ${item.path}.js`);
      return;
    };
    (item.deps || []).forEach(dep => {
      if (jsCollection[dep]) deps.push(dep);
    });
    out[item.key] = deps;
  });

  const sortedItems = depsSorter(out);
  sortedItems.forEach(name => {
    js.push(collection[name]);
  });

  return js;
};

const writeMinJSFile = (data, outputName, type) => {
  const jsFiles = [];
  const output = [];
  const promises = [];

  data.forEach(item => {
    if (!item.path.match(fileRegexp)) {
      item.path += '.js';
    }
    if (/\.json$/.test(item.path)) return;
    jsFiles.push(item);

    output.push((options.path + '/' + item.path).replace('//', '/'));
    options.echo && console.log(`\x1b[94m[Compressing]\x1b[0m ${item.path}`);
  });

  output.forEach((name, index) => {
    return promises.push(
      compressor
        .minify({
          compressor: type,
          input: name,
          output: outputName,
          // sync: true,
        })
        .then(min => {
          return min.replace(/((require|define)\((.*?)\))/, (_, $1, $2, $3) => {
            const params = $3.split(/\s*,\s*/);
            const noName = params[0][0] !== '"';
            let name = noName ? `"${jsFiles[index].key}",` : '';

            if (noName && params[0][0] !== '[') name += '[],';

            return `define(${name}${$3})`;
          });
        })
        .catch(e => console.error(e))
    );

  });

  return Promise.all(promises);
}

const params = process.argv.slice(2);
const options = {
  path: './',
  cfg: 'js/amd.cfg.js',
  output: 'js/main.min.js',
  updateLookahead: false,
  help: false,
  circularjs: '',
  echo: true,
  mocks: false,
};
for (let j = 0; j < params.length; j++) {
  if (params[j] === '--path' || params[j] === '-p') {
    options.path = params[j + 1];
  }
  if (params[j] === '--cfg' || params[j] === '-c') {
    options.cfg = params[j + 1];
  }
  if (params[j] === '--output' || params[j] === '-o') {
    options.output = params[j + 1];
  }
  if (params[j] === '--update' || params[j] === '-u') {
    options.updateLookahead = params[j + 1] === 'true';
  }
  if (params[j] === '--help' || params[j] === '-h') {
    options.help = true;
  }
  if (params[j] === '--circularjs' || params[j] === '-cr') {
    options.circularjs = params[j + 1];
  }
  if (params[j] === '--echo' || params[j] === '-e') {
    options.echo = params[j + 1] === 'false' ? false : true;
  }
  if (params[j] === '--mocks' || params[j] === '-m') {
    options.mocks = params[j + 1] === 'false' ? false : true;
  }
}
if (!params.length || options.help) {
  console.log(`How to use package.js

Example:
node package.js -p ./myProject -c js/amd.cfg.js -o js/all.min.js

This will package the project inside the folder "./myProject" to a
single file "js/all.min.js" inside the folder "./myProject"
(./myProject/js/all.min.js) using the amd-configuration file "js/amd.cfg.js".
package.js combines and minifies all template html/css and script files
to this one file.

Options:
--help | -h: returns help; no arguments also returns help
--path | -p: path of project
--cfg | -c: path to amd configuration file (relative to --path)
--output | -o: path (relative to --path) to output file
--update | -u: update the lookahedMap of configuration defined by --cfg
--circularjs | -cr: path to circular.min.j; includes circular.min.js to the file
--mocks | -m: enables mock dependency packaging
--echo | -e: more details about compressed files`);
  return;
}
if (!options.cfg) {
  throw 'No configuration (--cfg) defined';
}
options.path = options.path || './';
options.cfg = (options.path + '/' + options.cfg).replace('//', '/');
options.output = (options.path + '/' + options.output).replace('//', '/');

const updateLookahead = (lookaheadMap, data) => {
  if (!options.updateLookahead) return;
  const require = { // overwrite global function
    config: innerData => {
      innerData.lookaheadMap = lookaheadMap;
      const output = JSON.stringify(innerData).replace(/"/g, "'");

      fs.writeFile(
        options.cfg,
        'require.config(' + output + ');',
        err => {
          if (err) throw err;
          console.log('\n' + options.cfg + ' successfully saved!');

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
              console.log('\n' + options.cfg + ' successfully formatted and saved!');
            }
          });
        }
      );
    }
  };
  eval(data);
};

fs.readFile(options.cfg, 'utf-8', (err, data) => {
  if (err) { throw err; }
  const arr = [];
  let lookaheadMap = {};
  const require = { // local overwrite...
    config: cfgData => {
      Object.keys(cfgData.paths).forEach((item, idx) => {
        const production = cfgData.production || {};
        const itemPath = production[item] || (options.mocks && cfgData.mocks[item]) || cfgData.paths[item];
        const path = getRealPath(itemPath);
        if (fs.existsSync(path)) {
          arr.push({
            key: item,
            path: itemPath,
          });
        } else {
          console.log(`\x1b[31m[-- SKIPS --]\x1b[0m ${path}`);
          // TODO: necessary??
          // delete itemPath;
        }
      });

      collectDeps(arr, options.path);
      for (var key in collection) {
        if (!collection[key].deps || !collection[key].deps.length) continue;
        let goFurther = false;
        collection[key].deps.forEach(dep => {
          if (collection[dep]) goFurther = true;
        });
        if (!goFurther) continue;
        lookaheadMap[key] = collection[key].deps;
      }
      updateLookahead(lookaheadMap, data);
    },
  };
  eval(data);
  sortOutput(arr);
  writeMinJSFile(js.filter(item => item), options.output, 'uglify-es').then(minJS => {
    let textOut = '';
    let promises = [];

    if (options.circularjs) {
      html.length && promises.push(Promise.resolve(
        '/**! @license CircularJS ● v2.0.3; Copyright (C) 2017-2023 by Peter Dematté */'
      ));
      promises.push(fs.readFileSync(options.circularjs, 'utf-8')
        .replace(/\n\s*\/\/#\s*sourceMappingURL=[^\n]*/, ''));
    }

    html.length && promises.push(Promise.resolve('/* HTML */'));

    html.forEach(htmlData => promises.push(compressor.minify({
      compressor: 'html-minifier',
      input: (options.path + '/' + htmlData.path).replace('//', '/'),
      output: options.output,
      sync: true,
      options: {
        minifyJS: false,
        removeTagWhitespace: true,
        removeComments: true,
        preserveLineBreaks: true,
        collapseInlineTagWhitespace: true,
        collapseWhitespace: true,
        conservativeCollapse: true,
        ignoreCustomFragments: [/{{2,}[\s\S]*?}{2,}/],
        collapseBooleanAttributes: false,
      }
    }).then(min => {
      options.echo && console.log(`\x1b[94m[Compressing]\x1b[0m ${htmlData.path}`);

      return 'define("' + htmlData.key + '",[],function(){return\'' +
        min
          .replace(/\s+({{2,3})~/g, '$1')
          .replace(/~(}{2,3})\s+/g, '$1')
          .replace(/\'/g, "\\'")
          .replace(/\n/g, "\\n") + '\'});';
    }).catch(e => { console.error(e); throw new Error('Error parsing HTML'); })));

    css.length && promises.push(Promise.resolve('/* CSS */'));

    css.forEach(cssData => promises.push(compressor.minify({
      compressor: 'crass',
      input: (options.path + '/' + cssData.path).replace('//', '/'),
      output: options.output,
      sync: true,
    }).then(min => {
      options.echo && console.log(`\x1b[94m[Compressing]\x1b[0m ${cssData.path}`);
  
      return 'define("' + cssData.key + '",[],function(){return\'' +
        min.replace(/\'/g, "\\'") + '\'});'
    }).catch(e => { console.error(e); throw new Error('Error parsing CSS'); })));

    json.length && promises.push(Promise.resolve('/* JSON */'));

    json.forEach(jsonData => promises.push(new Promise((resolve, reject) => {  
      const path = (options.path + '/' + jsonData.path).replace('//', '/');
      const content = fs.readFileSync(path, 'utf-8', (err) => {
        reject(err);
        // if (err) { throw err; }
      });

      options.echo && console.log(`\x1b[94m[Compressing]\x1b[0m ${jsonData.path}`);
  
      return resolve('define("' + jsonData.key + '",[],function(){return' +
        content.replace(/\n\s*/g, '') + '});');
    
    })));

    promises.push(Promise.resolve('/* javaScript */'));

    Promise.all(promises).then(data => {
      data.push(minJS.join('\n'));
      textOut = data.join('\n');
      console.log(`\n\x1b[94m[*Packaging*]\x1b[0m ${options.output}`);
      fs.writeFile(
        options.output,
        textOut.replace(/\\n\s+/g, "\\n") + '\n/* EOF: */',
        err => {
          if (err) throw err;
          console.log('\n' + options.output + ' successfully saved!');
        }
      );
    }).catch(e => { console.error(e); throw new Error('Error parsing JS'); });
  });
});