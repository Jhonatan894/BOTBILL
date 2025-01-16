
import { green } from "colors";
import {ExtendedClient} from "./structs/ExtendedClient"
export * from "colors"; 
import config from "./config.json"
import fs from "fs";
import path from "path";



const client = new ExtendedClient();
           
  client.start();    

  export { client, config } 







{
//USA A FUNÇÃO DO FS PARA LER OS ARQUIVOS, UTILIZANDO O FOREACH PARA PERCORRER A PASTA E ENCONTRAR
//ARQUIVOS FILTRADOS QUE CONTENHAM NO FINAL .TS OU .JS
//
/*fs.readdirSync(path.join(__dirname, "commands")).forEach(local => {

  fs.readdirSync(path.join(__dirname, "commands", local))
  .filter(fileName => fileName.endsWith(".ts") || fileName.endsWith(".js"))
  .forEach(fileName => {
    console.log(fileName)
  })

})
*/
}
