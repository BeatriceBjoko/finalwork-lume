/**
 * Builds the public legal web pages from the same texts the app shows (locales/*.json → "legal"),
 * so the app and the website can never say something different.
 *
 *   node scripts/build-legal-site.js        → hosting/public/ (generated, not committed)
 *
 * Runs automatically before `firebase deploy --only hosting` (predeploy in firebase.json).
 * Pages: /privacy, /terms, /delete-account (Dutch) and /fr/privacy, /fr/terms, /fr/delete-account.
 * The pages load nothing from other websites (no fonts, scripts or trackers).
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "hosting", "public");

// Version, date and contact e-mail come from the app's own constants
const constants = fs.readFileSync(path.join(ROOT, "constants", "legal.ts"), "utf8");
const constant = (name) => constants.match(new RegExp(`${name} = "([^"]+)"`))[1];
const VERSION = constant("LEGAL_VERSION");
const UPDATED = constant("LEGAL_UPDATED");
const EMAIL = constant("CONTACT_EMAIL");

const LANGS = {
	nl: { prefix: "", locale: "nl-BE", other: "fr", otherLabel: "Français" },
	fr: { prefix: "/fr", locale: "fr-BE", other: "nl", otherLabel: "Nederlands" },
};
const PAGES = [
	{ slug: "privacy", titleKey: "privacyTitle", contentKey: "privacyContent" },
	{ slug: "terms", titleKey: "termsTitle", contentKey: "termsContent" },
	{ slug: "delete-account", titleKey: "deletionTitle", contentKey: "deletionContent" },
];

const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// E-mail addresses and www. addresses become links
function linkify(html) {
	return html
		.replace(/[\w.+-]+@[\w-]+\.[\w.]+[a-z]/gi, (email) => `<a href="mailto:${email}">${email}</a>`)
		.replace(/\bwww\.[\w-]+\.[a-z]{2,}/gi, (site) => `<a href="https://${site}" rel="noopener">${site}</a>`);
}

// A text block: lines starting with "• " become a list, other lines a paragraph
function renderBlock({ type, text }) {
	if (type === "subtitle") return `<h2>${escapeHtml(text)}</h2>`;
	if (type === "highlight") return `<p class="highlight">${linkify(escapeHtml(text))}</p>`;

	const html = [];
	for (const paragraph of text.split("\n\n")) {
		let lines = [];
		let bullets = [];
		const flush = () => {
			if (lines.length) html.push(`<p>${lines.map((l) => linkify(escapeHtml(l))).join("<br>")}</p>`);
			if (bullets.length) html.push(`<ul>${bullets.map((l) => `<li>${linkify(escapeHtml(l))}</li>`).join("")}</ul>`);
			lines = [];
			bullets = [];
		};
		for (const line of paragraph.split("\n")) {
			if (line.startsWith("• ")) {
				if (lines.length) flush();
				bullets.push(line.slice(2));
			} else {
				if (bullets.length) flush();
				lines.push(line);
			}
		}
		flush();
	}
	return html.join("\n");
}

function page({ lang, slug, title, content, legal }) {
	const { prefix, locale, other, otherLabel } = LANGS[lang];
	const [y, m, d] = UPDATED.split("-").map(Number);
	const date = new Date(y, m - 1, d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
	const versionLine = legal.updated.replace("{{version}}", VERSION).replace("{{date}}", date);
	const nav = PAGES.map((p) => {
		const current = p.slug === slug ? ' aria-current="page"' : "";
		return `<a href="${prefix}/${p.slug}"${current}>${escapeHtml(legal[p.titleKey])}</a>`;
	}).join("\n\t\t\t");

	return `<!doctype html>
<html lang="${lang}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${escapeHtml(title)} · Lume</title>
	<meta name="description" content="${escapeHtml(title)} · Lume">
	<link rel="stylesheet" href="/style.css">
	<link rel="alternate" hreflang="${other}" href="${LANGS[other].prefix}/${slug}">
</head>
<body>
	<header>
		<a class="logo" href="${prefix}/privacy"><span>Lume</span></a>
		<a class="lang" href="${LANGS[other].prefix}/${slug}" hreflang="${other}" lang="${other}">${otherLabel}</a>
	</header>
	<main>
		<nav>
			${nav}
		</nav>
		<h1>${escapeHtml(title)}</h1>
		<p class="version">${escapeHtml(versionLine)}</p>
		${content.map(renderBlock).join("\n\t\t")}
		<p class="contact"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
	</main>
	<footer>Lume · Beatrice Bjoko · ${y}</footer>
</body>
</html>
`;
}

const CSS = `:root { --primary: #233600; --accent: #FEF970; --background: #FDFBF7; --muted: rgba(35, 54, 0, 0.65); --line: rgba(35, 54, 0, 0.12); }
* { box-sizing: border-box; }
body { margin: 0; background: var(--background); color: var(--primary); font: 16px/1.6 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
header, main, footer { max-width: 760px; margin: 0 auto; padding: 0 20px; }
header { display: flex; justify-content: space-between; align-items: center; padding-top: 24px; padding-bottom: 8px; }
.logo { text-decoration: none; color: var(--primary); font-size: 26px; font-weight: 800; letter-spacing: 0.5px; }
.logo span { background: var(--accent); border-radius: 20px; padding: 2px 14px; }
.lang { color: var(--primary); font-weight: 600; font-size: 14px; }
nav { display: flex; flex-wrap: wrap; gap: 8px; margin: 24px 0 8px; }
nav a { color: var(--primary); text-decoration: none; font-size: 14px; border: 1px solid var(--line); border-radius: 20px; padding: 6px 14px; }
nav a[aria-current="page"] { background: var(--primary); color: #fff; border-color: var(--primary); }
h1 { font-size: 32px; line-height: 1.2; margin: 28px 0 4px; }
h2 { font-size: 19px; margin: 32px 0 8px; }
.version { color: var(--muted); font-size: 14px; margin-top: 0; }
.highlight { background: rgba(254, 249, 112, 0.45); border-left: 4px solid var(--primary); border-radius: 8px; padding: 12px 16px; font-weight: 600; }
ul { padding-left: 22px; }
li { margin-bottom: 6px; }
a { color: var(--primary); }
.contact { margin-top: 40px; }
.contact a { display: inline-block; border: 1px solid var(--line); border-radius: 20px; padding: 10px 16px; font-weight: 600; text-decoration: none; }
footer { color: var(--muted); font-size: 13px; padding-top: 40px; padding-bottom: 40px; }
`;

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "fr"), { recursive: true });
fs.writeFileSync(path.join(OUT, "style.css"), CSS);

for (const lang of Object.keys(LANGS)) {
	const { legal } = JSON.parse(fs.readFileSync(path.join(ROOT, "locales", `${lang}.json`), "utf8"));
	for (const p of PAGES) {
		const file = path.join(OUT, LANGS[lang].prefix, `${p.slug}.html`);
		fs.writeFileSync(file, page({ lang, slug: p.slug, title: legal[p.titleKey], content: legal[p.contentKey], legal }));
		console.log("  " + path.relative(ROOT, file));
	}
}
// The home page of the site is the privacy policy
fs.copyFileSync(path.join(OUT, "privacy.html"), path.join(OUT, "index.html"));
console.log(`Legal pages built (version ${VERSION}, ${UPDATED})`);
