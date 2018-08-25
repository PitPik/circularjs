require(['circular'], function(Circular) {
  const circular = new Circular();
  const targetSize = 31;

  const dots = circular.component('dots', {
    listeners: ['text', 'hover'],
    subscribe: (propName, item, value) => {
      if (propName === 'hover') {
        item.text = value ? '*' + item.text + '*' :
          item.text.replace(/\*/g, '');
        item.elements.container.style.background =
          value ? '#ff0' : '#61dafb'
      }
    },
    eventListeners: {
      mouseenter: (e, elm, item) => item.hover = true,
      mouseleave: (e, elm, item) => item.hover = false,
    },
  });

  function getStyles(item) {
    return 'width: ' + item.size + 'px;' +
      'height: ' + item.size + 'px;' +
      'left: ' + item.x + 'px;' +
      'top: ' + item.y + 'px;' +
      'border-radius: ' + (item.size / 2) + 'px;' +
      'line-height: ' + item.size + 'px;' +
      'background: ' + (item.hover ? '#ff0;' : '#61dafb;');
  }

  function buildDotsModel(item, init, max) {
    if (!item.length) {
      item = getTriangleView(init);
    }
    if (!item[0].s) {
      item[0].style = getStyles(item[0]);
      return;
    }

    for (let n = 0, l = item.length; n < l; n++) {
      item[n].childNodes = getTriangleView(item[n]);
      buildDotsModel(item[n].childNodes, null, max);
    }
    return item;
  }

  function getTriangleView(item) {
    let s = item.s;

    if (s <= targetSize) {
      return [{
        x: item.x - (targetSize / 2),
        y: item.y - (targetSize / 2),
        size: targetSize,
        text: item.seconds,
        hover: false,
        style: '',
      }];
    }

    s = s / 2;

    // let slowDown = true;
    // if (slowDown) {
    //   let e = performance.now() + 0.8;
    //   while (performance.now() < e) {
    //     // Artificially long execution time.
    //   }
    // }

    return [{
        x: item.x,
        y: item.y - (s / 2),
        s: s,
        seconds: item.seconds
      }, {
        x: item.x - s,
        y: item.y + (s / 2),
        s: s,
        seconds: item.seconds
      }, {
        x: item.x + s,
        y: item.y + (s / 2),
        s: s,
        seconds: item.seconds
      }
    ];
  }

  const sierpinski = circular.component('sierpinski', {
    model: [{
      elapsed: 0,
      scale: 1,
      seconds: 0,
      start: null,
      style: '',
    }],
    listeners: ['seconds', 'scale', 'style'],
    subscribe: (propName, item, value, oldValue) => {
      if (propName === 'scale') {
        item.style = 'transform: scaleX(' +
          (item.scale / 2.1) + ') scaleY(0.7) translateZ(0.1px)';
      } else if (propName === 'seconds') {
        item.allDots.forEach(atom => atom.text =
          atom.hover ? '*' + item.seconds + '*' : item.seconds + '');
      }
    },
    onInit: (self) => {
      dots.reset(buildDotsModel([], {
        x: 0,
        y: 0,
        s: 1000,
        seconds: 0
      }, targetSize));

      self.model[0].allDots = dots.getElementsByProperty('text');
      self.model[0].elements.element.appendChild(dots.element);

      self.model[0].start = Date.now();
      nextFrame(self.model[0]);
      nextSecond(self.model[0]);
    },
  });

  function nextFrame(item) {
    item.elapsed = Date.now() - item.start;
    const t = (item.elapsed / 1000) % 10;
    item.scale = 1 + (t > 5 ? 10 - t : t) / 10;

    window.requestAnimationFrame(() => {
      nextFrame(item);
    });
  }

  function nextSecond(item) {
    item.seconds = (item.seconds > 9) ? 0 : item.seconds + 1;
    setTimeout(() => {
      nextSecond(item);
    }, 1000);
  }
});