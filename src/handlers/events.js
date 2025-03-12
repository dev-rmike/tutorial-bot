// Import packages.
const fs = require("fs");
const path = require("path");

// Export the function
module.exports = (client) => {
  // Create a relative file path.
  const eventsPath = path.join(__dirname, "../events");

  // Read the directory
  fs.readdir(eventsPath, (err, files) => {
    if (err) {
      // If an error occurs, log it and return.
      client.l.error("Error reading events directory:", err);
      return;
    }

    // Take all the files that end with .js (javscript).
    const eventFiles = files.filter((file) => file.endsWith(".js"));

    // Cycle through all the files.
    eventFiles.forEach((file) => {
      // Take the event from the file.
      const event = require(path.join(eventsPath, file));

      // Check if the event is a function.
      if (typeof event === "function") {
        // Take the event name from the filename.
        const eventName = file.split(".")[0];
        // If the event occurs, run the code from the eventfile.
        client.on(eventName, event.bind(null, client));
        client.l.log(`Event ${eventName} loaded successfully.`);
      } else {
        // If an error occurs, log it.
        client.l.error(`Event file ${file} does not export a valid function.`);
      }
    });
  });
};
