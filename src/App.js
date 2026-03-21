import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  LayerGroup,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from 'react-leaflet';
import L from 'leaflet';
import Cropper from 'react-easy-crop';
import 'leaflet/dist/leaflet.css';
import './App.css';

const CALAMBA_CENTER = [14.2115, 121.1653];
const USERS_KEY = 'calambiyahe-users';
const SESSION_KEY = 'calambiyahe-session';

const JEEPNEY_ROUTES = [
  {
    id: 'crossing-parian',
    name: 'Crossing -> Parian',
    stops: ['Crossing Terminal', 'SM Calamba', 'National Hwy', 'Parian Plaza'],
    instructions: [
      'Wait at the 7-Eleven side of Crossing, facing south.',
      'Ride the Parian-bound jeepney with yellow route card.',
      'Drop off at Parian Plaza and walk 2 minutes to the barangay hall.',
    ],
  },
  {
    id: 'market-crossing',
    name: 'Market -> Crossing',
    stops: ['Calamba Market', 'Real St', 'City Hall', 'Crossing'],
    instructions: [
      'Wait at the east gate of Calamba Market near the tricycle lane.',
      'Take the Crossing route jeepney from Real St.',
      'Alight at Crossing footbridge northbound side.',
    ],
  },
  {
    id: 'crossing-canlubang',
    name: 'Crossing -> Canlubang',
    stops: ['Crossing', 'Checkpoint', 'Canlubang Gate 1', 'Canlubang Bayan'],
    instructions: [
      'Queue beside the Crossing overpass south lane.',
      'Board jeepney with Canlubang signboard.',
      'Get off at Canlubang Bayan waiting shed.',
    ],
  },
];

const HOTSPOTS = [
  { id: 1, name: 'Calamba Crossing', coords: [14.2088, 121.1652], count: 18 },
  { id: 2, name: 'Calamba Market', coords: [14.2124, 121.1643], count: 13 },
  { id: 3, name: 'City Plaza', coords: [14.2112, 121.1671], count: 9 },
  { id: 4, name: 'SM Calamba', coords: [14.2151, 121.1651], count: 11 },
  { id: 5, name: 'Parian Rd', coords: [14.2034, 121.1628], count: 7 },
  { id: 6, name: 'Real St', coords: [14.2102, 121.1634], count: 8 },
];

const PRESET_HAZARDS = [
  {
    id: 101,
    type: 'Pothole',
    description: 'Deep pothole near pedestrian crossing',
    coords: [14.2101, 121.1633],
    location: 'Real St',
    timestamp: '9:04 AM',
  },
  {
    id: 102,
    type: 'Flood',
    description: 'Knee-deep flood after drainage overflow',
    coords: [14.2082, 121.1667],
    location: 'Crossing Southbound',
    timestamp: '8:48 AM',
  },
  {
    id: 103,
    type: 'Debris',
    description: 'Fallen branches on right lane',
    coords: [14.2047, 121.1613],
    location: 'Parian Rd',
    timestamp: '8:32 AM',
  },
];

const GPS_MOCK_PATH = [
  [14.2089, 121.1654],
  [14.2098, 121.166],
  [14.2109, 121.1657],
  [14.2118, 121.1648],
];

