/**
 * Global constants (all caps) for sheet and time bounds in minutes since midnight
 */
const SHEET_NAME = "LSPU"; // UPDATE to your sheet name
const START_AM = 8 * 60; // 8:00 AM
const END_AM = 12 * 60; // 12:00 PM
const START_PM = 13 * 60; // 1:00 PM
const END_PM = 17 * 60; // 5:00 PM

/**
 * Add custom menu on spreadsheet open
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("CALCULATE HOURS")
    .addItem("Run Calculation", "updateTimeMinutes")
    .addToUi();
}

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
 * Parse time string into 24-hour format minutes.
 * For PM times (isPM=true), adds 12h to hours <12.
 * @param {string} timeStr
 * @param {boolean} isPM
 * @return {number} total minutes since midnight
 */
const toTotalMinutes24 = (timeStr, isPM = false) => {
  const t = parseTime(timeStr);
  let h = t.hours;
  if (isPM) {
    // convert 12-hour to 24-hour PM
    h = (h % 12) + 12;
  }
  return h * 60 + t.minutes;
};

/**
 * Clamp a value between lower and upper bounds
 * @param {number} val
 * @param {number} lower
 * @param {number} upper
 * @return {number}
 */
const clampMinutes = (val, lower, upper) =>
  Math.min(Math.max(val, lower), upper);

/**
 * Compute session minutes between two time strings, with clamping.
 * Automatically handles AM/PM based on isPM flag.
 * @param {string} startStr
 * @param {string} endStr
 * @param {number} lowerBound
 * @param {number} upperBound
 * @param {boolean} isPM
 * @return {number}
 */
const calculateClampedSession = (
  startStr,
  endStr,
  lowerBound,
  upperBound,
  isPM = false
) => {
  // parse to total minutes (24h)
  const startMin = toTotalMinutes24(startStr, isPM);
  const endMin = toTotalMinutes24(endStr, isPM);
  // clamp within session window
  const clampedStart = clampMinutes(startMin, lowerBound, upperBound);
  const clampedEnd = clampMinutes(endMin, lowerBound, upperBound);
  return Math.max(clampedEnd - clampedStart, 0);
};

/**
 * Main: reads TIME_IN_AM:C, TIME_OUT_AM:D, TIME_IN_PM:E, TIME_OUT_PM:F,
 * computes AM and PM minutes, highlights invalid, and writes G:H and I.
 */
function updateTimeMinutes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet '${SHEET_NAME}' not found.`);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  // Read columns C–F
  const timeVals = sheet.getRange(2, 3, lastRow - 1, 4).getValues();

  const results = timeVals.map((row, i) => {
    const [inAM, outAM, inPM, outPM] = row;
    let amMin = 0,
      pmMin = 0;

    // Highlight invalid/missing
    [
      [inAM, 3, false],
      [outAM, 4, false],
      [inPM, 5, true],
      [outPM, 6, true],
    ].forEach(([val, col, isPM]) => {
      const cell = sheet.getRange(i + 2, col);
      isValidTime(val) ? cell.setBackground(null) : cell.setBackground("red");
    });

    // AM session
    if (isValidTime(inAM) && isValidTime(outAM)) {
      amMin = calculateClampedSession(inAM, outAM, START_AM, END_AM, false);
    }
    // PM session
    if (isValidTime(inPM) && isValidTime(outPM)) {
      pmMin = calculateClampedSession(inPM, outPM, START_PM, END_PM, true);
    }

    return [amMin, pmMin, (amMin + pmMin) / 60];
  });

  // Write G (AM_MINUTES), H (PM_MINUTES), I (TOTAL_HRS)
  sheet.getRange(2, 7, results.length, 3).setValues(results);
}

/**
 * Synthetic tests for core functions (AM & PM)
 */
function testTimeFunctions() {
  const testCases = [
    {
      times: ["7:01", "12:01"],
      bounds: [START_AM, END_AM],
      isPM: false,
      exp: 240,
    },
    {
      times: ["8:00", "12:00"],
      bounds: [START_AM, END_AM],
      isPM: false,
      exp: 240,
    },
    {
      times: ["9:15", "11:45"],
      bounds: [START_AM, END_AM],
      isPM: false,
      exp: 150,
    },
    {
      times: ["12:52", "5:07"],
      bounds: [START_PM, END_PM],
      isPM: true,
      exp: 240,
    },
    { times: ["", "5:00"], bounds: [START_AM, END_AM], isPM: false, exp: 0 },
  ];

  testCases.forEach(
    ({ times: [start, end], bounds: [low, high], isPM, exp }) => {
      let result = 0;
      if (isValidTime(start) && isValidTime(end)) {
        result = calculateClampedSession(start, end, low, high, isPM);
      }
      Logger.log(
        `Test ${start}-${end} ${
          isPM ? "PM" : "AM"
        } (bounds ${low}-${high}): got ${result}, expected ${exp}`
      );
    }
  );
}
