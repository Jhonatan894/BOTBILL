import { ApplicationCommandType } from "discord.js";
import { Command } from "../../structs/types/Command";

export default new Command({
    name: "ping",
    description: "receba o pong!",
    type: ApplicationCommandType.ChatInput,
    run({interaction}){
        interaction.reply({ephemeral: true, content: "RECEBA O PONG BILL!!"})
    }
})