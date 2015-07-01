window.addEventListener('WebComponentsReady', function () {
  var stack = document.getElementById('card-stack');
  var menu = document.getElementById('card-menu');

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

  var drawerPanel = document.getElementById('drawer-panel');
  document.getElementById('home-link').addEventListener('click', function (e) {
    history.pushState(null, null, '/');
    e.preventDefault();
    e.stopPropagation();
    drawerPanel.closeDrawer();
    route(location.hash);
  });
  document.getElementById('who-link').addEventListener('click', function (e) {
    history.pushState(null, null, '#who');
    drawerPanel.closeDrawer();
    route(location.hash);
  });
  document.getElementById('podcasts-link').addEventListener('click', function (e) {
    history.pushState(null, null, '#podcasts');
    drawerPanel.closeDrawer();
    route(location.hash);
  });
  document.getElementById('pictures-link').addEventListener('click', function (e) {
    location.href = 'mailto:pictures@polyvox.audio?subject=I have a pic!&body=This relates to podcast #??? <-- Put in the number here!';
  });
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
