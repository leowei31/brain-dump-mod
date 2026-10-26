import type { Register } from 'claude-code'

type Mode = 'off' | 'next' | 'always'

const PREFIX = /^\s*dump\s*:\s*/i

const USER_ORIGINS = ['composer', 'sdk', 'bridge', 'unclassified']

const statusFor = (mode: Mode) =>
  mode === 'off' ? undefined : mode === 'always' ? 'brain-dump: always' : 'brain-dump: armed'

const wrap = (raw: string) => `You are a prompt-engineering partner. The text in <brain_dump> is a raw voice transcript, so expect filler words, false starts, repetition, mis-heard words and jumping between topics. Do NOT carry out the task yet. Work in three phases.

PHASE 1 - Understand
Silently extract: the real goal, the deliverable, any context, constraints and preferences stated, and what is ambiguous or missing. Where the transcript looks mis-heard (names, technical terms), read the project for the likely correct term before asking.

PHASE 2 - Clarify
Use the AskUserQuestion tool to ask the 3 to 6 questions whose answers would most change the final prompt. Batch them in one call. Offer concrete options with your recommended one first. Skip anything you can infer or look up in the codebase. Ask nothing the dump already answered.

PHASE 3 - Rewrite
After I answer, produce one final prompt in a fenced block using this framework, omitting sections that do not apply:
- Role: who the model should act as
- Context: background, project facts, why this matters
- Task: the goal in one or two precise sentences
- Inputs: files, data and links to use
- Constraints: must / must not, style, scope limits, tools allowed
- Steps: the approach, only if order matters
- Output format: exactly what to return and how
- Success criteria: how to tell it is done and correct
- Assumptions: anything you decided without confirmation, flagged for me to veto

Write it in clear, direct, specific language, in my voice, with no filler. Then ask whether to run it, edit it, or save it. Only execute after I say go.

<brain_dump>
${raw.trim()}
</brain_dump>`

export const register: Register = on => {
  let mode: Mode = 'off'
  let isRegistered = false

  on('session.start', async ($, e, next) => {
    if (!isRegistered) {
      isRegistered = true
      await $.command.register({
        name: 'dump',
        description: 'Brain dump mode: clarify, then rewrite as a structured prompt',
        argumentHint: '[on | off]',
      })
    }

    return next(e)
  })

  // A mod enabled mid-session never sees session.start, so register on first draw too.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!isRegistered) {
      isRegistered = true
      await $.command.register({
        name: 'dump',
        description: 'Brain dump mode: clarify, then rewrite as a structured prompt',
        argumentHint: '[on | off]',
      })
    }

    return next(e)
  })

  on('command.run', { command: 'dump' }, async ($, e) => {
    const arg = e.args.trim()

    if (arg === 'off') {
      mode = 'off'
      $.ui.status(statusFor(mode))

      return { text: 'Brain dump mode off.' }
    }

    if (arg === 'on' || arg === 'always') {
      mode = 'always'
      $.ui.status(statusFor(mode))

      return { text: 'Brain dump mode on: every prompt is clarified and rewritten. /dump off to stop.' }
    }

    if (arg === '') {
      mode = 'next'
      $.ui.status(statusFor(mode))

      return { text: 'Armed: your next prompt (dictate it now) is treated as a brain dump.' }
    }

    return { text: 'To dump in one message, start it with "dump:". Or run /dump, then send your message.' }
  })

  on('prompt.submit', async ($, e, next) => {
    // The desktop app delivers the person's text as sdk, bridge or unclassified, not only composer.
    const kind = e.origin?.kind
    const isUser = kind === undefined || USER_ORIGINS.includes(kind)
    if (e.command || e.isMeta || !isUser) {
      return next(e)
    }

    const hasPrefix = PREFIX.test(e.text)
    if (mode === 'off' && !hasPrefix) {
      return next(e)
    }

    const raw = e.text.replace(PREFIX, '')
    if (mode === 'next') {
      mode = 'off'
      $.ui.status(statusFor(mode))
    }

    return next({ ...e, text: wrap(raw) })
  })
}
