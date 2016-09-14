var ADDON_TITLE = 'เพิ่มเหตุการณ์ลงในปฏิทิน';

function test() {
  PropertiesService.getDocumentProperties().deleteAllProperties();
  //Logger.log('2016/3/12'.split(/[-/,]/))
}

function onVacCalendarAddOnFormSubmitEvent(e) {
  var pref = PropertiesService.getDocumentProperties().getProperties();
  
  var CAL_NAME = pref.calName;

  var eventItem = e.source.getItemById(parseInt(pref.calEvent));
  var event = e.response.getResponseForItem(eventItem).getResponse();

  var dateItem = e.source.getItemById(parseInt(pref.calDate));
  var date = e.response.getResponseForItem(dateItem).getResponse();

  // open calendar by name
  var cals = CalendarApp.getCalendarsByName(CAL_NAME);
  if (cals.length < 1) {
    CalendarApp.createCalendar(CAL_NAME);
    cals = CalendarApp.getCalendarsByName(CAL_NAME);
  }
  var cal = cals[0];
  
  // add event to the calendar
  var d = date.split(/[-/,]/);  // regx - or / or , separator
  cal.createAllDayEvent(event, new Date(parseInt(d[0]), parseInt(d[1], 10) - 1, parseInt(d[2], 10)));
}

function onOpen(e) {
  FormApp.getUi()
      .createAddonMenu()
      .addItem('ตั้งค่า', 'showSidebar')
      .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle(ADDON_TITLE);
  FormApp.getUi().showSidebar(ui);
}

function openPref() {
  var pref = PropertiesService.getDocumentProperties().getProperties();

  var form = FormApp.getActiveForm();

  var calDateItems = form.getItems(FormApp.ItemType.DATE);
  pref.calDateItems = [];
  for (var i = 0; i < calDateItems.length; i++) {
    pref.calDateItems.push({
      title: calDateItems[i].getTitle(),
      id: calDateItems[i].getId()
    });
  }

  var calEventItems = form.getItems(FormApp.ItemType.TEXT);
  pref.calEventItems = [];
  for (var i = 0; i < calEventItems.length; i++) {
    pref.calEventItems.push({
      title: calEventItems[i].getTitle(),
      id: calEventItems[i].getId()
    });
  }
  
  return pref;
}

function savePref(pref) {
  if (pref.enable)
    FormApp.getActiveForm().setCollectEmail(true);
  PropertiesService.getDocumentProperties().setProperties(pref);
  adjustFormSubmitTrigger();
}

function adjustFormSubmitTrigger() {
  var form = FormApp.getActiveForm();
  var triggers = ScriptApp.getUserTriggers(form);
  var pref = PropertiesService.getDocumentProperties().getProperties();
  var triggerNeeded = pref.enable === 'true';

  // find an existing trigger
  var existingTrigger = null;
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() == 'onVacCalendarAddOnFormSubmitEvent') {
      existingTrigger = triggers[i];
      break;
    }
  }
  
  if (existingTrigger) {
    // delete the existing one
    ScriptApp.deleteTrigger(existingTrigger);
  }
  
  if (triggerNeeded) {
    // add a new trigger if needed
    var trigger = ScriptApp.newTrigger('onVacCalendarAddOnFormSubmitEvent')
        .forForm(form)
        .onFormSubmit()
        .create();
  }
}



