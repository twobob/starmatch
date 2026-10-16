// ============================================================================
// Constants - Configuration and Lookup Tables
// All constant values, arrays, and configuration objects
// ============================================================================

const AstroConstants = {
  // Zodiac signs
  SIGN_NAMES: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
               'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'],
  
  SIGN_SYMBOLS: ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'],
  
  // Planets
  PLANET_NAMES: ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 
                 'Saturn', 'Uranus', 'Neptune', 'Pluto'],
  
  PLANET_SYMBOLS: ['☉', '☽', '☿', '♀', '♂', '♃', '♄', '⛢', '♆', '♇'],
  
  // Aspects
  ASPECT_NAMES: ['Conjunction', 'Opposition', 'Trine', 'Square', 'Sextile', 'Semi-square', 'Semi-sextile'],
  
  ASPECT_SYMBOLS: {
    'Conjunction': { symbol: '☌', color: '#ff6b6b' },
    'Semi-sextile': { symbol: '⚺', color: '#51cf66' },
    'Semi-square': { symbol: '∠', color: '#ffd43b' },
    'Sextile': { symbol: '⚹', color: '#74c0fc' },
    'Square': { symbol: '□', color: '#ff6b6b' },
    'Trine': { symbol: '△', color: '#51cf66' },
    'Opposition': { symbol: '☍', color: '#a78bfa' }
  },
  
  // Elements, qualities, polarities
  ELEMENT_NAMES: ['Fire', 'Earth', 'Air', 'Water'],
  
  QUALITY_NAMES: ['Cardinal', 'Fixed', 'Mutable'],
  
  // Element colors
  ELEMENT_COLOURS: {
    Fire: '#ff6b6b',    // Red - energetic, warm
    Earth: '#51cf66',   // Green - grounded, stable
    Air: '#74c0fc',     // Cyan - intellectual, light
    Water: '#a78bfa'    // Purple - emotional, deep
  },
  
  // Ruling planets for each sign
  RULING_PLANETS: {
    'Aries': 'Mars',
    'Taurus': 'Venus',
    'Gemini': 'Mercury',
    'Cancer': 'Moon',
    'Leo': 'Sun',
    'Virgo': 'Mercury',
    'Libra': 'Venus',
    'Scorpio': 'Pluto',
    'Sagittarius': 'Jupiter',
    'Capricorn': 'Saturn',
    'Aquarius': 'Uranus',
    'Pisces': 'Neptune'
  },
  
  // Zodiac wheel rotation offset (degrees) to align signs with ascendant line
  ZODIAC_ROTATION_OFFSET: 13,
  
  // Zodiac wheel rotation offset for comparison chart only
  COMPARISON_ZODIAC_ROTATION_OFFSET: 0,
  
  // Show ascendant tooltips in comparison chart (sign, degree, element info)
  SHOW_ASCENDANT_TOOLTIPS_IN_COMPARISON: false,
  
  // Chart configuration
  MAIN_CHART_CONFIG: {
    outerRadius: 280,
    innerRadius: 220,
    planetRadius: 160
  },
  
  COMPARISON_CHART_CONFIG: {
    outerRadius: 180,
    innerRadius: 140
  },
  
  // House cusp display options
  MAIN_HOUSE_CUSP_OPTIONS: {
    fontSize: 36,
    labelFontSize: 12,
    labelOffset: 20,
    numeralRadiusFactor: 0.55
  },
  
  COMPARISON_HOUSE_CUSP_OPTIONS: {
    fontSize: 14,
    labelFontSize: 10,
    labelOffset: 15,
    numeralRadiusFactor: 0.25
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.AstroConstants = AstroConstants;
}
