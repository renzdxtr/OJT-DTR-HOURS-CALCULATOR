# OJT-DTR-HOURS-CALCULATOR

A Google Apps Script toolkit for automating Daily Time Record (DTR) calculations and aggregating student hours within Google Sheets.

---

## 📁 File Structure

```
root/
├─ clampAM-OUT&PM-OUT.gs      # Core DTR calculation with clamped in/out logic and tests
├─ CONSTANT_VARIABLES.gs      # Shared global constants (start times, sheet names)
├─ Menu.gs                    # Adds custom menus for calculation & summary
├─ NoOUTClamping.gs           # Alternate DTR logic without output clamping
├─ Notification.gs            # Modular toast‐based error/logger utility
├─ Summary.gs                 # Aggregation script for student totals
├─ Format.txt                 # Sample data layout for reference
├─ README.md                  # Project overview & instructions
└─ LICENSE                    # MIT license
```

---

## 🔍 Overview of Key Scripts

### clampAM-OUT&PM-OUT.gs
- **Purpose**: Reads columns C–F (`TIME_IN_AM`, `TIME_OUT_AM`, `TIME_IN_PM`, `TIME_OUT_PM`), clamps sessions to configured bounds, calculates:
  - **AM_MINUTES** (col G)
  - **PM_MINUTES** (col H)
  - **TOTAL_HRS** (col I)
- **Features**:
  - Clamping of start/end times between **8 AM–12 PM** and **1 PM–5 PM**
  - Validation of time strings, highlighting invalid entries in **red**
  - Custom **`CALCULATE HOURS`** menu via `onOpen()`
  - Built‑in tests (`testTimeFunctions`) for core utility functions

### CONSTANT_VARIABLES.gs
- Defines global, uppercase constants for:
  - **START_AM**, **END_AM**, **START_PM**, **END_PM**
  - Default **`SUMMARY_SHEET`** name

### Menu.gs
- Registers two top‑level menus:
  - **CALCULATE HOURS → Run Calculation**
  - **GENERATE SUMMARY → Update Summary**

### NoOUTClamping.gs
- Variant of the DTR calculator that:
  - Clamps **only** session start times (no upper-bound clamps)
  - Highlights missing inputs/outputs with configurable colors

### Notification.gs
- **`logToastError(type, context)`**: centralizes UI toast messages & logging
- Easily extended with additional error/case types

### Summary.gs
- **Aggregates** per‑student totals across all DTR sheets:
  - Reads **NAME** & **SCHOOL** from a summary sheet
  - Sums **AM_MINUTES**, **PM_MINUTES**, **TOTAL_HRS** per student
  - Writes results into columns **C–E** of the summary
  - Includes **`testAggregation()`** harness for local testing

### Format.txt
- Example of input DTR data layout and a completed summary

---

## 🚀 Installation

1. Open your Google Sheets file.
2. Navigate to **Extensions → Apps Script**.
3. Create script files matching those above, and paste their contents.
4. Save and **Reload** the spreadsheet to activate menus.

Easiest Method:
1. Make a copy of this [DTR TIME TRACKER AUTOMATION TEMPLATE]([https://www.google.com](https://docs.google.com/spreadsheets/d/1926kmLUN2-WxAqCYilf5pkIEj0AmB8PoJscLVj5Lgws/edit?usp=sharing))
2. Run the functions on the Menus (see "Usage" below).

---

## 🔐 Authorization Notice

When running the script for the first time, you may see a prompt like:

> **Authorization required**  
> A script attached to this document needs your permission to run.

Follow these steps to authorize:

1. Click your **Google account** when prompted.  
2. You may see a warning saying:  
   _"Google hasn’t verified this app."_  
3. Click **Advanced** → **Go to DTR Time Tracker (unsafe)**.  
4. Click **Allow** to grant the required permissions.

These permissions are needed for the script to read and write to your Google Sheets. The script does **not** access or store any external user data.

---

## 🛠 Usage

1. **DTR Calculation**
   - Switch to any sheet containing DTR entries (not the summary).
   - Click **CALCULATE HOURS → Run Calculation**.
   - Inputs in C–F are validated; outputs in G–I are computed and color‑coded.

2. **Student Aggregation**
   - Ensure a `Summary` sheet exists with columns:
     ```
     NAME | SCHOOL | TOTAL_AM_MINUTES | TOTAL_PM_MINUTES | TOTAL_HOURS
     ```
   - Click **GENERATE SUMMARY → Update Summary**.
   - The script will overwrite the totals for each student.

---

## ✅ Testing

- **DTR Logic**: Run `testTimeFunctions()` in the Apps Script console and review logs.
- **Aggregation**: Run `testAggregation()` and verify logged output matches expected totals.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.


