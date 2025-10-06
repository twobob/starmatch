/**
 * Zodiac Sign Converter Utility
 * ==============================
 * Converts between zodiac sign notation (e.g., "8°♈11'15") and absolute degrees (0-360).
 * 
 * Usage:
 *   node zodiac_converter.js "29°♓16"          // Returns: 359.27
 *   node zodiac_converter.js 359.27            // Returns: 29°♓16'12"
 *   
 * Or in code:
 *   const { signToDegrees, degreesToSign } = require('./zodiac_converter');
 *   const degrees = signToDegrees('8°♈11\'15"');
 *   const zodiac = degreesToSign(158.1875);
 */

const SIGNS = {
  // Unicode symbols
  '♈': 0,   'Aries': 0,       'Ari': 0,
  '♉': 30,  'Taurus': 30,     'Tau': 30,
  '♊': 60,  'Gemini': 60,     'Gem': 60,
  '♋': 90,  'Cancer': 90,     'Can': 90,
  '♌': 120, 'Leo': 120,       'Leo': 120,
  '♍': 150, 'Virgo': 150,     'Vir': 150,
  '♎': 180, 'Libra': 180,     'Lib': 180,
  '♏': 210, 'Scorpio': 210,   'Sco': 210,
  '♐': 240, 'Sagittarius': 240, 'Sag': 240,
  '♑': 270, 'Capricorn': 270, 'Cap': 270,
  '♒': 300, 'Aquarius': 300,  'Aqu': 300,
  '♓': 330, 'Pisces': 330,    'Pis': 330
};

const SIGN_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
                    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_SYMBOLS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

/**
 * Convert zodiac notation to absolute degrees
 * Formats supported:
 *   "8°♈11'15"    (degrees, sign, arcminutes, arcseconds)
 *   "29°Pisces16" (degrees, sign name, arcminutes)
 *   "15Lib30"     (degrees, abbreviation, arcminutes)
 * 
 * @param {string} zodiacString - The zodiac notation
 * @returns {number} - Absolute degrees (0-360)
 */
function signToDegrees(zodiacString) {
  // Remove whitespace
  const str = zodiacString.trim();
  
  // Pattern: <degrees>[°]<sign><minutes>[']<seconds>["]
  // Sign can be unicode symbol, full name, or 3-letter abbreviation
  const pattern = /(\d+(?:\.\d+)?)°?\s*([♈-♓]|[A-Za-z]+)\s*(\d+)?'?\s*(\d+)?["']?/;
  const match = str.match(pattern);
  
  if (!match) {
    throw new Error(`Invalid zodiac format: "${zodiacString}". Expected format like "8°♈11'15" or "29Pisces16"`);
  }
  
  const [, degreesStr, signStr, minutesStr, secondsStr] = match;
  
  const degrees = parseFloat(degreesStr);
  const minutes = minutesStr ? parseFloat(minutesStr) : 0;
  const seconds = secondsStr ? parseFloat(secondsStr) : 0;
  
  // Find sign offset
  const signOffset = SIGNS[signStr];
  if (signOffset === undefined) {
    throw new Error(`Unknown sign: "${signStr}". Use symbols like ♈ or names like Aries/Ari`);
  }
  
  // Calculate absolute degrees
  const absoluteDegrees = signOffset + degrees + (minutes / 60) + (seconds / 3600);
  
  return absoluteDegrees;
}

/**
 * Convert absolute degrees to zodiac notation
 * 
 * @param {number} degrees - Absolute degrees (0-360)
 * @param {object} options - Formatting options
 * @param {boolean} options.useSymbols - Use unicode symbols (default: true)
 * @param {boolean} options.showSeconds - Include arcseconds (default: true)
 * @returns {string} - Zodiac notation
 */
function degreesToSign(degrees, options = {}) {
  const { useSymbols = true, showSeconds = true } = options;
  
  // Normalize to 0-360
  let normalizedDegrees = degrees % 360;
  if (normalizedDegrees < 0) normalizedDegrees += 360;
  
  // Determine sign (0-11)
  const signIndex = Math.floor(normalizedDegrees / 30);
  const signName = useSymbols ? SIGN_SYMBOLS[signIndex] : SIGN_NAMES[signIndex];
  
  // Degrees within sign (0-30)
  const degreesInSign = normalizedDegrees % 30;
  const wholeDegrees = Math.floor(degreesInSign);
  
  // Minutes and seconds
  const fractionalDegrees = degreesInSign - wholeDegrees;
  const totalMinutes = fractionalDegrees * 60;
  const wholeMinutes = Math.floor(totalMinutes);
  
  if (!showSeconds) {
    return `${wholeDegrees}°${signName}${wholeMinutes}'`;
  }
  
  const fractionalMinutes = totalMinutes - wholeMinutes;
  const wholeSeconds = Math.round(fractionalMinutes * 60);
  
  return `${wholeDegrees}°${signName}${wholeMinutes}'${wholeSeconds}"`;
}

// Command-line interface
if (require.main === module) {
  const arg = process.argv[2];
  
  if (!arg) {
    console.log('Zodiac Converter');
    console.log('================');
    console.log('');
    console.log('Usage:');
    console.log('  node zodiac_converter.js "8°♈11\'15"     // Convert to degrees');
    console.log('  node zodiac_converter.js 158.1875       // Convert to zodiac');
    console.log('');
    console.log('Examples:');
    console.log('  "29°♓16"          → 359.27°');
    console.log('  "15Lib30"         → 195.50°');
    console.log('  158.1875          → 8°♍11\'15"');
    process.exit(0);
  }
  
  // Try parsing as number first
  const asNumber = parseFloat(arg);
  if (!isNaN(asNumber)) {
    // Convert degrees to zodiac
    const zodiac = degreesToSign(asNumber);
    console.log(`${asNumber}° → ${zodiac}`);
  } else {
    // Convert zodiac to degrees
    try {
      const degrees = signToDegrees(arg);
      console.log(`${arg} → ${degrees.toFixed(4)}°`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  }
}

module.exports = { signToDegrees, degreesToSign, SIGNS, SIGN_NAMES, SIGN_SYMBOLS };
