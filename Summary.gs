/**
 * Aggregation script: updates a "Summary" sheet with total AM, PM, and hours per student.
 * Uses menu trigger for easy access and is parameterizable for testing.
 */

/**
 * Main: Reads NAME and SCHOOL from a summary sheet, computes totals from each SCHOOL sheet,
 * and writes back TOTAL_AM_MINUTES, TOTAL_PM_MINUTES, TOTAL_HOURS in columns C, D, E.
 * @param {string=} summarySheetName  Optional name of summary sheet; defaults to SUMMARY_SHEET
 */
function updateSummaryTotals(summarySheetName = SUMMARY_SHEET) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const summary = ss.getSheetByName(summarySheetName);
  if (!summary) throw new Error(`Sheet '${summarySheetName}' not found.`);

  const lastRow = summary.getLastRow();
  if (lastRow < 2) return;

  // Read NAME (col A) and SCHOOL (col B)
  const entries = summary.getRange(2, 1, lastRow - 1, 2).getValues();

  entries.forEach((row, i) => {
    const [studentName, schoolName] = row;
    const sourceSheet = ss.getSheetByName(schoolName);
    if (!sourceSheet) {
      // highlight school cell if sheet missing
      summary.getRange(i + 2, 2).setBackground("red");
      return;
    }
    // compute totals for this student
    const { amTotal, pmTotal, hrsTotal } = getStudentTotalsInSheet(
      sourceSheet,
      studentName
    );

    // Write into columns C, D, E
    const targetRow = i + 2;
    summary.getRange(targetRow, 3).setValue(amTotal);
    summary.getRange(targetRow, 4).setValue(pmTotal);
    summary.getRange(targetRow, 5).setValue(hrsTotal);

    // Clear any previous highlight
    summary.getRange(targetRow, 2).setBackground(null);
  });
}

/**
 * Compute sum of AM_MINUTES, PM_MINUTES, TOTAL_HRS for a specific student in a sheet.
 * @param {Sheet} sheet  Source sheet with data columns: NAME (col A), AM_MINUTES (G), PM_MINUTES (H), TOTAL_HRS (I)
 * @param {string} studentName
 * @return {{amTotal: number, pmTotal: number, hrsTotal: number}}
 */
function getStudentTotalsInSheet(sheet, studentName) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { amTotal: 0, pmTotal: 0, hrsTotal: 0 };

  // Read NAME col A, AM_MINUTES col G, PM_MINUTES col H, TOTAL_HRS col I
  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();

  return data.reduce(
    (acc, row) => {
      if (row[0] === studentName) {
        acc.amTotal += Number(row[6]) || 0;
        acc.pmTotal += Number(row[7]) || 0;
        acc.hrsTotal += Number(row[8]) || 0;
      }
      return acc;
    },
    { amTotal: 0, pmTotal: 0, hrsTotal: 0 }
  );
}

/**
 * Test function to verify aggregation logic.
 * Creates temporary sheets, populates sample data, runs updateSummaryTotals on testSummary,
 * and logs the summary results for manual verification.
 */
function testAggregation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Setup TestSource sheet
  const testSourceName = "TestSource";
  let testSource = ss.getSheetByName(testSourceName);
  if (testSource) ss.deleteSheet(testSource);
  testSource = ss.insertSheet(testSourceName);
  testSource
    .getRange(1, 1, 1, 9)
    .setValues([
      [
        "NAME",
        "DATE",
        "TIME_IN_AM",
        "TIME_OUT_AM",
        "TIME_IN_PM",
        "TIME_OUT_PM",
        "AM_MINUTES",
        "PM_MINUTES",
        "TOTAL_HRS",
      ],
    ]);
  testSource.getRange(2, 1, 3, 9).setValues([
    ["Alice", "", "", "", "", "", 60, 120, 3],
    ["Bob", "", "", "", "", "", 30, 60, 1.5],
    ["Alice", "", "", "", "", "", 90, 30, 2],
  ]);

  // Setup TestSummary sheet
  const testSummaryName = "TestSummary";
  let testSummary = ss.getSheetByName(testSummaryName);
  if (testSummary) ss.deleteSheet(testSummary);
  testSummary = ss.insertSheet(testSummaryName);
  testSummary
    .getRange(1, 1, 1, 5)
    .setValues([
      ["NAME", "SCHOOL", "TOTAL_AM_MINUTES", "TOTAL_PM_MINUTES", "TOTAL_HOURS"],
    ]);
  testSummary.getRange(2, 1, 2, 2).setValues([
    ["Alice", testSourceName],
    ["Bob", testSourceName],
  ]);

  // Run aggregation on TestSummary
  updateSummaryTotals(testSummaryName);

  // Read and log results (columns A-E)
  const resultRows = testSummary.getRange(2, 1, 2, 5).getValues();
  Logger.log("Aggregation Test Results:");
  resultRows.forEach((row) => Logger.log(row));
}
