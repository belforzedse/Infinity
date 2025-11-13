const fs = require('fs');
const path = require('path');

const DEFAULT_COLOR = {
  title: 'White',
  colorCode: '#FFFFFF',
};

let mappings = {};

function loadMappingsFromFile() {
  try {
    const filePath = path.resolve(__dirname, '../data/color-mappings.json');
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    if (parsed.default && parsed.default.title && parsed.default.colorCode) {
      DEFAULT_COLOR.title = parsed.default.title;
      DEFAULT_COLOR.colorCode = parsed.default.colorCode;
    }
    mappings = Object.entries(parsed.mappings || {}).reduce((acc, [key, value]) => {
      if (value && value.title && value.colorCode) {
        acc[key.trim().toLowerCase()] = {
          title: value.title,
          colorCode: value.colorCode,
        };
      }
      return acc;
    }, {});
  } catch (error) {
    mappings = {};
  }
}

loadMappingsFromFile();

function resolveColorMapping(rawValue) {
  if (!rawValue || typeof rawValue !== 'string') {
    return { ...DEFAULT_COLOR, matched: false };
  }

  const normalized = rawValue.trim().toLowerCase();
  const entry = mappings[normalized];
  if (entry) {
    return { ...entry, matched: true };
  }

  return { ...DEFAULT_COLOR, matched: false };
}

module.exports = {
  resolveColorMapping,
  DEFAULT_COLOR,
};
