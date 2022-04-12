figma.showUI(__html__);

figma.ui.onmessage = async msg => {
  await figma.loadFontAsync({ family: "Roboto", style: "Regular" })
  await figma.loadFontAsync({ family: "Roboto", style: "Bold" })

  if (msg.type === 'create-palette') {
    const selectedList = figma.currentPage.selection;

    if (selectedList.length) {
      const tileDistance = 12;
      const tileWidth = 100;
      const tileHeight = 100;
      let framePosX = 64;
      let framePosY = 64;

      selectedList.forEach(selectedItem => {
        if ('fills' in selectedItem && selectedItem.fills[0].type === "SOLID") {
          const selectedColor = selectedItem.fills[0].color;
          const selectedName = selectedItem.name;
          let posX = 0;
          let posY = 0;

          // Create palette frame
          const paletteFrame = figma.createFrame();
          paletteFrame.name = `palette-${selectedName}`;
          paletteFrame.resize(tileWidth * 10 + tileDistance * 9, tileHeight + 44);
          paletteFrame.x = framePosX;
          paletteFrame.y = framePosY;
          paletteFrame.fills = [];
          selectedItem.parent.appendChild(paletteFrame);
          framePosY += 208;

          // Create tiles 50-500
          [50, 100, 200, 300, 400, 500].forEach(level => {
            const tileWrap = createTileWrap(paletteFrame, posX, posY, tileWidth, tileHeight, selectedName, level);
            const color = colorLighten(selectedColor, level);
            const colorStyle = createColorStyle(color, selectedName, level);
            createTile(tileWrap, 0, 0, tileWidth, tileHeight, colorStyle.id, selectedName, level);
            createLabel(tileWrap, 0, tileHeight, level, colorStyle.color);
            posX += tileWidth + tileDistance;
          });

          // Create tiles 600-900
          [600, 700, 800, 900].forEach(level => {
            const tileWrap = createTileWrap(paletteFrame, posX, posY, tileWidth, tileHeight, selectedName, level);
            const color = colorDarken(selectedColor, level);
            const colorStyle = createColorStyle(color, selectedName, level);
            createTile(tileWrap, 0, 0, tileWidth, tileHeight, colorStyle.id, selectedName, level);
            createLabel(tileWrap, 0, tileHeight, level, colorStyle.color);
            posX += tileWidth + tileDistance;
          });
        } else {
          figma.closePlugin("❗️ Make fill color as a solid color.");
        }
      });
    } else {
      figma.closePlugin("❗️ Select a layer and re-run this plugin.");
    }

    figma.closePlugin("🎉 Color palettes created!");
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};

// Lighten color
function colorLighten(color, level: number): { r, g, b } {
  const r = color.r + (1 - color.r) * intensityList[level];
  const g = color.g + (1 - color.g) * intensityList[level];
  const b = color.b + (1 - color.b) * intensityList[level];
  return { r, g, b }
}

// Darken color
function colorDarken(color, level: number): { r, g, b } {
  const r = color.r * intensityList[level];
  const g = color.g * intensityList[level];
  const b = color.b * intensityList[level];
  return { r, g, b }
}

// Create color style
function createColorStyle(color, colorName: string, level: number) {
  const paintStyle = figma.getLocalPaintStyles().map((style) => style);
  let style;
  let existedStyle = paintStyle.filter(style => style['name'] === `${colorName}/${level}`);

  // Check if style existed
  if (existedStyle.length) {
    style = existedStyle[0];
  } else {
    style = figma.createPaintStyle();
    style.name = `${colorName}/${level}`;
  }

  const solidPaint: SolidPaint = {
    type: "SOLID",
    color: color,
    opacity: 1
  };
  style.paints = [solidPaint];
  return { id: style.id, color: color };
}

// Create tile wrap
function createTileWrap(container: FrameNode, x: number, y: number, tileWidth: number, tileHeight: number, selectedName: string, level: number) {
  const tileWrap = figma.createFrame();
  tileWrap.name = `${selectedName}-${level}`;
  tileWrap.x = x;
  tileWrap.y = y;
  tileWrap.fills = [];
  tileWrap.resize(tileWidth, tileHeight + 44);
  container.appendChild(tileWrap);
  return tileWrap;
}

// Create color tile
function createTile(container: FrameNode, x: number, y: number, tileWidth: number, tileHeight: number, styleId, selectedName: string, level: number) {
  const rect = figma.createRectangle();
  rect.resize(tileWidth, tileHeight);
  rect.x = x;
  rect.y = y;
  rect.fillStyleId = styleId;
  rect.name = 'tile';
  rect.cornerRadius = 8;
  container.appendChild(rect);
}

// Convert RGB to Hex
function rgbToHex(color): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const toHex = (c: number) => `0${c.toString(16)}`.slice(-2);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Create color label
function createLabel(container: FrameNode, x: number, y: number, level: number, color) {

  const levelLabel = figma.createText();
  levelLabel.fontName = { family: "Roboto", style: "Bold" };
  levelLabel.fontSize = 14;
  levelLabel.x = x;
  levelLabel.y = y + 8;
  levelLabel.characters = level.toString();

  const hexLabel = figma.createText();
  hexLabel.fontName = { family: "Roboto", style: "Regular" };
  hexLabel.fontSize = 14;
  hexLabel.textCase = "UPPER";
  hexLabel.x = x;
  hexLabel.y = y + 28;
  hexLabel.characters = rgbToHex(color);

  container.appendChild(levelLabel);
  container.appendChild(hexLabel);
}

// Color intensity list
const intensityList = {
  50: 0.9,
  100: 0.78,
  200: 0.6,
  300: 0.4,
  400: 0.2,
  500: 0,
  600: 0.85,
  700: 0.7,
  800: 0.55,
  900: 0.42
}