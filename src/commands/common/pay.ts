
import { ApplicationCommandOptionType, ApplicationCommandType, GuildMember } from "discord.js"; 
import { Command } from "../../structs/types/Command";

export default new Command({
    name: "pagar",
    description: "Envie dinheiro para um Filho do Bill",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "valor",
            description: "Usuário para enviar dinheiro",
            type: ApplicationCommandOptionType.Number,
            required: true,
        },
        {
            name: "membro",
            description: "Membro que recebera a moeda",
            type: ApplicationCommandOptionType.User,
            required: true,
        },
    ],
    async run({interaction, options}) {
        if (!interaction.isChatInputCommand()) return;
        const member = interaction.member as GuildMember;

        const amount = options.getNumber("valor", true);
        const mention = options.getMember("membro") as GuildMember;

        const content = ` ${member} enviou ${amount} para ${mention}`;

        await interaction.reply({ content });
    }
});

