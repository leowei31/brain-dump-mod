# brain-dump

A Claude Code mod that turns a rambling voice brain dump into a clean, structured prompt.

You dictate with your own voice tool.
The mod wraps what you said so that Claude does not start the task right away.
Claude first asks a short batch of clarifying questions.
After you answer, it rewrites everything into one prompt with these sections: Role, Context, Task, Inputs, Constraints, Steps, Output format, Success criteria, Assumptions.
It only runs the prompt after you say go.

## Install

```
/plugin install brain-dump --marketplace leowei31/brain-dump-mod
```

Then start a new session.

## Use

- `/dump` arms your next prompt as a brain dump.
- `dump: <text>` at the start of any prompt treats just that prompt as a brain dump.
- `/dump on` treats every prompt as a brain dump, and `/dump off` stops that.
- `/dump <text>` submits the text directly as a brain dump.

The status line shows `brain-dump: armed` or `brain-dump: always` while a mode is active.

## Notes

The mod does not record audio.
It works on whatever your dictation tool types into the prompt box.
It needs a Claude Code build that supports mods.
Mode state lives in memory and resets when the mod reloads.

To change the question style or the prompt framework, edit the `wrap` text in `brain-dump/hooks/register.tsx`.
