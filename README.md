# [3months Discord notifier](https://github.com/ddbeck/3months-discord-notifier#readme)

By Daniel D. Beck (@ddbeck)

_3months Discord notifier_ posts meeting reminders to a Discord channel for a private, invite-only accountability group. It lets its members use a Google Sheets spreadsheet to set meeting dates, times, and agendas.

This project was created because we previously used Slack's `/remind` feature but then we migrated to Discord, which lacks an equivalent feature.

If you're not a member of the 3months group, then you probably don't want to actually use this project, but you may consider taking it as inspiration for your own Discord integration.

For noncommercial purposes, you can use or modify this software for free, but commercial use requires a paid license per the terms of [_The Prosperity Public License 3.0.0_](https://prosperitylicense.com/). See [`LICENSE.md`](LICENSE.md) for details.

## Prerequisites

This tool requires Node.js 14 and expects that you have:

- A Google Sheets API key
- A document with a sheet titled `Agendas` containing these columns and expected values:

  | `Done`                   | `Date`                                                            | `Notice`                                            |
  | ------------------------ | ----------------------------------------------------------------- | --------------------------------------------------- |
  | `TRUE` or `FALSE` values | ISO 8601-formatted dates and times in the `America/New_York` zone | A string with a brief meeting agenda or description |

  Other columns are ignored, as long as they don't conflict with these column names.

- A link to a Zoom call or similar meeting service
- A Discord channel's webhook URL

## Set up and usage

1. Install the package. Run `npm install -g git+https://github.com/ddbeck/3months-discord-notifier`.

2. Set the following environment variables (or use command line switches, see `--help` for details):

   - `THREEMONTHS_GOOGLE_SHEETS_API_KEY` — Your Google Sheets API key
   - `THREEMONTHS_SPREADSHEET_ID` — The Google Sheets document ID (the long string of numbers, letters, and dashes from the spreadsheet URL)
   - `THREEMONTHS_CALL_URL` — A Zoom or other meeting link
   - `THREEMONTHS_DISCORD_URL` — A Discord webhook URL

3. Test that the script works. Make sure there's a meeting in your spreadsheet that's happening in the next 30 minutes. Run `3months-discord-notifier --dry-run`. If everything's set up properly, the script prints the JSON payload for the webhook.

4. Set up a cron job with the same environment to run every 30 minutes. For example:

   ```
   */30 * * * * 3months-discord-notifier
   ```

   Or how I'm actually running it, with [direnv](https://direnv.net/) to manage environment variables:

   ```
   */30 * * * * direnv exec /home/ddbeck/projects/3months-discord-notifier 3months-discord-notifier &>> /home/ddbeck/projects/3months-discord-notifier/output.log
   ```
