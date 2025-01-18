import { ApplicationCommandOptionType, ApplicationCommandType, Guild } from "discord.js";
import { Command } from "../../structs/types/Command";

export default new Command({
    name: "servidor",
    description: "Administra o servidor",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "icone",
            description: "Amostre sua imagem",
            type: ApplicationCommandOptionType.Attachment,
            required: true,
        },
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand()) return;
        const guild = interaction.guild as Guild;

        const image = options.getAttachment("icone", true);

        await interaction.deferReply({ephemeral: true});

        await guild.setIcon(image.url);

        await interaction.editReply({ content: `Novo icone da Guilda ${guild.name} definido` });
    }
});