const gpsIcon = L.divIcon({
  className: '',
  html: '<div class="gps-pulse"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const hazardIcon = (isNew) =>
  L.divIcon({
    className: '',
    html: `<div class="hazard-pin ${isNew ? 'new-hazard' : ''}">⚠</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 20],
  });

function getHeatColor(count) {
  if (count >= 16) return '#1967d2';
  if (count >= 11) return '#4986dc';
  return '#9ebce9';
}

function formatNow() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState('');
  const [authUser, setAuthUser] = useState(() => loadSession());

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'Commuter',
  });

  const [activeRole, setActiveRole] = useState(authUser?.role || 'Commuter');
  const [activeScreen, setActiveScreen] = useState('home');
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [routeQuery, setRouteQuery] = useState('');
  const [broadcastOn, setBroadcastOn] = useState(false);
  const [locationMode, setLocationMode] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Location broadcast is off.');
  const [realCoords, setRealCoords] = useState(null);
  const [gpsIdx, setGpsIdx] = useState(0);
  const watchIdRef = useRef(null);

  const [hotspots, setHotspots] = useState(HOTSPOTS);
  const [hazards, setHazards] = useState(PRESET_HAZARDS);
  const [recentReports, setRecentReports] = useState(PRESET_HAZARDS.slice().reverse());

  const [showModal, setShowModal] = useState(false);
  const [hazardType, setHazardType] = useState('Pothole');
  const [hazardDescription, setHazardDescription] = useState('');
  const [hazardPhoto, setHazardPhoto] = useState(null);
  const [profilePhotoError, setProfilePhotoError] = useState('');
  const [pendingProfilePhoto, setPendingProfilePhoto] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const [croppedPixels, setCroppedPixels] = useState(null);

  const firstName = useMemo(() => {
    const baseName = authUser?.fullName?.trim();
    if (!baseName) return 'Commuter';
    return baseName.split(' ')[0];
  }, [authUser]);

  useEffect(() => {
    if (!broadcastOn || locationMode === 'real') return undefined;
    const timer = setInterval(() => {
      setGpsIdx((idx) => (idx + 1) % GPS_MOCK_PATH.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [broadcastOn, locationMode]);

  useEffect(() => {
    if (!broadcastOn || locationMode !== 'real') {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return undefined;
    }

    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not available. Using simulated location.');
      setLocationMode('mock');
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setRealCoords([position.coords.latitude, position.coords.longitude]);
        setLocationStatus('Broadcasting your live location.');
      },
      () => {
        setLocationStatus('Location access failed. Using simulated location.');
        setLocationMode('mock');
      },
      { enableHighAccuracy: true, maximumAge: 4000, timeout: 10000 }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [broadcastOn, locationMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHotspots((prev) =>
        prev.map((spot) => {
          const change = Math.floor(Math.random() * 5) - 2;
          const nextCount = Math.min(24, Math.max(3, spot.count + change));
          return { ...spot, count: nextCount };
        })
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (authUser?.role) {
      setActiveRole(authUser.role);
      setShowRoleMenu(false);
      setShowProfileMenu(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!showCropModal) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showCropModal]);

  const matchedRoute = useMemo(() => {
    const q = routeQuery.trim().toLowerCase();
    if (!q) return null;
    return (
      JEEPNEY_ROUTES.find((r) => r.name.toLowerCase() === q) ||
      JEEPNEY_ROUTES.find((r) => r.name.toLowerCase().includes(q))
    );
  }, [routeQuery]);

  const topDemand = useMemo(
    () => [...hotspots].sort((a, b) => b.count - a.count).slice(0, 3),
    [hotspots]
  );

  const driverAlert = useMemo(() => {
    const danger = hazards.find((h) => h.location.includes('Real St'));
    if (!danger) return null;
    return 'Hazard on Real St. Suggested reroute: Parian Rd';
  }, [hazards]);

  const gpsCoords =
    locationMode === 'real' ? realCoords : GPS_MOCK_PATH[gpsIdx % GPS_MOCK_PATH.length];

  function handleThemeSwitch(checked) {
    setDarkMode(checked);
  }

  function handleSendSignal() {
    setActiveRole('Commuter');
    setActiveScreen('map');
    if (!broadcastOn) {
      handleBroadcastToggle();
      return;
    }
    setLocationStatus('Broadcasting your live location.');
  }

  function handleBroadcastToggle() {
    if (broadcastOn) {
      setBroadcastOn(false);
      setLocationStatus('Location broadcast is off.');
      return;
    }

    if (!locationMode) {
      const useRealLocation = window.confirm(
        'Allow CalamBiyahe to use your real location for broadcast?'
      );
      setLocationMode(useRealLocation ? 'real' : 'mock');
      setLocationStatus(
        useRealLocation
          ? 'Requesting access to your location...'
          : 'Broadcasting simulated location only.'
      );
    } else if (locationMode === 'real') {
      setLocationStatus('Requesting access to your location...');
    } else {
      setLocationStatus('Broadcasting simulated location only.');
    }

    setBroadcastOn(true);
  }

  function handlePhotoFile(file) {
    setHazardPhoto((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      if (!file) return null;
      return {
        name: file.name,
        url: URL.createObjectURL(file),
      };
    });
  }

  function handleCloseModal() {
    setShowModal(false);
    setHazardType('Pothole');
    setHazardDescription('');
    handlePhotoFile(null);
  }

  function handleLoginSubmit(event) {
    event.preventDefault();
    setAuthError('');

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) {
      setAuthError('Enter both email and password.');
      return;
    }

    const users = loadUsers();
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      setAuthError('Invalid credentials.');
      return;
    }

    const session = {
      fullName: found.fullName,
      email: found.email,
      role: found.role,
      avatarUrl: found.avatarUrl || null,
    };
    saveSession(session);
    setAuthUser(session);
    setLoginForm({ email: '', password: '' });
  }

  function handleSignupSubmit(event) {
    event.preventDefault();
    setAuthError('');

    const fullName = signupForm.fullName.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password;
    const role = signupForm.role;

    if (!fullName || !email || !password || !role) {
      setAuthError('Complete all signup fields, including your role.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
      setAuthError('Email already registered. Please log in.');
      return;
    }

    const newUser = { fullName, email, password, role, avatarUrl: null };
    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);

    const session = {
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: newUser.avatarUrl,
    };
    saveSession(session);
    setAuthUser(session);
    setSignupForm({ fullName: '', email: '', password: '', role: 'Commuter' });
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function cropImageFromPixels(imageSrc, pixelCrop) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const outputSize = 512;
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas is not available.'));
          return;
        }

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          outputSize,
          outputSize
        );

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      image.onerror = () => reject(new Error('Unable to crop image.'));
      image.src = imageSrc;
    });
  }

  const onCropComplete = useCallback((_croppedArea, areaPixels) => {
    setCroppedPixels(areaPixels);
  }, []);

  async function handleProfilePhotoSelect(file) {
    if (!file || !authUser?.email) return;
    setProfilePhotoError('');

    if (!file.type.startsWith('image/')) {
      setProfilePhotoError('Please select a valid image file.');
      return;
    }

    // Keep image sizes manageable to avoid localStorage quota issues.
    if (file.size > 2 * 1024 * 1024) {
      setProfilePhotoError('Image is too large. Please use an image smaller than 2MB.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCropSourceImage(dataUrl);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setCroppedPixels(null);
      setShowCropModal(true);
    } catch {
      setProfilePhotoError('Failed to load image. Please try another photo.');
    }
  }

  async function handleConfirmCrop() {
    if (!cropSourceImage || !croppedPixels) {
      setProfilePhotoError('Move and zoom the image before applying crop.');
      return;
    }

    try {
      const cropped = await cropImageFromPixels(cropSourceImage, croppedPixels);
      setPendingProfilePhoto(cropped);
      setShowCropModal(false);
      setCropSourceImage(null);
    } catch {
      setProfilePhotoError('Unable to crop this image. Please try another photo.');
    }
  }

  function handleCancelCrop() {
    setShowCropModal(false);
    setCropSourceImage(null);
    setCroppedPixels(null);
  }

  function applyPendingProfilePhoto() {
    if (!authUser?.email || !pendingProfilePhoto) return;
    setProfilePhotoError('');

    setAuthUser((prev) => {
      if (!prev) return prev;
      const nextSession = { ...prev, avatarUrl: pendingProfilePhoto };
      saveSession(nextSession);
      return nextSession;
    });

    const users = loadUsers();
    const nextUsers = users.map((user) =>
      user.email === authUser.email ? { ...user, avatarUrl: pendingProfilePhoto } : user
    );
    saveUsers(nextUsers);
    setPendingProfilePhoto(null);
  }

  function cancelPendingProfilePhoto() {
    setPendingProfilePhoto(null);
    setProfilePhotoError('');
  }

  function handleRemoveProfilePhoto() {
    if (!authUser?.email) return;
    setProfilePhotoError('');
    setPendingProfilePhoto(null);

    setAuthUser((prev) => {
      if (!prev) return prev;
      const nextSession = { ...prev, avatarUrl: null };
      saveSession(nextSession);
      return nextSession;
    });

    const users = loadUsers();
    const nextUsers = users.map((user) =>
      user.email === authUser.email ? { ...user, avatarUrl: null } : user
    );
    saveUsers(nextUsers);
  }

  function logout() {
    clearSession();
    setAuthUser(null);
    setAuthMode('login');
    setAuthError('');
  }

  function submitHazardReport() {
    const trimmed = hazardDescription.trim();
    if (!trimmed) return;

    const hotspot = hotspots[Math.floor(Math.random() * hotspots.length)];
    const jitterLat = hotspot.coords[0] + (Math.random() - 0.5) * 0.0026;
    const jitterLng = hotspot.coords[1] + (Math.random() - 0.5) * 0.0026;

    const report = {
      id: Date.now(),
      type: hazardType,
      description: trimmed,
      coords: [jitterLat, jitterLng],
      location: hotspot.name,
      timestamp: formatNow(),
      isNew: true,
      photoUrl: hazardPhoto?.url || null,
      photoName: hazardPhoto?.name || null,
    };

    setHazards((prev) => [report, ...prev]);
    setRecentReports((prev) => [report, ...prev].slice(0, 8));
    setHazardDescription('');
    setHazardType('Pothole');
    setShowModal(false);
    handlePhotoFile(null);

    setTimeout(() => {
      setHazards((prev) => prev.map((h) => (h.id === report.id ? { ...h, isNew: false } : h)));
    }, 5000);
  }

  return (
    <div className="app-root">
      <div className={`phone-shell ${darkMode ? 'theme-dark' : ''}`}>
        {!authUser ? (
          <AuthGate
            authMode={authMode}
            setAuthMode={setAuthMode}
            loginForm={loginForm}
            setLoginForm={setLoginForm}
            signupForm={signupForm}
            setSignupForm={setSignupForm}
            onLoginSubmit={handleLoginSubmit}
            onSignupSubmit={handleSignupSubmit}
            authError={authError}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />
        ) : (
          <>
            <div className="page-content">
              <header className="menu-header">
                <div className="menu-logo-row">
                  <div className="menu-logo-badge">🛺</div>
                  <h1 className="menu-logo-text">
                    <span className="menu-logo-blue">CALAMBI</span>
                    <span className="menu-logo-gold">YAHE</span>
                  </h1>
                </div>
                <div className="profile-menu-wrap">
                  <button
                    type="button"
                    className="menu-avatar profile-avatar-button"
                    aria-label="Open profile menu"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                  >
                    {authUser.avatarUrl ? (
                      <img src={authUser.avatarUrl} alt="Profile" className="menu-avatar-image" />
                    ) : (
                      authUser.fullName?.[0]?.toUpperCase() || 'U'
                    )}
                  </button>
                  {showProfileMenu ? (
                    <div className="profile-menu-popover">
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={() => {
                          setActiveScreen('profile');
                          setShowProfileMenu(false);
                        }}
                      >
                        View Profile
                      </button>
                      <div className="profile-menu-item profile-menu-item-static profile-theme-row">
                        <span className="profile-theme-label">Dark</span>
                        <button
                          type="button"
                          className={`switch-track ${darkMode ? 'switch-on' : 'switch-off'}`}
                          onClick={() => handleThemeSwitch(!darkMode)}
                          aria-label="Toggle dark mode"
                        >
                          <span className={`switch-thumb ${darkMode ? 'thumb-on' : ''}`} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="profile-menu-item"
                        onClick={logout}
                      >
                        Logout
                      </button>
                    </div>
                  ) : null}
                </div>
              </header>

              <section className="menu-role-row">
                <p className="menu-role-label">Mode:</p>
                <div className="menu-role-wrap">
                  <button
                    type="button"
                    className="menu-role-button"
                    onClick={() => setShowRoleMenu((prev) => !prev)}
                  >
                    <span className="menu-role-left">
                      <span className="menu-role-icon" aria-hidden="true">
                        {activeRole === 'Driver' ? '🚘' : activeRole === 'Citizen Reporter' ? '🚨' : '🚶'}
                      </span>
                      <span className="menu-role-value">{activeRole}</span>
                    </span>
                    <span className="menu-role-chevron" aria-hidden="true">
                      {showRoleMenu ? '▴' : '▾'}
                    </span>
                  </button>

                  {showRoleMenu ? (
                    <div className="menu-role-dropdown">
                      {['Commuter', 'Driver', 'Citizen Reporter'].map((role) => {
                        const selected = role === activeRole;
                        return (
                          <button
                            key={role}
                            type="button"
                            className={`menu-role-option ${selected ? 'menu-role-option-active' : ''}`}
                            onClick={() => {
                              setActiveRole(role);
                              setShowRoleMenu(false);
                            }}
                          >
                            <span>{role}</span>
                            {selected ? <span aria-hidden="true">✓</span> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="menu-greeting-block">
                <h2 className="menu-greeting">Hello, {firstName} 👋</h2>
                <p className="menu-subtitle">Smart Travel Dashboard</p>
              </section>

              {activeScreen === 'home' ? (
                <MainMenuPanel
                  activeRole={activeRole}
                  onSendSignal={handleSendSignal}
                  onOpenCommuter={() => {
                    setActiveRole('Commuter');
                    setActiveScreen('map');
                  }}
                  onOpenDriver={() => {
                    setActiveRole('Driver');
                    setActiveScreen('map');
                  }}
                  onOpenReporter={() => {
                    setActiveRole('Citizen Reporter');
                    setActiveScreen('map');
                    setShowModal(true);
                  }}
                  topDemand={topDemand}
                  firstHazard={hazards[0] || null}
                />
              ) : null}

              <div className="role-view-section">
                {activeScreen === 'map' && activeRole === 'Commuter' && (
                  <CommuterView
                    hotspots={hotspots}
                    broadcastOn={broadcastOn}
                    onToggleBroadcast={handleBroadcastToggle}
                    gpsCoords={gpsCoords}
                    routeQuery={routeQuery}
                    setRouteQuery={setRouteQuery}
                    matchedRoute={matchedRoute}
                    locationStatus={locationStatus}
                  />
                )}
                {activeScreen === 'map' && activeRole === 'Driver' && (
                  <DriverView
                    hotspots={hotspots}
                    hazards={hazards}
                    topDemand={topDemand}
                    alertText={driverAlert}
                  />
                )}
                {activeScreen === 'map' && activeRole === 'Citizen Reporter' && (
                  <ReporterView
                    hazards={hazards}
                    recentReports={recentReports}
                    onOpenModal={() => setShowModal(true)}
                  />
                )}
                {activeScreen === 'alerts' ? (
                  <AlertsView hazards={hazards} recentReports={recentReports} onOpenAlerts={() => {
                    setActiveRole('Driver');
                    setActiveScreen('map');
                  }} />
                ) : null}
                {activeScreen === 'profile' ? (
                  <ProfileView
                    authUser={authUser}
                    broadcastOn={broadcastOn}
                    topDemand={topDemand}
                    recentReports={recentReports}
                    profilePhotoError={profilePhotoError}
                    pendingProfilePhoto={pendingProfilePhoto}
                    onPhotoSelect={handleProfilePhotoSelect}
                    onApplyPhoto={applyPendingProfilePhoto}
                    onCancelPhoto={cancelPendingProfilePhoto}
                    onRemovePhoto={handleRemoveProfilePhoto}
                    onGoMap={() => setActiveScreen('map')}
                  />
                ) : null}
                  </div>
            </div>

            <BottomNav
              activeScreen={activeScreen}
              onOpenHome={() => setActiveScreen('home')}
              onOpenMap={() => setActiveScreen('map')}
              onOpenAlerts={() => setActiveScreen('alerts')}
              onOpenProfile={() => setActiveScreen('profile')}
              onOpenReport={() => {
                setActiveRole('Citizen Reporter');
                setActiveScreen('map');
                setShowModal(true);
              }}
            />

            {showModal && (
              <ReportModal
                hazardType={hazardType}
                setHazardType={setHazardType}
                hazardDescription={hazardDescription}
                setHazardDescription={setHazardDescription}
                hazardPhoto={hazardPhoto}
                onPhotoChange={handlePhotoFile}
                onClearPhoto={() => handlePhotoFile(null)}
                onClose={handleCloseModal}
                onSubmit={submitHazardReport}
              />
            )}

            {showCropModal && cropSourceImage ? (
              <CropModal
                imageSrc={cropSourceImage}
                cropPosition={cropPosition}
                setCropPosition={setCropPosition}
                cropZoom={cropZoom}
                setCropZoom={setCropZoom}
                onCropComplete={onCropComplete}
                onCancel={handleCancelCrop}
                onConfirm={handleConfirmCrop}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function MainMenuPanel({ activeRole, onSendSignal, onOpenCommuter, onOpenDriver, onOpenReporter, topDemand, firstHazard }) {
  const roleCard =
    activeRole === 'Driver'
      ? {
          title: 'Passenger Heatmap',
          subtitle: 'See crowded areas in real time',
          action: onOpenDriver,
          icon: '🗺️',
        }
      : {
          title: 'Send Signal',
          subtitle: 'Share your waiting area quickly',
          action: onSendSignal,
          icon: '📍',
        };

  return (
    <section className="menu-card-stack">
      <button type="button" className="feature-card" onClick={roleCard.action}>
        <span className="feature-icon" aria-hidden="true">
          {roleCard.icon}
        </span>
        <span className="feature-copy">
          <span className="feature-title">{roleCard.title}</span>
          <span className="feature-subtitle">{roleCard.subtitle}</span>
        </span>
        <span className="feature-arrow" aria-hidden="true">
          ›
        </span>
      </button>

      <button type="button" className="feature-card" onClick={onOpenCommuter}>
        <span className="feature-icon" aria-hidden="true">
          🧭
        </span>
        <span className="feature-copy">
          <span className="feature-title">Find Routes</span>
          <span className="feature-subtitle">Plan your trip with jeepney stops</span>
        </span>
        <span className="feature-arrow" aria-hidden="true">
          ›
        </span>
      </button>

      <button type="button" className="feature-card" onClick={onOpenReporter}>
        <span className="feature-icon feature-icon-warn" aria-hidden="true">
          ⚠️
        </span>
        <span className="feature-copy">
          <span className="feature-title">Report Issue</span>
          <span className="feature-subtitle">Road problems and hazards</span>
        </span>
        <span className="feature-arrow" aria-hidden="true">
          ›
        </span>
      </button>

      <aside className="menu-alert-card">
        <div className="menu-alert-head">
          <p className="menu-alert-kicker">Nearby Alert</p>
          <button type="button" className="ghost-button" onClick={onOpenDriver}>
            View Alerts
          </button>
        </div>
        <p className="menu-alert-title">
          {firstHazard ? `${firstHazard.type} detected near ${firstHazard.location}` : 'No hazard alerts right now'}
        </p>
        <div className="menu-alert-foot">
          <span className="menu-traffic-dot" aria-hidden="true" />
          <p className="menu-traffic-text">
            {topDemand[0] ? `${topDemand[0].name}: ${topDemand[0].count} waiting` : 'Low traffic'}
          </p>
        </div>
      </aside>
    </section>
  );
}

function AlertsView({ hazards, recentReports, onOpenAlerts }) {
  return (
    <section className="stack-section">
      <aside className="panel">
        <div className="panel-row">
          <p className="panel-title">Nearby Alerts</p>
          <button type="button" className="ghost-button" onClick={onOpenAlerts}>
            Open Map
          </button>
        </div>
        <div className="report-list">
          {hazards.slice(0, 6).map((hazard) => (
            <div key={hazard.id} className="report-item">
              <div className="report-row">
                <p className="report-type">{hazard.type}</p>
                <p className="report-time">{hazard.timestamp}</p>
              </div>
              <p className="report-description">{hazard.description}</p>
              <p className="report-location">{hazard.location}</p>
            </div>
          ))}
        </div>
      </aside>

      <aside className="panel">
        <p className="panel-title panel-title-gap">Recent Community Reports</p>
        <div className="report-list">
          {recentReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-row">
                <p className="report-type">{report.type}</p>
                <p className="report-time">{report.timestamp}</p>
              </div>
              <p className="report-description">{report.description}</p>
              <p className="report-location">{report.location}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function ProfileView({
  authUser,
  broadcastOn,
  topDemand,
  recentReports,
  profilePhotoError,
  pendingProfilePhoto,
  onPhotoSelect,
  onApplyPhoto,
  onCancelPhoto,
  onRemovePhoto,
  onGoMap,
}) {
  return (
    <section className="stack-section">
      <aside className="panel profile-card">
        <div className="profile-avatar-large">
          {authUser.avatarUrl ? (
            <img src={authUser.avatarUrl} alt="Profile" className="profile-avatar-image" />
          ) : (
            authUser.fullName?.[0]?.toUpperCase() || 'U'
          )}
        </div>
        <div>
          <p className="profile-name">{authUser.fullName}</p>
          <p className="profile-meta">{authUser.email}</p>
          <p className="profile-meta">Role: {authUser.role}</p>
          <div className="profile-photo-actions">
            <label className="ghost-button profile-photo-label" htmlFor="profile-photo-input">
              Change Photo
            </label>
            {authUser.avatarUrl ? (
              <button type="button" className="ghost-button profile-remove-photo" onClick={onRemovePhoto}>
                Remove Photo
              </button>
            ) : null}
          </div>
          <input
            id="profile-photo-input"
            type="file"
            accept="image/*"
            className="profile-photo-input"
            onChange={(e) => {
              onPhotoSelect(e.target.files?.[0] || null);
              e.target.value = '';
            }}
          />
          {pendingProfilePhoto ? (
            <div className="profile-photo-preview-wrap">
              <img src={pendingProfilePhoto} alt="Pending profile preview" className="profile-photo-preview" />
              <div className="profile-photo-actions profile-photo-preview-actions">
                <button type="button" className="primary-button profile-photo-apply" onClick={onApplyPhoto}>
                  Apply Photo
                </button>
                <button type="button" className="ghost-button" onClick={onCancelPhoto}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
          {profilePhotoError ? <p className="auth-error profile-photo-error">{profilePhotoError}</p> : null}
        </div>
      </aside>

      <aside className="panel profile-details-panel">
        <p className="panel-title panel-title-gap">Profile Details</p>
        <div className="stack-vertical">
          <div className="zone-row">
            <p className="zone-name">Location Broadcast</p>
            <span className="zone-badge">{broadcastOn ? 'On' : 'Off'}</span>
          </div>
          <div className="zone-row">
            <p className="zone-name">Top Demand Zone</p>
            <span className="zone-badge">{topDemand[0]?.name || 'N/A'}</span>
          </div>
          <div className="zone-row">
            <p className="zone-name">Reports Submitted</p>
            <span className="zone-badge">{recentReports.length}</span>
          </div>
        </div>
        <button type="button" className="primary-button profile-map-button" onClick={onGoMap}>
          Go To Map
        </button>
      </aside>
    </section>
  );
}

function CropModal({
  imageSrc,
  cropPosition,
  setCropPosition,
  cropZoom,
  setCropZoom,
  onCropComplete,
  onCancel,
  onConfirm,
}) {
  function zoomOut() {
    setCropZoom((prev) => Math.max(1, Number((prev - 0.1).toFixed(2))));
  }

  function zoomIn() {
    setCropZoom((prev) => Math.min(3, Number((prev + 0.1).toFixed(2))));
  }

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-sheet">
        <p className="panel-title">Crop Profile Photo</p>
        <div className="crop-area-wrap">
          <Cropper
            image={imageSrc}
            crop={cropPosition}
            zoom={cropZoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCropPosition}
            onZoomChange={setCropZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="crop-zoom-row">
          <button type="button" className="ghost-button crop-zoom-button" onClick={zoomOut}>
            -
          </button>
          <span className="field-label">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={cropZoom}
            className="crop-zoom-slider"
            onChange={(e) => setCropZoom(Number(e.target.value))}
          />
          <button type="button" className="ghost-button crop-zoom-button" onClick={zoomIn}>
            +
          </button>
        </div>
        <div className="crop-actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="primary-button crop-apply-button" onClick={onConfirm}>
            Use Crop
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthGate({
  authMode,
  setAuthMode,
  loginForm,
  setLoginForm,
  signupForm,
  setSignupForm,
  onLoginSubmit,
  onSignupSubmit,
  authError,
  darkMode,
  setDarkMode,
}) {
  return (
    <section className="auth-screen">
      <div className="auth-header-row">
        <h2
          className="auth-title"
          style={{ color: darkMode ? '#ffffff' : undefined }}
        >
          CalamBiyahe
        </h2>
        <ThemeSwitch darkMode={darkMode} onToggle={setDarkMode} />
      </div>
      <p className="auth-subtitle">Login or create an account and register your role first.</p>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${authMode === 'login' ? 'auth-tab-active' : ''}`}
          onClick={() => setAuthMode('login')}
        >
          Login
        </button>
        <button
          type="button"
          className={`auth-tab ${authMode === 'signup' ? 'auth-tab-active' : ''}`}
          onClick={() => setAuthMode('signup')}
        >
          Sign Up
        </button>
      </div>

      {authMode === 'login' ? (
        <form className="auth-form" onSubmit={onLoginSubmit}>
          <label className="field-label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            className="text-input"
            value={loginForm.email}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="you@email.com"
          />

          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            className="text-input"
            value={loginForm.password}
            onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Your password"
          />

          {authError ? <p className="auth-error">{authError}</p> : null}

          <button type="submit" className="primary-button">
            Login
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={onSignupSubmit}>
          <label className="field-label" htmlFor="signup-name">
            Full Name
          </label>
          <input
            id="signup-name"
            type="text"
            className="text-input"
            value={signupForm.fullName}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, fullName: e.target.value }))}
            placeholder="Juan Dela Cruz"
          />

          <label className="field-label" htmlFor="signup-email">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            className="text-input"
            value={signupForm.email}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="you@email.com"
          />

          <label className="field-label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            className="text-input"
            value={signupForm.password}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="At least 6 characters"
          />

          <label className="field-label" htmlFor="signup-role">
            Register as
          </label>
          <select
            id="signup-role"
            className="text-input"
            value={signupForm.role}
            onChange={(e) => setSignupForm((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option>Commuter</option>
            <option>Driver</option>
            <option>Citizen Reporter</option>
          </select>

          {authError ? <p className="auth-error">{authError}</p> : null}

          <button type="submit" className="primary-button">
            Create Account
          </button>
        </form>
      )}
    </section>
  );
}

