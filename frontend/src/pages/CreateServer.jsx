import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  ArrowLeftIcon, ArrowPathIcon, ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 bg-[#202229] rounded-md animate-pulse"></div>
        <div className="h-8 w-48 bg-[#202229] rounded-md animate-pulse"></div>
      </div>
      
      <div className="max-w-2xl space-y-6">
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-[#202229] rounded animate-pulse"></div>
              <div className="h-10 w-full bg-[#202229] rounded-md animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreateServer() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [egg, setEgg] = useState('');
  const [location, setLocation] = useState('');
  const [ram, setRam] = useState('');
  const [disk, setDisk] = useState('');
  const [cpu, setCpu] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: eggs, isLoading: loadingEggs } = useQuery({
    queryKey: ['eggs'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/eggs');
      return data;
    }
  });

  const { data: locations, isLoading: loadingLocations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data } = await axios.get('/api/v5/locations');
      return data;
    }
  });

  const selectedEgg = eggs?.find(e => e.id === egg);

  const handleCreate = async () => {
    try {
      setError('');
      setIsCreating(true);

      if (!name?.trim()) throw new Error('Server name is required');
      if (!egg) throw new Error('Server type is required');
      if (!location) throw new Error('Location is required');
      if (!ram || !disk || !cpu) throw new Error('Resource values are required');

      await axios.post('/api/v5/servers', {
        name: name.trim(),
        egg,
        location,
        ram: parseInt(ram),
        disk: parseInt(disk),
        cpu: parseInt(cpu)
      });

      navigate('/servers');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsCreating(false);
    }
  };

  if (loadingEggs || loadingLocations) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/servers')}
          className="flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Create New Server</h1>
      </div>

      {/* Form */}
      <div className="max-w-2xl space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-name">Server Name</Label>
            <Input 
              id="server-name"
              placeholder="My Awesome Server" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
            <p className="text-xs text-[#95a1ad]">
              Choose a memorable name for your server
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Server Type</Label>
            <Select value={egg} onValueChange={setEgg}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Server Type" />
              </SelectTrigger>
              <SelectContent>
                {eggs?.map(eggItem => (
                  <SelectItem key={eggItem.id} value={eggItem.id}>
                    {eggItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#95a1ad]">
              Choose the type of server you want to create
            </p>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {locations?.map(locationItem => (
                  <SelectItem key={locationItem.id} value={locationItem.id}>
                    {locationItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-[#95a1ad]">
              Choose the server location closest to you for best performance
            </p>
          </div>

          <div className="space-y-4">
            <Label>Resource Allocation</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ram">RAM (MB)</Label>
                <Input 
                  id="ram"
                  type="number"
                  placeholder="2048"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disk">Disk (MB)</Label>
                <Input 
                  id="disk"
                  type="number"
                  placeholder="10240"
                  value={disk}
                  onChange={(e) => setDisk(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpu">CPU (%)</Label>
                <Input 
                  id="cpu"
                  type="number"
                  placeholder="100"
                  value={cpu}
                  onChange={(e) => setCpu(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-[#95a1ad]">
              Allocate resources based on your server's needs
            </p>
          </div>

          {selectedEgg && (
            <Alert>
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>
                <strong>Minimum requirements:</strong> {selectedEgg.minimum.ram}MB RAM, {selectedEgg.minimum.disk}MB Disk, {selectedEgg.minimum.cpu}% CPU
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <ExclamationCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-[#2e3337]/50">
          <Button 
            variant="outline" 
            onClick={() => navigate('/servers')}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {isCreating && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            Create Server
          </Button>
        </div>
      </div>
    </div>
  );
}