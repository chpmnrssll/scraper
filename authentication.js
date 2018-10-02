const fs = require('fs');
const http = require('http');
const {OAuth2Client} = require('google-auth-library');
const querystring = require('querystring');
const opn = require('opn');
const url = require('url');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'scraper.json';

class Authentication {
  authenticate() {
    return new Promise((resolve, reject) => {
      // Download your OAuth2 configuration from the Google
      const credentials = require('./keys.json');
      const authorizePromise = this.authorize(credentials);
      authorizePromise.then(resolve, reject);
    });
  }
  authorize(credentials) {
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = "http://localhost:3000";
    const oAuth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

    return new Promise((resolve, reject) => {
      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          this.getNewToken(oAuth2Client).then((oAuth2ClientNew) => {
            resolve(oAuth2ClientNew);
          }, (err) => {
            reject(err);
          });
        } else {
          oAuth2Client.credentials = JSON.parse(token);
          resolve(oAuth2Client);
        }
      });
    });
  }
  getNewToken(oAuth2Client, callback) {
    return new Promise((resolve, reject) => {
      // Generate the url that will be used for the consent dialog.
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });

      // Start an http server to accept the oauth callback.
      const server = http.createServer((req, res) => {
        // Acquire the code from the querystring.
        const code = querystring.parse(url.parse(req.url).query);

        // Now that we have the code, use that to acquire tokens.
        oAuth2Client.getToken(code).then((tokens) => {
          // Make sure to set the credentials on the OAuth2 client.
          oAuth2Client.setCredentials(tokens.tokens);
          this.storeToken(tokens.tokens);

          res.end('Authorization complete.');
          server.close();
          resolve(oAuth2Client);
        }).catch(err => {
          throw err;
          reject();
        });
      }).listen(3000, () => {
        // Open the browser to the authorize url to start the workflow
        console.log('Please Sign-in to Google and allow access.');
        opn(authUrl);
      });
    });
  }
  storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
      if (err) throw err;
      console.log('Token stored to ' + TOKEN_PATH);
    });
  }
}

module.exports = new Authentication();
