const cheerio = require('cheerio');
const request = require('request');

module.exports.search = function (query) {
  const GOOGLE_SCHOLAR_URL = 'https://scholar.google.com/scholar?hl=en&q=';
  const GOOGLE_SCHOLAR_URL_PREFIX = 'https://scholar.google.com';
  const STATUS_CODE_FOR_RATE_LIMIT = 503;
  const STATUS_MESSAGE_FOR_RATE_LIMIT = 'Service Unavailable';
  const STATUS_MESSAGE_BODY = 'This page appears when Google automatically detects requests coming from your computer network which appear to be in violation of the <a href="//www.google.com/policies/terms/">Terms of Service</a>. The block will expire shortly after those requests stop.';
  const CITATION_COUNT_PREFIX = 'Cited by ';

  console.log(`Searching: "${query}"`);

  return new Promise((resolve, reject) => {
    request({
      url: GOOGLE_SCHOLAR_URL + encodeURI(query)
    }, (error, response, html) => {
      if (error) {
        reject(error);
      } else if (response.statusCode !== 200) {
        if (response.statusCode === STATUS_CODE_FOR_RATE_LIMIT && response.statusMessage === STATUS_MESSAGE_FOR_RATE_LIMIT && response.body.indexOf(STATUS_MESSAGE_BODY) > -1) {
          reject(new Error('you are being rate-limited by google. you have made too many requests too quickly. see: https://support.google.com/websearch/answer/86640'));
        } else {
          reject(new Error('expected statusCode 200 on http response, but got: ' + response.statusCode));
          // reject(html);
        }
      } else {
        let $ = cheerio.load(html);
        let firstResult = $('.gs_r').first();
        $(firstResult).find('.gs_ri h3 span').remove();
        let footerLinks = $(firstResult).find('.gs_ri .gs_fl a');
        let count = 0;
        let url = '';

        if ($(footerLinks[2]).text().indexOf(CITATION_COUNT_PREFIX) >= 0) {
          count = $(footerLinks[2]).text().substr(CITATION_COUNT_PREFIX.length);
        }

        if ($(footerLinks[2]).attr && $(footerLinks[2]).attr('href') && $(footerLinks[2]).attr('href').length > 0) {
          url = GOOGLE_SCHOLAR_URL_PREFIX + $(footerLinks[2]).attr('href');
        } else {
          reject($.html());
        }

        resolve({count, url});
      }
    });
  });
};
