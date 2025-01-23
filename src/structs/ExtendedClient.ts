import { Client, Partials, IntentsBitField, BitFieldResolvable, GatewayIntentsString, Component, Collection, ApplicationCommandDataResolvable, ClientEvents} from "discord.js";
import { CommandType, ComponentsButton, ComponentsSelect, ComponentsModal, Command } from './types/Command';
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { green } from 'colors';
import { EventType } from "./types/Event";
dotenv.config(); 	


const fileCondition = (fileName: string) => fileName.endsWith(".ts") || fileName.endsWith(".js");

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
            this.registerModules();
            this.registerEvents();
            this.login(process.env.BOT_TOKEN);
            console.log('Online'.green);
        } catch (error) {
            console.error('Falha: '.red, error);
        }
    }

    private registerCommands(commands: Array<ApplicationCommandDataResolvable>){
        this.application?.commands.set(commands)
        .then(() => {
            console.log("✔ Slash Commands (/) defined". green);
        })
        .catch(error => {
            console.log(`❌ An error occurred while trying to set the Slash Commands (/): \n${error}`.red);
        })
    }

    private registerModules(){
        const slashCommands: Array<ApplicationCommandDataResolvable> = new Array();
        const commandsPath = path.join(__dirname, "..", "commands");

        fs.readdirSync(commandsPath).forEach(local => {

            fs.readdirSync(commandsPath + `/${local}/`).filter(fileCondition).forEach(async fileName => {

                let command: CommandType | undefined;

                try {
                    command = (await import(`../commands/${local}/${fileName}`))?.default;
                } catch (error) {
                    console.error(`❌ Falha ao importar o comando "${local}/${fileName}":\n`, error);
                    return;
                }

                if (!command) {
                    console.error(`❌ O comando em "${local}/${fileName}" é inválido ou está malformado.`);
                    return;
                }

                const { name, buttons, selects, modals } = command;

                if (!name) {
                    console.error(`❌ O comando em "${local}/${fileName}" está sem a propriedade 'name'.`);
                    return;
                }

                this.commands.set(name, command);
                slashCommands.push(command);

                if (buttons) {
                    buttons.forEach((run, key) => this.buttons.set(key, run));
                }
                if (selects) {
                    selects.forEach((run, key) => this.selects.set(key, run));
                }
                if (modals) {
                    modals.forEach((run, key) => this.modals.set(key, run));
                }
            })
        })

        this.on("ready", () => this.registerCommands(slashCommands))
    }

    private registerEvents(){
        const eventsPath = path.join(__dirname, "..","events");
        

        fs.readdirSync(eventsPath).forEach(local => {
            fs.readdirSync(`${eventsPath}/${local}`).filter((fileCondition))
            .forEach(async fileName =>{
                let event: EventType<keyof ClientEvents>;

                try {
                    event = (await import(`../events/${local}/${fileName}`))?.default;
                } catch (error) {
                    console.error(`❌ Falha ao importar o evento "${local}/${fileName}":\n`, error);
                    return;
                }

                const { name, once, run } = event || {};

                if (!name || !run) {
                    console.error(`❌ O evento em "${local}/${fileName}" está malformado ou sem propriedades obrigatórias.`);
                    return;
                }

                try {
                    once ? this.once(name, run) : this.on(name, run);
                } catch (error) {
                    console.error(`❌ Erro ao registrar o evento "${name}":\n`, error);
                }
            })
        })
    }
}
