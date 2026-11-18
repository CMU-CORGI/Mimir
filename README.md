<p align="center"><img src="assets/mimir-logo.svg" width="96" alt="Mímir logo: a bearded head above a well"></p>

# Mímir

Mímir reviews a paper draft by voice. You open the student's PDF, point at a passage with the cursor or a selection, and talk. Claude turns what you say into comments anchored to the passages you meant, edits or moves them when you ask, answers questions about the paper, and writes the review summary from your comments.

It is named for the Norse god whose severed head Odin kept so he could ask it for counsel.

## Starting a review

Each review is its own private claude.ai artifact, holding one paper's PDF, comments, summary and your conversation with Claude. To start one, run this in Claude Code from this repo:

```
/new-review Fenrir draft from Alice
```

Claude publishes a fresh copy of the app and gives you the link. Open it and drop in the PDF.

The `new-review` skill also upgrades an existing review to the current app: give it the review's link instead. The review's data stays.

## Using a review

- **Talk.** Click *Start talking*, point, and speak. What you say is sent after a pause (2–8 s, your choice). You can also type.
- **Point.** A selection is the strongest signal of what you mean, then the words the cursor rests on while you talk.
- **Models.** Comments use *Balanced* (Sonnet 5.5) by default; the summary uses *Best* (Opus 5.5). Each picker shows the model, and your choice is remembered per browser. If your plan lacks a model, its tier answers and the summary says which ran.
- **Update PDF.** When the student sends a revision, *Update PDF* replaces the paper and moves every comment onto the new version (see below). It asks first, because the old PDF can't be restored.
- **Share.** The Share menu on the artifact controls who can open it. Viewers see the paper, the comments and the summary, but can't edit or call Claude; Editors can do everything you can. Sharing outside the organization depends on the organization's settings.

## How comments follow a revised PDF

A comment covers a run of words in the PDF. On *Update PDF*, Mímir aligns the words of the old and new versions with a patience diff (`app/anchor.js`) and maps each comment's words through the alignment:

- Words that survived unchanged keep their comment, wherever they moved on the page or to another page.
- Words that were reworded carry the comment to their replacement. The comment is flagged *Passage revised* and shows what the passage originally said.
- Words that were deleted leave the comment at the spot where they were, flagged *Passage deleted*.
- A passage of 20 or more characters that reappears verbatim elsewhere counts as moved, not deleted.
- A comment on a figure follows the nearest word and keeps its offset from it.

Flags survive later updates until you dismiss them, so after several revisions a flag still shows the text you originally commented on. Claude sees the flags too, so you can ask "which of my comments did the student address?"

## Development

The app is one page, `app/mimir.html`, plus `app/anchor.js`. They run inside claude.ai's artifact viewer and use its runtime capabilities (`app/capabilities.json`): dictation for speech, `sample` for Claude, `db` for comments and the summary, `assets` for the PDF, and `user` for roles. PDF.js comes from cdnjs.

Test the alignment with any JavaScript shell:

```
node test/anchor.test.js
# or, on macOS without Node:
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc test/anchor.test.js
```

Everything else runs only inside the artifact viewer, so try changes by publishing a scratch review with `/new-review` before upgrading real ones.

Student PDFs never belong in this repo; `.gitignore` keeps them out.
