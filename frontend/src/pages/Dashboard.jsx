import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  CpuChipIcon, 
  ChartPieIcon, 
  ArchiveBoxIcon, 
  ServerIcon
} from '@heroicons/react/24/outline';
import { FAQSection } from '../components/FAQSection';

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function ResourceCard({ icon: Icon, title, used, total, unit }) {
  const percentage = total ? (used / total) * 100 : 0;
  const colorClass = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-neutral-300';
  
  return (
    <div className="border border-[#2e3337]/50 shadow-xs rounded-lg p-4 bg-transparent">
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        <span className="text-xs text-[#95a1ad]">
          {used}{unit} / {total}{unit}
        </span>
      </div>
      <div>
        <div className="h-1 bg-[#202229] rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} rounded-full`} 
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-[#95a1ad] mt-2">
          {percentage.toFixed(1)}% utilized
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-8 w-32 bg-[#202229] rounded-md animate-pulse"></div>
      
      <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-[#2e3337] rounded-lg p-4">
            <div className="flex items-center pb-2">
              <div className="w-8 h-8 rounded-lg bg-[#202229] animate-pulse mr-2"></div>
              <div className="h-6 w-32 bg-[#202229] rounded animate-pulse"></div>
            </div>
            <div className="h-1 w-full bg-[#202229] rounded-full animate-pulse"></div>
            <div className="h-4 w-20 mt-2 bg-[#202229] rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await axios.get('/api/user');
      return data;
    }
  });

  const { data: resources, isLoading: loadingResources } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/resources');
      return data;
    }
  });

  if (loadingResources || loadingUser) {
    return <LoadingSkeleton />;
  }

  const displayName = userData?.global_name || userData?.username || 'User';
  const timeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          Good {timeOfDay()}, {displayName}
        </h1>
        <p className="text-[#95a1ad] text-md">
          Welcome back to Sryzen. Here's an overview of your account and resources.
        </p>
      </div>

      {/* User Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-[#2e3337]/50 rounded-lg p-4 bg-transparent">
          <h3 className="text-sm font-medium mb-2">User information</h3>
          <div className="space-y-1">
            <p className="text-xs text-[#95a1ad]">Username: <span className="text-white">{userData?.username}</span></p>
            <p className="text-xs text-[#95a1ad]">Email: <span className="text-white">{userData?.email}</span></p>
            <p className="text-xs text-[#95a1ad]">User ID: <span className="text-white">#{userData?.id}</span></p>
          </div>
        </div>
        
        <div className="border border-[#2e3337]/50 rounded-lg p-4 bg-transparent">
          <h3 className="text-sm font-medium mb-2">Account status</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-[#95a1ad]">Active</span>
            </div>
            <p className="text-xs text-[#95a1ad]">Member since: <span className="text-white">{new Date().getFullYear()}</span></p>
          </div>
        </div>

        <div className="border border-[#2e3337]/50 rounded-lg p-4 bg-transparent">
          <h3 className="text-sm font-medium mb-2">Statistics</h3>
          <div className="space-y-1">
            <p className="text-xs text-[#95a1ad]">Servers: <span className="text-white">{resources?.current?.servers || 0}</span></p>
          </div>
        </div>
      </div>

      {/* Resource Usage */}
      <div className="space-y-4">
        <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
          <ResourceCard 
            icon={ChartPieIcon}
            title="Memory"
            used={resources?.current?.ram/1024 || 0}
            total={resources?.limits?.ram/1024 || 0}
            unit="GB"
          />
          <ResourceCard 
            icon={CpuChipIcon}
            title="CPU"
            used={resources?.current?.cpu || 0}
            total={resources?.limits?.cpu || 0}
            unit="%"
          />
          <ResourceCard 
            icon={ArchiveBoxIcon}
            title="Storage"
            used={resources?.current?.disk/1024 || 0}
            total={resources?.limits?.disk/1024 || 0}
            unit="GB"
          />
          <ResourceCard 
            icon={ServerIcon}
            title="Servers"
            used={resources?.current?.servers || 0}
            total={resources?.limits?.servers || 0}
            unit=""
          />
        </div>
      </div>

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
}