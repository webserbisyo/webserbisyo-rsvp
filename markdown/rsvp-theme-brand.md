---
description: RSVP brand and theme planning without overriding default shadcn tokens too early
globs:
  [
    "src/app/globals.css",
    "src/styles/themes.css",
    "src/styles/components.css",
    "src/components/**/*.tsx",
  ]
alwaysApply: false
---

# RSVP Theme & Brand Rules

This file defines the future branding direction for **WebSerbisyo RSVP**.

Current implementation rule:

```txt
Use generated shadcn/ui defaults first.
Keep radix-nova / neutral preset from components.json.
Do not force final RSVP brand colors into globals.css yet.
```
