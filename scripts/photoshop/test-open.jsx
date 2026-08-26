#target photoshop
app.displayDialogs = DialogModes.NO;
var log = new File("C:/project/StoneSummoner/scripts/photoshop/ps-test.log");
log.open("w");
try {
  log.writeln("version " + app.version);
  log.writeln("ok");
} catch (e) {
  log.writeln("ERR " + e.message);
}
log.close();
