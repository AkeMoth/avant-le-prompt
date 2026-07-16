#!/usr/bin/env node
/* Génère trame.html, la trame finale autonome pour le jour de l'enregistrement.
 *
 * index.html reste la source de vérité : le contenu (TRAME, SVGS, angles) et le
 * style sont recopiés tels quels, jamais dupliqués à la main. Après toute retouche
 * de la trame dans l'app, relancer :  node build-trame.js
 *
 * Ce qui est propre à l'export vit dans trame.src.js et trame.src.css.
 */
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const SRC = path.join(DIR, "index.html");
const OUT = path.join(DIR, "trame.html");

const src = fs.readFileSync(SRC, "utf8");
const lines = src.split("\n");

/* Les blocs se repèrent aux déclarations en colonne 0 : à l'intérieur des
   données tout est indenté, donc aucune chance de couper un bloc en deux. */
const DECL = /^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/;
const decls = [];
lines.forEach((l, i) => {
  const m = l.match(DECL);
  if (m) decls.push({ name: m[1], i });
});

function block(name) {
  const k = decls.findIndex(d => d.name === name);
  if (k < 0) throw new Error(`Bloc introuvable dans index.html : ${name}`);
  const start = decls[k].i;
  let end = k + 1 < decls.length ? decls[k + 1].i : lines.length;
  // On rend la ligne du bloc suivant, pas les blancs ni les commentaires qui l'annoncent.
  while (end > start + 1) {
    const prev = lines[end - 1].trim();
    if (prev === "" || /^\/\*[\s\S]*\*\/$/.test(prev)) end--;
    else break;
  }
  return lines.slice(start, end).join("\n");
}

function one(re, label) {
  const m = src.match(re);
  if (!m) throw new Error(`Introuvable dans index.html : ${label}`);
  return m[1];
}

const STYLE = one(/<style>\n([\s\S]*?)\n<\/style>/, "bloc <style>");
const FONTS = one(/(<link href="https:\/\/fonts\.googleapis\.com[^>]*>)/, "lien des polices");

/* CH et EPI pour les angles, INTRU pour le teaser sécurité du mot de la fin. */
const DATA = ["CH", "TRAME", "INTRU", "SVGS", "EPI"].map(block).join("\n");
const TOASTS = ["tq", "toast", "nextToast"].map(block).join("\n");
const LOGIC = fs.readFileSync(path.join(DIR, "trame.src.js"), "utf8");
const CSS = fs.readFileSync(path.join(DIR, "trame.src.css"), "utf8");

/* Une chaîne "</script" fermerait la balise par accident. L'échapper est sans
   effet sur le sens du code (\/ vaut / en JS), que ce soit dans une chaîne,
   une regex ou un commentaire. */
const js = [DATA, TOASTS, LOGIC].join("\n\n").split("</script").join("<\\/script");

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Trame · Le cycle de vie d'un logiciel · Le Dernier Clic</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
${FONTS}
<style>
${STYLE}
${CSS}</style>
</head>
<!-- Fichier généré par build-trame.js. Ne pas modifier à la main : éditer
     index.html (contenu) ou trame.src.js / trame.src.css (export), puis relancer. -->
<body class="designed anim" data-view="trame">
<div id="scroller">
<header>
  <div class="wrap">
    <div class="hrow">
      <h1>Trame de l'épisode</h1>
      <div class="chips"><span class="chip">59 min</span><span class="chip prod">FINALE</span></div>
    </div>
    <div class="baseline">Le cycle de vie d'un logiciel · Le Dernier Clic</div>
  </div>
</header>
<main><div class="wrap" id="app"></div></main>
</div>
<div id="toasts" role="status" aria-live="polite"></div>
<script>
${js}
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
console.log(`trame.html généré : ${kb} Ko, ${html.split("\n").length} lignes.`);
