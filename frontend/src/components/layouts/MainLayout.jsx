import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { Link, useLocation, useParams, useNavigate, Outlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import {
  ServerStackIcon, WindowIcon, FolderIcon, GlobeAltIcon, PuzzlePieceIcon,
  CloudArrowDownIcon, UsersIcon, Cog6ToothIcon, CubeIcon, 
  ArrowRightOnRectangleIcon, UserIcon, WalletIcon, 
  EllipsisHorizontalIcon, CircleStackIcon, 
  ListBulletIcon, ArrowLeftIcon, ArrowTrendingUpIcon, GiftIcon, 
  FingerPrintIcon, HomeIcon, BoltIcon, PaperAirplaneIcon, ArrowDownLeftIcon,
  ChevronDownIcon, EllipsisVerticalIcon, LinkIcon
} from '@heroicons/react/24/outline';
import { Plus } from 'lucide-react';

// Page transition variants
const pageTransitionVariants = {
  initial: { 
    opacity: 0,
    y: 10
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1], // Custom ease curve for subtle, professional feel
    }
  },
  exit: { 
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.1,
      ease: [0.16, 1, 0.3, 1],
    }
  },
};

// Sidebar context for visibility management
const SidebarContext = createContext({
  sidebarVisible: true,
  toggleSidebar: () => {}
});

export const useSidebar = () => useContext(SidebarContext);

