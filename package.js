// How to use:
// node package.js -p ./myProject/ -c ./myProject/js/amd.cfg.js -o js/all.min.js
// --path | -p: path of project
// --cfg | -c: path to amd configuration file: amd.cfg.js
// --output | -o: path (relative to --path) to output file (or just name)

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

    let path = rootPath + item.path;
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
    output.push(options.path + item.path);
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

  const outputPath = options.path + options.output;
  writeMinJSFile(js, outputPath, 'uglify-es').then(minJS => {
    let textOut = '';
    let promises = [];

    html.forEach(htmlData => {
      promises.push(compressor.minify({
        compressor: 'html-minifier',
        input: options.path + htmlData.path,
        output: outputPath,
        sync: true,
      }).then(function(min) {
        return 'define("' + htmlData.key + '",[],function(){return \'' +
          min.replace(/\'/g, "\\'") + '\'});';
      }));
    });

    promises.push(Promise.resolve('---newPackageSection---'));

    css.forEach(htmlData => {
      promises.push(compressor.minify({
        compressor: 'sqwish',
        input: options.path + htmlData.path,
        output: outputPath,
        sync: true,
      }).then(function(min) {
        return 'define("' + htmlData.key + '",[],function(){return \'' +
          min.replace(/\'/g, "\\'") + '\'});';
      }));
    });

    promises.push(Promise.resolve('---newPackageSection---'));

    Promise.all(promises).then(data => {
      data.push(minJS);
      textOut = data.join('\n');
      fs.writeFile(
        outputPath,
        textOut
          .replace(/---newPackageSection---/g, '')
          .replace(/\\n\s+/g, "\\n "),
        (err) => {
          if (err) throw err;
        }
      );
    });
  });
});