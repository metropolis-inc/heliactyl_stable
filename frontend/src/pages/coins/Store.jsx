import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Plus, 
  RefreshCw, 
  Coins,
  X,
  Check,
  Zap,
  Rocket,
  Clock,
  Calendar
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export default function StorePage() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // For boost purchases
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedBoostType, setSelectedBoostType] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Get store configuration
  const { data: storeConfig } = useQuery({
    queryKey: ['storeConfig'],
    queryFn: async () => {
      const response = await axios.get('/api/store/config');
      return response.data;
    },
    retry: false
  });
  
  // Get available boost types
  const { data: boostTypes } = useQuery({
    queryKey: ['boostTypes'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/types');
      return response.data;
    },
    retry: false
  });
  
  // Get user servers
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      const response = await axios.get('/api/v5/servers');
      return response.data;
    },
    retry: false
  });
  
  // Set default values when data is loaded
  useEffect(() => {
    if (boostTypes && Object.keys(boostTypes).length > 0 && !selectedBoostType) {
      setSelectedBoostType(Object.keys(boostTypes)[0]);
    }
    
    if (servers?.length > 0 && !selectedServer) {
      setSelectedServer(servers[0].attributes.id);
    }
    
    if (boostTypes && selectedBoostType && !selectedDuration) {
      setSelectedDuration('1h');
    }
  }, [boostTypes, servers, selectedBoostType, selectedServer]);
  
  // Configure initial scheduled time (1 hour from now) when scheduled mode is enabled
  useEffect(() => {
    if (isScheduled) {
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);
      
      const year = oneHourFromNow.getFullYear();
      const month = String(oneHourFromNow.getMonth() + 1).padStart(2, '0');
      const day = String(oneHourFromNow.getDate()).padStart(2, '0');
      const hours = String(oneHourFromNow.getHours()).padStart(2, '0');
      const minutes = String(oneHourFromNow.getMinutes()).padStart(2, '0');
      
      setScheduledTime(`${year}-${month}-${day}T${hours}:${minutes}`);
    }
  }, [isScheduled]);

  const resourceLabels = {
    ram: 'MB RAM',
    disk: 'MB Storage',
    cpu: '% CPU',
    servers: 'Server Slots'
  };

  // Resource purchase handler
  const buyResource = async (type, amount) => {
    try {
      setLoading(prev => ({ ...prev, [type]: true }));
      setError('');
      setSuccess('');

      await axios.post('/api/store/buy', {
        resourceType: type,
        amount: parseInt(amount)
      });
      
      setSuccess(`Successfully purchased ${amount} units of ${type}!`);
      await queryClient.invalidateQueries(['storeConfig']);
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to make purchase');
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };
  
  // Boost purchase handler
  const purchaseBoost = async () => {
    if (!selectedServer || !selectedBoostType || !selectedDuration) {
      setError('Please select a server, boost type, and duration');
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, 'boost': true }));
      setError('');
      setSuccess('');
      
      if (isScheduled) {
        if (!scheduledTime) {
          setError('Please select a scheduled time');
          setLoading(prev => ({ ...prev, 'boost': false }));
          return;
        }
        
        const scheduledTimeMs = new Date(scheduledTime).getTime();
        
        if (isNaN(scheduledTimeMs) || scheduledTimeMs <= Date.now()) {
          setError('Scheduled time must be in the future');
          setLoading(prev => ({ ...prev, 'boost': false }));
          return;
        }
        
        await axios.post('/api/boosts/schedule', {
          serverId: selectedServer,
          boostType: selectedBoostType,
          duration: selectedDuration,
          scheduledTime: scheduledTimeMs
        });
        
        setSuccess(`Successfully scheduled a ${boostTypes[selectedBoostType].name} boost for your server!`);
      } else {
        await axios.post('/api/boosts/apply', {
          serverId: selectedServer,
          boostType: selectedBoostType,
          duration: selectedDuration
        });
        
        setSuccess(`Successfully applied a ${boostTypes[selectedBoostType].name} boost to your server!`);
      }
      
      await queryClient.invalidateQueries(['storeConfig']);
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to purchase boost');
    } finally {
      setLoading(prev => ({ ...prev, 'boost': false }));
    }
  };
  
  // Open confirmation dialog for resource purchase
  const handleResourcePurchaseClick = (type, amount, resourceAmount, totalPrice, title, unit) => {
    setConfirmDialog({
      type: 'resource',
      resourceType: type,
      amount,
      resourceAmount,
      totalPrice,
      title,
      unit
    });
  };
  
  // Open confirmation dialog for boost purchase
  const handleBoostPurchaseClick = () => {
    if (!selectedServer || !selectedBoostType || !selectedDuration) {
      setError('Please select a server, boost type, and duration');
      return;
    }
    
    const selectedServerObj = servers.find(s => s.attributes.id === selectedServer);
    const boostTypeObj = boostTypes[selectedBoostType];
    const price = boostTypeObj.prices[selectedDuration];
    
    if (isScheduled && (!scheduledTime || new Date(scheduledTime).getTime() <= Date.now())) {
      setError('Scheduled time must be in the future');
      return;
    }
    
    setConfirmDialog({
      type: 'boost',
      server: selectedServerObj?.attributes?.name || 'Unknown server',
      serverId: selectedServer,
      boostType: selectedBoostType,
      boostName: boostTypeObj.name,
      duration: selectedDuration,
      price,
      isScheduled,
      scheduledTime: isScheduled ? new Date(scheduledTime).toLocaleString() : null,
      resourceMultipliers: boostTypeObj.resourceMultiplier
    });
  };
  
  // Resource card component
  const ResourceCard = ({ title, icon: Icon, type, description, pricePerUnit }) => {
    const [amount, setAmount] = useState(1);
    const totalPrice = amount * pricePerUnit;
    const canAfford = storeConfig?.canAfford?.[type] && storeConfig.userBalance >= totalPrice;
    const resourceAmount = amount * (storeConfig?.multipliers?.[type] || 0);
    const maxAmount = storeConfig?.limits?.[type] || 10;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
              <Icon className="w-4 h-4" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CardDescription>{description}</CardDescription>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="1"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Math.min(maxAmount, parseInt(e.target.value) || 1)))}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">units</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span>{resourceAmount} {resourceLabels[type]}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Price:</span>
              <span>{totalPrice} coins</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full"
            onClick={() => handleResourcePurchaseClick(type, amount, resourceAmount, totalPrice, title, resourceLabels[type])}
            disabled={!canAfford || loading[type]}
          >
            {loading[type] ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              canAfford ? (
                <Plus className="w-4 h-4 mr-2" />
              ) : null
            )}
            {canAfford ? 'Purchase' : 'Insufficient balance'}
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Boost type card with icon mapping
  const BoostCard = ({ boostType, isSelected, onClick }) => {
    const getIcon = (iconName) => {
      switch (iconName) {
        case 'zap': return <Zap className="w-4 h-4 text-yellow-400" />;
        case 'cpu': return <Cpu className="w-4 h-4 text-blue-400" />;
        case 'memory-stick': return <MemoryStick className="w-4 h-4 text-purple-400" />;
        case 'hard-drive': return <HardDrive className="w-4 h-4 text-green-400" />;
        case 'rocket': return <Rocket className="w-4 h-4 text-red-400" />;
        default: return <Zap className="w-4 h-4 text-muted-foreground" />;
      }
    };
    
    return (
      <Card 
        className={`cursor-pointer transition-all ${
          isSelected 
            ? 'ring-2 ring-primary' 
            : 'hover:bg-muted/50'
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <h4 className="font-medium text-sm mb-1">{boostType.name}</h4>
          <p className="text-xs text-muted-foreground min-h-[40px] mb-3">{boostType.description}</p>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="flex flex-col items-center p-1 rounded bg-muted">
              <span className="text-muted-foreground">RAM</span>
              <span>{boostType.resourceMultiplier.ram}x</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-muted">
              <span className="text-muted-foreground">CPU</span>
              <span>{boostType.resourceMultiplier.cpu}x</span>
            </div>
            <div className="flex flex-col items-center p-1 rounded bg-muted">
              <span className="text-muted-foreground">Disk</span>
              <span>{boostType.resourceMultiplier.disk}x</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Loading state
  if (!storeConfig || !boostTypes || !servers) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Store</h1>
          <p className="text-muted-foreground">Purchase resources and boosts for your servers</p>
        </div>
        <Badge variant="outline" className="px-4 py-2">
          <Coins className="w-4 h-4 mr-2" />
          {storeConfig.userBalance} coins
        </Badge>
      </div>

      {/* Alert messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="resources" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="boosts" className="flex items-center gap-2">
            <Rocket className="w-4 h-4" />
            Boosts
          </TabsTrigger>
        </TabsList>

        {/* Resources Tab Content */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ResourceCard
              title="Memory"
              icon={MemoryStick}
              type="ram"
              description="Purchase additional RAM for your servers"
              pricePerUnit={storeConfig.prices.resources.ram}
            />
            <ResourceCard
              title="Storage"
              icon={HardDrive}
              type="disk"
              description="Purchase additional storage space"
              pricePerUnit={storeConfig.prices.resources.disk}
            />
            <ResourceCard
              title="CPU"
              icon={Cpu}
              type="cpu"
              description="Purchase additional CPU power"
              pricePerUnit={storeConfig.prices.resources.cpu}
            />
            <ResourceCard
              title="Server Slots"
              icon={Server}
              type="servers"
              description="Purchase additional server slots"
              pricePerUnit={storeConfig.prices.resources.servers}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>More information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Purchase additional resources for your servers using coins. Maximum limits per resource type: 
                {Object.entries(storeConfig.limits).map(([type, limit]) => (
                  <span key={type} className="ml-1">
                    {type}: {limit},
                  </span>
                ))}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Boosts Tab Content */}
        <TabsContent value="boosts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Boost selection section */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Choose Boost Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {boostTypes && Object.entries(boostTypes).map(([id, boostType]) => (
                      <BoostCard 
                        key={id}
                        boostType={boostType}
                        isSelected={selectedBoostType === id}
                        onClick={() => setSelectedBoostType(id)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Server & Duration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Server</Label>
                    <Select value={selectedServer} onValueChange={setSelectedServer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a server" />
                      </SelectTrigger>
                      <SelectContent>
                        {servers && servers.map(server => (
                          <SelectItem key={server.attributes.id} value={server.attributes.id}>
                            {server.attributes.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {selectedBoostType && boostTypes && Object.keys(boostTypes[selectedBoostType].prices).map(duration => (
                        <Button
                          key={duration}
                          size="sm"
                          variant={selectedDuration === duration ? "default" : "outline"}
                          onClick={() => setSelectedDuration(duration)}
                        >
                          {duration}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id="schedule-boost" 
                      checked={isScheduled}
                      onCheckedChange={setIsScheduled}
                    />
                    <Label htmlFor="schedule-boost">Schedule for later</Label>
                  </div>
                  
                  {isScheduled && (
                    <div className="space-y-2">
                      <Label>Scheduled Time</Label>
                      <Input
                        type="datetime-local"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Boost summary and purchase section */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Boost Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedBoostType && boostTypes ? (
                    <>
                      <div>
                        <p className="font-medium">{boostTypes[selectedBoostType].name}</p>
                        <p className="text-xs text-muted-foreground">{boostTypes[selectedBoostType].description}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Server:</span>
                          <span>
                            {servers && selectedServer
                              ? servers.find(s => s.attributes.id === selectedServer)?.attributes?.name || 'Unknown'
                              : 'Select a server'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{selectedDuration || 'Select duration'}</span>
                        </div>
                        {isScheduled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Scheduled for:</span>
                            <span>
                              {scheduledTime
                                ? new Date(scheduledTime).toLocaleString()
                                : 'Select time'}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span>
                            {selectedBoostType && selectedDuration
                              ? `${boostTypes[selectedBoostType].prices[selectedDuration]} coins`
                              : '0 coins'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t">
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Resource Multipliers:</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="flex flex-col items-center p-2 rounded bg-muted">
                              <MemoryStick className="w-4 h-4 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">RAM</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.ram}x</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-muted">
                              <Cpu className="w-4 h-4 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">CPU</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.cpu}x</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-muted">
                              <HardDrive className="w-4 h-4 text-muted-foreground mb-1" />
                              <span className="text-xs text-muted-foreground">Disk</span>
                              <span className="text-sm font-medium">{boostTypes[selectedBoostType].resourceMultiplier.disk}x</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Select a boost type to see details</p>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={handleBoostPurchaseClick}
                    disabled={!selectedServer || !selectedBoostType || !selectedDuration || 
                              (isScheduled && (!scheduledTime || new Date(scheduledTime).getTime() <= Date.now())) ||
                              loading.boost ||
                              (selectedBoostType && selectedDuration && boostTypes && 
                               storeConfig.userBalance < boostTypes[selectedBoostType].prices[selectedDuration])}
                  >
                    {loading.boost ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    ) : isScheduled ? (
                      <Calendar className="w-4 h-4 mr-2" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    {!selectedBoostType || !selectedDuration || !boostTypes ? 'Select options' : 
                     storeConfig.userBalance < boostTypes[selectedBoostType].prices[selectedDuration] ? 'Insufficient balance' :
                     isScheduled ? 'Schedule Boost' : 'Apply Boost Now'}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How boosts work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Server boosts temporarily multiply your server's resources for the selected duration.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Boosts are active immediately or at your scheduled time and automatically expire after the duration.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <X className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">You can cancel active boosts for a partial refund proportional to remaining time.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Only one boost type can be active per server at a time.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog?.type === 'resource' ? 'Confirm Purchase' : 'Confirm Boost'}
            </DialogTitle>
          </DialogHeader>
          
          {confirmDialog && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {confirmDialog?.type === 'resource' 
                  ? 'Are you sure you want to purchase:' 
                  : confirmDialog?.isScheduled
                    ? 'Are you sure you want to schedule this boost?'
                    : 'Are you sure you want to apply this boost?'}
              </p>
              
              {confirmDialog?.type === 'resource' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Resource:</span>
                    <span>{confirmDialog?.title}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount:</span>
                    <span>{confirmDialog?.resourceAmount} {confirmDialog?.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost:</span>
                    <span>{confirmDialog?.totalPrice} coins</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance after purchase:</span>
                    <span>{storeConfig.userBalance - (confirmDialog?.totalPrice || 0)} coins</span>
                  </div>
                </div>
              )}
              
              {confirmDialog?.type === 'boost' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Boost Type:</span>
                      <span>{confirmDialog?.boostName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Server:</span>
                      <span>{confirmDialog?.server}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>{confirmDialog?.duration}</span>
                    </div>
                    {confirmDialog?.isScheduled && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Scheduled Time:</span>
                        <span>{confirmDialog?.scheduledTime}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost:</span>
                      <span>{confirmDialog?.price} coins</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Balance after purchase:</span>
                      <span>{storeConfig.userBalance - (confirmDialog?.price || 0)} coins</span>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Resource Multipliers:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center p-2 rounded bg-muted text-center">
                        <span className="text-xs text-muted-foreground">RAM</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.ram}x</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted text-center">
                        <span className="text-xs text-muted-foreground">CPU</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.cpu}x</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded bg-muted text-center">
                        <span className="text-xs text-muted-foreground">Disk</span>
                        <span className="text-sm">{confirmDialog?.resourceMultipliers?.disk}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => confirmDialog?.type === 'resource' 
                ? buyResource(confirmDialog.resourceType, confirmDialog.amount)
                : purchaseBoost()
              }
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm {confirmDialog?.type === 'resource' ? 'Purchase' : 'Boost'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}