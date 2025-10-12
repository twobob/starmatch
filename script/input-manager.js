// Input Manager Module
// Manages dual input system (specialised pickers vs text inputs)
// Text inputs are the single source of truth

const InputManager = {
  // Input element references
  elements: {
    // Date
    datePicker: null,
    dateText: null,
    // Time
    timePicker: null,
    timeText: null,
    // Latitude
    latPicker: null,
    latText: null,
    // Longitude
    lonPicker: null,
    lonText: null
  },

  // Current mode
  isTextMode: false,

  /**
   * Initialise the input manager
   */
  init() {
    // Get all input elements
    this.elements.datePicker = document.getElementById('birth-date');
    this.elements.dateText = document.getElementById('birth-date-text');
    this.elements.timePicker = document.getElementById('birth-time');
    this.elements.timeText = document.getElementById('birth-time-text');
    this.elements.latPicker = document.getElementById('latitude');
    this.elements.latText = document.getElementById('latitude-text');
    this.elements.lonPicker = document.getElementById('longitude');
    this.elements.lonText = document.getElementById('longitude-text');

    // Set up sync from pickers to text (when pickers change, update text)
    this.setupPickerSync();

    // Initialise text inputs with current picker values
    this.syncPickersToText();

    // Load saved mode preference
    const savedMode = StorageManager.settings.get('useTextInputs', false);
    this.setMode(savedMode);
  },

  /**
   * Set up event listeners to sync picker changes to text inputs
   */
  setupPickerSync() {
    // Date picker -> date text
    if (this.elements.datePicker && this.elements.dateText) {
      this.elements.datePicker.addEventListener('change', () => {
        const isoDate = this.elements.datePicker.value; // YYYY-MM-DD
        if (isoDate) {
          const [year, month, day] = isoDate.split('-');
          this.elements.dateText.value = `${day} ${month} ${year}`;
        }
      });
    }

    // Time picker -> time text
    if (this.elements.timePicker && this.elements.timeText) {
      this.elements.timePicker.addEventListener('change', () => {
        const isoTime = this.elements.timePicker.value; // HH:MM
        if (isoTime) {
          const [hours, minutes] = isoTime.split(':');
          this.elements.timeText.value = `${hours} ${minutes}`;
        }
      });
    }

    // Latitude picker -> latitude text
    if (this.elements.latPicker && this.elements.latText) {
      this.elements.latPicker.addEventListener('input', () => {
        const value = parseFloat(this.elements.latPicker.value);
        if (!isNaN(value)) {
          this.elements.latText.value = InputParsers.formatCoordinate(value, true);
        }
      });
    }

    // Longitude picker -> longitude text
    if (this.elements.lonPicker && this.elements.lonText) {
      this.elements.lonPicker.addEventListener('input', () => {
        const value = parseFloat(this.elements.lonPicker.value);
        if (!isNaN(value)) {
          this.elements.lonText.value = InputParsers.formatCoordinate(value, false);
        }
      });
    }
  },

  /**
   * Sync current picker values to text inputs (one-time sync)
   */
  syncPickersToText() {
    // Date
    if (this.elements.datePicker?.value && this.elements.dateText) {
      const [year, month, day] = this.elements.datePicker.value.split('-');
      this.elements.dateText.value = `${day} ${month} ${year}`;
    }

    // Time
    if (this.elements.timePicker?.value && this.elements.timeText) {
      const [hours, minutes] = this.elements.timePicker.value.split(':');
      this.elements.timeText.value = `${hours} ${minutes}`;
    }

    // Latitude
    if (this.elements.latPicker?.value && this.elements.latText) {
      const value = parseFloat(this.elements.latPicker.value);
      if (!isNaN(value)) {
        this.elements.latText.value = InputParsers.formatCoordinate(value, true);
      }
    }

    // Longitude
    if (this.elements.lonPicker?.value && this.elements.lonText) {
      const value = parseFloat(this.elements.lonPicker.value);
      if (!isNaN(value)) {
        this.elements.lonText.value = InputParsers.formatCoordinate(value, false);
      }
    }
  },

  /**
   * Set input mode (text or picker)
   * @param {boolean} useTextMode - True for text inputs, false for pickers
   */
  setMode(useTextMode) {
    this.isTextMode = useTextMode;

    // Show/hide appropriate inputs
    const pickers = document.querySelectorAll('.picker-input');
    const texts = document.querySelectorAll('.text-input');

    if (useTextMode) {
      // Show text inputs, hide pickers
      pickers.forEach(p => p.style.display = 'none');
      texts.forEach(t => t.style.display = 'block');
    } else {
      // Show pickers, hide text inputs
      pickers.forEach(p => p.style.display = 'block');
      texts.forEach(t => t.style.display = 'none');
    }
  },

  /**
   * Get the current date value (source of truth from text input)
   * @returns {string} ISO date string YYYY-MM-DD or empty string
   */
  getDate() {
    const textValue = this.elements.dateText?.value || '';
    const parsed = InputParsers.parseDate(textValue);
    return parsed ? InputParsers.toISODate(parsed) : '';
  },

  /**
   * Get the current time value (source of truth from text input)
   * @returns {string} Time string HH:MM or empty string
   */
  getTime() {
    const textValue = this.elements.timeText?.value || '';
    const parsed = InputParsers.parseTime(textValue);
    return parsed ? InputParsers.toTimeString(parsed) : '';
  },

  /**
   * Get the current latitude value (source of truth from text input)
   * @returns {number} Latitude as decimal number or null
   */
  getLatitude() {
    const textValue = this.elements.latText?.value || '';
    const parsed = InputParsers.parseCoordinate(textValue);
    return InputParsers.isValidLatitude(parsed) ? parsed : null;
  },

  /**
   * Get the current longitude value (source of truth from text input)
   * @returns {number} Longitude as decimal number or null
   */
  getLongitude() {
    const textValue = this.elements.lonText?.value || '';
    const parsed = InputParsers.parseCoordinate(textValue);
    return InputParsers.isValidLongitude(parsed) ? parsed : null;
  },

  /**
   * Set date value (updates both text and picker)
   * @param {string} isoDate - Date in YYYY-MM-DD format
   */
  setDate(isoDate) {
    if (this.elements.datePicker) {
      this.elements.datePicker.value = isoDate;
    }
    if (this.elements.dateText && isoDate) {
      const [year, month, day] = isoDate.split('-');
      this.elements.dateText.value = `${day} ${month} ${year}`;
    }
  },

  /**
   * Set time value (updates both text and picker)
   * @param {string} isoTime - Time in HH:MM format
   */
  setTime(isoTime) {
    if (this.elements.timePicker) {
      this.elements.timePicker.value = isoTime;
    }
    if (this.elements.timeText && isoTime) {
      const [hours, minutes] = isoTime.split(':');
      this.elements.timeText.value = `${hours} ${minutes}`;
    }
  },

  /**
   * Set latitude value (updates both text and picker)
   * @param {number} lat - Latitude as decimal
   */
  setLatitude(lat) {
    if (this.elements.latPicker) {
      this.elements.latPicker.value = lat;
    }
    if (this.elements.latText) {
      this.elements.latText.value = InputParsers.formatCoordinate(lat, true);
    }
  },

  /**
   * Set longitude value (updates both text and picker)
   * @param {number} lon - Longitude as decimal
   */
  setLongitude(lon) {
    if (this.elements.lonPicker) {
      this.elements.lonPicker.value = lon;
    }
    if (this.elements.lonText) {
      this.elements.lonText.value = InputParsers.formatCoordinate(lon, false);
    }
  },

  /**
   * Get all current values in the format expected by the rest of the app
   * @returns {object} {date, time, lat, lon}
   */
  getAllValues() {
    return {
      date: this.getDate(),
      time: this.getTime(),
      lat: this.getLatitude(),
      lon: this.getLongitude()
    };
  }
};

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.InputManager = InputManager;
}
