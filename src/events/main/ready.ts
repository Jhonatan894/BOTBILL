import { client } from "../..";
import { Event } from "../../structs/types/Event";   

export default new Event({  
    name: "ready",  
    once : true,
    run (){
        const  { commands, buttons, selects, modals } = client;

        console.log("BOTBILL ta on!".green);
        console.log(`Commands loaded: ${commands.size}`.cyan);
        console.log(`Buttons loaded: ${buttons.size}`.cyan);
        console.log(`Selects Menus loaded: ${selects.size}`.cyan);
        console.log(`Modals loaded: ${modals.size}`.cyan);

    },
      
    });
