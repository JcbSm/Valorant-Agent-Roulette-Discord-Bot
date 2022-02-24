import { Client, BaseCommandInteraction, Snowflake, Message, MessageEmbed, SelectMenuInteraction, ButtonInteraction, MessageActionRow, MessageAttachment } from "discord.js";
import type { Gamemode } from "./Gamemode";
import { Player } from "./Players";
import { ValMap } from "./ValMap";
import { ValAgent } from "./ValAgent";
import { promises as fsp } from "fs";

import BlindPick from "../gamemodes/blind-pick";
import { colors } from "../constants.json";

export interface Customs {
    client: Client;
    interaction: BaseCommandInteraction;
    players: Map<Snowflake, Player>;
    maps: ValMap[];
    mappool: ValMap[];
    gamemode: Gamemode;
    gamemodes: Gamemode[];
    map: ValMap;
    message: Message;
    agents: ValAgent[];
}

export class Customs {

    constructor (client: Client, interaction: BaseCommandInteraction) {

        this.client = client;
        this.interaction = interaction;
        this.players = new Map();

        this.maps = [
            new ValMap('ASCENT', 0),
            new ValMap('BIND', 1),
            new ValMap('BREEZE', 2),
            new ValMap('FRACTURE', 3),
            new ValMap('HAVEN', 4),
            new ValMap('ICEBOX', 5),
            new ValMap('SPLIT', 6,)
        ];

        this.agents = [
            new ValAgent('BRIMSTONE', '🌫', '930526575299027034', true),
            new ValAgent('SOVA', '🏹', '930526575319982133', true),
            new ValAgent('SAGE', '🤍', '930526575366140044', true),
            new ValAgent('PHOENIX', '🔥', '930526575408070766', true),
            new ValAgent('JETT', '💨', '930526575366111243', true),
            new ValAgent('VIPER', '🐍', '930526575626178771'),
            new ValAgent('OMEN', '👻', '930526575311605781'),
            new ValAgent('KILLJOY', '🔧', '930526575982706798'),
            new ValAgent('CYPHER', '🤠', '930526575248687165'),
            new ValAgent('REYNA', '👁', '930526575395483739'),
            new ValAgent('RAZE', '💣', '930526575789760512'),
            new ValAgent('BREACH', '🦾', '930526575978500096'),
            new ValAgent('SKYE', '🍃', '930526575793930280'),
            new ValAgent('YORU', '🐺', '930526575953346560'),
            new ValAgent('ASTRA', '🌌', '930526576028827748'),
            new ValAgent('KAY/O', '🤖', '930526575596810301'),
            new ValAgent('CHAMBER', '🃏', '930526575332573235'),
            new ValAgent('NEON', '⚡', '936618293417115698')
        ]

        this.mappool = [...this.maps];
        this.gamemode = new BlindPick(this);
        this.gamemodes = [];
        this.map = this.maps[0];

    }

