require([
  'circular',
  'toolbox',
  'data-provider'
], ({ Plugin }, { $create }, { getIcon }) => Plugin({
  selector: 'treeDndPlugin',
  events: {
    dragstart: 'dragstart',
    dragenter: 'dragenter',
    dragleave: 'dragleave',
    dragover: 'dragover',
    drop: 'drop',
    dragend: 'dragend',
  },
}, class treeDndPlugin {
  tree = [];
  noHover = {};

  hoverTimer = 0;
  hoverTime = 400;
  dragImage = $create('div', 'drag-ghost');
  dragImageIcon = this.dragImage.appendChild($create('div'));
  dragItem = {};
  hoveredItem = {};
  cursorItem = {};
  canDrop = false;
  methods = { up: 'insertBefore', mid: 'appendChild', down: 'insertAfter' };

  constructor(elm, crInst, input) {
    input(this);
    elm.appendChild(this.dragImage);
  }

  dragstart(e, elm, item) {
    this.dragImageIcon.innerHTML = `<em class="material-icons icon">${
      getIcon(item.kind)}</em> ${item.properties.title}`;
    e.dataTransfer.setData('text', item.name);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(this.dragImage, -5, -5);

    item.class = 'is-dragging';
    this.noHover.toggle = true;
    this.dragItem = item;
  }

  dragenter(e, elm, item) {
    this.cursorItem.linkClass = '';
    this.cursorItem = item;
    this.hoveredItem.hovered = false;
    this.hoveredItem = item;
    item.hovered = true;

    this.canDrop = !this.dragItem.elements.element
      .contains(item.elements.element);
    this.openOnHover(item, !this.canDrop);
  }

  dragleave(e, elm, item) {}

  dragover(e, elm, item) {
    if (!this.canDrop) return;
    e.preventDefault();

    const cursor = item.views.link || item.elements.element;
    const pos = this.getPosition(e, cursor, item.kind === 'container');
    if (item.linkClass !== pos) {
      item.linkClass = pos;
    }
  }

  drop(e, elm, item) {
    const oldParent = this.dragItem.parentNode;
    if (!item.linkClass) return;

    this.tree[this.methods[item.linkClass]](this.dragItem, item);

    oldParent.isOpen = oldParent.childNodes.length !== 0;
    item.isOpen = item.childNodes.length !== 0;
  }

  dragend(e, elm, item) {
    clearTimeout(this.hoverTimer);
    item.class = '';
    this.cursorItem.linkClass = '';
    this.hoveredItem.hovered = false;
    this.noHover.toggle = false;
  }

  openOnHover(item, containsItem) {
    clearTimeout(this.hoverTimer);
    if (
      !item.childNodes ||
      item.childNodes.length === 0 ||
      item.isOpen ||
      containsItem
    ) return;
  
    this.hoverTimer = setTimeout(() => item.isOpen = true, this.hoverTime);
  }

  getPosition(e, elm, inside) {
    const top = elm.offsetHeight / (inside ? 3.5 : 2);
    const bottom = top * (inside ? 2.5 : .5);

    return e.offsetY <= top ? 'up' : e.offsetY >= bottom ? 'down' : 'mid';
  }

}));