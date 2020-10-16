class Payload {
  constructor(notice, url, footerText, timestamp) {
    // TODO: optional `this.content` attr to @ everyone?
    this.embeds = [
      {
        title: "Weekly 3months call on Zoom",
        description: notice,
        url,
        footer: {
          text: footerText,
        },
        timestamp, // example: "2020-10-27T09:00:00.000Z",
      },
    ];
    this.username = "3months reminder bot";
  }
}

// An example of how this works
if (require.main === module) {
  console.log(
    JSON.stringify(
      new Payload(
        "Hooray!",
        "https://…",
        "This message brought to you by…",
        "2020-10-27T09:00:00.000Z"
      ),
      undefined,
      2
    )
  );
}

module.exports = Payload;
