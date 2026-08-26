#target photoshop
/**
 * New 1024² document with transparent background (paint monster battle stills here).
 * Save As PNG to assets/monster/battle/{artKey}-front.png
 */
app.displayDialogs = DialogModes.NO;
var doc = app.documents.add(
  1024,
  1024,
  72,
  "monster-battle-still",
  NewDocumentMode.RGB,
  DocumentFill.TRANSPARENT,
);
alert("Transparent 1024 document ready. Paint, then File > Save As > PNG.");
