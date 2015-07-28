window.addEventListener('WebComponentsReady', function () {
  var stack = document.getElementById('card-stack');
  var menu = document.getElementById('card-menu');
  var drawerPanel = document.getElementById('drawer-panel');

  function route(hash) {
    if (hash === '#who') {
      stack.selected = 1;
      menu.select(0);
    } else if (hash === '#podcasts') {
      stack.selected = 2;
      menu.select(1);
    } else {
      stack.selected = 0;
      menu.select(null);
      document.getElementById('home-link').focus();
    }
  }

  window.onpopstate = function (state) {
    route(state.target.location.hash);
  }

  route(location.hash);

  function transition(hash) {
    return function (e) {
      history.pushState(null, null, hash);
      drawerPanel.closeDrawer();
      route(hash);
    }
  }

  function mail() {
    setTimeout(function () {
      location.href = 'mailto:pictures@polyvox.audio?subject=I have a pic!&body=This relates to podcast #??? <-- Put in the number here!';
    }, 0);
  }

  drawerPanel.responsiveWidth = '800px';
  document.getElementById('home-link').addEventListener('click', function (e) {
    e.preventDefault();
  });
  document.getElementById('home-link').addEventListener('tap', function (e) {
    history.pushState(null, null, '/');
    e.preventDefault();
    e.stopPropagation();
    drawerPanel.closeDrawer();
    route(location.hash);
  });

  document.getElementById('who-link').addEventListener('mouseup', transition('#who'));
  document.getElementById('who-link').addEventListener('touchend', transition('#who'));

  document.getElementById('podcasts-link').addEventListener('mouseup', transition('#podcasts'));
  document.getElementById('podcasts-link').addEventListener('touchend', transition('#podcasts'));

  document.getElementById('pictures-link').addEventListener('mouseup', mail);
  document.getElementById('pictures-link').addEventListener('touchend', mail);
});

document.body.addEventListener('click', function (e) {
  var target = e.target;
  while (target && (target.tagName || '').toLowerCase() !== 'paper-button') {
    target = target.parentNode;
  }
  if (target) {
    while(target && (!target.tagName || target.tagName.toLowerCase() !== 'div')) {
      target = target.nextSibling;
    }
    location.href = target.innerHTML;
  }
});
