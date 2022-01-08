console.clear();

import { Customs } from './lib/Customs';
import { Client, Interaction } from 'discord.js';

const client = new Client({ intents: [ // For a list: https://discord.com/developers/docs/topics/gateway#list-of-intents

        'GUILDS',
        'GUILD_MESSAGES',
        'GUILD_MEMBERS',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGE_REACTIONS',
        'GUILD_PRESENCES',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS',

    ], partials: ['MESSAGE', 'REACTION'] });

client.on('ready', () => console.log("Online"));

client.on('interactionCreate', async (interaction: Interaction) => {

    if (interaction.isApplicationCommand()) {

        switch (interaction.commandName) {

            case 'customs':

                const customs = new Customs(client, interaction);
                await customs.send();
                break;

        }

    }

});

console.log("Logging in...");

(async () => {

    try {

        await client.login("OTI2MDgyNDY0NTA4Njc0MDYw.Yc2fgQ.OKIC0T35MARov3UXgiAD2-P0BII");

        console.log("Logged in.")

        await client.application?.commands.set([
            {
                name: 'customs',
                description: 'Start a Valorant Customs!'
            }
        ], '447504770719154192');

    } catch (error) {
        console.error(error);
    };

})();