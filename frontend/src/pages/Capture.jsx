import { useState, useRef, useEffect } from 'react';
import { Camera, Send, X, RefreshCw, MapPin, Sun, Moon, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { toast, Toaster } from 'sonner';



export default function EnhancedPotholeReporter() {
  // Core states
  const [cameraActive, setCameraActive] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [imageSrc, setImageSrc] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [location, setLocation] = useState(null);
  const [isSending, setIsSending] = useState(false);

  

  

  // New states
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    camera: 'pending',
    location: 'pending'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // Dark mode effect
  useEffect(() => {
    // Check user preference initially
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);

  // Toast handler
  const showToast = (message, type = 'info') => {
    // Clear any existing timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    
    setToastMessage({ text: message, type });
    setAnimateIn(true);
    
    // Auto dismiss after 4 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setAnimateIn(false);
      setTimeout(() => setToastMessage(null), 300); // Allow time for exit animation
    }, 4000);
  };

  // Handle permissions
  const requestPermissions = async () => {
    // Request camera permission
    try {
      setPermissionStatus(prev => ({ ...prev, camera: 'requesting' }));
      await navigator.mediaDevices.getUserMedia({ video: true });
      setPermissionStatus(prev => ({ ...prev, camera: 'granted' }));
      showToast('Camera access granted', 'success');
    } catch (err) {
      setPermissionStatus(prev => ({ ...prev, camera: 'denied' }));
      showToast('Camera access denied', 'error');
    }

    // Request location permission
    try {
      setPermissionStatus(prev => ({ ...prev, location: 'requesting' }));
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              timestamp: new Date().toISOString()
            };
            setLocation(coords);
            resolve(coords);
          },
          (err) => reject(err),
          { enableHighAccuracy: true }
        );
      });
      setPermissionStatus(prev => ({ ...prev, location: 'granted' }));
      showToast('Location access granted', 'success');
    } catch (err) {
      setPermissionStatus(prev => ({ ...prev, location: 'denied' }));
      showToast('Location access denied', 'error');
    }

    // Check if both permissions are granted
    setTimeout(() => {
      if (permissionStatus.camera === 'granted' && permissionStatus.location === 'granted') {
        setPermissionsGranted(true);
      }
    }, 500);
  };

  // Update permissions check when status changes
  useEffect(() => {
    if (permissionStatus.camera === 'granted' && permissionStatus.location === 'granted') {
      setPermissionsGranted(true);
    }
  }, [permissionStatus]);

  // Camera controls
  const startCamera = async () => {
    if (!location) {
      showToast('Location not available yet', 'error');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
  
      streamRef.current = stream;
      setCameraActive(true);
      
      // Delay assigning srcObject until video is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
      
      showToast('Camera started', 'info');
    } catch (err) {
      showToast(`Camera error: ${err.message}`, 'error');
    }
  };
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
    showToast('Camera stopped', 'info');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) {
        showToast('Failed to capture image', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      setImageBlob(blob);
      setImageSrc(url);
      setPhotoTaken(true);
      stopCamera();
      showToast('Photo captured successfully', 'success');
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc('');
    setImageBlob(null);
    setPhotoTaken(false);
    startCamera();
  };

  const discardPhoto = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc('');
    setImageBlob(null);
    setPhotoTaken(false);
    showToast('Photo discarded', 'info');
  };

  const sendReport = async () => {
    if (!imageBlob || !location) {
      showToast('Missing photo or location', 'error');
      return;
    }
    try {
      setIsSending(true);
      const formData = new FormData();
      formData.append('image', imageBlob, 'pothole.jpg');
      formData.append('latitude', location.latitude);
      formData.append('longitude', location.longitude);
      formData.append('accuracy', location.accuracy);
      formData.append('timestamp', location.timestamp);
      
      // Simulate request
      let status = false
          let dt = {}
          const dummy =  await new Promise ((resolve)=>{
    
              toast.promise(new Promise((resolve,reject)=>{
                fetch("http://localhost:8080/analyse", {
                  method: "POST",
                  body: formData,
                }).then((resp) => resp.json())
                .then((data)=>{
                  if(data.err){
                    throw new Error(data.err)
                  }
                  resolve(data)
                })
                .catch((err)=> reject(err))
              }),{
                loading: "Analysing the image...",
                success: (data)=>{
                  status = true
                  dt = data
                  alert(JSON.stringify(dt))
                  resolve()
                  return (`Image processed successfully`)
                },
                error: (err) => {
                  resolve()
                  return (`${err}`)
                },
              })
            }) 
            console.log("i must be second")
      
      setPhotoTaken(false);
      setImageSrc('');
      setImageBlob(null);
    } catch (err) {
      showToast(`Failed to send: ${err.message}`, 'error');
    } finally {
      setIsSending(false);
    }

    


  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  // Generate container classes based on theme
  const containerClasses = `min-h-screen w-full transition-colors duration-300 ${
    darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
  }`;

  const cardClasses = `p-6 max-w-md mx-auto rounded-xl shadow-lg transition-all duration-300 ${
    darkMode ? 'bg-gray-800 shadow-gray-800/30' : 'bg-white shadow-gray-200/50'
  }`;

  // Toast classes
  const toastTypeClasses = {
    success: darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-800 border-green-500',
    error: darkMode ? 'bg-red-800 text-red-100' : 'bg-red-100 text-red-800 border-red-500',
    info: darkMode ? 'bg-blue-800 text-blue-100' : 'bg-blue-100 text-blue-800 border-blue-500',
  };

  // Button style classes
  const buttonBaseClasses = "p-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2";
  const buttonStyles = {
    primary: `${buttonBaseClasses} ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`,
    danger: `${buttonBaseClasses} ${darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`,
    success: `${buttonBaseClasses} ${darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`,
    warning: `${buttonBaseClasses} ${darkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-amber-500 hover:bg-amber-600'} text-white`,
    secondary: `${buttonBaseClasses} ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'}`,
    icon: `p-2 rounded-full transition-all duration-200 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'}`
  };

  return (
    <div className={containerClasses}>
     <Toaster position='bottom-right'/>
      <div className="w-full max-w-3xl mx-auto py-6 px-4">
        {/* Header */}
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            <span>Pothole Reporter</span>
          </h1>
          <button 
            onClick={toggleTheme}
            className={buttonStyles.icon}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Main content */}
        <div className={cardClasses}>
          {/* Permissions screen */}
          {!permissionsGranted && (
            <div className="flex flex-col gap-6">
              <div className="text-center">
                <div className="mb-4 mx-auto p-3 rounded-full inline-flex items-center justify-center bg-blue-100 text-blue-600">
                  <Info size={32} />
                </div>
                <h2 className="text-xl font-semibold mb-2">Welcome to Pothole Reporter</h2>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Help improve your community by reporting potholes. We need access to your camera and location to make this work.
                </p>
              </div>
              
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h3 className="font-medium mb-2">Required Permissions:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <div className={`mt-1 ${permissionStatus.camera === 'granted' ? 'text-green-500' : permissionStatus.camera === 'denied' ? 'text-red-500' : 'text-gray-400'}`}>
                      {permissionStatus.camera === 'granted' ? <CheckCircle size={16} /> : 
                       permissionStatus.camera === 'denied' ? <AlertCircle size={16} /> : <Info size={16} />}
                    </div>
                    <div>
                      <p className="font-medium">Camera Access</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        To take photos of potholes
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className={`mt-1 ${permissionStatus.location === 'granted' ? 'text-green-500' : permissionStatus.location === 'denied' ? 'text-red-500' : 'text-gray-400'}`}>
                      {permissionStatus.location === 'granted' ? <CheckCircle size={16} /> : 
                       permissionStatus.location === 'denied' ? <AlertCircle size={16} /> : <Info size={16} />}
                    </div>
                    <div>
                      <p className="font-medium">Location Access</p>
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        To know where the pothole is located
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={requestPermissions} 
                className={buttonStyles.primary}
                disabled={permissionStatus.camera === 'requesting' || permissionStatus.location === 'requesting'}
              >
                {(permissionStatus.camera === 'requesting' || permissionStatus.location === 'requesting') ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} />
                    Requesting Permissions...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Grant Permissions
                  </>
                )}
              </button>
            </div>
          )}

          {/* Main app content */}
          {permissionsGranted && (
            <>
              {/* Camera/Image View */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
                {!photoTaken && cameraActive && (
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                )}
                
                {photoTaken && (
                  <img src={imageSrc} className="w-full h-full object-contain" alt="Captured pothole" />
                )}
                
                {!photoTaken && !cameraActive && (
                  <div className="w-full h-full flex items-center justify-center text-white text-lg">
                    <Camera size={36} className="opacity-50" />
                  </div>
                )}

                {/* Location info overlay */}
                {location && (
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-mono bg-black/60 text-white`}>
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    <span className="ml-1 opacity-70">±{Math.round(location.accuracy)}m</span>
                  </div>
                )}
              </div>

              {/* Camera controls */}
              <div className="grid gap-3">
                {/* Camera toggle controls */}
                {!photoTaken && (
                  <div className="grid grid-cols-1 gap-3">
                    {!cameraActive ? (
                      <button
                        onClick={startCamera}
                        className={buttonStyles.primary}
                      >
                        <Camera size={18} />
                        Start Camera
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={stopCamera}
                          className={buttonStyles.secondary}
                        >
                          <X size={18} />
                          Stop Camera
                        </button>
                        <button
                          onClick={capturePhoto}
                          className={buttonStyles.warning}
                        >
                          <Camera size={18} />
                          Capture Photo
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Photo actions */}
                {photoTaken && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={discardPhoto}
                        className={buttonStyles.danger}
                      >
                        <Trash2 size={18} />
                        Discard
                      </button>
                      <button
                        onClick={retakePhoto}
                        className={buttonStyles.secondary}
                      >
                        <Camera size={18} />
                        Retake
                      </button>
                    </div>
                    <button
                      onClick={sendReport}
                      disabled={isSending}
                      className={buttonStyles.success}
                    >
                      {isSending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                      {isSending ? 'Sending Report...' : 'Submit Report'}
                    </button>
                  </div>
                )}
              </div>

              {/* App description */}
              <div className={`mt-6 p-4 rounded-lg text-sm ${darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                <h3 className="font-medium mb-2 flex items-center gap-1">
                  <Info size={16} />
                  How it works
                </h3>
                <ol className="list-decimal list-inside space-y-1 ml-1">
                  <li>Start the camera and point it at a pothole</li>
                  <li>Capture a clear image of the road damage</li>
                  <li>Submit the report with the precise location</li>
                  <li>Local authorities will be notified to fix it</li>
                </ol>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className={`mt-8 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>© {new Date().getFullYear()} Pothole Reporter App</p>
          <p className="mt-1">Help make our roads safer for everyone</p>
        </footer>
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className={`fixed bottom-4 right-4 left-4 md:left-auto md:w-80 p-3 rounded-lg shadow-lg border-l-4 transition-all duration-300 flex items-center ${
          toastTypeClasses[toastMessage.type]
        } ${
          animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <div className="mr-3">
            {toastMessage.type === 'success' && <CheckCircle size={18} />}
            {toastMessage.type === 'error' && <AlertCircle size={18} />}
            {toastMessage.type === 'info' && <Info size={18} />}
          </div>
          <p>{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
}