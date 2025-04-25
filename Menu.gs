/**
 * Add custom menu on spreadsheet open
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CALCULATE HOURS")
    .addItem("Run Calculation", "updateTimeMinutes")
    .addToUi();

  SpreadsheetApp.getUi()
    .createMenu("GENERATE SUMMARY")
    .addItem("Update Summary", "updateSummaryTotals")
    .addToUi();
}
