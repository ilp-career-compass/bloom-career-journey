---
description: Verify School Learning Translations
---

1. Open the "My School, Learning and I" assessment in the app.
2. Switch the language to Kannada.
3. Open the browser's Developer Tools (F12).
4. Go to the "Console" tab.
5. Look for the log message starting with "🔍 School Learning Debug:".
6. Expand the log object.
   - Check if `lang` is 'kn'.
   - Check the `data` array. Look at the first item's `text` property. Is it in Kannada or English?
   - Check if `error` is null.
   
If `data` shows English text even when `lang` is 'kn', the RPC or database data is incorrect. 
If `data` shows Kannada text but the UI shows English, there's a rendering issue.
