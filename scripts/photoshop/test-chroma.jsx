#target photoshop
app.displayDialogs = DialogModes.NO;
var log = new File("C:/project/StoneSummoner/scripts/photoshop/ps-test.log");
log.open("w");
try {
  var inFile = new File(
    "C:/project/StoneSummoner/apps/web/public/art/_staging/photoshop-input/wolf_fighter/wolf_fighter_fire-front.png"
  );
  var doc = app.open(inFile);
  if (doc.activeLayer.isBackgroundLayer) {
    doc.activeLayer.isBackgroundLayer = false;
  }
  var desc = new ActionDescriptor();
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  desc.putReference(charIDToTypeID("null"), ref);
  var desc2 = new ActionDescriptor();
  desc2.putEnumerated(
    charIDToTypeID("Op  "),
    charIDToTypeID("Op  "),
    charIDToTypeID("Ctng"),
  );
  desc2.putInteger(charIDToTypeID("Fzns"), 90);
  var desc3 = new ActionDescriptor();
  desc3.putInteger(charIDToTypeID("Hrzn"), 4);
  desc3.putInteger(charIDToTypeID("Vrtc"), 4);
  desc2.putObject(charIDToTypeID("From"), charIDToTypeID("Pnt "), desc3);
  desc.putObject(charIDToTypeID("T   "), charIDToTypeID("Clrng"), desc2);
  executeAction(charIDToTypeID("setd"), desc, DialogModes.NO);
  log.writeln("selected");
  executeAction(charIDToTypeID("Dlt "), undefined, DialogModes.NO);
  log.writeln("deleted");
  var out = new File(
    "C:/project/StoneSummoner/assets/monster/battle-transparent/wolf_fighter/_test-fire-front.png"
  );
  doc.saveAs(out, new PNGSaveOptions(), true, Extension.LOWERCASE);
  log.writeln("saved");
  doc.close(SaveOptions.DONOTSAVECHANGES);
} catch (e) {
  log.writeln("ERR " + e.line + " " + e.message);
}
log.close();
