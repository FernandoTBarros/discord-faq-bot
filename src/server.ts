// server.ts
require('dotenv').config();
import { Client, Intents, Interaction, Message, MessageActionRow, MessageButton, MessageEditOptions } from "discord.js";

import fs from 'fs';
import { exit } from "process";
import { FaqConfig, Question } from "./types";

const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID;

bot.once("ready", async () => {
	console.log(`${new Date().toLocaleString()} - Bot is ready`);
	
	// Create an event listener for messages
	bot.on('messageCreate', async (message: Message) => {
		if (!message.author.bot && message.author.id === ADMIN_DISCORD_ID) {
			let args = message.content.split(' ');
			if (args[0] === ('!showFaq')) {
				message.channel.send('Montando FAQ, aguarde...')
					.then(async message => {
						message.edit(createFaqMenu());
					});
			}
		}
	});

	//Create an event listener for interactions (button interactions on this case)
	bot.on('interactionCreate', async (interaction: Interaction) => {
		if (interaction.isButton()) {
			const { questions, otherOption }: FaqConfig = JSON.parse(fs.readFileSync('./faq-config.json', 'utf-8'));
			if (interaction.customId === '?') {
				interaction.reply({content:otherOption.answer, ephemeral:true});
			}
			else if (Number.parseInt(interaction.customId) < 0) {
				let menu = createFaqMenu(Number.parseInt(interaction.customId)*-1);
				interaction.reply({embeds: menu.embeds?.slice(1), components:menu.components, ephemeral:true});
			}
			else {
				interaction.reply({content:questions[interaction.customId].answer, ephemeral:true});
			}
		}
	});
});

if (!BOT_TOKEN) {
	console.error("Sem token para iniciar o bot")
	exit(1);
}
bot.login(BOT_TOKEN);

/**
 * Function that creates the Faq Menu message reading from faq-config.json file all the configurations and questions
 * @returns MessageEditOptions with the content necessary to display the message and all the embeds and buttons
 */
function createFaqMenu(offset:number = 0): MessageEditOptions {
	const { intro, questions: questions, otherOption, numberEmojis, moreOption }: FaqConfig = JSON.parse(fs.readFileSync('./faq-config.json', 'utf-8'));
	const buttons: MessageButton[] = [];
	const content: string[] = [];
	let currentQuestions = questions;
	if(offset > 0) {
		currentQuestions = questions.slice(offset-1);
	}
	if (currentQuestions && currentQuestions.length > 0) {
		const rows: MessageActionRow[] = [];
		for (let i = 0; i < Math.min(currentQuestions.length, 9); i++) {
			const emoji = bot.emojis.cache.get(numberEmojis[i]) || numberEmojis[i];
			const q: Question = currentQuestions[i];
			content.push(`${emoji} **${q.question}**`);
			buttons.push(
				new MessageButton()
					.setEmoji(emoji)
					.setCustomId((i + offset-1).toString())
					.setStyle("SECONDARY")
			)
		}
		let anotherOption = otherOption;
		let customId = '?';
		if(currentQuestions.length > 9) {
			anotherOption = moreOption;
			customId = ((offset + 10)*-1).toString();
		}
		const anotherEmoji = bot.emojis.cache.get(anotherOption.emoji) || anotherOption.emoji;
		content.push(`${anotherEmoji} ${anotherOption.question}`);
		buttons.push(
			new MessageButton()
				.setEmoji(anotherEmoji)
				.setCustomId(customId)
				.setStyle("PRIMARY")
		)
		while (buttons.length > 0) {
			rows.push(
				new MessageActionRow().addComponents(
					buttons.splice(0, Math.min(5, buttons.length))
				));
		}

		return {
			embeds: [{
				title: intro.title,
				description: intro.description,
				color: 0xdfbc86,
				thumbnail: { url: intro.titleImageUrl }
			},
			{
				title: intro.titleButtons,
				description: content.join('\n\n'),
				color: 0xdfbc86,
				thumbnail: { url: intro.messageButtonImage }
			}],
			content: null,
			components: rows
		}
	}
	return { content: "Nenhuma pergunta configurada!\n\nCrie perguntas no arquivo 'data/questions.json' e mande '!showFaq' novamente" };
}
