/**
 * How to use package.js
 * 
 * Example:
 * node package.js -p ./myProject -c js/amd.cfg.js -o js/all.min.js
 * 
 * This will package the project in "./myProject" to a single file "js/all.min.js"
 * inside "./myProject" (so: ./myProject/js/all.min.js) using the
 * amd-configuration file "js/amd.cfg.js"
 * 
 * Options:
 * --path | -p: path of project
 * --cfg | -c: path to amd configuration file (relative to --path)
 * --output | -o: path (relative to --path) to output file
 */

const fs = require('fs');
const compressor = require('node-minify');

const fileRegexp = /\.(?:html|css|txt)$/;

const collection = {};
const jsCollection = {};

const html = [];
const css = [];
const js = [];

const collectDeps = (data, rootPath) => {
  data.forEach(item => {
    const exports = 'string'; // needed...
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

    let path = (rootPath + '/' + item.path).replace('//', '/');
    if (!path.match(fileRegexp)) {
      path += '.js';
    }
    const content = fs.readFileSync(path, 'utf-8', (err) => {
      if(err) { throw err; }
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


const depsSorter = (dependencies) => {
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
  });

  return compressor.minify({
    compressor: type,
    input: output,
    output: outputName,
    // sync: true,
  }).then(function(min) {
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
        out =  'define("' + data[index].key + '",';
      } else if ($2 === '""') {
        out =  'define("' + data[index].key + '",';
      } else {
        out =  'define(' + $2 + ',';
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
  output: 'output.min.js', // TODO: also combine with options.path
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
}
if (!options.cfg) {
  throw 'No cfg defined';
}
options.path = options.path || './';
options.cfg = (options.path + '/' + options.cfg).replace('//', '/');
options.output = (options.path + '/' + options.output).replace('//', '/');

fs.readFile(options.cfg, 'utf-8', (err, data) => {
  if(err) { throw err; }
  const arr = [];
  const require = { // local overwrite...
    config: (data) => {
      Object.keys(data.paths).forEach(item => {
        arr.push({
          key: item,
          path: data.paths[item],
        });
      });
  
      collectDeps(arr, options.path);
    },
  };
  eval(data);
  sortOutput(arr);

  writeMinJSFile(js, options.output, 'uglify-es').then(minJS => {
    let textOut = '';
    let promises = [];

    html.length && promises.push(Promise.resolve('/* HTML */'));

    html.forEach(htmlData => {
      promises.push(compressor.minify({
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
        }
      }).then(function(min) {
        return 'define("' + htmlData.key + '",[],function(){return \'' +
          min.replace(/\'/g, "\\'").replace(/\n/g, "\\n") + '\'});';
      }));
    });

    css.length && promises.push(Promise.resolve('/* CSS */'));

    css.forEach(cssData => {
      promises.push(compressor.minify({
        compressor: 'crass',
        input: (options.path + '/' + cssData.path).replace('//', '/'),
        output: options.output,
        sync: true,
      }).then(function(min) {
        return 'define("' + cssData.key + '",[],function(){return \'' +
          min.replace(/\'/g, "\\'") + '\'});';
      }));
    });

    promises.push(Promise.resolve('/* javaScript */'));

    Promise.all(promises).then(data => {
      data.push(minJS);
      textOut = data.join('\n');
      fs.writeFile(
        options.output,
        textOut.replace(/\\n\s+/g, "\\n"),
        (err) => {
          if (err) throw err;
          console.log(options.output + ' successfully saved!');
        }
      );
    });
  });
});