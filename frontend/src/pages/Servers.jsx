import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ServerIcon, PlusIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function ServerCard({ server, wsStatus, stats }) {
  const navigate = useNavigate();
  
  const statusColors = {
    running: 'bg-emerald-500',
    starting: 'bg-amber-500',
    stopping: 'bg-amber-500',
    offline: 'bg-neutral-500'
  };

  const {
    limits = {}
  } = server?.attributes || {};

  let globalIdentifier;
  let globalName;

  if (server?.attributes) {
    globalIdentifier = server.attributes.identifier;
  } else {
    globalIdentifier = server.id;
  }

  if (server?.attributes) {
    globalName = server.attributes.name;
  } else {
    globalName = server.name;
  }

  const status = wsStatus?.[globalIdentifier] || 'offline';
  const serverStats = stats?.[globalIdentifier] || { cpu: 0, memory: 0, disk: 0 };

  const handleCardClick = () => {
    navigate(`/server/${globalIdentifier}/overview`);
  };
  
  return (
    <div 
      className="border border-[#2e3337]/50 hover:scale-95 hover:border-[#2e3337] rounded-lg bg-transparent transition duration-200 hover:border-white/10 cursor-pointer relative"
      onClick={handleCardClick}
    >
      <div className="p-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#202229]">
            <ServerIcon className="w-5 h-5 text-[#95a1ad]" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{globalName || 'Unnamed Server'}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`h-1.5 w-1.5 rounded-full ${statusColors[status]}`}></div>
              <p className="text-xs text-[#95a1ad]">
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 pt-2 pb-3 space-y-4">
        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>Memory</span>
            <span>{serverStats.memory?.toFixed(0) || 0} / {limits.memory || 0} MB</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-300 rounded-full" 
              style={{ width: `${limits.memory ? Math.min((serverStats.memory / limits.memory) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>CPU</span>
            <span>{serverStats.cpu?.toFixed(1) || 0} / {limits.cpu || 0}%</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-300 rounded-full" 
              style={{ width: `${limits.cpu ? Math.min((serverStats.cpu / limits.cpu) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs text-[#95a1ad] mb-1.5">
            <span>Disk</span>
            <span>{formatBytes(serverStats.disk || 0)} / {formatBytes((limits.disk || 0) * 1024 * 1024)}</span>
          </div>
          <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
            <div 
              className="h-full bg-neutral-300 rounded-full" 
              style={{ width: `${limits.disk ? Math.min((serverStats.disk / (limits.disk * 1024 * 1024)) * 100, 100) : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-[#202229] rounded-md animate-pulse"></div>
        <div className="h-9 w-32 bg-[#202229] rounded-md animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-[220px] border border-[#2e3337] rounded-lg bg-[#202229]/20 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

export default function Servers() {
  const [serverStatus, setServerStatus] = useState({});
  const [serverStats, setServerStats] = useState({});
  const socketsRef = useRef({});
  const navigate = useNavigate();
  
  const { data: servers, isLoading: loadingServers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/servers');
      return data;
    }
  });

  const { data: subuserServers, isLoading: loadingSubuserServers } = useQuery({
    queryKey: ['subuser-servers'],
    queryFn: async () => {
      const { data } = await axios.get('/api/subuser-servers');
      return data;
    }
  });

  useEffect(() => {
    if (!servers && !subuserServers) return;

    // Connect WebSockets for owned servers
    servers?.forEach(server => {
      if (!socketsRef.current[server.attributes.identifier]) {
        connectWebSocket(server);
      }
    });

    // Connect WebSockets for subuser servers
    subuserServers?.forEach(server => {
      if (!socketsRef.current[server.id]) {
        connectWebSocket(server);
      }
    });

    return () => {
      Object.values(socketsRef.current).forEach(ws => ws.close());
      socketsRef.current = {};
    };
  }, [servers, subuserServers]);

  const connectWebSocket = async (server) => {
    try {
      const serverId = server?.attributes?.identifier || server.id;
      const { data: wsData } = await axios.get(`/api/server/${serverId}/websocket`);
      const ws = new WebSocket(wsData.data.socket);

      ws.onopen = () => {
        ws.send(JSON.stringify({
          event: "auth",
          args: [wsData.data.token]
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message, serverId);
      };

      ws.onclose = () => {
        delete socketsRef.current[serverId];
        setTimeout(() => connectWebSocket(server), 5000);
      };

      socketsRef.current[serverId] = ws;
    } catch (error) {
      console.error(`WebSocket connection error for ${server?.attributes?.identifier || server.id}:`, error);
    }
  };

  const handleWebSocketMessage = (message, serverId) => {
    switch (message.event) {
      case 'auth success':
        socketsRef.current[serverId].send(JSON.stringify({ 
          event: 'send stats', 
          args: [null] 
        }));
        break;

      case 'stats':
        const statsData = JSON.parse(message.args[0]);
        if (!statsData) return;

        setServerStats(prev => ({
          ...prev,
          [serverId]: {
            cpu: statsData.cpu_absolute || 0,
            memory: statsData.memory_bytes / 1024 / 1024 || 0,
            disk: statsData.disk_bytes || 0
          }
        }));
        break;

      case 'status':
        setServerStatus(prev => ({
          ...prev,
          [serverId]: message.args[0]
        }));
        break;
    }
  };

  if (loadingServers || loadingSubuserServers) {
    return <LoadingSkeleton />;
  }

  const hasSubuserServers = subuserServers?.length > 0;
  const hasOwnedServers = servers?.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Servers</h1>
        <Button onClick={() => navigate('/servers/new')}>
          <PlusIcon className="w-4 h-4 mr-2" />
          New Server
        </Button>
      </div>

      {/* Owned Servers Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your servers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers?.map(server => (
            <ServerCard
              key={server.attributes.id}
              server={server}
              wsStatus={serverStatus}
              stats={serverStats}
            />
          ))}

          {!hasOwnedServers && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 py-24 text-center border border-[#2e3337] border-dashed rounded-lg">
              <p className="text-xs text-[#95a1ad] tracking-widest uppercase">Create your first server to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Subuser Servers Section */}
      {hasSubuserServers && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium flex items-center gap-2">
            Servers you can access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subuserServers.map(server => (
              <ServerCard
                key={server.id}
                server={server}
                wsStatus={serverStatus}
                stats={serverStats}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}