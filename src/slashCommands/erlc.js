// Import all required packages such as discordjs.
const {
  SlashCommandBuilder,
  EmbedBuilder,
  CommandInteraction,
  Client,
} = require("discord.js");

module.exports = {
  // Create the command data (name, description, options, etc.)
  data: new SlashCommandBuilder()
    .setName("erlc")
    .setDescription("ERLC Commands")
    .addSubcommand((cmd) =>
      cmd
        .setName("info")
        .setDescription("View information about the ER:LC server.")
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("command")
        .setDescription(
          "Run a command inside your ER:LC server using this command."
        )
        .addStringOption((opt) =>
          opt
            .setName("command")
            .setDescription(
              "The command to run, please include : in the command. Example: :heal all"
            )
            .setRequired(true)
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("players")
        .setDescription(
          "View a list of players currently in-game and in-queue."
        )
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("joinlogs")
        .setDescription("View the latest joinlogs of your server.")
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("killlogs")
        .setDescription("View the latest kill logs of your server.")
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("modcalls")
        .setDescription("View the latest modcall logs of your server.")
    )
    .addSubcommand((cmd) =>
      cmd
        .setName("vehicles")
        .setDescription("View the currently spawned vehicles your server.")
    ),

  guildOnly: true, // Make it so the command can only be ran inside a guild.

  // Set the types of client & interaction to make it easier to see available options.
  /**
   * @param {Client} client
   * @param {CommandInteraction} interaction
   */
  // Create the code to execute when a user runs the command.
  execute: async (client, interaction) => {
    if (interaction.options.getSubcommand() === "info") {
      // Fetch the serverinfo from the ER:LC API using the custom handler.
      const info = await client.p.info();

      // Fetch the user information for the owner and co owners.
      const ids = info.CoOwnerIds;
      ids.push(info.OwnerId);
      // Fetch the data using the robloxUser function.
      const data = await robloxUser(ids);

      // Take the information for the server owner.
      const owner = await data.data.find((d) => d.id === info.OwnerId);

      // Cycle through all the co owners to get their information.
      let CoOwners = [];
      for (const coOwner in info.CoOwnerIds) {
        if (info.CoOwnerIds[coOwner] !== info.ownerId) {
          // Take the user data.
          const user = data.data.find((d) => d.id === info.CoOwnerIds[coOwner]);

          // Add the text to the Array.
          CoOwners.push(
            `[${user.name}:${user.id}](https://roblox.com/users/${user.id})`
          );
        }
      }

      // Reply with an embed.
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("ER:LC Server Info")
            .setDescription(
              `**Server name:** ${info.Name}\n**Owner:** [${owner.name}:${
                owner.id
              }](https://roblox.com/users/${
                owner.id
              })\n**Co owners:** ${CoOwners.join(", ")}\n**Current players:** ${
                info.CurrentPlayers
              }/${info.MaxPlayers}\n**Join code:** ${
                info.JoinKey
              }\n**Team balance:** ${
                info.TeamBalance ? "Disabled" : "Enabled"
              }\n**Account verification:** ${info.AccVerifiedReq}`
            ),
        ],
      });
    } else if (interaction.options.getSubcommand() === "command") {
      // Check if the user has permissions to run the command.
      if (!interaction.member.permissions.has("ManageGuild")) {
        return interaction.reply(
          "You do not have the required permissions to run this command, you need the `Manage Server` permission in order to run this command."
        );
      }

      // Get the command from the command options.
      const cmd = await interaction.options.getString("command");

      // Run the command and fetch the response.
      const response = await client.p.command(cmd);

      // if there is a response there is an error, so check what the error code is & reply with a description.
      if (response) {
        let errMsg = "";

        if (response === 0) {
          errMsg +=
            "An unknown error occurred, please contact PRC if this happens again.";
        } else if (response === 1001) {
          errMsg +=
            "An error occurred while trying to communicate with Roblox / the in-game server.";
        } else if (response === 1002) {
          errMsg +=
            "An internal error occurred while trying to run your command.";
        } else if (response === 2000) {
          errMsg += "The developer of this bot did not set an ER:LC API key.";
        } else if (response === 2001) {
          errMsg +=
            "The developer of this bot set an ER:LC API key, but there was a mistake in correctly entering it.";
        } else if (response === 2002) {
          errMsg +=
            "The developer of this bot set an ER:LC API key but it is invalid or expired.";
        } else if (response === 2003) {
          errMsg +=
            "The developer of this bot tried adding a global PRC key, but it was invalid.";
        } else if (response === 2004) {
          errMsg += "The server is currently banned from using the PRC API.";
        } else if (response === 3001) {
          errMsg +=
            "The command was not properly sent, make sure you are entering the **full command**. Example: `:heal all`";
        } else if (response === 3002) {
          errMsg +=
            "The server you are trying to send a command to is currently offline.";
        } else if (response === 4001) {
          errMsg += "You are currently being ratelimited, please try again.";
        } else if (response === 4002) {
          errMsg += "The command you are trying to send is prohibited.";
        } else if (response === 4003) {
          errMsg += "The message you are trying to send is prohibited.";
        } else if (response === 9998) {
          errMsg += "The resource you are accessing is restricted.";
        } else if (response === 9999) {
          errMsg +=
            "The server is outdated, please kick all and rejoin before trying again.";
        }

        return interaction.reply(errMsg);
      }

      // Reply saying the command has been sent.
      interaction.reply("The command has been sent to your ER:LC server!");
    } else if (interaction.options.getSubcommand() === "players") {
      // Send an "{name} is thinking" message so the interaction does not expire.
      await interaction.deferReply();

      // Fetch the playerlist and the queue.
      const players = await client.p.players();
      const queuePrc = await client.p.queue();

      // Filter by permission.
      const staff = players.filter((s) => s.Permission !== "Normal");
      const members = players.filter((p) => p.Permission === "Normal");

      // Fetch accounts for queue users.
      const r = await robloxUser(queuePrc);
      const queue = await r.data;

      // Create default strings to later add data to.
      let staffString = "";
      let playerString = "";
      let queueString = "";

      // Cycle through the staff.
      for (const s in staff) {
        const staffUser = staff[s];
        if (s === 0) staffString += ", ";
        staffString += `[${staffUser.Player}](https://roblox.com/users/${
          staffUser.Player.split(":")[1]
        }) (${staffUser.Team})`;
      }

      // Cycle through the members.
      for (const s in members) {
        const member = members[s];
        playerString += `[${member.Player}](https://roblox.com/users/${
          member.Player.split(":")[1]
        }) (${member.Team})`;
      }

      // Cycle through the queue.
      for (const s in queue) {
        const member = queue[s];
        queueString += `[${member.name}:${member.id}](https://roblox.com/users/${member.id})`;
      }

      await interaction.editReply({
        embeds: [
          new EmbedBuilder().setTitle("ER:LC Players").setDescription(
            `**Server Staff**\n${
              staffString === "" ? "None in this category." : staffString
            }\n**Server Players**\n${
              playerString === "" ? "None in this category." : playerString
            }\n
              **Server Staff**\n${
                queueString === "" ? "None in this category." : queueString
              }`
          ),
        ],
      });
    } else if (interaction.options.getSubcommand() === "joinlogs") {
      // Fetch the joinlogs.
      const joinlogs = await client.p.joinlogs();

      // Sort the joinlogs.
      let logs = await joinlogs.sort((a, b) => b.Timestamp - a.Timestamp);

      // Take the latest 15 entries.
      logs = await logs.slice(0, 15);

      // Set an empty string for the embed.
      let string = "";

      // Cycle through all the join logs.
      for (const l in logs) {
        const log = logs[l];

        // Add the join/leave message to the string.
        string += `[${log.Player.split(":")[0]}](https://roblox.com/users/${
          log.Player.split(":")[1]
        }) ${log.Join ? "joined" : "left"} the server at <t:${
          log.Timestamp
        }:F>\n`;
      }

      // Send the embed.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("ER:LC Joinlogs")
            .setDescription(string === "" ? "No logs found." : string),
        ],
      });
    } else if (interaction.options.getSubcommand() === "killlogs") {
      // Fetch the killlogs.
      const killlogs = await client.p.killlogs();

      // Sort the killlogs.
      let logs = await killlogs.sort((a, b) => b.Timestamp - a.Timestamp);

      // Take the latest 15 entries.
      logs = await logs.slice(0, 15);

      // Set an empty string for the embed.
      let string = "";

      // Cycle through all the kill logs.
      for (const l in logs) {
        const log = logs[l];

        // Add the kill message to the string.
        string += `[${log.Killer.split(":")[0]}](https://roblox.com/users/${
          log.Killer.split(":")[1]
        }) killed [${log.Killed.split(":")[0]}](https://roblox.com/users/${
          log.Killed.split(":")[1]
        }) at <t:${log.Timestamp}:F>\n`;
      }

      // Send the embed.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("ER:LC Kill logs")
            .setDescription(string === "" ? "No logs found." : string),
        ],
      });
    } else if (interaction.options.getSubcommand() === "modcalls") {
      // Fetch the modcall logs.
      const modcalls = await client.p.modcalls();

      // Sort the modcall logs.
      let logs = await modcalls.sort((a, b) => b.Timestamp - a.Timestamp);

      // Take the latest 15 entries.
      logs = await logs.slice(0, 15);

      // Set an empty string for the embed.
      let string = "";

      // Cycle through all the modcall logs.
      for (const l in logs) {
        const log = logs[l];

        // Add the modcall message to the string.
        string += `[${log.Caller.split(":")[0]}](https://roblox.com/users/${
          log.Caller.split(":")[1]
        }) called a mod at <t:${log.Timestamp}:F> Answered: ${
          log.Moderator ? log.Moderator.split(":")[0] : "N/A"
        }\n`;
      }

      // Send the embed.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("ER:LC modcall logs")
            .setDescription(string === "" ? "No logs found." : string),
        ],
      });
    } else if (interaction.options.getSubcommand() === "vehicles") {
      // Fetch the vehicles.
      const vehicles = await client.p.vehicles();

      // Take the latest 15 entries.
      cars = await vehicles.slice(0, 15);

      // Set an empty string for the embed.
      let string = "";

      // Cycle through all the vehicles.
      for (const c in cars) {
        const car = cars[c];

        // Add the modcall message to the string.
        string += `${car.Owner} - ${car.Name} (${car.Texture})\n`;
      }

      // Send the embed.
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("ER:LC vehicles")
            .setDescription(string === "" ? "No vehicles found." : string),
        ],
      });
    }
  },
};

// Create a function to fetch a user's roblox data based on their roblox ID.
async function robloxUser(ids) {
  // Fetch the user data from the roblox users API.
  const response = await fetch(`https://users.roblox.com/v1/users`, {
    method: "POST",
    body: JSON.stringify({
      userIds: ids,
      excludeBannedUsers: false,
    }),
  });

  // Transform the data into javascript usable data.
  const data = await response.json();

  // Return the data with the robloxUsers
  return data;
}
