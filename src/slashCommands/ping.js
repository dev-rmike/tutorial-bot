// Import all required packages such as discordjs.
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  // Create the command data (name, description, options, etc.)
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("View the bot's latency with the Discord websocket."),

  // Set the types of client & interaction to make it easier to see available options.
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */

  // Create the code to execute when a user runs the command.
  execute: async (client, interaction) => {
    // Calculate the uptime, round trip time (from the interaction creation to the moment the reply is sent).
    let days = Math.floor(client.uptime / 86400000);
    let hours = Math.floor(client.uptime / 3600000) % 24;
    let minutes = Math.floor(client.uptime / 60000) % 60;
    let seconds = Math.floor(client.uptime / 1000) % 60;
    const latency = Math.max(0, Date.now() - interaction.createdTimestamp);
    const discordLatency = Math.round(client.ws.ping);

    // Send the embed with the data.
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Latency")
          .setDescription(
            `**Discord Latency:** \`${discordLatency}ms\`\n**Round-trip Latency:** \`${latency}ms\`\n**Uptime:** \`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds\``
          )
          .setColor("#2b2d31"),
      ],
    });
  },
};
