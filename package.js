/**
 * How to use package.js
 * 
 * Example:
 * node package.js -p ./myProject -c js/amd.cfg.js -o js/all.min.js
 * 
 * This will package the project inside the folder "./myProject" to a
 * single file "js/all.min.js" inside the folder "./myProject"
 * (./myProject/js/all.min.js) using the amd-configuration file "js/amd.cfg.js".
 * package.js combines and minifies all template html/css and script files
 * to this one file.
 * 
 * Options:
 * --path | -p: path of project
 * --cfg | -c: path to amd configuration file (relative to --path)
 * --output | -o: path (relative to --path) to output file
 * --update | -u: update the lookahedMap of configuration defined by --cfg
 */

const fs = require('fs');
const compressor = require('node-minify');

const fileRegexp = /\.(?:html|css|txt)$/;

const collection = {};
const jsCollection = {};

const html = [];
const css = [];
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
  let output = [];

  data.forEach(item => {
    if (!item.path.match(fileRegexp)) {
      item.path += '.js';
    }
    output.push((options.path + '/' + item.path).replace('//', '/'));
    options.echo && console.log(`[Compressing] ${item.path}`);
  });

  return compressor.minify({
    compressor: type,
    input: output,
    output: outputName,
    // sync: true,
  }).then(min => {
    let index = 0;

    min = min.replace(/,(require|define)/g, (_, $1) => {
      return ',\n' + $1;
    });
    min = min.replace(/\),!*function/g, (_, $1) => {
      return '),\nfunction';
    });
    min = min.replace(/(require\(|define\((\".*?\"),)/g, (_, $1, $2) => {
      let out = "";

      if ($1 === 'require(') {
        out = 'define("' + data[index].key + '",';
      } else if ($2 === '""') {
        out = 'define("' + data[index].key + '",';
      } else {
        out = 'define(' + $2 + ',';
      }
      index++;
      return out;
    });
    return min;
  });
}

const params = process.argv.slice(2);
const options = {
  path: '',
  cfg: '',
  output: 'output.min.js',
  updateLookahead: false,
  help: false,
  echo: false,
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
  if (params[j] === '--echo' || params[j] === '-e') {
    options.echo = true;
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
--path | -p: path of project
--cfg | -c: path to amd configuration file (relative to --path)
--output | -o: path (relative to --path) to output file
--update | -u: update the lookahedMap of configuration defined by --cfg
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
        const path = getRealPath(cfgData.paths[item]);
        if (fs.existsSync(path)) {
          arr.push({
            key: item,
            path: cfgData.paths[item],
          });
        } else {
          console.log(`[SKIP] ${path}`);
          // TODO: necessary??
          // delete cfgData.paths[item];
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
        ignoreCustomFragments: [/{{[\s\S]*?}}/],
      }
    }).then(min => {
      options.echo && console.log(`[Compressing] ${htmlData.path}`);

      return 'define("' + htmlData.key + '",[],function(){return\'' +
        min.replace(/\'/g, "\\'").replace(/\n/g, "\\n") + '\'});';
    }).catch(e => { console.error(e); throw new Error('Error parsing HTML'); })));

    css.length && promises.push(Promise.resolve('/* CSS */'));

    css.forEach(cssData => promises.push(compressor.minify({
      compressor: 'crass',
      input: (options.path + '/' + cssData.path).replace('//', '/'),
      output: options.output,
      sync: true,
    }).then(min => {
      options.echo && console.log(`[Compressing] ${cssData.path}`);
  
      return 'define("' + cssData.key + '",[],function(){return\'' +
        min.replace(/\'/g, "\\'") + '\'});'
    }).catch(e => { console.error(e); throw new Error('Error parsing CSS'); })));

    promises.push(Promise.resolve('/* javaScript */'));

    Promise.all(promises).then(data => {
      data.push(minJS);
      textOut = data.join('\n');
      fs.writeFile(
        options.output,
        textOut.replace(/\\n\s+/g, "\\n"),
        err => {
          if (err) throw err;
          console.log('\n' + options.output + ' successfully saved!');
        }
      );
    }).catch(e => { console.error(e); throw new Error('Error parsing JS'); });
  });
});