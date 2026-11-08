---
name: learn-profile
description: >
  Interview the learner and write .alvar/LEARNER.md so one teacher can fit
  one mind — goal, pace, voice, solid ground, how they want to struggle, and
  what they want in the material. Use when the user runs /learn-profile or
  /skill:learn-profile, or says how I learn, learning philosophy, teaching
  style, set up tutoring, or install my learning preferences.
license: MIT
metadata:
  author: vasanthsreeram
  version: "2.0"
  source: "Eero Alvar — How I Use AI to Learn Things https://youtu.be/kzcI5F4tGiU"
---

# Learn profile

Install **how this mind wants to be taught**. The file is the teacher. Do not cram style rules into every later prompt.

LEARNER.md holds **preferences and their reasons**. The exact syntax of lesson files lives in the plugin (`alvar.mjs format`); never copy it into LEARNER.md.

## Interview

Fill every `<...>` in [assets/LEARNER.md](assets/LEARNER.md). Sections marked "(method default)" are the Alvar method itself: do not interview them one by one, only confirm them in round 7.

One round per turn, through AskUserQuestion: multiSelect false (except where noted), no "(Recommended)", options that stand on their own. The learner can always type their own answer under "Other"; prefer their words over your option labels when writing. If an answer is unclear, ask a short follow-up before moving on. Never ask all rounds at once.

1. **Who and goal.** Role and level. Main goal: what "done" looks like (deep mastery of courses, research or PhD, a specific exam, a professional skill). Which fields their sessions are mostly in, noting that sessions can open in any field.
2. **Solid ground and pace.** Is anything already held thoroughly, or should nothing be assumed until proven in a map? Pace stays one reasoning step per turn; ask only whether light nodes may be batched (2-3 at a time, quizzes still per node).
3. **How understanding locks, and struggle.** What makes a concept click for them: the precise statement, a concrete example, the reasons and how steps connect, or doing it themselves. How much struggle they want before a hint. Which exercise types they want (multiSelect true).
4. **Language and voice.** Language of the material (written to `language` in the frontmatter), and whether technical terms get an English equivalent at first use. Tone: for example a lecturer whose content is textbook-precise but whose explanation is relaxed and detailed, a neutral textbook voice, or compact and dense. LLM habits they dislike.
5. **Where they read.** Where they read the material: Obsidian, a Markdown editor, or chat (written to `reader`: `obsidian`, `editor`, or `chat`). Whether their chat or terminal renders LaTeX (written to `chat_math`: `latex`, or `ascii` if not; with `ascii`, the CLI converts math to ASCII in chat and quiz popups). If they do not know, show `$x^2$` in chat and ask whether it looks typeset.
6. **What goes in the material.** Length of the simple version at the end of each subsection (short 3-5 sentences, long, or none). Mermaid diagrams automatically for relational structure, or only on request. SVG pictures only on request, or whenever they help (written to `figures`: `on_request` or `when_helpful`; the hook enforces it). Code snippets and optional exercises: keep or leave out.
7. **Method and references.** Summarize the method defaults in a few lines (rigor in every field, mastery needs transfer evidence, errors are diagnosed at the reasoning step, clarification before the quiz, the struggle policy) and ask whether to keep them or adjust something. Ask for the books or sources they own (titles are enough), or "none yet".

When the learner is unsure, offer the default from the template, say it can be changed later, and move on. Do not stall.

## Write

Create `.alvar/LEARNER.md` from the template: replace each `<...>` with their answer, drop the alternatives they did not choose, and remove the HTML comment. The frontmatter values must be exactly one of the listed options (the CLI reads them); a missing value falls back to `Indonesian`, `ascii`, `obsidian`, `on_request`. Keep "(method default)" sections, adjusted only where they asked. Do not invent hobbies, a persona, or preferences they did not state.

If a file already exists: map its content onto the template sections first, ask only about the gaps and contradictions, then show a diff of the proposed edits and wait for approval. Back up the old file as `.alvar/LEARNER.old.md` before overwriting.

## After

Show the file. Tell them `teach` reads it every session and that preferences can be changed any time by running this skill again. Offer to start a probe on the current goal.
