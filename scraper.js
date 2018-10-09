const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request');
const optimist = require('optimist');
const {google} = require('googleapis');
const authentication = require('./authentication');
const citations = require('./citations');

const sheets = google.sheets('v4');
const args = optimist
  .default('sheetName', 'Sheet1')
  .default('titleColumn', 'A')
  .default('titleRow', '2')
  .default('resultColumn', 'B')
  .default('resultRow', '2')
  .argv;

if (!args._[0]) {
  console.log('Spreadsheet ID required.')
  console.log(optimist.help());
} else {
  main();
}

async function main () {
  const auth = await authentication.authenticate().catch(err => console.log(err));
  const spreadsheetId = args._[0]; // '1i6Lvzi6fUdDlszyy8HqO3joJ_hKEJ3CQT7_qA1rpc8Y';

  sheets.spreadsheets.values.get({
    auth: auth,
    spreadsheetId: spreadsheetId,
    range: `${args.sheetName}!${args.titleColumn}${args.titleRow}:${args.titleColumn}`
  }, async (err, response) => {
    if (err) {
      console.log('The Sheets API returned an error: ' + err);
    } else if (response.data.values.length === 0) {
      console.log('Title data not found.');
    } else {
      let rows = response.data.values;
      let index = 0;

      while(rows.length > 0) {
        const query = rows.shift()[0];
        const cited = await citations.search(query).catch(err => console.log(err));
        await writeCitations(auth, spreadsheetId, index, cited);
        index++;
      }
    }
  });
}

function writeCitations(auth, spreadsheetId, index, cited) {
  return new Promise((resolve, reject) => {
    if (!cited) reject();
    const result = `=HYPERLINK("${cited.url}", "Cited by ${cited.count}")`;
    sheets.spreadsheets.values.update({
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: `${args.sheetName}!${args.resultColumn}${parseInt(args.resultRow) + index}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [result]
        ]
      }
    }, (err, response) => {
      if (err) {
        console.log('The Sheets API returned an error: ' + err);
        reject(err);
      } else {
        console.log(`Writing: "Cited by ${cited.count}"\n`);
        resolve();
      }
    });
  });
}