const SidebarProvider = ({ children }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };
  
  return (
    <SidebarContext.Provider value={{ sidebarVisible, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Enhanced Navigation Item with ref forwarding - Argon-style with Mantle colors
const NavItem = ({ to, icon: Icon, label, isActive, setRef }) => {
  const id = to.replace(/\//g, '-').slice(1);
  const linkRef = useRef(null);
  
  useEffect(() => {
    if (linkRef.current) {
      setRef(id, linkRef.current);
    }
    return () => setRef(id, null);
  }, [id, setRef]);
  
  return (
    <Link
      to={to}
      ref={linkRef}
      className={`flex items-center h-8 px-2 text-xs rounded-md transition duration-300 relative z-10 outline-none active:scale-95 ${
        isActive
          ? 'text-white font-semibold'
          : 'hover:text-white text-white/50 border-none'
      }`}
    >
      {Icon && <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-white/60' : 'text-white/30'}`} />}
      <span>{label}</span>
    </Link>
  );
};

// Section Header component from Argon
const SectionHeader = ({ label }) => {
  return (
    <div className="pt-1 pb-1">
      <h3 className="text-[0.6rem] font-semibold uppercase tracking-wider text-white/40">{label}</h3>
    </div>
  );
};

// Footer component
const Footer = () => {
  // Generate a random 8-character hex ID for the footer
  const [footerId] = useState(() => {
    return Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });

  // Generate a random 8-character hex session ID
  const [sessionId] = useState(() => {
    return Array.from(crypto.getRandomValues(new Uint8Array(4)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  });

  return (
    <footer className="bg-[#08090c] py-8 px-16">
      <div className="text-center space-y-2">
        <p className="text-[0.65rem] font-medium text-white/70">
          © 2025 Sryzen. All rights reserved.
        </p>
        <div className="flex justify-center space-x-4">
          <p className="text-[0.55rem] font-mono uppercase tracking-widest text-white/40">
            <GlobeAltIcon className="w-3 h-3 mb-[2px] text-white/20 inline-block mr-1" />
            Heliactyl Next 10.0.15 (Toledo)
          </p>
          <p className="text-[0.55rem] font-mono uppercase tracking-widest text-white/40">
            <FingerPrintIcon className="w-3 h-3 mb-[1px] text-white/20 inline-block mr-1" />
            {footerId}
          </p>
          <p className="text-[0.55rem] font-mono uppercase tracking-widest text-white/40">
            <UserIcon className="w-3 h-3 mb-[2px] text-white/20 inline-block mr-1" />
            {sessionId}
          </p>
        </div>
      </div>
    </footer>
  );
};

const MainLayout = () => {
  const [userData, setUserData] = useState({
    username: 'Loading...',
    id: '...',
    email: '...',
    global_name: ''
  });
  const [balances, setBalances] = useState({ coins: 0 });
  const [servers, setServers] = useState([]);
  const [subuserServers, setSubuserServers] = useState([]);
  const [selectedServerId, setSelectedServerId] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [serverName, setServerName] = useState("");
  
  const userDropdownRef = useRef(null);
  const menuDropdownRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const showServerSection = location.pathname.includes('/server/');

  // Sliding indicator animation logic
  const [activeTabId, setActiveTabId] = useState(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0, height: 0, top: 0, left: 0, opacity: 0,
  });
  
  const tabRefsMap = useRef({});
  const setTabRef = useCallback((id, element) => {
    tabRefsMap.current[id] = element;
  }, []);

  // Effect to track active tab changes
  useEffect(() => {
    const newTabId = location.pathname.replace(/\//g, '-').slice(1);
    if (activeTabId !== newTabId) {
      setActiveTabId(newTabId);
    }
  }, [location.pathname, activeTabId]);

  // Effect to update the indicator position
  useEffect(() => {
    requestAnimationFrame(() => {
      if (activeTabId && tabRefsMap.current[activeTabId]) {
        const tabElement = tabRefsMap.current[activeTabId];
        if (!tabElement) return;

        const rect = tabElement.getBoundingClientRect();
        const navElement = tabElement.closest('nav');
        const navRect = navElement?.getBoundingClientRect();
        
        if (navRect) {
          setIndicatorStyle({
            width: rect.width,
            height: rect.height,
            top: rect.top - navRect.top,
            left: rect.left - navRect.left,
            opacity: 1,
          });
        }
      }
    });
  }, [activeTabId]);

  useEffect(() => {
    if (showServerSection && id) {
      setSelectedServerId(id);
      // Find server name
      const currentServer = [...servers, ...subuserServers].find(
        server => server.id === id || (server.attributes && server.attributes.identifier === id)
      );
      
      if (currentServer) {
        setServerName(currentServer.name || (currentServer.attributes && currentServer.attributes.name));
      }
    }
  }, [id, showServerSection, servers, subuserServers]);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target)) {
        setMenuDropdownOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigation items for both Mantle sections
  const iconNavItems = [
    { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: ServerStackIcon, label: 'Servers', path: '/servers' },
    { icon: CircleStackIcon, label: 'Store', path: '/coins/store' },
    { icon: GiftIcon, label: 'Daily rewards', path: '/coins/daily' },
    { icon: BoltIcon, label: 'Boosts', path: '/boosts' },
    { icon: ArrowTrendingUpIcon, label: 'Staking', path: '/coins/staking' }
  ];

  const serverNavItems = [
    { icon: WindowIcon, label: 'Overview', path: `/server/${id}/overview` },
    { icon: FolderIcon, label: 'Files', path: `/server/${id}/files` },
    { icon: GlobeAltIcon, label: 'Network', path: `/server/${id}/network` },
    { icon: CloudArrowDownIcon, label: 'Backups', path: `/server/${id}/backups` },
    { icon: UsersIcon, label: 'Users', path: `/server/${id}/users` },
    { icon: Cog6ToothIcon, label: 'Settings', path: `/server/${id}/settings` },
    { icon: CubeIcon, label: 'Package', path: `/server/${id}/package` },
    { icon: PuzzlePieceIcon, label: 'Plugins', path: `/server/${id}/plugins` },
    { icon: ListBulletIcon, label: 'Logs', path: `/server/${id}/logs` }
  ];
  
  const menuItems = [
    { icon: <LinkIcon className="w-4 h-4" />, label: 'Panel', path: 'https://panel.mantle.lat', external: true },
    { icon: <ArrowRightOnRectangleIcon className="w-4 h-4" />, label: 'Logout', action: handleLogout, className: 'text-red-400 hover:text-red-300 hover:bg-red-950/30' }
  ];

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coinsResponse, userResponse, serversResponse, subuserServersResponse] = await Promise.all([
          axios.get('/api/coins'),
          axios.get('/api/user'),
          axios.get('/api/v5/servers'),
          axios.get('/api/subuser-servers')
        ]);

        setBalances({ coins: coinsResponse.data.coins || 0 });
        setUserData({
          username: userResponse.data.username || 'User',
          id: userResponse.data.id || '00000',
          email: userResponse.data.email || '',
          global_name: userResponse.data.global_name || userResponse.data.username || 'User'
        });
        setServers(serversResponse.data || []);
        setSubuserServers(subuserServersResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  function handleLogout() {
    try {
      axios.post('/api/user/logout')
        .then(() => navigate('/auth'))
        .catch((error) => console.error('Logout error:', error));
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  const isActivePath = (path) => location.pathname === path;
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-[#08090c] text-white">
        {/* Main container - Full width with no artificial centering */}
        <div className="w-full flex relative z-10">
          {/* Sidebar */}
          <aside className={`hidden lg:block sticky top-0 h-screen w-56 p-4 border-r border-white/5 bg-[#08090c] flex-shrink-0 relative overflow-hidden transform transition-transform duration-300 ease-in-out ${
            useSidebar().sidebarVisible ? 'translate-x-0' : '-translate-x-full'
          }`}>
            {/* Sidebar content */}
            <div className="flex flex-col h-full relative z-10">
              {/* Logo and Toggle Button */}
              <div className="flex items-center justify-between h-12 mb-2">
                <Link to="/dashboard" className="flex items-center gap-3 transition-transform duration-200 active:scale-95">
                  <img src="https://i.imgur.com/ImIoc6U.png" alt="Logo" className="h-8 w-auto" />
                </Link>
              </div>

              {/* Server title when in server view */}
              {showServerSection && (
                <div className="py-2">
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex text-white/70 hover:text-white transition duration-200 text-xs active:scale-95 items-center"
                  >
                    <ArrowLeftIcon className="w-3 h-3 mr-1.5" />
                    <span>Back to server list</span>
                  </button>
                </div>
              )}

              {/* Navigation Sections */}
              <div className="flex-1 overflow-y-auto py-2">
                {/* Show section headers in Argon style */}
                {!showServerSection ? (
                  <SectionHeader label="Navigation" />
                ) : (
                  <SectionHeader label="Server" />
                )}
              
                <nav className="py-1 space-y-0.5 relative">
                  {/* Animated background indicator - Argon style */}
                  <div 
                    className="absolute transform transition-all duration-200 ease-spring bg-[#383c47] rounded-md z-0"
                    style={{
                      width: `${indicatorStyle.width}px`,
                      height: `${indicatorStyle.height}px`,
                      top: `${indicatorStyle.top}px`,
                      left: `${indicatorStyle.left}px`,
                      opacity: indicatorStyle.opacity,
                      transitionDelay: '30ms',
                    }}
                  />
                  
                  {/* Main nav items */}
                  {!showServerSection && (
                    <>
                      {/* Big deploy button */}
                      <Link
                        to="/servers/new"
                        className="flex items-center bg-gradient-to-t from-[#0284c7] rounded-lg to-[#0369a1] text-[#eceaff] ring-2 ring-[#080a0b] ring-opacity-0 ring-offset-2 ring-offset-[#080a0b] hover:ring-opacity-100 hover:ring-[#080a0b] justify-center gap-1 mb-4 text-xs font-medium py-2 px-3"
                      >
                        <Plus className="w-3 h-3 mr-0.5 text-[#eceaff]/70" />
                        New server
                      </Link>
                      <div className="flex items-center justify-between pb-2"></div>
                      {iconNavItems.map((item) => (
                        <NavItem
                          key={item.label}
                          to={item.path}
                          icon={item.icon} 
                          label={item.label}
                          isActive={isActivePath(item.path)}
                          setRef={setTabRef}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Server Navigation */}
                  {showServerSection && (
                    <>
                      {serverNavItems.map((item) => (
                        <NavItem
                          key={item.label}
                          to={item.path}
                          icon={item.icon}
                          label={item.label}
                          isActive={isActivePath(item.path)}
                          setRef={setTabRef}
                        />
                      ))}
                    </>
                  )}
                </nav>
              </div>

              {/* Bottom Section with user profile moved here */}
              <div>
                {/* Coins Balance Section */}
                <div className="border-t border-white/5 pt-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/40">Coins</span>
                    <span className="text-xs font-medium text-white">{balances.coins.toFixed(2)}</span>
                  </div>
                </div>
                {/* User Profile Section */}
                        <div className="flex items-center gap-3 border border-white/5 shadow-xs rounded-xl py-3 px-3">
                          <div className="h-7 w-7 bg-[#191b20] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-white/70 font-semibold">
                            {getInitials(userData.global_name)}
                          </span>
                          </div>
                          <div className="flex flex-col relative" ref={userDropdownRef}>
                          <button 
                            className="flex items-center gap-1 text-sm font-medium hover:text-white transition-all duration-200 active:scale-95"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                          >
                            <span className="truncate max-w-[120px]">{(userData.global_name).trim(4)}</span>
                          </button>
                          <span className="text-[0.55rem] uppercase max-w-[120px] truncate tracking-widest text-white/30 leading-none mt-0.3">
                            {userData.email}
                          </span>
                          
                          <AnimatePresence>
                            {userDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute bottom-full mb-2 w-64 bg-[#202229] border border-white/5 rounded-xl shadow-lg z-20"
                            >
                              <div className="p-3 border-b border-white/5">
                              <p className="text-sm font-medium">{userData.username}</p>
                              <p className="text-xs text-[#95a1ad] mt-1">{userData.email}</p>
                              </div>
                              <div className="py-1">
                              <button 
                                className="flex items-center w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-all duration-200 active:scale-95"
                                onClick={() => {
                                navigate('/account');
                                setUserDropdownOpen(false);
                              }}
                            >
                              <UserIcon className="w-4 h-4 mr-2" />
                              <span className="font-medium">My account</span>
                            </button>
                          </div>
                          <div className="py-1">
                            <button 
                              className="flex items-center w-full px-3 py-2.5 text-sm text-left hover:bg-white/5 transition-all duration-200 active:scale-95"
                              onClick={() => {
                                navigate('/passkeys');
                                setUserDropdownOpen(false);
                              }}
                            >
                              <FingerPrintIcon className="w-4 h-4 mr-2" />
                              <span className="font-medium">Passkeys</span>
                            </button>
                          </div>
                          <div className="py-1 border-t border-white/5">
                            <button 
                              className="flex items-center w-full px-3 py-2.5 text-sm text-left text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-all duration-200 active:scale-95"
                              onClick={() => {
                                handleLogout();
                                setUserDropdownOpen(false);
                              }}
                            >
                              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                              <span className="font-medium">Sign out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content Area - Now includes both content and footer */}
          <div className={`flex-1 flex flex-col transition-all duration-300`}>
            {/* Main Content with page transitions */}
            <main className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={location.pathname}
                  variants={pageTransitionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="py-16 px-16"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </main>
            
            {/* Footer */}
            <Footer />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

// Add CSS for spring animation 
// .ease-spring { transition-timing-function: cubic-bezier(0.5, 0, 0.2, 1.4); }

export default MainLayout;