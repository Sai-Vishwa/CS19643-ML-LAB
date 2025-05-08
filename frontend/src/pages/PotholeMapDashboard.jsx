import { useState, useRef, useEffect } from 'react';
import { MapPin, Sun, Moon, Layers, Map, List, BarChart2, ChevronDown, Info, Plus, Minus, Compass } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function PotholeMapDashboard() {
  // Core states
  const [darkMode, setDarkMode] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapObject, setMapObject] = useState(null);
  const [markerLayer, setMarkerLayer] = useState(null);
  const [activeView, setActiveView] = useState('map'); // 'map' or 'list'
  const [mapZoom, setMapZoom] = useState(13);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [heatmapLayer, setHeatmapLayer] = useState(null);

  // Refs
  const mapContainerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Sample pothole data - in a real app this would come from an API
  const potholeData = [
    { id: 1, lat: 40.7128, lng: -74.006, count: 5, severity: 'high', reportDate: '2025-04-15' },
    { id: 2, lat: 40.7138, lng: -74.008, count: 3, severity: 'medium', reportDate: '2025-04-14' },
    { id: 3, lat: 40.7118, lng: -74.010, count: 7, severity: 'high', reportDate: '2025-04-12' },
    { id: 4, lat: 40.7108, lng: -74.004, count: 2, severity: 'low', reportDate: '2025-04-10' },
    { id: 5, lat: 40.7148, lng: -74.012, count: 4, severity: 'medium', reportDate: '2025-04-08' },
    { id: 6, lat: 40.7158, lng: -74.007, count: 6, severity: 'high', reportDate: '2025-04-05' },
    { id: 7, lat: 40.7098, lng: -74.005, count: 1, severity: 'low', reportDate: '2025-04-02' },
    { id: 8, lat: 40.7078, lng: -74.009, count: 8, severity: 'high', reportDate: '2025-03-30' },
    { id: 9, lat: 40.7168, lng: -74.011, count: 3, severity: 'medium', reportDate: '2025-03-25' },
    { id: 10, lat: 40.7188, lng: -74.003, count: 5, severity: 'high', reportDate: '2025-03-20' }
  ];

  // Dark mode effect
  useEffect(() => {
    // Check user preference initially
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Function to load Leaflet scripts
  const loadLeafletScripts = () => {
    if (scriptLoadedRef.current) return Promise.resolve();

    return new Promise((resolve, reject) => {
      // Load CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.async = true;
      script.onload = () => {
        // Load Leaflet heat plugin after main Leaflet loads
        const heatScript = document.createElement('script');
        heatScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
        heatScript.async = true;
        heatScript.onload = () => {
          scriptLoadedRef.current = true;
          resolve();
        };
        heatScript.onerror = reject;
        document.body.appendChild(heatScript);
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  // Initialize map only when active view is map
  useEffect(() => {
    if (!mapContainerRef.current || activeView !== 'map') return;

    loadLeafletScripts()
      .then(() => {
        // Create map if Leaflet is loaded and map doesn't exist yet
        if (window.L && !mapObject && mapContainerRef.current) {
          // Initialize the map
          const map = window.L.map(mapContainerRef.current).setView([40.7128, -74.006], mapZoom);
          
          // Add the base tile layer
          const tileLayer = window.L.tileLayer(
            darkMode 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution: darkMode 
                ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19
            }
          ).addTo(map);

          // Create markers layer group
          const markers = window.L.layerGroup().addTo(map);
          
          // Save references
          setMapObject(map);
          setMarkerLayer(markers);
          setMapLoaded(true);
          
          // Update zoom when it changes
          map.on('zoomend', () => {
            setMapZoom(map.getZoom());
          });
          
          // Notify user
          toast.success("Map loaded successfully!");
        }
      })
      .catch(err => {
        toast.error("Failed to load map: " + err.message);
      });
      
    // Cleanup when switching to list view or unmounting
    return () => {
      if (mapObject && activeView !== 'map') {
        mapObject.remove();
        setMapObject(null);
        setMarkerLayer(null);
        setMapLoaded(false);
      }
    };
  }, [mapContainerRef.current, activeView]);

  // Update map when dark mode changes (only if map is active)
  useEffect(() => {
    if (mapObject && window.L && activeView === 'map') {
      // Remove the current tile layer
      mapObject.eachLayer(layer => {
        if (layer instanceof window.L.TileLayer) {
          mapObject.removeLayer(layer);
        }
      });
      
      // Add the new tile layer based on dark mode
      window.L.tileLayer(
        darkMode 
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution: darkMode 
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }
      ).addTo(mapObject);
    }
  }, [darkMode, mapObject, activeView]);

  // Update markers when map and data are ready (only if map view is active)
  useEffect(() => {
    if (mapLoaded && markerLayer && window.L && activeView === 'map') {
      // Clear existing markers
      markerLayer.clearLayers();
      
      // Remove heatmap if exists
      if (heatmapLayer) {
        mapObject.removeLayer(heatmapLayer);
        setHeatmapLayer(null);
      }

      // If heatmap is active, add heatmap layer
      if (heatmapActive && window.L.heatLayer) {
        const heatData = potholeData.map(point => [
          point.lat, 
          point.lng, 
          point.count * 0.5 // Intensity factor
        ]);
        
        const heat = window.L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 15,
          gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
        }).addTo(mapObject);
        
        setHeatmapLayer(heat);
      } else {
        // Add individual markers
        potholeData.forEach(point => {
          // Define marker color based on severity
          const markerColor = point.severity === 'high' ? '#ef4444' : 
                            point.severity === 'medium' ? '#f59e0b' : '#22c55e';
          
          // Create custom marker
          const marker = window.L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: markerColor,
            color: darkMode ? '#fff' : '#000',
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(markerLayer);
          
          // Add popup
          marker.bindPopup(`
            <div class="p-2">
              <strong>Pothole #${point.id}</strong><br>
              Reports: ${point.count}<br>
              Severity: ${point.severity}<br>
              Last reported: ${point.reportDate}
            </div>
          `);
          
          // Add hover tooltip showing count
          marker.bindTooltip(`${point.count} reports`, {
            permanent: false,
            direction: 'top',
            className: darkMode ? 'dark-tooltip' : 'light-tooltip'
          });
        });
      }
    }
  }, [mapLoaded, markerLayer, potholeData, darkMode, heatmapActive, activeView]);
  
  // Add custom CSS for tooltips when dark mode changes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dark-tooltip {
        background-color: #1f2937;
        color: #f3f4f6;
        border: 1px solid #4b5563;
      }
      .light-tooltip {
        background-color: #ffffff;
        color: #111827;
        border: 1px solid #d1d5db;
      }
    `;
    
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const toggleHeatmap = () => {
    setHeatmapActive(!heatmapActive);
  };

  const zoomIn = () => {
    if (mapObject) mapObject.zoomIn();
  };

  const zoomOut = () => {
    if (mapObject) mapObject.zoomOut();
  };

  const recenter = () => {
    if (mapObject) mapObject.setView([40.7128, -74.006], 13);
  };

  // Generate container classes based on theme
  const containerClasses = `min-h-screen w-full transition-colors duration-300 ${
    darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
  }`;
  
  const cardClasses = `p-4 rounded-xl shadow-lg transition-all duration-300 ${
    darkMode ? 'bg-gray-800 shadow-gray-800/30' : 'bg-white shadow-gray-200/50'
  }`;
  
  // Button style classes
  const buttonBaseClasses = "p-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const buttonStyles = {
    primary: `${buttonBaseClasses} ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`,
    secondary: `${buttonBaseClasses} ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'}`,
    success: `${buttonBaseClasses} ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`,
    warning: `${buttonBaseClasses} ${darkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`,
    danger: `${buttonBaseClasses} ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`,
    icon: `p-2 rounded-full transition-all duration-200 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'}`
  };

  return (
    <div className={containerClasses}>
      <Toaster position="bottom-right" />
      
      <div className="w-full h-screen flex flex-col">
        {/* Header */}
        <header className="px-4 py-3 border-b flex justify-between items-center shadow-sm z-10 
                         transition-colors duration-300 sticky top-0
                         ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}">
          <div className="flex items-center gap-2">
            <MapPin size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            <h1 className="text-xl font-bold">
              Pothole Map Dashboard
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex border overflow-hidden rounded-lg">
              <button 
                onClick={() => setActiveView('map')}
                className={`px-3 py-1.5 flex items-center transition-colors ${
                  activeView === 'map' 
                    ? darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800' 
                    : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                }`}
              >
                <Map size={16} className="mr-1" />
                Map
              </button>
              <button 
                onClick={() => setActiveView('list')}
                className={`px-3 py-1.5 flex items-center transition-colors ${
                  activeView === 'list' 
                    ? darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800' 
                    : darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
                }`}
              >
                <List size={16} className="mr-1" />
                List
              </button>
            </div>
            <button 
              onClick={toggleTheme}
              className={buttonStyles.icon}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'map' ? (
            <div className="relative h-full">
              {/* Map container - only render when in map view */}
              <div ref={mapContainerRef} className="w-full h-full z-0"></div>
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                <button 
                  onClick={zoomIn}
                  className={`${buttonStyles.icon} w-8 h-8 flex items-center justify-center shadow-md`}
                  aria-label="Zoom in"
                >
                  <Plus size={18} />
                </button>
                <button 
                  onClick={zoomOut}
                  className={`${buttonStyles.icon} w-8 h-8 flex items-center justify-center shadow-md`}
                  aria-label="Zoom out"
                >
                  <Minus size={18} />
                </button>
                <button 
                  onClick={recenter}
                  className={`${buttonStyles.icon} w-8 h-8 flex items-center justify-center shadow-md`}
                  aria-label="Recenter map"
                >
                  <Compass size={18} />
                </button>
                <button 
                  onClick={toggleHeatmap}
                  className={`w-8 h-8 flex items-center justify-center shadow-md rounded-full
                         ${heatmapActive 
                           ? darkMode ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                           : buttonStyles.icon}`}
                  aria-label="Toggle heatmap"
                >
                  <Layers size={18} />
                </button>
              </div>
              
              {/* Legend */}
              <div className={`absolute bottom-4 left-4 ${cardClasses} z-10 max-w-xs`}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Legend</h3>
                  <button 
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className="text-sm flex items-center gap-1"
                  >
                    {isInfoExpanded ? 'Less info' : 'More info'}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform ${isInfoExpanded ? 'rotate-180' : ''}`} 
                    />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    <span>High Severity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span>Medium Severity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span>Low Severity</span>
                  </div>
                  
                  {heatmapActive && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-3 bg-gradient-to-r from-blue-500 via-lime-500 to-red-500 rounded"></div>
                      <span>Heat intensity</span>
                    </div>
                  )}
                </div>
                
                {isInfoExpanded && (
                  <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-sm mb-2"><strong>About this map:</strong></p>
                    <ul className="text-xs space-y-1 list-disc pl-4">
                      <li>Each point represents a pothole location</li>
                      <li>Hover over points to see report counts</li>
                      <li>Click points for detailed information</li>
                      <li>Toggle heatmap to see concentration areas</li>
                      <li>Total potholes shown: {potholeData.length}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className={cardClasses}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Pothole Reports List</h2>
                  <div className="flex items-center gap-2">
                    <BarChart2 size={18} />
                    <span className="font-medium">Total: {potholeData.length}</span>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className={`w-full border-collapse ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    <thead>
                      <tr className={darkMode ? 'bg-gray-700' : 'bg-gray-100'}>
                        <th className="py-2 px-3 text-left">ID</th>
                        <th className="py-2 px-3 text-left">Location</th>
                        <th className="py-2 px-3 text-left">Reports</th>
                        <th className="py-2 px-3 text-left">Severity</th>
                        <th className="py-2 px-3 text-left">Last Report</th>
                      </tr>
                    </thead>
                    <tbody>
                      {potholeData.map(pothole => (
                        <tr key={pothole.id} className={`border-t ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <td className="py-3 px-3">#{pothole.id}</td>
                          <td className="py-3 px-3">{pothole.lat.toFixed(4)}, {pothole.lng.toFixed(4)}</td>
                          <td className="py-3 px-3">{pothole.count}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                         ${pothole.severity === 'high' 
                                           ? 'bg-red-100 text-red-800' 
                                           : pothole.severity === 'medium'
                                             ? 'bg-amber-100 text-amber-800'
                                             : 'bg-green-100 text-green-800'
                                         }`}>
                              {pothole.severity}
                            </span>
                          </td>
                          <td className="py-3 px-3">{pothole.reportDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
        
        {/* Footer */}
        <footer className={`py-3 px-4 text-center text-sm border-t transition-colors duration-300
                         ${darkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'}`}>
          <p>© {new Date().getFullYear()} Pothole Tracking System</p>
          <p className="mt-1">Help your community by reporting road hazards</p>
        </footer>
      </div>
    </div>
  );
}