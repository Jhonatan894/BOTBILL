
import { green } from "colors";
import {ExtendedClient} from "./structs/ExtendedClient"
export * from "colors"; 
import config from "./config.json"
import fs from "fs";
import path from "path";



const client = new ExtendedClient();
           
  client.start();    

  export { client, config } 

