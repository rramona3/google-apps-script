var ADDON_TITLE = 'แนบ PDF';

function onOpen(e) {
  FormApp.getUi()
      .createAddonMenu()
      .addItem('ตั้งค่า', 'showSidebar')
      .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function openPref() {
  var pref = PropertiesService.getDocumentProperties().getProperties();
  return pref;
}

function showSidebar() {
  var ui = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle(ADDON_TITLE);
  FormApp.getUi().showSidebar(ui);
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

  // delete all existing triggers
  for (var i = triggers.length - 1; i >= 0; i--) {
    if (triggers[i].getHandlerFunction() == 'onVacEmailPdfAddOnFormSubmitEvent') {
      var existingTrigger = triggers[i];
      ScriptApp.deleteTrigger(existingTrigger);
    }
  }
  
  if (triggerNeeded) {
    // add a new trigger if needed
    var trigger = ScriptApp.newTrigger('onVacEmailPdfAddOnFormSubmitEvent')
        .forForm(form)
        .onFormSubmit()
        .create();
  }
}

function onVacEmailPdfAddOnFormSubmitEvent(e) {
  var pref = PropertiesService.getDocumentProperties().getProperties();
  if (pref.enable === 'true') {
    try {
      var docId = pref.template;
      Logger.log(docId);
      var email = e.response.getRespondentEmail();
      
      var file = DriveApp.getFileById(docId).makeCopy('application' + Math.random());
      var newDoc = DocumentApp.openById(file.getId());
      
      replace(newDoc, e);
      newDoc.saveAndClose();
      
      var pdf = newDoc.getAs('application/pdf').getBytes();
      var attach = {fileName:'form.pdf', content:pdf, mimeType:'application/pdf'};
      MailApp.sendEmail(email, pref.subject, pref.message, {attachments:[attach]});
      
      DriveApp.removeFile(file);
    } catch (ex) {}
  }
}

function replace(newDoc, e) {
  var body = newDoc.getBody();

  var resp = getResponses(e);
  for (var i = 0; i < resp.length; i++) {
    body.replaceText('<' + i + '>', resp[i]);
  }
}


//--------------------------------------------------------------------------------------------
// get reponses from event object of form submit
function getResponses(e) {
  /*
  var resp = e.response.getItemResponses();
  var responses = []
  for (i = 0; i < resp.length; i++)
     responses.push(resp[i].getResponse());
  */
  var form = e.source;
  var items = form.getItems();
  var responses = [];
  for (i = 0; i < items.length; i++) {
    var r = e.response.getResponseForItem(items[i]);
    responses.push(r == null ? '' : r.getResponse());
  }
  return responses;
}

