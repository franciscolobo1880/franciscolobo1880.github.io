// Color management system
class ColorManager {
  constructor() {
    this.colors = {};
    this.palette = {};
    this.cssVariables = new Map();
  }

  async loadColors() {
    try {
      // Load both JSON files
      const [colorsResponse, paletteResponse] = await Promise.all([
        fetch('content/database/colors.json'),
        fetch('content/database/palette.json')
      ]);

      const colorsData = await colorsResponse.json();
      const paletteData = await paletteResponse.json();

      // Store palette
      this.palette = paletteData;
      this.colors = colorsData;

      // Apply colors to CSS
      this.applyColorsToCSS();
    } catch (error) {
      console.error('Error loading color configuration:', error);
    }
  }

  resolveColor(colorValue) {
    // If it's a palette reference, resolve it
    if (typeof colorValue === 'string' && colorValue.startsWith('palette_')) {
      return this.palette[colorValue] || colorValue;
    }
    return colorValue;
  }

  applyColorsToCSS() {
    const root = document.documentElement;

    // Apply each color as a CSS custom property
    Object.entries(this.colors).forEach(([key, value]) => {
      const resolvedColor = this.resolveColor(value);
      const cssVar = `--${key.replace(/_/g, '-')}`;
      root.style.setProperty(cssVar, resolvedColor);
    });

    // Store for debugging
    this.cssVariables = new Map(Object.entries(this.colors));
  }

  // Method to change colors dynamically
  updateColor(colorKey, newValue) {
    this.colors[colorKey] = newValue;
    const resolvedColor = this.resolveColor(newValue);
    const cssVar = `--${colorKey.replace(/_/g, '-')}`;
    document.documentElement.style.setProperty(cssVar, resolvedColor);
  }
}

// Initialize color manager when page loads
const colorManager = new ColorManager();
document.addEventListener('DOMContentLoaded', () => {
  colorManager.loadColors();
});