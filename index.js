#!/usr/bin/env node

const { GoogleSpreadsheet } = require("google-spreadsheet");

const { argv } = require("yargs")
  .scriptName("3months-discord-notifier")
  .usage("$0")
  .option("k", {
    alias: "api-key",
    description: "Google Sheets API key",
    default: process.env.THREEMONTHS_GOOGLE_SHEETS_API_KEY,
    defaultDescription: "$THREEMONTHS_GOOGLE_SHEETS_API_KEY",
  })
  .option("s", {
    alias: "spreadsheet",
    description: "ID for the 3months agenda spreadsheet",
    default: process.env.THREEMONTHS_SPREADSHEET_ID,
    defaultDescription: "$THREEMONTHS_SPREADSHEET_ID",
  })
  .help();

async function main() {
  const doc = new GoogleSpreadsheet(argv.spreadsheet);
  doc.useApiKey(argv.apiKey);
  await doc.loadInfo(); // loads document properties and worksheets

  const sheet = doc.sheetsByTitle["Agendas"];
  const rows = await sheet.getRows();
  const upcoming = rows.filter(rowIsAnActiveAgenda);
  for (const row of upcoming) {
    console.log(`${row.Date}`);
    console.log(`\t${row.Notice}`);
  }
}

function rowIsAnActiveAgenda(row) {
  if (row.Done === "TRUE" || row.Date === undefined || row.Date === "") {
    return false;
  } else {
    return true;
  }
}

try {
  main();
} catch (err) {
  console.error(err);
  console.trace(err);
}
