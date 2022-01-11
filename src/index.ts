console.clear();

import { Customs } from './lib/Customs';
import { ApplicationCommandData, Client, Guild, Interaction } from 'discord.js';
import { colors } from "./constants.json";

const client = new Client({ intents: [ // For a list: https://discord.com/developers/docs/topics/gateway#list-of-intents

        'GUILDS',
        'GUILD_MESSAGES',
        'GUILD_MEMBERS',
        'GUILD_VOICE_STATES',
        'GUILD_MESSAGE_REACTIONS',
        'GUILD_PRESENCES',
        'DIRECT_MESSAGES',
        'DIRECT_MESSAGE_REACTIONS',

    ], partials: ['MESSAGE', 'REACTION']
});

const commands: ApplicationCommandData[] = [
    {
        name: 'customs',
        description: 'Start a Valorant Customs!',
        options: [
            {
                type: 'STRING',
                name: 'gamemode',
                description: 'The gamemode',
                choices: [
                    {
                        name: 'Standard',
                        value: 'standard'
                    },
                    {
                        name: 'Blind Pick',
                        value: 'blind pick'
                    }
                ]
            }
        ]
    },
    {
        name: 'invite',
        description: 'Get an invite link for the bot!',
    }
];

client.on('ready', () => console.log("Online"));

client.on('interactionCreate', async (interaction: Interaction) => {

    if (interaction.isApplicationCommand()) {

        switch (interaction.commandName) {

            case 'customs':

                const customs = new Customs(client, interaction);
                await customs.send();
                break;

            case 'invite':

                interaction.reply({ ephemeral: true, embeds: [{ 
                    title: 'Invite',
                    url: 'https://discord.com/api/oauth2/authorize?client_id=926082464508674060&permissions=277025769536&scope=bot%20applications.commands',
                    color: colors.valRed
                }]});
                break;

        }

    }

});

client.on('guildCreate', async (guild: Guild) => {
    console.log(`Added guild ${guild.id} | ${guild.name}`);
    await client.application?.commands.set(commands, guild.id);
    console.log(`Added.`)
});

console.log("Logging in...");

(async () => {

    try {

        
        (await import ('dotenv')).config();	
        await client.login(process.env.TOKEN);

        console.log("Logged in.")

        for (const [id, guild] of (await client.guilds.fetch())) {

            (async () => {
            
                await client.application?.commands.set(commands, id);

                console.log(`Loaded guild ${id} | ${guild.name}`);

            })();

        }

    } catch (error) {
        console.error(error);
    };

})();