# Widgets e elementos dinâmicos que funcionam hoje

Pesquisa do ticket #4 (mapa #1). Dados coletados em 1º de outubro de 2026.

Método: README e issues de cada projeto (via `gh api`), data do último commit no branch padrão, e uma requisição HTTP direta a cada instância pública para ver se ela responde com uma imagem de verdade (não basta o status 200: alguns serviços devolvem um card de erro com status 200, então o texto do SVG também foi conferido).

## Resumo

- O caminho mais confiável hoje é **gerar os SVGs com GitHub Actions e commitar no próprio repositório**. Três dos projetos principais (github-readme-stats e seu sucessor, streak stats, 3D contrib) recomendam isso no próprio README.
- **github-readme-stats (anuraghazra) não é mais mantido.** O README manda migrar para o fork **GitHub Stats Extended** ou para a **GitHub Readme Stats Action**. A instância pública antiga ainda responde, mas a deployment foi pausada várias vezes em 2026 (issue #4867, aberta).
- **Fora do ar agora:** `github-profile-trophy.vercel.app` e `github-readme-activity-graph.vercel.app` retornam `402 Payment required / DEPLOYMENT_DISABLED`.
- Para o tema geo, o melhor candidato é o **github-profile-3d-contrib**: o calendário de contribuições vira um relevo isométrico, tem variante de estações para o **hemisfério sul**, paleta configurável (dá para usar cores hipsométricas) e rótulos traduzíveis.
- Imagens estáticas (typing SVG, ícones, banner) não precisam ficar penduradas num servidor externo: dá para baixar o SVG uma vez e commitar.
- Atenção: em repositório público, **workflows agendados são desativados depois de 60 dias sem atividade** no repositório. Commits feitos pelos próprios workflows contam como atividade, mas eles só commitam quando o SVG muda (ver seção 5).

## 1. Estado de cada serviço

| Serviço | Último commit (branch padrão) | Instância pública em 01/10/2026 | Tem Action? | Veredito |
|---|---|---|---|---|
| [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | 2026-06-30 | 200, card correto | sim (via sucessora) | **Não mantido**, evitar a URL pública |
| [stats-organization/github-stats-extended](https://github.com/stats-organization/github-stats-extended) | 2026-09-28 | 200, card correto | sim | Ativo; sucessor oficial |
| [stats-organization/github-readme-stats-action](https://github.com/stats-organization/github-readme-stats-action) | 2026-09-23 | n/a (roda no Actions) | é a Action | **Recomendado** para stats e linguagens |
| [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) | 2026-09-17 | 200, card correto | sim (`@v1`) | Ativo; usar a Action |
| [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) | 2026-09-17 | 200 | não | Ativo; texto é fixo, dá para commitar o SVG |
| [tandpfun/skill-icons](https://github.com/tandpfun/skill-icons) | 2026-02-27 | 200 | não | Funciona, mas manutenção lenta (1.287 issues abertas, a maioria pedidos de ícone); **não tem QGIS, GDAL nem Claude** |
| [simple-icons](https://github.com/simple-icons/simple-icons) (via shields.io ou jsDelivr) | 2026-09-30 | 200 | n/a | Ativo; **tem** `qgis`, `gdal`, `osgeo`, `openstreetmap`, `leaflet`, `cesium`, `arcgis`, `mapbox`, `dji`, `claude`, `anthropic` |
| [kyechan99/capsule-render](https://github.com/kyechan99/capsule-render) (banner) | 2026-09-18 | 200 | não | Ativo |
| [vn7n24fzkq/github-profile-summary-cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) | 2026-08-07 | 200, card correto | sim | Ativo |
| [ryo-ma/github-profile-trophy](https://github.com/ryo-ma/github-profile-trophy) | 2026-07-25 | **402 DEPLOYMENT_DISABLED** | não | **Fora do ar** (issue #439 desde maio) |
| [Ashutosh00710/github-readme-activity-graph](https://github.com/Ashutosh00710/github-readme-activity-graph) | 2026-05-17 | **402 DEPLOYMENT_DISABLED** | não | **Fora do ar** |
| [lowlighter/metrics](https://github.com/lowlighter/metrics) | **2023-12-18** (última release v3.34, set/2023) | n/a | sim | Parado; só dependabot desde 2023. Evitar |
| [Platane/snk](https://github.com/Platane/snk) | 2026-04-25 (release v3.5.0) | n/a | é a Action | Ativo, 3 issues abertas |
| [yoshi389111/github-profile-3d-contrib](https://github.com/yoshi389111/github-profile-3d-contrib) | 2026-07-24 (release v0.9.3, jun/2026) | n/a | é a Action | Ativo, 8 issues abertas |
| [jamesgeorge007/github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme) | 2026-03-15 | n/a | é a Action | Ativo, simples |

### Histórico de quedas relevantes

- **github-readme-stats**: o README avisa que a instância pública "é best-effort e pode ser instável por causa de rate limits e picos de tráfego" ([#1471](https://github.com/anuraghazra/github-readme-stats/issues/1471)). Em 2026 a deployment foi pausada mais de uma vez: [#4867](https://github.com/anuraghazra/github-readme-stats/issues/4867) ("503 DEPLOYMENT_PAUSED", abril, ainda aberta; cita também #3851, #4737, #4864) e [#4876](https://github.com/anuraghazra/github-readme-stats/issues/4876) (maio).
- **streak stats**: [#872](https://github.com/DenverCoder1/github-readme-streak-stats/issues/872) (fev/2026), "todos os endpoints públicos retornando 403". Já foi resolvida, mas mostra que o `demolab.com` também cai. O typing SVG roda no mesmo domínio.
- **github-profile-trophy**: [#419](https://github.com/ryo-ma/github-profile-trophy/issues/419) (fev/2026, deployment pausada) e [#439](https://github.com/ryo-ma/github-profile-trophy/issues/439) (maio/2026, ainda aberta). Hoje retorna 402.

## 2. Cards de stats, streak e linguagens

### Limites de uso e por que self-host

- A API do GitHub permite 5 mil requisições por hora por token. A instância pública do github-readme-stats compartilha alguns tokens entre todos os usuários, e é por isso que cai ([README, seção "On Vercel"](https://github.com/anuraghazra/github-readme-stats#on-vercel)).
- Cache da instância pública: stats 24 h, linguagens 144 h (6 dias), pin 10 dias. `cache_seconds` aceita de 21.600 a 86.400 s. Para atualizar com mais frequência, só com instância própria (variável `CACHE_SECONDS`).
- O card de linguagens considera só os **primeiros 100 repositórios**.
- Sem token próprio, só entram repositórios públicos.

### Três formas de usar, da mais para a menos confiável

1. **GitHub Action que gera o SVG e commita** (recomendada). Não depende de nenhum servidor externo na hora em que alguém abre o perfil. Usa o `GITHUB_TOKEN` do próprio workflow, então não há rate limit compartilhado. Atualiza uma vez por dia, o que basta para um perfil pessoal.
2. **Instância própria na Vercel** (GitHub Stats Extended ou o projeto antigo). Exige um PAT (classic: `repo` + `read:user`; ou fine-grained só leitura) guardado como variável de ambiente na Vercel. O plano grátis da Vercel funciona, mas é mais uma conta e um token para manter, e as quedas de 2026 foram justamente deployments da Vercel pausadas ou desativadas.
3. **Instância pública** (`github-stats-extended.vercel.app`). Funciona hoje, mas tem o mesmo modelo que já caiu várias vezes no projeto original.

### Instalação: stats + linguagens via Action

Fonte: [README da github-readme-stats-action](https://github.com/stats-organization/github-readme-stats-action).

```yaml
# .github/workflows/cards.yml
name: Atualizar cards
on:
  schedule:
    - cron: "17 6 * * *"   # fora da hora cheia; ver seção 5
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: stats-organization/github-readme-stats-action@v2
        with:
          card: stats
          options: username=${{ github.repository_owner }}&show_icons=true
          path: profile/stats.svg
          token: ${{ secrets.GITHUB_TOKEN }}
          fail_on_error: true
      - uses: stats-organization/github-readme-stats-action@v2
        with:
          card: top-langs
          options: username=${{ github.repository_owner }}&layout=compact&langs_count=6
          path: profile/top-langs.svg
          token: ${{ secrets.GITHUB_TOKEN }}
          fail_on_error: true
      - uses: DenverCoder1/github-readme-streak-stats@v1
        with:
          options: user=${{ github.repository_owner }}&disable_animations=true
          path: profile/streak.svg
      - run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add profile/*.svg
          git commit -m "Atualiza cards" || exit 0
          git push
```

No README: `![Stats](./profile/stats.svg)`.

- `fail_on_error: true` faz o job falhar em vez de commitar o card "Something went wrong" por cima do último card bom. Vale ligar, porque assim o perfil continua mostrando a versão anterior.
- Streak: fonte [README do streak stats, "Option 2: GitHub Actions"](https://github.com/DenverCoder1/github-readme-streak-stats#option-2-github-actions). Sem escopo extra para dados públicos.
- **Manutenção:** quase nenhuma. Atualizar a major da Action quando sair (`@v2` → `@v3`).
- **Risco de quebrar:** baixo. Se a Action quebrar, o README continua mostrando o último SVG commitado.

### Card alternativo: github-profile-summary-cards

Ativo, tem Action própria e gera cards de linguagens por repositório e por commit, além de um gráfico de contribuições. É uma opção caso o visual do stats card não agrade. O risco é o mesmo da opção 1 se usado via Action.

## 3. Typing SVG, ícones de stack e banner

Esses três são **estáticos**: o conteúdo não muda com a atividade. Por isso o mais robusto é gerar a URL, baixar o SVG uma vez e commitar no repositório (`assets/`). Assim nenhum serviço externo precisa estar no ar.

- **Typing SVG** (`readme-typing-svg.demolab.com`): ativo, sem Action. O SVG anima via CSS e funciona como arquivo local. Para self-host o README só documenta PHP no Heroku, que não tem plano grátis. Commitar o arquivo é mais simples.
  Ex.: `https://readme-typing-svg.demolab.com/?lines=Geoprocessamento;LiDAR+e+drones;Ferramentas+para+Claude+Code&font=Fira+Code&center=true&width=420&height=45`
- **Ícones de stack:**
  - `skillicons.dev` é bonito e uniforme, mas **não tem ícone de QGIS, GDAL nem Claude**: para nomes desconhecidos ele devolve um SVG vazio sem erro (testado com `qgis`, `gdal`, `claude` e um nome inventado; os quatro retornam o mesmo SVG de 256 bytes). Serve para `py,ts,docker,postgres,linux,arch,bash,githubactions,pytorch,blender,r`.
  - Para a parte geo e de IA, use badges do **shields.io com ícones do simple-icons**: `https://img.shields.io/badge/QGIS-589632?logo=qgis&logoColor=white` (testado, funciona). Slugs confirmados: `qgis`, `gdal`, `osgeo`, `openstreetmap`, `leaflet`, `cesium`, `arcgis`, `mapbox`, `dji`, `postgresql`, `claude`, `anthropic`. O simple-icons pede que se leia o [aviso legal sobre marcas](https://github.com/simple-icons/simple-icons/blob/develop/DISCLAIMER.md).
  - Combinação sugerida: uma linha de skillicons para as linguagens e uma linha de badges shields para QGIS/GDAL/PostGIS/drone/Claude. Ou tudo em badges, para ficar visualmente coerente.
- **Banner** (`capsule-render.vercel.app`): ativo, responde. Tipos `waving`, `wave`, `cylinder`, etc. O tipo `waving` lembra curvas de nível. Também dá para commitar o SVG.

**Risco de quebrar:** zero se commitado; médio se ficar apontando para a URL externa, já que a hospedagem é de terceiros e grátis.

## 4. Elementos dinâmicos via GitHub Actions

### 4.1 github-profile-3d-contrib: o mais "geo"

Fonte: [README](https://github.com/yoshi389111/github-profile-3d-contrib), [EXAMPLES.md](https://github.com/yoshi389111/github-profile-3d-contrib/blob/main/EXAMPLES.md), [`src/type.ts`](https://github.com/yoshi389111/github-profile-3d-contrib/blob/main/src/type.ts).

O calendário de contribuições vira um **bloco isométrico em 3D**, com a altura de cada dia proporcional às contribuições. Visualmente é um modelo digital de elevação em blocos (um "DEM de commits"), o que conversa direto com LiDAR e relevo. Também traz um radar de tipos de contribuição e uma pizza de linguagens.

- **Variantes prontas:** `green`, `season`, **`south-season`** (estações do hemisfério sul, faz sentido para o Brasil), `night-view`, `night-green`, `night-rainbow`, `gitblock`. Todas existem com e sem animação de crescimento.
- **Personalização** (`SETTING_JSON`): `contribColors` (5 cores, dá para montar uma rampa hipsométrica verde→amarelo→marrom), `backgroundColor`, `radarColor`, `darkMode` separado e `l10n` (rótulos traduzíveis; há `sample-settings/spanish.json` como modelo para PT).
- **Instalação:**

```yaml
# .github/workflows/profile-3d.yml
name: Contribuições 3D
on:
  schedule:
    - cron: "23 6 * * *"   # ~03h23 em Brasília
  workflow_dispatch:
permissions:
  contents: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: yoshi389111/github-profile-3d-contrib@v0.9.3
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          USERNAME: ${{ github.repository_owner }}
          # SETTING_JSON: conf/relevo.json   # paleta hipsométrica + rótulos em PT
      - run: |
          git config user.name github-actions
          git config user.email github-actions@github.com
          git add -A .
          git commit -m "Atualiza contribuições 3D" && git push || true
```

  No README: `![](./profile-3d-contrib/profile-south-season-animate.svg)`. O README oficial usa `@latest`; fixar a tag (`@v0.9.3`) evita surpresa quando sair versão nova.
- **Manutenção:** baixa. Projeto ativo (releases em set/2025, fev/2026 e jun/2026), poucas issues, e as que existem são de configuração, não de queda.
- **Risco de quebrar:** baixo. Depende só da API GraphQL do GitHub com o token do próprio workflow. Se falhar, o SVG anterior continua no repositório.

### 4.2 Platane/snk: a cobrinha

Fonte: [README](https://github.com/Platane/snk), [workflow de exemplo do autor](https://github.com/Platane/Platane/blob/master/.github/workflows/main.yml).

Uma cobra percorre o grid de contribuições e come os quadrados. É o elemento dinâmico mais conhecido em perfis.

- **Instalação:** `Platane/snk/svg-only@v3` (mais rápido que a versão com GIF) gera `dist/*.svg`. O autor publica numa branch `output` com `crazy-max/ghaction-github-pages` e referencia por `raw.githubusercontent.com/<user>/<user>/output/...`. Suporta modo escuro com `<picture>`.
- **Personalização com cara geo:** `color_dots` aceita 5 cores (0 contribuição → máximo). Dá para usar uma rampa tipo NDVI (marrom→verde) e ler o grid como um talhão sendo colhido. A cobra vira a colheitadeira, o que liga o tema ao agro.
- **Manutenção:** baixa. Release v3.5.0 em abril de 2026, 3 issues abertas.
- **Risco de quebrar:** baixo. O autor avisa que não aceita PRs e que mudanças na API "provavelmente não serão aprovadas", então a interface `@v3` tende a ficar estável.
- **Contra:** é o widget mais comum de todos e não tem relação visual com relevo. O 3D contrib conta melhor a história geo.

### 4.3 Atividade recente em texto: jamesgeorge007/github-activity-readme

Fonte: [README](https://github.com/jamesgeorge007/github-activity-readme).

Escreve as últimas N atividades públicas entre os marcadores `<!--START_SECTION:activity-->` e `<!--END_SECTION:activity-->` do `README.md`.

- **Eventos:** só `IssuesEvent`, `IssueCommentEvent`, `PullRequestEvent` e `ReleaseEvent` (filtráveis com `FILTER_EVENTS`). **Commits não aparecem.**
- As mensagens geradas ficam em inglês ("Opened issue…"), o que destoa de um README em PT.
- **Manutenção:** baixa. Último commit em mar/2026. A Action faz um commit vazio quando não há novidade, para manter o workflow vivo depois de 60 dias.
- **Risco:** baixo, mas a Action reescreve o próprio `README.md`. Qualquer edição manual precisa ficar fora dos marcadores.
- **Alternativa:** [gautamkrishnar/blog-post-workflow](https://github.com/gautamkrishnar/blog-post-workflow) (ativo, 0 issues abertas) faz o mesmo a partir de qualquer feed RSS. Serviria para listar posts, releases de um repositório (`/releases.atom`) ou notícias. Um feed de releases das ferramentas para Claude Code, por exemplo.

### 4.4 Opção própria: um workflow que desenha algo geo

Nenhum projeto pronto desenha um mapa ou relevo de verdade. Um workflow próprio pequeno (Python ou Node, sem dependência de terceiros em runtime) poderia gerar um SVG com curvas de nível derivadas das contribuições, ou um hillshade do calendário. É o que mais combina com a história geo, mas o código fica com o dono. Fica registrado como possibilidade para o ticket que decidir o elemento dinâmico; esta pesquisa não avaliou a implementação.

### 4.5 Descartados

- **lowlighter/metrics**: muito completo (tem até calendário isométrico), mas sem commit no branch padrão desde dez/2023 e sem release desde set/2023. Risco alto de quebrar sem correção.
- **github-profile-trophy** e **github-readme-activity-graph**: instâncias públicas desativadas (402) e sem Action.

## 5. Regras do GitHub que afetam qualquer workflow agendado

Fonte: docs do GitHub, [Events that trigger workflows → `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

- **Desativação após 60 dias:** "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days." Os workflows acima só commitam quando o SVG muda (`git commit ... || exit 0`). Em 60 dias sem nenhuma contribuição, o SVG pode ficar idêntico e o agendamento ser desativado (não verifiquei se os geradores embutem data no SVG). Para garantir, dá para fazer um commit vazio periódico, como a activity-readme faz de propósito, ou simplesmente reativar o workflow na aba Actions quando acontecer.
- **Atraso e descarte:** o `schedule` pode atrasar em horário de pico, principalmente na hora cheia, e "some queued jobs may be dropped". Por isso os exemplos acima usam minutos quebrados (`17`, `23`).
- **Intervalo mínimo:** 5 minutos. Para perfil, uma vez por dia basta.
- Os workflows agendados só rodam no **branch padrão**.
- **Imagens externas passam pelo Camo** (proxy do GitHub, [About anonymized URLs](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-anonymized-urls)). Isso adiciona cache e mais um ponto de falha para URLs de terceiros. SVG commitado no próprio repositório não passa por esse caminho.

## 6. Plano de contingência (resposta ao "Not yet specified" do mapa)

1. Tudo que for dinâmico é gerado por Action e commitado em `profile/` ou `profile-3d-contrib/`. Se a Action quebrar, o perfil mostra o último SVG bom (com `fail_on_error: true` onde existir).
2. Tudo que for estático (typing, banner, ícones) fica commitado em `assets/`. Não depende de terceiros.
3. Só os badges do shields.io ficam como URL externa, por conveniência. O shields.io é o serviço mais estável da lista. Se cair, o texto alternativo dos badges aparece.
4. Fixar versões das Actions (`@v2`, `@v1`, `@v3`, `@v0.9.3`) e deixar o Dependabot (`package-ecosystem: github-actions`) abrir PR quando houver versão nova.
5. Não usar `github-readme-stats.vercel.app`, `github-profile-trophy.vercel.app` nem `github-readme-activity-graph.vercel.app`.

## Fontes

- Metadados dos repositórios: `gh api repos/<owner>/<repo>` e `.../commits?per_page=1`, consultados em 2026-10-01.
- Instâncias públicas: `curl` direto em cada URL em 2026-10-01, com status, content-type e texto do SVG conferidos.
- READMEs citados acima, lidos via `gh api repos/<owner>/<repo>/readme`.
- Issues: anuraghazra/github-readme-stats #1471, #4867, #4876; DenverCoder1/github-readme-streak-stats #872; ryo-ma/github-profile-trophy #419, #439.
- GitHub Docs: `content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`, `data/reusables/actions/schedule-delay.md`, `data/reusables/actions/scheduled-workflows-disabled.md` e `content/authentication/keeping-your-account-and-data-secure/about-anonymized-urls.md` no repositório github/docs.
