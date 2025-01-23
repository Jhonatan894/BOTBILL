import { Message } from "discord.js";

export default {
  name: "messageCreate", // Nome do evento
  once: false, // Se o evento deve ser executado apenas uma vez
  run: async (message: Message) => {
    // Certifique-se de que a mensagem não veio do próprio bot
    if (message.author.bot) return;

    // Código do evento
    if (message.content.includes("@BotName")) {
      await message.reply("Você me mencionou?");
    }
  },
};
