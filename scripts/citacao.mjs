// Troca a citação do rodapé do README pela citação da semana.
// O índice é determinístico (semanas desde a época, módulo o tamanho da lista), então a
// citação sempre muda de uma semana para a outra. O commit semanal mantém vivos os
// workflows agendados (ver pesquisa/workflows-agendados.md no branch research/workflows-agendados).
import { readFileSync, writeFileSync } from 'node:fs';

const README = 'README.md';
const INICIO = '<!-- CITACAO:INICIO -->';
const FIM = '<!-- CITACAO:FIM -->';
const SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

const citacoes = JSON.parse(readFileSync('citacoes/citacoes.json', 'utf8'));
if (citacoes.length < 2) throw new Error('A lista precisa de pelo menos duas citações para sempre gerar diff.');

const semana = Number(process.env.SEMANA ?? Math.floor(Date.now() / SEMANA_MS));
const { texto, fonte } = citacoes[semana % citacoes.length];

const readme = readFileSync(README, 'utf8');
const i = readme.indexOf(INICIO), f = readme.indexOf(FIM);
if (i < 0 || f < i) throw new Error(`Marcadores ${INICIO} / ${FIM} não encontrados no ${README}.`);

const bloco = `${INICIO}\n> ${texto}\n>\n> <sub>${fonte}</sub>\n${FIM}`;
writeFileSync(README, readme.slice(0, i) + bloco + readme.slice(f + FIM.length));
console.log(`Semana ${semana}: ${fonte}`);
