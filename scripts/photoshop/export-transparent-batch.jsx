/**
 * Batch export transparent PNG from plate-painted monster battle sources.
 *
 * Invoked by scripts/run-photoshop-transparent.mjs
 * Config JSON path passed as app.scriptArgs[0].
 */
#target photoshop

app.displayDialogs = DialogModes.NO;
app.preferences.rulerUnits = Units.PIXELS;

function parseJson(raw) {
  if (typeof JSON !== "undefined" && JSON.parse) {
    return JSON.parse(raw);
  }
  return eval("(" + raw + ")");
}

function readConfig() {
  var scriptFile = new File($.fileName);
  var configFile = new File(scriptFile.parent + "/job-config.json");
  if (!configFile.exists) throw new Error("missing job-config.json beside JSX");
  configFile.open("r");
  var raw = configFile.read();
  configFile.close();
  return parseJson(raw);
}

function ensureLayerFromBackground(doc) {
  if (doc.layers.length === 1 && doc.activeLayer.isBackgroundLayer) {
    doc.activeLayer.isBackgroundLayer = false;
  }
}

function selectColorRangeFuzz(fuzziness, minRgb, maxRgb) {
  var idClr = charIDToTypeID("Clr ");
  var desc = new ActionDescriptor();
  var idMrgd = charIDToTypeID("Mrgd");
  desc.putBoolean(idMrgd, false);
  var idClrs = charIDToTypeID("Clrs");
  var list = new ActionList();
  var cdesc = new ActionDescriptor();
  var idMnm = charIDToTypeID("Mnm ");
  var min = new ActionDescriptor();
  min.putDouble(charIDToTypeID("Rd  "), minRgb[0]);
  min.putDouble(charIDToTypeID("Grn "), minRgb[1]);
  min.putDouble(charIDToTypeID("Bl  "), minRgb[2]);
  cdesc.putObject(idMnm, charIDToTypeID("RGBC"), min);
  var idMxm = charIDToTypeID("Mxm ");
  var max = new ActionDescriptor();
  max.putDouble(charIDToTypeID("Rd  "), maxRgb[0]);
  max.putDouble(charIDToTypeID("Grn "), maxRgb[1]);
  max.putDouble(charIDToTypeID("Bl  "), maxRgb[2]);
  cdesc.putObject(idMxm, charIDToTypeID("RGBC"), max);
  list.putObject(charIDToTypeID("Clrs"), cdesc);
  desc.putList(idClrs, list);
  var idFzns = charIDToTypeID("Fzns");
  desc.putInteger(idFzns, fuzziness);
  executeAction(idClr, desc, DialogModes.NO);
}

function deleteSelection() {
  var idDlt = charIDToTypeID("Dlt ");
  executeAction(idDlt, undefined, DialogModes.NO);
}

function deselect() {
  var idDst = charIDToTypeID("Dstl");
  var ref = new ActionReference();
  ref.putProperty(charIDToTypeID("Chnl"), charIDToTypeID("fsel"));
  var desc = new ActionDescriptor();
  desc.putReference(charIDToTypeID("null"), ref);
  executeAction(idDst, desc, DialogModes.NO);
}

function plateProfile(mode) {
  if (mode === "magenta") {
    return { fuzz: 90, min: [200, 0, 200], max: [255, 110, 255], passes: 2 };
  }
  if (mode === "black") {
    return { fuzz: 45, min: [0, 0, 0], max: [18, 18, 18], passes: 2 };
  }
  throw new Error("unknown plate mode: " + mode);
}

function removePlate(doc, mode) {
  var profile = plateProfile(mode);
  ensureLayerFromBackground(doc);
  for (var p = 0; p < profile.passes; p++) {
    selectColorRangeFuzz(profile.fuzz, profile.min, profile.max);
    deleteSelection();
    deselect();
  }
}

function savePng(doc, outFile) {
  var pngOpts = new PNGSaveOptions();
  pngOpts.interlaced = false;
  doc.saveAs(outFile, pngOpts, true, Extension.LOWERCASE);
}

function processOne(inputFile, outputFile, plateMode) {
  var doc = app.open(inputFile);
  try {
    removePlate(doc, plateMode);
    savePng(doc, outputFile);
  } finally {
    doc.close(SaveOptions.DONOTSAVECHANGES);
  }
}

function main() {
  var cfg = readConfig();
  var errLog = new File(cfg.logFile || "C:/project/StoneSummoner/scripts/photoshop/ps-error.log");
  try {
    var inputDir = new Folder(cfg.inputDir);
    var outputDir = new Folder(cfg.outputDir);
    if (!inputDir.exists) throw new Error("inputDir missing: " + cfg.inputDir);
    outputDir.create();
    var plateMode = cfg.plateMode || "magenta";
    var files = inputDir.getFiles(function (f) {
      return f instanceof File && /\.(png|jpg|jpeg|tif|tiff|psd)$/i.test(f.name);
    });
    var log = [];
    for (var i = 0; i < files.length; i++) {
      var inFile = files[i];
      var outName = inFile.name.replace(/\.(jpg|jpeg|tif|tiff|psd)$/i, ".png");
      var outFile = new File(outputDir.fsName + "/" + outName);
      processOne(inFile, outFile, plateMode);
      log.push(inFile.fsName + " -> " + outFile.fsName);
    }
    errLog.open("w");
    errLog.write(log.join("\n"));
    errLog.close();
  } catch (e) {
    errLog.open("w");
    errLog.write("ERROR " + e.message + "\n" + e.line);
    errLog.close();
    throw e;
  }
}

main();
