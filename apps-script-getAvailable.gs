/**
 * STANDALONE SCRIPT — Option B
 *
 * Paste this into your standalone Apps Script project
 * (the one that already has generateAvailableAppointments).
 *
 * Then deploy as Web App and paste the URL into script.js as AVAILABLE_SCRIPT_URL.
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';

  if (action === 'getAvailable') {
    return ContentService
      .createTextOutput(JSON.stringify({ data: getAvailableAppointmentsData() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Unknown action' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getAvailableAppointmentsData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('AvailableAppointments');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0];
  var dateIdx = headers.indexOf('תאריך');
  var hoursIdx = headers.indexOf('שעות פנויות');
  var msgIdx = headers.indexOf('הודעת וואטסאפ לדוגמה');

  if (dateIdx === -1 || hoursIdx === -1 || msgIdx === -1) return [];

  var rows = [];
  for (var i = 1; i < data.length; i++) {
    rows.push({
      date: String(data[i][dateIdx] || ''),
      hours: String(data[i][hoursIdx] || ''),
      message: String(data[i][msgIdx] || '')
    });
  }
  return rows;
}
