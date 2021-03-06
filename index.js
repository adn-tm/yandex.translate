var https = require('https');
var url = require('url');
var querystring = require('querystring');
/**
 * @link http://api.yandex.com/key/keyslist.xml Get a free API key on this page.
 *
 * @param {string} key The API key.
 */
function YandexTranslator(key) {
  this.key = key;
}

/**
 * Detects the language of the specified text.
 * @link https://tech.yandex.com/translate/doc/dg/reference/detect-docpage/
 *
 * @param {string} text The text to detect the language for.
 * @return {string} Detected language code.
 */
YandexTranslator.prototype.detect = function detect(text) {
  return this.request('detect', {
    text: text
  }).then(function(data) {
    return data.lang;
  });
};

/**
 * Translates the text.
 * @link https://tech.yandex.com/translate/doc/dg/reference/translate-docpage/
 *
 * @param  {string|string[]} text    The text to be translated.
 * @param  {string}          lang    Translation direction (for example, "en-ru" or "ru").
 * @param  {bool}            html    Text format, if true - html, otherwise plain.
 * @param  {int}             options Translation options.
 * @return {string[]}
 */
YandexTranslator.prototype.translate = function translate(text, lang, html, options) {
  return this.request('translate', {
    text: text,
    lang: lang,
    format: html ? 'html' : 'plain',
    options: options || 0
  }).then(function(data) {
    return data.text;
  });
};

function parseJSON(json) {
  try {
    return Promise.resolve(JSON.parse(json));
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Sends request to Yandex.Translate API.
 *
 * @param  {string}   command The command name.
 * @param  {object}   params  The command parameters.
 * @return {Promise} The request result.
 */
YandexTranslator.prototype.request = function request(command, params) {
  params.key = this.key;
  if (params.options) params.options=1;
  var post_data = querystring.stringify(params);
  params.text = undefined;
  return new Promise(function(resolve, reject) {
    console.log(querystring.stringify(params));
    var post_req=https.request({
      hostname: 'translate.yandex.net',
      protocol: 'https:',
      port: 443,
      path: '/api/v1.5/tr.json/' + command,
      // query: querystring.stringify(params),
      method:"POST",
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      }
    }, function(res) {
      var chunks = [];

      res.on('data', function(chunk) {
        chunks.push(chunk);
      });
      res.on('error', reject);

      res.on('end', function() {
        var body = Buffer.concat(chunks).toString();
        // console.log(body);
        parseJSON(body).then(function(data) {
          if (res.statusCode >= 300) {
            var err = new Error(res.statusMessage);
            err.data = data;
            return reject(err);
          }

          resolve(data);
        }).catch(reject);
      });
    }).on('error', reject);

    post_req.write(post_data);
    post_req.end();

  });
};

module.exports = YandexTranslator;
