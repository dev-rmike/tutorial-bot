// Export the event function.
module.exports = async (client) => {
  // Set the client's presence / status.
  client.presence.set({
    activities: [
      {
        name: "over your server", // Activity name
        type: 3, // Activity type, 0 = playing, 1 = streaming, 2 = listening, 3 = watching, 4 = competing
      },
    ],
  });
};
