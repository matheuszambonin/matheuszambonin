# Como manter vivos os workflows agendados

Pesquisa do ticket #8. Dados coletados em 1º de outubro de 2026.

Método: documentação oficial do GitHub (Actions e REST API), discussões em github.com/orgs/community, código-fonte das Actions de keepalive (lidas via `gh api` ou, quando o repositório original está bloqueado, por um espelho) e uma checagem empírica em repositórios públicos que só recebem commits de bots, consultando o estado dos workflows pela API.

## Resumo

- **Sim, na prática um commit feito por uma Action com `GITHUB_TOKEN` conta como atividade.** A documentação não define "atividade", mas há evidência forte: um repositório público que só recebe commits feitos com `GITHUB_TOKEN` desde fevereiro de 2024 continua com o workflow agendado `active` (seção 3), e a Keepalive Workflow v1 funcionou durante anos fazendo exatamente isso, com `github.token` como padrão.
- O que conta é **commit**. Criar tag ou release não conta, e execuções agendadas sem commit também não.
- Para este repositório, **a própria rotação semanal da citação já mantém tudo vivo**, desde que ela sempre gere um commit. O risco real é o workflow da citação parar de commitar (falha, lista com uma citação só, `|| exit 0` sem diff). Os workflows de SVG só commitam quando o SVG muda, então não dá para contar com eles.
- **Recomendação:** garantir que o workflow da citação sempre commite e, como cinto de segurança, acrescentar nele um job que chama `PUT /repos/{owner}/{repo}/actions/workflows/{id}/enable` para cada workflow agendado, com `permissions: actions: write`. Não precisa de PAT.
- **Evite a `gautamkrishnar/keepalive-workflow`:** o repositório foi bloqueado pelo GitHub por violação dos Termos de Serviço em 21/04/2025. Quem referencia `@v2` hoje recebe erro ao baixar a Action.

## 1. O que a documentação diz

A frase oficial, igual na página de eventos e na de habilitar/desabilitar workflows:

