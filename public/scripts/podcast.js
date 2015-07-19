window.addEventListener('DOMContentLoaded', function () {
  var firebase = new Firebase("https://polyvox-discussion.firebaseio.com/");
  var id = document.body.getAttribute('data-podcast-id');
  var dataKey = 'discussions/' + id + '/entries';
  var commentInput = document.getElementById('comment');

  var authData = null;
  var dateMethod = (function () {
    var d = new Date();
    if (d.toLocaleDateString) {
      return 'toLocaleDateString';
    }
    return 'toDateString';
  }());

  function showAuthedUser() {
    var provider = authData[authData.provider];
    document.querySelector('.sign-in-list').innerHTML = [
      '<span>posting as </span><b>',
      provider.displayName,
      '</b><a href="#" id="logout"><i class="fa fa-times"></i></a>'
    ].join('&nbsp;');
    document.querySelector('.your-image').src = provider.profileImageURL;
    document.getElementById('logout').addEventListener('click', function (e) {
      e.preventDefault();
      firebase.unauth();
      location.reload();
    });
  }

  if (store.get('reload')) {
    store.remove('reload');
    setTimeout(function reauth() {
      authData = firebase.getAuth();
      if (!authData) {
        setTimeout(reauth, 500);
      } else {
        showAuthedUser();
      }
    }, 0);
  } else {
    setTimeout(function () {
      authData = firebase.getAuth();
      if (authData) {
        showAuthedUser();
      }
    }, 0);
  }

  document.getElementById('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var auth = authData || { provider: 'foo', foo: null, uid: null };
    var provider = auth[auth.provider] || { profileImageURL: '', displayName: 'anonymous' };
    firebase.child(dataKey).push({
      comment: commentInput.value,
      date: new Date().toISOString(),
      image: provider.profileImageURL,
      uid: auth.uid,
      user: provider.displayName
    });
    commentInput.value = '';
  });

  var methods = document.querySelectorAll('.login');
  for (var i = 0; i < methods.length; i += 1) {
    var method = methods[i];
    method.addEventListener('click', function (e) {
      e.preventDefault();
      store.set('reload', true);
      var method = this.getAttribute('data-method');
      firebase.authWithOAuthRedirect(method, function (error) {
        if (error) {
          console.log('FAILURE!');
        }
      });
    });
  }

  firebase.child(dataKey).on('value', function (d) {
    var template = document.getElementById('comment-template');
    var comments = document.getElementById('comments');
    comments.innerHTML = '';

    var val = d.val();
    if (val) {
      Object.keys(val).forEach(function (key) {
        var o = val[key];
        var clone = document.importNode(template.content, true);
        clone.querySelector('.profile-image').src = o.image;
        clone.querySelector('.user').innerHTML = o.user;
        clone.querySelector('.comment-content').innerHTML = o.comment.replace(/</g, '&lt;').replace(/\n/g, '<br>');
        clone.querySelector('.date-time').innerHTML = new Date(o.date)[dateMethod]();
        comments.appendChild(clone);
      });
    }

    document.querySelector('#comments-block').classList.add('loaded');
  });
});
