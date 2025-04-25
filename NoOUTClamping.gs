/**
 * Check if a string is a valid H:MM or HH:MM time
 * @param {string} str
 * @return {boolean}
 */
const isValidTime = (str) => /^\d{1,2}:\d{2}$/.test(str);

/**
 * Parse "H:MM" or "HH:MM" into {hours, minutes}
 * @param {string} timeStr
 * @return {{hours: number, minutes: number}}
 */
const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(":").map((s) => s.trim());
  return { hours: parseInt(h, 10), minutes: parseInt(m, 10) };
};

/**
 * Convert a time string into total minutes in 24-hour terms.
 * Adds 12 hours for PM if flag set.
 * @param {string} timeStr
 * @param {boolean} isPM
 * @return {number}
 */
const toTotalMinutes24 = (timeStr, isPM = false) => {
  const { hours, minutes } = parseTime(timeStr);
  const h24 = isPM ? (hours % 12) + 12 : hours;
  return h24 * 60 + minutes;
};

/**
 * Compute session minutes between two time strings.
 * Clamps the session start to the lowerBound if earlier, otherwise uses actual start.
 * @param {string} startStr
 * @param {string} endStr
 * @param {number} lowerBound
 * @param {boolean} isPM
 * @return {number}
 */
const calculateSession = (startStr, endStr, lowerBound, isPM = false) => {
  const actualStart = toTotalMinutes24(startStr, isPM);
  const endMin = toTotalMinutes24(endStr, isPM);
  const clampedStart = Math.max(actualStart, lowerBound);
  return Math.max(endMin - clampedStart, 0);
};

/**
 * Main: reads TIME_IN_AM:C, TIME_OUT_AM:D, TIME_IN_PM:E, TIME_OUT_PM:F,
 * computes AM and PM minutes, highlights invalid input and missing outputs,
 * and writes G:H and I.
 */
function updateTimeMinutes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheetName = sheet.getName();

  // Prevent running on Summary sheet
  if (sheetName === SUMMARY_SHEET) {
    logToastError("wrong_sheet_summary", { sheetName });
    // throw new Error(
    //   `Automatic Hour Calculation do not apply to "${SUMMARY_SHEET}". Only use it on sheets that contain the DTR data.`
    // );
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Batch read C-F (time inputs)
  const timeVals = sheet.getRange(2, 3, lastRow - 1, 4).getValues();

  timeVals.forEach((row, i) => {
    const [inAM, outAM, inPM, outPM] = row;
    const rowIndex = i + 2;
    let amMin = 0,
      pmMin = 0;
    let amValid = isValidTime(inAM) && isValidTime(outAM);
    let pmValid = isValidTime(inPM) && isValidTime(outPM);

    // Highlight invalid time inputs in C-F
    [
      [inAM, 3, false],
      [outAM, 4, false],
      [inPM, 5, true],
      [outPM, 6, true],
    ].forEach(([val, col]) => {
      sheet
        .getRange(rowIndex, col)
        .setBackground(isValidTime(val) ? null : "#f6b26b");
    });

    // Compute minutes
    if (amValid) amMin = calculateSession(inAM, outAM, START_AM, false);
    if (pmValid) pmMin = calculateSession(inPM, outPM, START_PM, true);

    // Write outputs G (AM_MINUTES), H (PM_MINUTES), I (TOTAL_HRS)
    sheet.getRange(rowIndex, 7).setValue(amMin);
    sheet.getRange(rowIndex, 8).setValue(pmMin);
    sheet.getRange(rowIndex, 9).setValue((amMin + pmMin) / 60);

    // Highlight missing outputs in G, H, I
    sheet.getRange(rowIndex, 7).setBackground(amValid ? null : "#f6b26b");
    sheet.getRange(rowIndex, 8).setBackground(pmValid ? null : "#f6b26b");
    // Highlight TOTAL_HRS if either AM or PM missing
    sheet
      .getRange(rowIndex, 9)
      .setBackground(amValid && pmValid ? null : "#f6b26b");
  });
}

/**
 * Synthetic tests to verify revised clamping logic
 */
function testTimeFunctions() {
  const tests = [
    {
      times: ["7:01", "12:01"],
      lower: START_AM,
      isPM: false,
      exp: 12 * 60 + 1 - START_AM,
    },
    {
      times: ["8:00", "12:00"],
      lower: START_AM,
      isPM: false,
      exp: 12 * 60 - START_AM,
    },
    {
      times: ["12:52", "17:07"],
      lower: START_PM,
      isPM: true,
      exp: 17 * 60 + 7 - START_PM,
    },
    {
      times: ["13:15", "18:15"],
      lower: START_PM,
      isPM: true,
      exp: 18 * 60 + 15 - (13 * 60 + 15),
    },
  ];

  tests.forEach(({ times: [s, e], lower, isPM, exp }) => {
    const result = calculateSession(s, e, lower, isPM);
    Logger.log(
      `Test ${s}-${e} (${isPM ? "PM" : "AM"}): got ${result}, expected ${exp}`
    );
  });
}

function getActiveSpreadsheet() {
  return SpreadsheetApp.getActiveSheet().getName();
}
