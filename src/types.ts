
export type Question = {
	question: string;
	answer: string;
}
export type OtherOption = {
	question: string;
	emoji: string;
	answer?: string;
}
export type FaqConfig = {
	intro: {
		title: string
		description: string
		titleImageUrl: string
		titleButtons: string
		messageButtonImage: string
	};
	otherOption: OtherOption
	moreOption: OtherOption
	questions: Question[]
	numberEmojis: string[]
}