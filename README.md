# Google Scholar Citation Scraper

Clone or download this repository.
```
$ git clone git@github.com:chpmnrssll/scraper.git
```

```
$ npm install
```

On the first run it should open a new browser window for you to sign-in and authorize access to spreadsheets in your google drive.

You must pass in the spreadsheet ID as the first argument on the command line.

```
$ npm run start 1i6Lvzi6fUdDlszyy8HqO3joJ_hKEJ3CQT7_qA1rpc8Y
```
```
Options:
--sheetName     [default: "Sheet1"]
--titleColumn   [default: "A"]
--titleRow      [default: "2"]
--resultColumn  [default: "B"]
--resultRow     [default: "2"]
```
