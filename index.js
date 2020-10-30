#!/usr/bin/env node

const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const luxon = require("luxon");
const yargs = require("yargs");

const Payload = require("./discordPayload");

const EXPECTED_ZONE = "America/New_York";
const SOON_INTERVAL = luxon.Interval.fromDateTimes(
  now().plus({ minutes: 5 }),
  now().plus({ minutes: 34, seconds: 59 })
);

const argv = yargs(process.argv)
  .scriptName("3months-discord-notifier")
  .usage("$0 [options]", "Post a meeting reminder to Discord.")
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
  let nextMeeting = null;

  for (const row of await getMeetingRows(argv.spreadsheet, argv.apiKey)) {
    const dateTime = toDateTime(row.Date);
    const meetingInNextHalfHour = SOON_INTERVAL.contains(dateTime);

    if (meetingInNextHalfHour) {
      const payload = new Payload(row.Notice, argv.callUrl, "JFDI", dateTime);

      if (argv.dryRun) {
        console.log(JSON.stringify(payload, undefined, 2));
        process.exit(0);
      } else {
        await axios.post(argv.webhook, payload);
        process.exit(0);
      }
    }

    if (isNextMeeting(dateTime, nextMeeting)) {
      nextMeeting = dateTime;
    }
  }

  if (nextMeeting) {
    console.log(
      `${now().toISOTime()}: Next meeting is ${nextMeeting.toRelative()}.`
    );
  }
  console.log(
    `${now().toISOTime()}: No meetings in the next half hour. Exiting.`
  );
  process.exit(0);
}

async function getMeetingRows(spreadsheet, apiKey, sheetTitle = "Agendas") {
  const doc = new GoogleSpreadsheet(spreadsheet);
  doc.useApiKey(argv.apiKey);
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByTitle[sheetTitle];
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

function rowIsAnActiveAgenda(row) {
  if (row.Done === "TRUE" || row.Date === undefined || row.Date === "") {
    return false;
  } else {
    return true;
  }
}

function isFuture(dt) {
  return dt.diffNow().as("milliseconds") > 0;
}

function isNextMeeting(current, previous) {
  return isFuture(current) && (previous === null || current < previous);
}

try {
  main();
} catch (err) {
  console.error(err);
  console.trace(err);
}
