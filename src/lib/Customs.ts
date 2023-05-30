import { Client, BaseCommandInteraction, Snowflake, Message, MessageEmbed, SelectMenuInteraction, ButtonInteraction, MessageActionRow, MessageButton } from "discord.js";
import type { Gamemode } from "./Gamemode";
import { Player } from "./Players";
import { ValAgent } from "./ValAgent";
import { promises as fsp } from "fs";

import BlindPick from "../gamemodes/blind-pick";
import { colors } from "../constants.json";

export interface Customs {
    client: Client;
    interaction: BaseCommandInteraction;
    players: Map<Snowflake, Player>;
    gamemode: Gamemode;
    gamemodes: Gamemode[];
    message: Message;
    agents: ValAgent[];
}

export class Customs {

    constructor (client: Client, interaction: BaseCommandInteraction) {

        this.client = client;
        this.interaction = interaction;
        this.players = new Map();

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
            new ValAgent('NEON', '⚡', '936618293417115698'),
            new ValAgent('FADE', '🦃', '1113104096593977446'),
            new ValAgent('HARBOR', '🛥️', '1113104105804669021'),
            new ValAgent('GECKO', '🦎', '1113104098770833520')
        ]

        this.gamemode = new BlindPick(this);
        this.gamemodes = [];

    }

    async send() {

        this.gamemodes = await this.getGamemodes();

        this.message = await this.interaction.channel?.send({ embeds: [ this.getEmbed() ], components: this.getComponents() })!;

        await this.interaction.editReply({ content: '***OPTIONS***', components: this.getOptionsComponents() });

        const optionsCollector = (await this.interaction.fetchReply() as Message).createMessageComponentCollector();

        optionsCollector.on('collect', async (interaction: SelectMenuInteraction | ButtonInteraction) => {

            if (interaction.isSelectMenu()) {

                switch (interaction.customId) {

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
                    name: 'PLAYERS',
                    value: this.getPlayerList() + '\n\u200b',
                    inline: false
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
            ],
            color: colors.valRed,
        })

    }

    getComponents(disabled = false): MessageActionRow[] {

        return [
            new MessageActionRow<MessageButton>({

                type: 'ACTION_ROW',
                components: [
                    new MessageButton({
                        customId: 'filler',
                        label: '\u200b',
                        style: 'SECONDARY',
                        disabled: true,
                    }),
                    new MessageButton({
                        label: 'JOIN TEAM 1',
                        customId: 'customTeam1',
                        style: 'PRIMARY',
                        disabled: disabled || [...this.players.values()].filter(p => p.team === 0).length >= 5
                    }),
                    new MessageButton({
                        label: 'JOIN TEAM 2',
                        customId: 'customTeam2',
                        style: 'DANGER',
                        disabled: disabled || [...this.players.values()].filter(p => p.team === 1).length >= 5
                    }),
                    new MessageButton({
                        label: 'LEAVE',
                        customId: 'customLeave',
                        style: 'SECONDARY',
                        disabled: disabled
                    })
                ]
            })]

    }

    getOptionsComponents(): MessageActionRow[] {

        return [
            new MessageActionRow<MessageButton>({
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

        return new MessageActionRow<MessageButton>({
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

    getKickPlayerSelectMenu(): MessageActionRow {

        return new MessageActionRow<MessageButton>({
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
}