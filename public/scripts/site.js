window.addEventListener('WebComponentsReady', function () {
  if (location.hash) {
    if (location.hash === '#who') {
      document.getElementById('card-stack').selected = 1;
    } else if (location.hash === '#podcasts') {
      document.getElementById('card-stack').selected = 2;
    }
  }

  var drawerPanel = document.getElementById('drawer-panel');
  document.getElementById('home-link').addEventListener('click', function (e) {
    history.pushState(null, null, '/');
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('card-stack').selected = 0;
    document.getElementById('card-menu').select(null);
    drawerPanel.closeDrawer();
  });
  document.getElementById('who-link').addEventListener('click', function (e) {
    history.pushState(null, null, '#who');
    document.getElementById('card-stack').selected = 1;
    drawerPanel.closeDrawer();
  });
  document.getElementById('podcasts-link').addEventListener('click', function (e) {
    history.pushState(null, null, '#podcasts');
    document.getElementById('card-stack').selected = 2;
    drawerPanel.closeDrawer();
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