> "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days."
> ([Events that trigger workflows, `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule); [Disabling and enabling a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows))

A documentação **não define "repository activity"** e não diz se commits de bot contam. Outros pontos oficiais relevantes:

- Para reativar um workflow desativado: botão "Enable workflow" na aba Actions, `gh workflow enable WORKFLOW` ou a API REST ([mesma página](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)).
- "For a deactivated scheduled workflow, if a user with `write` permissions to the repository makes a commit that changes the `cron` schedule on the workflow, the workflow will be reactivated" ([eventos, `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)). Ou seja: **um commit comum não reativa um workflow já desativado**; só um commit que muda o `cron` ou a reativação explícita. Por isso o que importa é prevenir.
- O endpoint [Enable a workflow](https://docs.github.com/en/rest/actions/workflows#enable-a-workflow) "Enables a workflow and sets the state of the workflow to active". O campo `state` de um workflow pode ser `active`, `deleted`, `disabled_fork`, `disabled_inactivity` ou `disabled_manually`. O valor `disabled_inactivity` é o que aparece quando o problema acontece.
- Eventos gerados com `GITHUB_TOKEN` não disparam novos workflows (exceto `workflow_dispatch` e `repository_dispatch`) ([eventos](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). Isso é sobre disparar workflows, não sobre contar como atividade. Os dois assuntos costumam ser confundidos.

## 2. O que a comunidade observa

- [Discussion #57858](https://github.com/orgs/community/discussions/57858) (jun/2023): o autor relata que "currently only new commits qualify as 'activity'" e que criar tags de release não impediu a desativação. Nenhuma resposta da equipe do GitHub.
- [Discussion #181236](https://github.com/orgs/community/discussions/181236) (dez/2025): a resposta aceita fala em "recent activity (commits, pushes)", sem distinguir autor humano de bot.
- [Discussion #32197](https://github.com/orgs/community/discussions/32197): a desativação por inatividade desliga **todos os gatilhos do workflow**, não só o `schedule` (no relato, `pull_request` também parou). E um push depois da desativação não reativou.
- O próprio autor da Keepalive Workflow descreve a regra como "if there is no commit in the repository for the past 60 days" ([post no DEV, set/2021](https://dev.to/gautamkrishnar/how-to-prevent-github-from-suspending-your-cronjob-based-triggers-knf)).

Nenhuma fonte oficial confirma nem nega que commits de bot contam. Por isso fiz a checagem da seção 3.

## 3. Evidência empírica: commits com `GITHUB_TOKEN` contam

**[simonw/pge-outages](https://github.com/simonw/pge-outages)**, consultado pela API em 01/10/2026:

- Workflow `fetch.yml` com `schedule` a cada 10 minutos, `permissions: contents: write`, commit feito com `git config user.name "Automated"` e `git push` usando a credencial que o `actions/checkout` grava, ou seja, o `GITHUB_TOKEN`. Não há PAT.
- Último commit do dono (`author=simonw`): **06/02/2024**. Desde então só há commits do bot (o último foi em 01/10/2026).
- Estado do workflow: **`active`**, mais de dois anos e meio depois do último commit humano.

**Contraexemplo coerente: [simonw/ca-fires-history](https://github.com/simonw/ca-fires-history).** Mesmo padrão (`git commit ... || exit 0`). Os dados pararam de mudar, o último commit do bot é de 28/07/2024 e o workflow está **`disabled_inactivity`**. O relógio de 60 dias conta a partir do último commit, de qualquer autor. Execução agendada sem commit não renova nada.

Mais duas evidências indiretas:

- A Keepalive Workflow v1 (2021 a 2024) fazia commits vazios com `gh_token`, que por padrão é `${{ github.token }}` ([action.yml no espelho](https://gitea.com/sekedus/keepalive-workflow)). Era a Action mais usada para isso e funcionava.
- A [github-activity-readme](https://github.com/jamesgeorge007/github-activity-readme) faz `git commit --allow-empty` quando o último commit tem mais de 50 dias, justamente para manter o workflow vivo (função `createEmptyCommit` em `index.js`).

## 4. As opções

### 4.1 Commit periódico com `GITHUB_TOKEN` (o que o repositório já vai ter)

O workflow da citação roda toda semana e troca o texto do README, então commita toda semana. Isso basta, com duas condições:

1. O commit tem que acontecer sempre. Se o script sortear a mesma citação da semana anterior, ou se o passo de commit usar `|| exit 0` e não houver diff, aquela semana não conta. Rotação determinística (por exemplo, índice = número da semana mod tamanho da lista) evita isso.
2. O workflow não pode ficar quebrado por muito tempo. Se ele falhar por oito semanas seguidas, todos os agendamentos do repositório param.

Sobre os Termos: commits automáticos que fazem parte do projeto (atualizar o README) são o uso normal de Actions. O alerta que circula vem do autor da Keepalive Workflow, que em 24/04/2025 escreveu "performing automated commits may also breach their Terms of Service" ([comentários do post no DEV](https://dev.to/gautamkrishnar/how-to-prevent-github-from-suspending-your-cronjob-based-triggers-knf)). Os [termos de Actions](https://docs.github.com/en/site-policy/github-terms/github-terms-for-additional-products-and-features) proíbem, entre outras coisas, atividade que gere "a burden on our servers [...] disproportionate to the benefits provided to users" e, em runners hospedados, "any other activity unrelated to the production, testing, deployment, or publication of the software project". Um commit semanal que publica conteúdo do próprio README não se encaixa em nenhuma das duas.

### 4.2 Chamar a API `enable` (recomendado como reforço)

`PUT /repos/{owner}/{repo}/actions/workflows/{workflow_id}/enable` em um workflow que já está ativo. É o que fazem a [liskin/gh-workflow-keepalive](https://github.com/liskin/gh-workflow-keepalive) e a Keepalive Workflow v2: "it uses GitHub API to preemptively re-enable the workflow, thus preventing it from being automatically disabled". Não gera commit nem polui o histórico.

Ressalva: **a documentação não diz que chamar `enable` num workflow ativo zera o contador de 60 dias.** Isso vem da prática dessas duas Actions, que dependem desse comportamento desde 2024 (a liskin/gh-workflow-keepalive tem 3 issues, todas fechadas, nenhuma relatando falha). Por isso trato como reforço, não como mecanismo principal.

Permissão necessária: `actions: write` no `GITHUB_TOKEN` (a v2 da Keepalive mudou de `contents: write` para `actions: write` exatamente por isso). Com PAT clássico, o escopo seria `repo`. Não precisa de PAT.

A liskin/gh-workflow-keepalive é só um passo composto com `gh api -X PUT .../enable`, e só reativa **o workflow em que ela roda**. Para cobrir vários workflows a partir de um só, é mais simples chamar o `gh` direto:

```yaml
# .github/workflows/citacao.yml (trecho)
on:
  schedule:
    - cron: "0 9 * * 1"   # toda segunda
  workflow_dispatch:

jobs:
  citacao:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      # ... troca a citação e commita (sempre gerando diff)

  keepalive:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    permissions:
      actions: write
    env:
      GH_TOKEN: ${{ github.token }}
    steps:
      - run: |
          for wf in citacao.yml metricas.yml contrib-3d.yml streak.yml; do
            gh api -X PUT "repos/${GITHUB_REPOSITORY}/actions/workflows/${wf}/enable"
          done
```

Os nomes dos arquivos acima são exemplos; troque pelos reais. Se preferir a Action pronta, coloque `uses: liskin/gh-workflow-keepalive@v1` (fixe pelo SHA) num job com `permissions: actions: write` dentro de **cada** workflow agendado.

### 4.3 PAT

Não resolve nada aqui. O commit com `GITHUB_TOKEN` já conta como atividade. Um PAT só mudaria uma coisa, que o push dispararia outros workflows, e isso não é necessário. Além disso, vira um segredo de longa duração para guardar e renovar.

### 4.4 `workflow_dispatch` via API

Não serve como keepalive. Uma execução de workflow sem commit não renova o relógio, como mostra o ca-fires-history, que rodava a cada poucos minutos e mesmo assim foi desativado. E a [#32197](https://github.com/orgs/community/discussions/32197) indica que um workflow desativado também para de responder aos outros gatilhos.

### 4.5 Outras Actions de keepalive

| Action | Situação em 01/10/2026 | Método |
|---|---|---|
| `gautamkrishnar/keepalive-workflow` | **Bloqueada pelo GitHub** ("Repository access blocked", motivo `tos`, 21/04/2025). Espelho em [gitea.com/sekedus/keepalive-workflow](https://gitea.com/sekedus/keepalive-workflow) | v1: commit vazio; v2 (mar/2024 em diante): API `enable` por padrão, `use_api: false` volta ao commit |
| `liskin/gh-workflow-keepalive` | Ativa, v1.2.1, último push em ago/2025 | API `enable`, só o próprio workflow |
| `entrostat/git-keepalive` | **Não existe mais** (a API retorna 404) | n/a |

O GitHub não publicou o motivo do bloqueio da keepalive-workflow. Na época do bloqueio a v2 já usava a API por padrão, então não dá para concluir que o problema era o commit vazio. O efeito prático é que todo workflow com `uses: gautamkrishnar/keepalive-workflow@...` quebra.

## 5. Ressalvas

- **Branch padrão.** Agendamentos rodam no último commit do branch padrão, e hoje o padrão deste repositório é `research/widgets-perfil`. Quando os workflows forem criados, o branch padrão precisa ser o que contém os arquivos em `.github/workflows/` e recebe os commits dos bots. Não verifiquei se commits em outros branches contam como atividade.
- **Se desativar mesmo assim:** um push comum não reativa. É preciso `gh workflow enable <arquivo>`, o botão na aba Actions ou um commit que mude o `cron`.
- **Notificações:** "Notifications for scheduled workflows are sent to the user who last modified the cron syntax in the workflow file" ([eventos, `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)). Vale deixar ativadas as notificações de falha do Actions para perceber cedo se a rotação da citação quebrar.
- A regra dos 60 dias está documentada só para repositórios públicos. Este é público, então se aplica.
