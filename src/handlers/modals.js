// This is a custom made handler designed for role selectmenus. Feel free to check it out yourself.

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const { Collection } = require("discord.js");

class ModalHandler {
  constructor(client) {
    this.client = client;
    this.buttons = new Collection();
    this.db = new Map();

    this.client.on("interactionCreate", async (interaction) => {
      if (!interaction.isModalSubmit()) return;

      const buttonData = this.db.get(interaction.customId);
      if (buttonData) {
        return buttonData.execute(interaction);
      }
      const localTitle = {
        en: "Menu unavailable",
        nl: "Menu niet beschikbaar",
        de: "Menü nicht verfügbar",
        fr: "Menu indisponible",
        "es-ES": "Menú no disponible",
        "sv-SE": "Menyn är inte tillgänglig",
      };

      const localDescription = {
        en: "This menu is no longer available or was never added. Try running this command again or contact our support team.",
        nl: "Dit menu is niet langer beschikbaar of is nooit toegevoegd. Probeer dit commando opnieuw uit te voeren of neem contact op met ons ondersteuningsteam.",
        de: "Dieses Menü ist nicht mehr verfügbar oder wurde nie hinzugefügt. Versuchen Sie, diesen Befehl erneut auszuführen, oder wenden Sie sich an unser Support-Team.",
        fr: "Ce menu n'est plus disponible ou n'a jamais été ajouté. Essayez d'exécuter à nouveau cette commande ou contactez notre équipe de support.",
        "es-ES":
          "Este menú ya no está disponible o nunca se agregó. Intente ejecutar este comando nuevamente o comuníquese con nuestro equipo de soporte.",
        "sv-SE":
          "Denna meny är inte längre tillgänglig eller har aldrig lagts till. Försök köra den här kommandot igen eller kontakta vårt supportteam.",
      };

      const localButton = {
        en: "Support",
        nl: "Ondersteuning",
        de: "Unterstützung",
        fr: "Soutien",
        "es-ES": "Apoyo",
        "sv-SE": "Stöd",
      };

      const embed = new EmbedBuilder()
        .setTitle(localTitle[interaction.locale] ?? localTitle.en)
        .setDescription(
          localDescription[interaction.locale] ?? localDescription.en
        )
        .setColor("#2b2d31");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel(localButton[interaction.locale] ?? localButton.en)
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/ZwyumpzAgK")
      );

      return interaction.reply({
        embeds: [embed],
        components: [row],
        flags: [MessageFlags.Ephemeral],
      });
    });

    setInterval(() => {
      const now = Date.now();
      for (const [customId, data] of this.db.entries()) {
        if (data.expireAt <= now) this.db.delete(customId);
      }
    }, 60 * 60 * 1000);
  }

  register(customId, days, execute) {
    const expireAt = Date.now() + days * 24 * 60 * 60 * 1000;
    this.db.set(customId, { execute, expireAt });
  }

  remove(customId) {
    this.db.delete(customId);
  }
}

module.exports = ModalHandler;
