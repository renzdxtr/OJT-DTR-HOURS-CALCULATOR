// Modular Toast Logger Function
// reusable function with switch-case, making it super easy to trigger consistent messages

function logToastError(errorType, contextData = {}) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  switch (errorType) {
    case "wrong_sheet_summary":
      ss.toast(
        `Automatic Hour Calculation do not apply to "${contextData.sheetName}". Only use it on sheets that contain the DTR data.`,
        "⚠️ Wrong Sheet Error",
        5
      );
      break;

    // Add more cases as your system grows
    default:
      ss.toast("An unknown error occurred.", "⚠️ Error", 5);
      break;
  }
}