    async send() {

        this.gamemodes = await this.getGamemodes();

        this.message = await this.interaction.channel?.send({ embeds: [ this.getEmbed() ], components: this.getComponents(), files: [ this.getMapImageAttachment() ] })!;

        await this.interaction.reply({ content: '***OPTIONS***', ephemeral: true, components: this.getOptionsComponents() });

        const optionsCollector = (await this.interaction.fetchReply() as Message).createMessageComponentCollector();

        optionsCollector.on('collect', async (interaction: SelectMenuInteraction | ButtonInteraction) => {

            if (interaction.isSelectMenu()) {

                switch (interaction.customId) {

                    case 'mapSelectMenu':

                        this.mappool = [];

                        interaction.values.forEach(v => {

                            this.mappool.push(this.maps.find(m => m.name === v)!);

                        })

                        interaction.update({ components: this.getOptionsComponents() });
                        break;

                    case 'gamemodeSelectMenu':

                        this.gamemode = this.gamemodes.find(g => g.name === interaction.values[0])!;

                        interaction.update({ components: this.getOptionsComponents() });
                        break;

                    case 'kickPlayerSelectMenu':

                        interaction.values.forEach(v => this.players.delete(v));
                        interaction.update({ components: this.getOptionsComponents() });
                        break;

                }

            } else if (interaction.isButton()) {

                switch (interaction.customId) {

                    case 'selectMapPool':
                        interaction.update({ components: [ this.getMapSelectMenu() ]});
                        break;

                    case 'selectGamemode':
                        interaction.update({ components: [ this.getGamemodeSelectMenu() ]});
                        break;

                    case 'mapRoll':

                        this.map = this.mappool[Math.floor(Math.random() * this.mappool.length)];
                        await this.message.edit({ embeds: [ this.getEmbed() ], files: [ this.getMapImageAttachment() ] });
                        await interaction.update({});
                        return;

                    case 'kickPlayer':
                        interaction.update({ components: [ this.getKickPlayerSelectMenu() ]});
                        break;

                    case 'closeCustoms':
                        this.exit();
                        break;

                    case 'customStart':

                        interaction.update({ content: 'Starting...', components: [] });
                        this.start();
                        break;

                }

            }

            await this.message.edit({ embeds: [ this.getEmbed() ]});

        })

        const collector = this.message.createMessageComponentCollector({ componentType: 'BUTTON' });

        collector.on('collect', async (interaction: ButtonInteraction) => {

            switch (interaction.customId) {

                case 'customTeam1':
                    if ([...this.players.values()].filter(p => p.team === 0).length >= 5) break;
                    this.players.set(interaction.user.id, new Player(interaction.user, 0, [...this.agents].filter(a => a.default)));
                    interaction.update({ embeds: [ this.getEmbed() ], components: this.getComponents() });
                    break;

                case 'customTeam2':
                    if ([...this.players.values()].filter(p => p.team === 1).length >= 5) break;
                    this.players.set(interaction.user.id, new Player(interaction.user, 1, [...this.agents].filter(a => a.default)));
                    interaction.update({ embeds: [ this.getEmbed() ], components: this.getComponents() });
                    break;

                case 'customLeave':
                    this.players.delete(interaction.user.id);
                    interaction.update({ embeds: [ this.getEmbed() ], components: this.getComponents() });
                    break;

            }

        })

    }

    private removeSuffix(fileName: string) {
        let arr = fileName.split('.');
        arr.pop();
        return arr.join('.');
    };

    async getGamemodes() {

        let gamemodes: Gamemode[] = [];

        const dir = await fsp.opendir('./src/gamemodes/');

        for await (const file of dir) {

            gamemodes.push(new (await import(`../gamemodes/${this.removeSuffix(file.name)}.js`)).default(this));

        }

        return gamemodes;

    }

    async start() {

        this.message.edit({ components: this.getComponents(true) })
        this.gamemode.run();

    }

    async exit() {

        this.message.edit({ embeds: [ this.getEmbed() ], components: [] });
        this.interaction.editReply({ content: 'Customs Closed.', components: [] })

    }

    getEmbed(): MessageEmbed {

        return new MessageEmbed({
            title: 'CUSTOMS',
            description: `Leader: <@${this.interaction.user.id}>\nPlayers: \`${this.players.size}/10\`\n\u200b`,
            fields: [
                {
                    name: 'MAP POOL',
                    value: this.getMapPoolList() + '\n\u200b',
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: 'PLAYERS',
                    value: this.getPlayerList() + '\n\u200b',
                    inline: true
                },
                {
                    name: 'TEAM 1',
                    value: this.getTeam1List() + '\n\u200b',
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: true
                },
                {
                    name: 'TEAM 2',
                    value: this.getTeam2List() + '\n\u200b',
                    inline: true
                },
                {
                    name: 'CURRENT MAP',
                    value: this.map.name
                }
            ],
            color: colors.valRed,
            image: {
                url: `attachment://${this.map.name}.png`
            }
        })

    }