function CommuterView({
  hotspots,
  broadcastOn,
  onToggleBroadcast,
  gpsCoords,
  routeQuery,
  setRouteQuery,
  matchedRoute,
  locationStatus,
}) {
  return (
    <section className="stack-section">
      <MapPanel
        center={CALAMBA_CENTER}
        hotspots={hotspots}
        showHotspots={false}
        hazards={[]}
        gpsCoords={broadcastOn ? gpsCoords : null}
        title="Commuter Live Map"
      />

      <div className="panel">
        <div className="panel-row">
          <p className="panel-title">Broadcast My Location</p>
          <button
            type="button"
            onClick={onToggleBroadcast}
            className={`switch-track ${broadcastOn ? 'switch-on' : 'switch-off'}`}
            aria-label="Toggle broadcast location"
          >
            <span className={`switch-thumb ${broadcastOn ? 'thumb-on' : ''}`} />
          </button>
        </div>
        <p className="panel-muted">{locationStatus}</p>
      </div>

      <div className="panel stack-vertical">
        <p className="panel-title">Find My Jeepney Route</p>
        <input
          list="route-options"
          value={routeQuery}
          onChange={(e) => setRouteQuery(e.target.value)}
          placeholder="Type route e.g. Crossing -> Parian"
          className="text-input"
        />
        <datalist id="route-options">
          {JEEPNEY_ROUTES.map((r) => (
            <option key={r.id} value={r.name} />
          ))}
        </datalist>

        {matchedRoute ? (
          <div className="info-box">
            <p className="info-title">{matchedRoute.name}</p>
            <p className="info-stops">Stops: {matchedRoute.stops.join(' -> ')}</p>
            <ol className="instruction-list">
              {matchedRoute.instructions.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ol>
          </div>
        ) : (
          <p className="panel-muted">
            Type a route to view commute instructions and exact waiting spot labels.
          </p>
        )}
      </div>
    </section>
  );
}

function DriverView({ hotspots, hazards, topDemand, alertText }) {
  return (
    <section className="stack-section">
      {alertText ? <div className="danger-banner">{alertText}</div> : null}

      <MapPanel
        center={CALAMBA_CENTER}
        hotspots={hotspots}
        showHotspots
        hazards={hazards}
        gpsCoords={null}
        title="Driver Demand Heatmap"
      />

      <aside className="panel">
        <p className="panel-title panel-title-gap">Top Demand Zones</p>
        <div className="stack-vertical">
          {topDemand.map((zone) => (
            <div key={zone.id} className="zone-row">
              <p className="zone-name">{zone.name}</p>
              <span className="zone-badge">{zone.count} waiting</span>
            </div>
          ))}
        </div>
        <p className="panel-muted">Passenger counts update every 5 seconds.</p>
      </aside>
    </section>
  );
}

function ReporterView({ hazards, recentReports, onOpenModal }) {
  return (
    <section className="stack-section">
      <MapPanel
        center={CALAMBA_CENTER}
        hotspots={[]}
        showHotspots={false}
        hazards={hazards}
        gpsCoords={null}
        title="Citizen Hazard Map"
      />

      <button type="button" onClick={onOpenModal} className="primary-button">
        Report Hazard
      </button>

      <aside className="panel">
        <p className="panel-title panel-title-gap">Recent Reports</p>
        <div className="report-list">
          {recentReports.map((report) => (
            <div key={report.id} className="report-item">
              <div className="report-row">
                <p className="report-type">{report.type}</p>
                <p className="report-time">{report.timestamp}</p>
              </div>
              <p className="report-description">{report.description}</p>
              {report.photoUrl ? (
                <img src={report.photoUrl} alt={report.photoName || 'Hazard report'} className="report-photo" />
              ) : null}
              <p className="report-location">{report.location}</p>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

function BottomNav({ activeScreen, onOpenHome, onOpenMap, onOpenAlerts, onOpenProfile, onOpenReport }) {
  const items = [
    { id: 'home', title: 'Home', icon: '🏠' },
    { id: 'map', title: 'Map', icon: '🗺️' },
    { id: 'alerts', title: 'Alerts', icon: '🔔' },
    { id: 'profile', title: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-grid">
        <button
          type="button"
          className={`bottom-item ${activeScreen === 'home' ? 'bottom-item-active' : ''}`}
          onClick={onOpenHome}
        >
          <span className="bottom-item-icon" aria-hidden="true">
            {items[0].icon}
          </span>
          <span className="bottom-item-label">{items[0].title}</span>
        </button>

        <button
          type="button"
          className={`bottom-item ${activeScreen === 'map' ? 'bottom-item-active' : ''}`}
          onClick={onOpenMap}
        >
          <span className="bottom-item-icon" aria-hidden="true">
            {items[1].icon}
          </span>
          <span className="bottom-item-label">{items[1].title}</span>
        </button>

        <button type="button" className="bottom-fab-wrap" onClick={onOpenReport}>
          <span className="bottom-fab-ring">
            <span className="bottom-fab-core" aria-hidden="true">
              +
            </span>
          </span>
          <span className="bottom-fab-label">Report</span>
        </button>

        <button
          type="button"
          className={`bottom-item ${activeScreen === 'alerts' ? 'bottom-item-active' : ''}`}
          onClick={onOpenAlerts}
        >
          <span className="bottom-item-icon" aria-hidden="true">
            {items[2].icon}
          </span>
          <span className="bottom-item-label">{items[2].title}</span>
        </button>

        <button
          type="button"
          className={`bottom-item ${activeScreen === 'profile' ? 'bottom-item-active' : ''}`}
          onClick={onOpenProfile}
        >
          <span className="bottom-item-icon" aria-hidden="true">
            {items[3].icon}
          </span>
          <span className="bottom-item-label">{items[3].title}</span>
        </button>
      </div>
    </nav>
  );
}

function ReportModal({
  hazardType,
  setHazardType,
  hazardDescription,
  setHazardDescription,
  hazardPhoto,
  onPhotoChange,
  onClearPhoto,
  onClose,
  onSubmit,
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-head">
          <h3 className="modal-title">Report Hazard</h3>
          <button type="button" onClick={onClose} className="ghost-button">
            Close
          </button>
        </div>

        <label className="field-label" htmlFor="hazard-type">
          Hazard Type
        </label>
        <select
          id="hazard-type"
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
          className="text-input"
        >
          <option>Pothole</option>
          <option>Flood</option>
          <option>Debris</option>
          <option>Accident</option>
        </select>

        <label className="field-label" htmlFor="hazard-description">
          Description
        </label>
        <textarea
          id="hazard-description"
          value={hazardDescription}
          onChange={(e) => setHazardDescription(e.target.value)}
          rows="3"
          placeholder="Type details for nearby commuters and drivers"
          className="text-input"
        />

        <label className="field-label" htmlFor="hazard-photo">
          Photo (optional)
        </label>
        <input
          id="hazard-photo"
          type="file"
          accept="image/*"
          className="text-input"
          onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
        />
        {hazardPhoto ? (
          <div className="photo-preview-wrap">
            <img src={hazardPhoto.url} alt="Hazard preview" className="photo-preview" />
            <button type="button" className="ghost-button" onClick={onClearPhoto}>
              Remove Photo
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          className="primary-button"
          disabled={!hazardDescription.trim()}
        >
          Submit Report
        </button>
      </div>
    </div>
  );
}

function MapPanel({ center, hotspots, showHotspots, hazards, gpsCoords, title }) {
  return (
    <div className="panel">
      <div className="map-topbar">
        <p className="panel-title">{title}</p>
        <span className="live-badge">Live</span>
      </div>
      <div className="map-frame">
        <MapContainer center={center} zoom={14} scrollWheelZoom={false} className="leaflet-container">
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {showHotspots ? (
            <LayerGroup>
              {hotspots.map((spot) => {
                const color = getHeatColor(spot.count);
                return (
                  <Circle
                    key={spot.id}
                    center={spot.coords}
                    radius={90 + spot.count * 10}
                    pathOptions={{
                      color,
                      weight: 1,
                      fillColor: color,
                      fillOpacity: Math.min(0.82, 0.2 + spot.count / 30),
                    }}
                  >
                    <Popup>{`${spot.name}: ${spot.count} passengers waiting`}</Popup>
                  </Circle>
                );
              })}
            </LayerGroup>
          ) : null}

          {hazards.length > 0 ? (
            <LayerGroup>
              {hazards.map((hazard) => (
                <Marker key={hazard.id} position={hazard.coords} icon={hazardIcon(hazard.isNew)}>
                  <Popup>
                    <b>{hazard.type}</b>
                    <br />
                    {hazard.location}
                    <br />
                    {hazard.description}
                  </Popup>
                </Marker>
              ))}
            </LayerGroup>
          ) : null}

          {gpsCoords ? (
            <Marker position={gpsCoords} icon={gpsIcon}>
              <Popup>You are here</Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>
    </div>
  );
}

function ThemeSwitch({ darkMode, onToggle }) {
  return (
    <label className="theme-switch" aria-label="Toggle dark mode">
      <span className="theme-switch-label">Dark</span>
      <input
        type="checkbox"
        checked={darkMode}
        onChange={(e) => onToggle(e.target.checked)}
      />
      <span className="theme-switch-track">
        <span className="theme-switch-thumb" />
      </span>
    </label>
  );
}

export default App;
