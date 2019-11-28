define('data-provider', ['toolbox'], ({ ajax, storageHelper }) => {
  const getTreePath = key => ({
    tree: 'mock-data/page-model.json',
    catalog: 'mock-data/catalog.json',
  }[key]);
  const storageData = {}; // TODO: store open items...
  const mapTreeModel = (model, isNew, storageName, recursion) => {
    if (!recursion && storageName) {
      storageData[storageName] = storageData[storageName] || [];
      storageData[storageName] = provider.fetchToggles(storageName);
    }

    return model.map(item => ({
      ...item,
      childNodes: mapTreeModel(item.children || [], isNew, storageName, true),
      // extra items for view
      isOpen: (storageData[storageName] || []).indexOf(item.name) !== -1,
      hovered: false,
      selected: false,
      active: false,
      name: item.name + (isNew ? '_' : ''), // if new; only for demo
      class: '',
      linkClass: '',
      title: item.properties.title,
    }));
  };
  const getIcon = kind => ({ // TODO: move to more generic service
    addAfter: 'playlist_add',
    addBefore: 'playlist_add',
    addInside: 'playlist_add',
    close: 'close',
    closeInner: 'unfold_less',
    container: 'video_label',
    delete: 'delete',
    properties: 'settings',
    tree: 'subject',
    widget: 'apps',
    catalog: 'storage',
  })[kind] || 'apps';

  const provider = {
    getTree: (type) => ajax(getTreePath(type), { dataType: 'json' })
      .then(data => {
        return mapTreeModel(type === 'tree' ? [data.children[0]] : data, false, type);
      }),
    checkItem: (item, model) => {
      const isOwnItem = provider.getItem(item, model); // tricky
      return isOwnItem ? item : mapTreeModel([model.getCleanModel(item)], !isOwnItem)[0];
    },
    getItem: (item, model) => {
      return model.getElementsByProperty('name', item.name)[0];
    },
    fetchToggles: (name) => {
      return name ? storageHelper.fetch(name) || [] : [];
    },
    storeToggle: (item, name) => {
      if (!name) return;
      const data = storageData[name] || [];
      if (item.isOpen === true) {
        if (data.indexOf(item.name) === -1) {
          data.push(item.name);
        }
      } else {
        const index = data.indexOf(item.name);
        index !== - 1 && data.splice(index, 1);
      }
      storageHelper.saveLazy(data, name, provider);
    },
    i18n: input => input.trim(), // TODO: implement if needed
    getIcon: getIcon, // TODO: move to more generic service
    actions: { // TODO: move to more generic service
      closeTab: {
        event: 'closeTab',
        title: 'Close',
        aIcon: getIcon('close'),
      },
      showTree: {
        event: 'showTree',
        title: 'Open tree pane',
        aIcon: getIcon('tree'),
      },
      deleteItem: {
        event: 'deleteItem',
        title: 'Delete',
        aIcon: getIcon('delete'),
      },
      addItemBefore: {
        event: 'addItemBefore',
        title: 'Add before',
        aIcon: getIcon('addBefore'),
        class: 'flip',
      },
      addItemAfter: {
        event: 'addItemAfter',
        title: 'Add after',
        aIcon: getIcon('addAfter'),
      },
      addItemInside: {
        event: 'addItemInside',
        title: 'Create folder inside',
        aIcon: getIcon('addInside'),
      },
      closeInnerFolders: {
        event: 'closeInnerFolders',
        title: 'Close inner folders',
        aIcon: getIcon('closeInner'),
      },
    },
  };

  return provider;
});
