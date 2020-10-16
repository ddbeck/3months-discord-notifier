#!/usr/bin/env node

const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const luxon = require("luxon");
const { boolean } = require("yargs");
const yargs = require("yargs");

const EXPECTED_ZONE = "America/New_York";
const SOON_DURATION = luxon.Duration.fromObject({ hours: 260, minutes: 30 });
const CUSTOM_TIME_FORMAT = Object.assign(luxon.DateTime.TIME_SIMPLE, {
  timeZoneName: "short",
});

const Payload = require("./discordWebHookPayload");

const argv = yargs(process.argv)
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
  .option("c", {
    alias: "call-url",
    description: "URL for Zoom or other video conferencing",
    default: process.env.THREEMONTHS_CALL_URL,
    defaultDescription: "$THREEMONTHS_CALL_URL",
  })
  .option("w", {
    alias: "webhook",
    description: "Discord webhook URL",
    default: process.env.THREEMONTHS_DISCORD_URL,
    defaultDescription: "$THREEMONTHS_DISCORD_URL",
  })
  .option("n", {
    alias: "dry-run",
    type: "boolean",
    description: "Print payload and don't POST to Discord",
    default: false,
  })
  .help().argv;

async function main() {
  const meetingRows = await getMeetingRows(argv.spreadsheet, argv.apiKey);

  for (const row of meetingRows) {
    const dateTime = toDateTime(row.Date);
    const duration = howLong(toDateTime(dateTime));
    const soon = duration < SOON_DURATION;

    if (soon) {
      const payload = new Payload(
        row.Notice,
        argv.callUrl,
        dateTime.toLocaleString(CUSTOM_TIME_FORMAT),
        dateTime
      );

      try {
        if (argv.dryRun) {
          console.log(JSON.stringify(payload, undefined, 2));
        } else {
          await axios.post(argv.webhook, payload);
        }
      } catch (err) {
        console.error(err);
        console.trace(err);
      }
    }
  }
}

async function getMeetingRows(spreadsheet, apiKey, sheetTitle = "Agendas") {
  const doc = new GoogleSpreadsheet(spreadsheet);
  doc.useApiKey(argv.apiKey);
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByTitle["Agendas"];
  const rows = await sheet.getRows();
  return rows.filter(rowIsAnActiveAgenda);
}

function toDateTime(rowDate) {
  return luxon.DateTime.fromISO(rowDate, {
    locale: "en-US",
    zone: "America/New_York",
  });
}

function now() {
  return luxon.DateTime.local().setZone(EXPECTED_ZONE);
}

function howLong(dt) {
  return dt.diff(now(), ["days"]);
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