    getComponents(disabled = false): MessageActionRow[] {

        return [
            new MessageActionRow({

                type: 'ACTION_ROW',
                components: [
                    {
                        type: 'BUTTON',
                        customId: 'filler',
                        label: '\u200b',
                        style: 'SECONDARY',
                        disabled: true,
                    },
                    {
                        type: 'BUTTON',
                        label: 'JOIN TEAM 1',
                        customId: 'customTeam1',
                        style: 'PRIMARY',
                        disabled: disabled || [...this.players.values()].filter(p => p.team === 0).length >= 5
                    },
                    {
                        type: 'BUTTON',
                        label: 'JOIN TEAM 2',
                        customId: 'customTeam2',
                        style: 'DANGER',
                        disabled: disabled || [...this.players.values()].filter(p => p.team === 1).length >= 5
                    },
                    {
                        type: 'BUTTON',
                        label: 'LEAVE',
                        emoji: '❌',
                        customId: 'customLeave',
                        style: 'SECONDARY',
                        disabled: disabled
                    }
                ]
            })]

    }

    getOptionsComponents(): MessageActionRow[] {

        return [

            new MessageActionRow({
                type: 'ACTION_ROW',
                components: [
                    {
                        type: 'BUTTON',
                        label: 'SELECT MAP POOL',
                        customId: 'selectMapPool',
                        style: 'SECONDARY',
                        emoji: '🗺'
                    },
                    {
                        type: 'BUTTON',
                        label: 'RE-ROLL MAP',
                        customId: 'mapRoll',
                        style: 'PRIMARY',
                        emoji: '🎲'
                    },
                ]
            }),

            new MessageActionRow({
                type: 'ACTION_ROW',
                components: [
                    {
                        type: 'BUTTON',
                        label: 'START',
                        customId: 'customStart',
                        style: 'SUCCESS'
                    },
                    {
                        type: 'BUTTON',
                        label: 'KICK PLAYER',
                        customId: 'kickPlayer',
                        style: 'DANGER',
                        emoji: '🦵',
                    },
                    {
                        type: 'BUTTON',
                        label: 'EXIT',
                        customId: 'closeCustoms',
                        style: 'DANGER',
                        emoji: '✖'
                    }
                ]
            })
        ]
    }

    getGamemodeSelectMenu(): MessageActionRow {

        return new MessageActionRow({
            type: 'ACTION_ROW',
            components: [
                {
                    type: 'SELECT_MENU',
                    maxValues: 1,
                    minValues: 1,
                    customId: 'gamemodeSelectMenu',
                    placeholder: 'Select gamemode...',
                    options: [...this.gamemodes].map(g => {
                        return {
                            label: g.name.toUpperCase(),
                            value: g.name,
                            description: g.description
                        }
                    }),
                }
            ]
        });

    }

    getMapSelectMenu(): MessageActionRow {

        return new MessageActionRow({
            type: 'ACTION_ROW',
            components: [
                {
                    type: 'SELECT_MENU',
                    maxValues: 7,
                    minValues: 1,
                    customId: 'mapSelectMenu',
                    placeholder: 'Select map pool...',
                    options: this.maps.map(m => {

                        return {
                            label: m.name,
                            value: m.name
                        }

                    })
                }
            ]
        });
    }

    getKickPlayerSelectMenu(): MessageActionRow {

        return new MessageActionRow({
            type: 'ACTION_ROW',
            components: [
                {
                    type: 'SELECT_MENU',
                    minValues: 0,
                    maxValues: this.players.size,
                    customId: 'kickPlayerSelectMenu',
                    placeholder: 'Select players to kick',
                    options: [...this.players.values()].map(p => {

                        return {
                            label: p.user.username,
                            value: p.user.id
                        }

                    })
                }
            ]
        })

    }

    getPlayerList(): string {

        return this.players.size > 0 ? [...this.players.values()].map((p: Player, i: number) => `\`${i + 1}.\` <@${p.user.id}>`).join('\n') : 'Click to join!'

    }

    getTeam1List(): string {

        return [...this.players.values()].filter(p => p.team === 0).map((p: Player) => `<@${p.user.id}>`).join('\n')

    }

    getTeam2List(): string {

        return [...this.players.values()].filter(p => p.team === 1).map((p: Player) => `<@${p.user.id}>`).join('\n')

    }

    getMapImageAttachment(): MessageAttachment {

        return new MessageAttachment(`./src/assets/maps/${this.map.name.toLowerCase()}.png`, `${this.map.name}.png`);

    }

    getMapPoolList(): string {

        return [...this.mappool].map(m => m.name).join('\n');

    }

}