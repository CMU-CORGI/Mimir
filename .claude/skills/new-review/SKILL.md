---
name: new-review
description: Start a Mímir review for a student's paper draft by publishing a fresh copy of the app as a private claude.ai artifact, or roll the current app into an existing review. Use when the user wants to review a new paper or draft with Mímir, or to upgrade a review they already have.
---

Each Mímir review is its own claude.ai artifact. The PDF, comments, summary and conversation live in that artifact's database, so a new paper always gets a new artifact. Republishing the app to an existing review's URL upgrades its code and keeps its data.

What to publish:

- The page is `app/mimir.html`, with `app/anchor.js` published beside it as `anchor.js` (the page loads it by that relative path).
- Declare exactly the capabilities in `app/capabilities.json`. Dictation, Claude sampling, PDF storage and the shared database all depend on them, so a review published without them can't hear the reviewer, call Claude or save anything.
- The artifact's name comes from the page's `<title>`, which in the repo is just `Mímir`. Publish a copy whose title also names the review, such as `Mímir · Fenrir (Alice, Nov 2026)`. If the user hasn't said what identifies the review, ask. When upgrading, keep the review's current title.
- Use the icon `review` on a new artifact.

After a new review is published, give the user its link. They open it and drop in the PDF. The review starts private. To let the student or co-reviewers read it, they share it from the artifact's Share menu: viewers see the paper, comments and summary but can't edit or call Claude. Only people they make Editors can.
