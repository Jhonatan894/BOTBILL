import { Event } from '../../structs/types/Event';
import { CommandInteractionOption, CommandInteractionOptionResolver, IntentsBitField, Interaction } from 'discord.js';
import { Command } from '../../structs/types/Command';
import { client } from '../..';
export default new Event({
    name:"interactionCreate",
    run(interaction) {
        if(!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName)
        if(!command) return;

        const options = interaction.options as CommandInteractionOptionResolver
        command.run({ client, interaction, options })
    }
})