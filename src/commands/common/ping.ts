import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, Collection } from "discord.js";
import { Command } from "../../structs/types/Command";

export default new Command({
  name: "ping",
  description: "receba o pong!",
  type: ApplicationCommandType.ChatInput,
  run({ interaction }) {
    const row = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          customId: "test-button",
          label: "Receba aqui",
          style: ButtonStyle.Success,
        }),
      ],
    });

    interaction.reply({
      ephemeral: true,
      content: "RECEBA O PONG BILL!!",
      components: [row],
    });
  },
  buttons: new Collection([
    [
      "test-button",
      (interaction) => {
        interaction.update({ components: [] });
      },
    ],
  ]),
});
