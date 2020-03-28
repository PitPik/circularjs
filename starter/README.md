# Starte kit or, how to structure your projects

This demo should show how projects can be structured. The component `app-starter` can be used as a blue-print for new components.

The file `js/amd.cfg.js` is used to show `amd.js` where to find the files that are required for your components, services, etc.
It will also be used to package your project once you want to go live. Basicly, this file is only needed for development.
That's why you can change your `index.html` once you're done to the following:

```html
  <!-- <script type="text/javascript" src="js/amd.cfg.js"></script>
  <script type="text/javascript"> require(['app-starter.component']); </script> -->
  <script type="text/javascript" src="js/all.min.js"></script>
```

## Packaging

To get `js/all.min.js` you need to call `package.js`:

```
node package.js -p ./starter
```

or with all options (`-c` and `-o` default to the following):

```
node package.js -p ./starter -c js/amd.cfg.js -o js/all.min.js -e
```

In `./js/` folder you'll then find the file `all.min.js` that lists all the compressed files starting with the templates, then the styles and finally all the js-components in correct order according to dependencies.


## Adding components

There is not yet a cli-tool to create new components, therefore you have to do the following manually to add one:

Use `components` folder or create a `plugins` folder (unless you want to call them directives), copy the `app-starter` folder into it and start renaming: the folder, the files, inside `app-starter.component.js` the dependencies, the `selector` and the class name, and you're done.
To register those components, add them to the `js/amd.cfg.js` file (maybe also just copy/paste and rename...).

## Folder strucure

This is how your project could be organised:

```
my-project
  ├─ components
     ├─ app-starter
         app-starter.component.css
         app-starter.component.html
         app-starter.component.js
  ├─ plugins
      ...
  ├─ services
      ...
  ├─ js
      amd.cfg.js
      circular.min.js
  ├─ css
      ...
  index.html
  package.js
```