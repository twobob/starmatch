// ============================================================================
// Location Picker Module - Geocoding with Nominatim (OpenStreetMap)
// ============================================================================

class LocationPicker {
  constructor() {
    this.modal = null;
    this.searchInput = null;
    this.searchBtn = null;
    this.resultsList = null;
    this.selectedLocation = null;
    this.onSelect = null;
    
    this.createModal();
    this.attachEventListeners();
  }

  createModal() {
    const modalHTML = `
      <div id="location-modal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>🌍 Location Search</h2>
            <button class="modal-close" aria-label="Close">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="search-section">
              <div class="search-box">
                <input 
                  type="text" 
                  class="search-input" 
                  id="location-search-input"
                  placeholder="Enter city, hospital, or address..."
                  autocomplete="off">
                <button class="search-btn" id="location-search-btn">Search</button>
              </div>
              <div class="search-hint">
                💡 Try: "London, UK", "New York Hospital", "Tokyo, Japan", "Paris"
              </div>
            </div>
            
            <div class="results-section" id="location-results-section" style="display: none;">
              <div class="results-label">Search Results</div>
              <div class="results-list" id="location-results-list"></div>
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-secondary" id="location-cancel-btn">Cancel</button>
            <button class="btn-primary" id="location-select-btn" disabled>Use Selected Location</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    this.modal = document.getElementById('location-modal');
    this.searchInput = document.getElementById('location-search-input');
    this.searchBtn = document.getElementById('location-search-btn');
    this.resultsList = document.getElementById('location-results-list');
    this.resultsSection = document.getElementById('location-results-section');
    this.selectBtn = document.getElementById('location-select-btn');
    this.cancelBtn = document.getElementById('location-cancel-btn');
    this.closeBtn = this.modal.querySelector('.modal-close');
  }

  attachEventListeners() {
    // Close modal
    this.closeBtn.addEventListener('click', () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    
    // Click outside to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
    
    // Search
    this.searchBtn.addEventListener('click', () => this.performSearch());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });
    
    // Select location
    this.selectBtn.addEventListener('click', () => {
      if (this.selectedLocation && this.onSelect) {
        this.onSelect(this.selectedLocation);
        this.close();
      }
    });
  }

  open(callback) {
    this.onSelect = callback;
    this.modal.classList.add('active');
    this.searchInput.focus();
    this.clearResults();
    this.selectedLocation = null;
    this.selectBtn.disabled = true;
  }

  close() {
    this.modal.classList.remove('active');
    this.searchInput.value = '';
    this.clearResults();
  }

  clearResults() {
    this.resultsList.innerHTML = '';
    this.resultsSection.style.display = 'none';
    this.selectedLocation = null;
    this.selectBtn.disabled = true;
  }

  async performSearch() {
    const query = this.searchInput.value.trim();
    
    if (!query) {
      this.showError('Please enter a location to search');
      return;
    }
    
    this.showLoading();
    this.searchBtn.disabled = true;
    
    try {
      // Use Nominatim (OpenStreetMap) geocoding service
      const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 10,
        'accept-language': 'en'
      });
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Astrological-Engine-visualiser/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const results = await response.json();
      this.displayResults(results);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      this.showError('Failed to search locations. Please try again.');
    } finally {
      this.searchBtn.disabled = false;
    }
  }

  showLoading() {
    this.resultsSection.style.display = 'block';
    this.resultsList.innerHTML = '<div class="loading-spinner">Searching</div>';
  }

  showError(message) {
    this.resultsSection.style.display = 'block';
    this.resultsList.innerHTML = `<div class="error-message">${message}</div>`;
  }

  displayResults(results) {
    if (!results || results.length === 0) {
      this.resultsList.innerHTML = '<div class="no-results">No locations found. Try a different search.</div>';
      return;
    }
    
    this.resultsList.innerHTML = '';
    
    results.forEach((result, index) => {
      const item = document.createElement('div');
      item.className = 'result-item';
      item.dataset.index = index;
      
      const name = result.display_name.split(',')[0];
      const details = result.display_name;
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      
      item.innerHTML = `
        <div class="result-name">${this.formatLocationName(result)}</div>
        <div class="result-details">${this.truncateAddress(details)}</div>
        <div class="result-coords">📍 ${lat.toFixed(4)}°, ${lon.toFixed(4)}°</div>
      `;
      
      item.addEventListener('click', () => {
        this.selectResult(result, item);
      });
      
      this.resultsList.appendChild(item);
    });
  }

  formatLocationName(result) {
    // Prioritize city, town, village, or other recognizable place names
    const addr = result.address || {};
    return addr.city || addr.town || addr.village || addr.county || 
           result.display_name.split(',')[0] || 'Unknown Location';
  }

  truncateAddress(address, maxLength = 80) {
    if (address.length <= maxLength) return address;
    return address.substring(0, maxLength) + '...';
  }

  selectResult(result, element) {
    // Remove previous selection
    this.resultsList.querySelectorAll('.result-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Mark new selection
    element.classList.add('selected');
    
    this.selectedLocation = {
      name: this.formatLocationName(result),
      fullAddress: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      type: result.type,
      importance: result.importance
    };
    
    this.selectBtn.disabled = false;
  }
}

// Initialize the location picker
let locationPicker = null;

function initLocationPicker() {
  if (!locationPicker) {
    locationPicker = new LocationPicker();
  }
  return locationPicker;
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.LocationPicker = LocationPicker;
  window.initLocationPicker = initLocationPicker;
}
