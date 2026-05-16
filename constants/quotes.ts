export const DAILY_QUOTES = [
	"Je hoeft het niet allemaal alleen te dragen.",
	"Zorg goed voor jezelf, zodat je voor anderen kunt zorgen.",
	"Kleine stapjes vooruit zijn ook stappen.",
	"Vraag om hulp wanneer je het nodig hebt, dat is een teken van kracht.",
	"Elke dag brengt nieuwe kansen, adem in en begin opnieuw.",
];

// Functie die op basis van de datum altijd dezelfde quote geeft voor die specifieke dag
export function getDailyQuote(date: Date): string {
	const daysSinceEpoch = Math.floor(date.getTime() / (1000 * 60 * 60 * 24));
	return DAILY_QUOTES[daysSinceEpoch % DAILY_QUOTES.length];
}
