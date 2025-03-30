export function drawArrow(c: CanvasRenderingContext2D, x: number, y: number, angle: number): void {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x - 8 * dx + 5 * dy, y - 8 * dy - 5 * dx);
  c.lineTo(x - 8 * dx - 5 * dy, y - 8 * dy + 5 * dx);
  c.fill();
}

export function drawText(
  c: CanvasRenderingContext2D,
  originalText: string,
  x: number,
  y: number,
  angle: number | undefined,
  isSelected: boolean,
  hasFocus: boolean,
) {
  var greekLetterNames = [
    "Alpha",
    "Beta",
    "Gamma",
    "Delta",
    "Epsilon",
    "Zeta",
    "Eta",
    "Theta",
    "Iota",
    "Kappa",
    "Lambda",
    "Mu",
    "Nu",
    "Xi",
    "Omicron",
    "Pi",
    "Rho",
    "Sigma",
    "Tau",
    "Upsilon",
    "Phi",
    "Chi",
    "Psi",
    "Omega",
  ];

  function convertLatexShortcuts(text: string) {
    // html greek characters
    for (var i = 0; i < greekLetterNames.length; i++) {
      var name = greekLetterNames[i];
      text = text.replace(
        new RegExp("\\\\" + name, "g"),
        String.fromCharCode(913 + i + (i > 16 ? 1 : 0)),
      );
      text = text.replace(
        new RegExp("\\\\" + name.toLowerCase(), "g"),
        String.fromCharCode(945 + i + (i > 16 ? 1 : 0)),
      );
    }

    // subscripts
    for (var i = 0; i < 10; i++) {
      text = text.replace(new RegExp("_" + i, "g"), String.fromCharCode(8320 + i));
    }

    return text;
  }

  let text = convertLatexShortcuts(originalText);
  c.font = '20px "IBM Plex Sans"';
  var width = c.measureText(text).width;

  // center the text
  x -= width / 2;

  // position the text intelligently if given an angle
  if (angle !== undefined) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);
    var cornerPointX = (width / 2 + 5) * (cos > 0 ? 1 : -1);
    var cornerPointY = (10 + 5) * (sin > 0 ? 1 : -1);
    var slide =
      sin * Math.pow(Math.abs(sin), 40) * cornerPointX -
      cos * Math.pow(Math.abs(cos), 10) * cornerPointY;
    x += cornerPointX - sin * slide;
    y += cornerPointY + cos * slide;
  }

  // draw text and caret (round the coordinates so the caret falls on a pixel)
  x = Math.round(x);
  y = Math.round(y);
  c.fillText(text, x, y + 6);
  if (isSelected && hasFocus && document.hasFocus()) {
    x += width;
    c.beginPath();
    c.moveTo(x, y - 10);
    c.lineTo(x, y + 10);
    c.stroke();
  }
}
