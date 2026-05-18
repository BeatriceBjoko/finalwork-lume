export const DAILY_QUOTES_NL = [
	"Je hoeft het niet allemaal alleen te dragen.",
	"Zorg goed voor jezelf, zodat je voor anderen kunt zorgen.",
	"Kleine stapjes vooruit zijn ook stappen.",
	"Vraag om hulp wanneer je het nodig hebt, dat is een teken van kracht.",
	"Elke dag brengt nieuwe kansen, adem in en begin opnieuw.",
];

export const DAILY_QUOTES_FR = [
	"Vous n'avez pas à tout porter seul.",
	"Prenez bien soin de vous, pour pouvoir prendre soin des autres.",
	"Les petits pas en avant sont aussi des pas.",
	"Demandez de l'aide quand vous en avez besoin, c'est un signe de force.",
	"Chaque jour apporte de nouvelles opportunités, respirez et recommencez.",
];

// Functie die op basis van de datum altijd dezelfde quote geeft voor die specifieke dag
export function getDailyQuote(date: Date, language: string = "nl"): string {
	const quotes = language.startsWith("fr") ? DAILY_QUOTES_FR : DAILY_QUOTES_NL;
	const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
	return quotes[daysSinceEpoch % quotes.length];
}
