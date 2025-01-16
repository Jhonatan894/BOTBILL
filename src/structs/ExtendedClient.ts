import { Client, Partials, IntentsBitField, BitFieldResolvable, GatewayIntentsString, Component, Collection} from "discord.js";
import { CommandType, ComponentsButton, ComponentsSelect, ComponentsModal } from "./types/Command";

import dotenv from "dotenv";

dotenv.config(); 	

export class ExtendedClient extends Client{
    public commands: Collection<string, CommandType> = new Collection();
    public buttons: ComponentsButton = new Collection();
    public selects: ComponentsSelect = new Collection();
    public modals: ComponentsModal = new Collection();
        constructor(){
            super({
            intents: Object.keys(IntentsBitField.Flags) as BitFieldResolvable<GatewayIntentsString, number>,
            partials: [
            Partials.Channel, Partials.GuildMember, Partials.GuildScheduledEvent, Partials.Message
            , Partials.Reaction, Partials.ThreadMember, Partials.User
            ]
        })
    }
    public async start(){
        try{
            this.login(process.env.BOT_TOKEN);
            console.log('Bot está funcionando...');
        } catch (error) {
            console.error('Falha: ', error);
        }
    }
}

