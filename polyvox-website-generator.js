var DOMParser = require('xmldom').DOMParser;
var fs = require('fs');
var http = require('http');
var path = require('path');
var Promise = require('bluebird');
var Ractive = require('ractive');
var schedule = require('node-schedule');

var lastModified = new Date(1888, 1, 1);

Ractive.DEBUG = false;

function generate() {
  // Get the RSS feed.
  new Promise(function (good, bad) {
    if (process.env['NO_JOB']) {
      console.info('using local rss.xml');
      var p = path.join(__dirname, 'rss.xml');
      return fs.readFile(p, 'utf8', function (e, content) {
        if (e) {
          return bad(e);
        }
        good({
          lastModified: new Date(),
          content: content
        });
      });
    }

    var body = [];
    var request = http.get('http://podcasts.polyvox.audio/rss.xml');
    request.on('response', function (m) {
      if (m.statusCode >= 400) {
        return bad('got a bad status for the feed: ' + m.statusCode);
      }
      m.setEncoding('utf8');
      m.on('data', function (chunk) {
        body.push(chunk);
      });
      m.on('end', function () {
        good({
          lastModified: new Date(m.headers['last-modified']),
          content: body.join('')
        });
      });
    });
    request.on('error', function (e) {
      bad(e);
    });
  })

  // If it's not new, just check out.
  .then(function (o) {
    if (o.lastModified.valueOf() === lastModified.valueOf()) {
      throw new IgnoreError('no new content to generate');
    }
    return new DOMParser().parseFromString(o.content);
  })

  // Parse feed.
  .then(function (xml) {
    var channelTag = xml.getElementsByTagName('channel')[0];
    var items = [];
    var channel = {};
    var children = channelTag.children || channelTag.childNodes;
    for (var i = 0; i < children.length; i += 1) {
      var tag = children[i];

      if (tag.nodeType === 3) {
        continue;
      }
      
      var o = tree(tag);
      if (tag.nodeName === 'item') {
        o.formattedPubDate = o.pubdate.toLocaleDateString();
        o.number = items.length + 1;
        o.detailsLink = '/podcasts/' + o.number + '.html';
        o.podcastTitle = 'Episode #' + o.number + ' - ' + o.title;
        items.unshift(o);
      } else {
        var name = tag.nodeName.replace(/:/g, '_');
        channel[name] = o;
      }
    }
    channel.subscribeLink = channel.atom_link['@href'].replace('http', 'feed');

    return {
      items: items,
      channel: channel
    };
  })

  // Get the templates
  .then(function (data) {
    var m = path.join(__dirname, 'templates', 'index.html.ractive');
    var p = path.join(__dirname, 'templates', 'podcast.html.ractive');
    var a = path.join(__dirname, 'templates', 'all-comments.html.ractive');
    return Promise.props({
      data: data,
      main: Promise.promisify(fs.readFile)(m, 'utf8'),
      podcast: Promise.promisify(fs.readFile)(p, 'utf8'),
      comments: Promise.promisify(fs.readFile)(a, 'utf8'),
    });
  })

  // Generate with ractive.
  .then(function (result) {
    var htmls = {
      main: new Ractive({
              template: result.main,
              preserveWhitespace: true,
              data: result.data
            }).toHTML(),
      comments: new Ractive({
              template: result.comments,
              preserveWhitespace: true,
              data: result.data
            }).toHTML(),
      items: []
    }
    for (var i = 0; i < result.data.items.length; i += 1) {
      var item = result.data.items[i];
      htmls.items.push(new Ractive({
        template: result.podcast,
        preserveWhitespace: true,
        data: item
      }).toHTML());
    }
    return htmls;
  })

  // Save the html files
  .then(function (htmls) {
    var m = path.join(__dirname, 'public', 'index.html');
    var c = path.join(__dirname, 'public', 'all-comments.html');
    var a = [
      Promise.promisify(fs.writeFile)(m, htmls.main),
      Promise.promisify(fs.writeFile)(c, htmls.comments)
    ];
    var l = htmls.items.length;
    for (var i = 0; i < htmls.items.length; i += 1) {
      var item = htmls.items[i];
      var p = path.join(__dirname, 'public', 'podcasts', (l - i) + '.html');
      a.push(Promise.promisify(fs.writeFile)(p, item));
    }
    return Promise.all(a);
  })

  // Ignore on ignore :)
  .catch(IgnoreError, function (e) {
    console.error('Ignored:', e);
  })

  // Die on error
  .catch(function (e) {
    console.error('Error:', e);
    console.error(e.stack);
    job.cancel();
  });
}

// Just run it at noon.
var rule = new schedule.RecurrenceRule();
rule.hour = 12;
rule.minute = 0;

var job = schedule.scheduleJob(rule, generate);
generate();

if (process.env['NO_JOB']) {
  job.cancel();
}

/**********************************/
/*** Some happy helper methods. ***/

function IgnoreError() {}
IgnoreError.prototype = Object.create(Error.prototype);

function parseText(val) {
  if (/^\s*$/.test(val)) {
    return null;
  }
  if (/^(?:true|false)$/i.test(val)) {
    return val.toLowerCase() === 'true';
  }
  if (isFinite(val)) {
    return parseFloat(val);
  }
  if (isFinite(Date.parse(val))) {
    return new Date(val);
  }
  return val;
}

function tree(xml) {
  var result = true;
  var length = 0;
  var text = '';
  var attrib = null;
  if (xml.hasAttributes()) {
    result = {};
    for (length; length < xml.attributes.length; length += 1) {
      attrib = xml.attributes.item(length);
      result['@' + attrib.name.toLowerCase()] = parseText(attrib.value.trim());
    }
  }
  if (xml.hasChildNodes()) {
    for (var node, prop, content, item = 0; item < xml.childNodes.length; item += 1) {
      node = xml.childNodes.item(item);
      if (node.nodeType === 4) {
        text += node.nodeValue;
      } else if (node.nodeType === 3) {
        text += node.nodeValue.trim();
      } else if (node.nodeType === 1) {
        if (length === 0) {
          result = {};
        }
        prop = node.nodeName.toLowerCase().replace(/:/g, '_');
        content = tree(node);
        if (result.hasOwnProperty(prop)) {
          if (result[prop].constructor !== Array) {
            result[prop] = [result[prop]];
          }
          result[prop].push(content);
        } else {
          result[prop] = content;
          length += 1;
        }
      }
    }
  }
  if (text) {
    length > 0 ? result.keyValue = parseText(text) : result = parseText(text);
  }
  return result;
}
