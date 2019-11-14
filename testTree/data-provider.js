define('data-provider', ['toolbox'], ({ ajax, storageHelper }) => {
  const treePath = 'mock-data/page-model.json';
  let storageData = []; // TODO: store open items...
  const mapTreeModel = (model, storageName, recursion) => {
    if (!recursion && storageName) {
      storageData = provider.fetchToggles(storageName);
    }

    return model.map(item => ({
      ...item,
      childNodes: mapTreeModel(item.children || [], storageName, true),
      // extra items for view
      isOpen: storageData.indexOf(item.name) !== -1,
      hovered: false,
      selected: false,
      active: false,
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
  })[kind] || 'apps';

  const provider = {
    getTree: storageName => ajax(treePath, { dataType: 'json' })
      .then(data => mapTreeModel([data], storageName)),
    fetchToggles: (name) => {
      return name ? storageHelper.fetch(name) || [] : [];
    },
    storeToggle: (item, name) => {
      if (!name) return;
      if (item.isOpen === true) {
        if (storageData.indexOf(item.name) === -1) {
          storageData.push(item.name);
        }
      } else {
        const index = storageData.indexOf(item.name);
        index !== - 1 && storageData.splice(index, 1);
      }
      storageHelper.saveLazy(storageData, name, provider);
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
