import { BotClient } from "#lib/BotClient";
import { ApplicationCommandRegistries, RegisterBehavior } from "@sapphire/framework";

// init dotenv
(await import ('dotenv')).config();

console.clear();
console.log("Initialising...");

ApplicationCommandRegistries.setDefaultBehaviorWhenNotIdentical(RegisterBehavior.BulkOverwrite)

// Initialise client
let client = new BotClient();

// Attempt log in
client.logger.info("Logging in...");

try {

    client.login(process.env.TOKEN);
    client.logger.info("Successfully logged in.");

} catch (err) {

    client.logger.error(err);
    client.destroy();
    process.exit();

}