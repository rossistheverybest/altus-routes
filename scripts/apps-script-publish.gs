/**
 * "Publish website" button for the route database Google Sheet.
 *
 * Setup (once):
 * 1. In the Sheet: Extensions > Apps Script. Paste this file in. Save.
 * 2. In Netlify: Site configuration > Build & deploy > Continuous deployment > Build hooks > Add build hook,
 *    name "Sheet", branch "main". Copy the URL.
 * 3. In Apps Script: Project Settings (gear) > Script properties > add DEPLOY_HOOK = that URL.
 * 4. Reload the Sheet. A "Website" menu appears.
 *
 * "Publish website now" rebuilds the site from the Sheet. It goes live in about a minute.
 */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Website").addItem("Publish website now", "publishWebsite").addToUi();
}

function publishWebsite() {
  const hook = PropertiesService.getScriptProperties().getProperty("DEPLOY_HOOK");
  if (!hook) { SpreadsheetApp.getUi().alert("Add the DEPLOY_HOOK script property first (see the notes at the top of the script)."); return; }
  const res = UrlFetchApp.fetch(hook, { method: "post", muteHttpExceptions: true });
  const ok = res.getResponseCode() < 300;
  SpreadsheetApp.getActive().toast(ok ? "Rebuilding the website. Live in about a minute." : "Netlify said: " + res.getContentText(), "Website", 8);
}
