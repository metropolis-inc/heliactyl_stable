import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  Zap, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  X, 
  Server, 
  MemoryStick, 
  HardDrive, 
  Cpu, 
  Calendar, 
  BarChart4,
  ArrowRight,
  Rocket
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function ServerBoostsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  // Get boost types
  const { data: boostTypes, isLoading: loadingBoostTypes } = useQuery({
    queryKey: ['boost-types'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/types');
      return response.data;
    }
  });
  
  // Get active boosts
  const { data: activeBoosts, isLoading: loadingActiveBoosts } = useQuery({
    queryKey: ['active-boosts'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/active');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Get scheduled boosts
  const { data: scheduledBoosts, isLoading: loadingScheduledBoosts } = useQuery({
    queryKey: ['scheduled-boosts'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/scheduled');
      return response.data;
    }
  });
  
  // Get boost history
  const { data: boostHistory, isLoading: loadingBoostHistory } = useQuery({
    queryKey: ['boost-history'],
    queryFn: async () => {
      const response = await axios.get('/api/boosts/history');
      return response.data;
    }
  });
  
  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  
  // Cancel boost
  const handleCancelBoost = async () => {
    if (!confirmDialog || !confirmDialog.boost) return;
    
    try {
      setIsCancelling(true);
      setError('');
      
      const response = await axios.post('/api/boosts/cancel', {
        serverId: confirmDialog.boost.serverId,
        boostId: confirmDialog.boost.id
      });
      
      setSuccess(`Successfully cancelled boost with a refund of ${response.data.refundAmount} coins`);
      
      // Refresh boosts data
      queryClient.invalidateQueries(['active-boosts']);
      queryClient.invalidateQueries(['boost-history']);
      
      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel boost');
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Cancel scheduled boost
  const handleCancelScheduledBoost = async () => {
    if (!confirmDialog || !confirmDialog.scheduledBoost) return;
    
    try {
      setIsCancelling(true);
      setError('');
      
      const response = await axios.post('/api/boosts/cancel-scheduled', {
        scheduledBoostId: confirmDialog.scheduledBoost.id
      });
      
      setSuccess(`Successfully cancelled scheduled boost with a refund of ${response.data.refundAmount} coins`);
      
      // Refresh boosts data
      queryClient.invalidateQueries(['scheduled-boosts']);
      queryClient.invalidateQueries(['boost-history']);
      
      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel scheduled boost');
    } finally {
      setIsCancelling(false);
    }
  };
  
  // Extend boost
  const handleExtendBoost = async () => {
    if (!confirmDialog || !confirmDialog.boost || !confirmDialog.additionalDuration) return;
    
    try {
      setIsExtending(true);
      setError('');
      
      const response = await axios.post('/api/boosts/extend', {
        serverId: confirmDialog.boost.serverId,
        boostId: confirmDialog.boost.id,
        additionalDuration: confirmDialog.additionalDuration
      });
      
      setSuccess(`Successfully extended boost duration by ${confirmDialog.additionalDuration}`);
      
      // Refresh boosts data
      queryClient.invalidateQueries(['active-boosts']);
      
      // Close dialog
      setConfirmDialog(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to extend boost');
    } finally {
      setIsExtending(false);
    }
  };
  
  // Format timestamp to readable date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format remaining time
  const formatTimeRemaining = (endTime) => {
    if (!endTime) return 'Unknown';
    
    const now = Date.now();
    const remaining = endTime - now;
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  };
  
  // Format time until scheduled boost
  const formatTimeUntilScheduled = (scheduledTime) => {
    if (!scheduledTime) return 'Unknown';
    
    const now = Date.now();
    const timeUntil = scheduledTime - now;
    
    if (timeUntil <= 0) return 'Starting soon';
    
    const hours = Math.floor(timeUntil / (1000 * 60 * 60));
    const minutes = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hr${hours % 24 !== 1 ? 's' : ''}`;
    }
    
    return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`;
  };
  
  // Get boost icon
  const getBoostIcon = (boostId) => {
    const boostType = boostTypes?.[boostId];
    
    switch (boostType?.icon) {
      case 'zap':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'cpu':
        return <Cpu className="w-4 h-4 text-blue-400" />;
      case 'memory-stick':
        return <MemoryStick className="w-4 h-4 text-purple-400" />;
      case 'hard-drive':
        return <HardDrive className="w-4 h-4 text-green-400" />;
      case 'rocket':
        return <Rocket className="w-4 h-4 text-red-400" />;
      default:
        return <Zap className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  // Loading state for the entire page
  if (loadingBoostTypes && !boostTypes) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-screen-2xl mx-auto">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Boosts</h1>
          <p className="text-muted-foreground">Manage temporary resource boosts for your servers</p>
        </div>
        <Button asChild>
          <a href="/coins/store">
            <Zap className="w-4 h-4 mr-2" />
            Buy Boosts
          </a>
        </Button>
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
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Active Boosts
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Scheduled Boosts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart4 className="w-4 h-4" />
            Boost History
          </TabsTrigger>
        </TabsList>

        {/* Active Boosts Tab Content */}
        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Boosts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingActiveBoosts ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeBoosts && Object.keys(activeBoosts).length > 0 ? (
                <div className="space-y-4">
                  {/* Group boosts by server */}
                  {Object.entries(activeBoosts).map(([serverId, serverBoosts]) => (
                    <Card key={serverId}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Server className="w-4 h-4" />
                          {Object.values(serverBoosts)[0]?.serverName || 'Unknown Server'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {Object.values(serverBoosts).map((boost) => {
                          const boostType = boostTypes?.[boost.boostType];
                          const timeRemaining = formatTimeRemaining(boost.expiresAt);
                          const percentRemaining = Math.max(
                            0, 
                            Math.min(
                              100, 
                              ((boost.expiresAt - Date.now()) / (boost.durationMs)) * 100
                            )
                          );
                          
                          return (
                            <div key={boost.id} className="border rounded-lg p-4 space-y-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-medium">{boostType?.name || 'Unknown Boost'}</h5>
                                  <p className="text-xs text-muted-foreground">Applied {formatDate(boost.appliedAt)}</p>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDialog({
                                      type: 'extend',
                                      boost,
                                      additionalDuration: '1h'
                                    })}
                                  >
                                    Extend
                                  </Button>
                                  <Button 
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setConfirmDialog({
                                      type: 'cancel',
                                      boost
                                    })}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-2 rounded bg-muted flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground">RAM Boost</span>
                                  <span className="text-sm">x{boost.appliedChange.memory > 0 ? (boost.boostedResources.memory / boost.initialResources.memory).toFixed(1) : '1.0'}</span>
                                </div>
                                <div className="p-2 rounded bg-muted flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground">CPU Boost</span>
                                  <span className="text-sm">x{boost.appliedChange.cpu > 0 ? (boost.boostedResources.cpu / boost.initialResources.cpu).toFixed(1) : '1.0'}</span>
                                </div>
                                <div className="p-2 rounded bg-muted flex flex-col items-center">
                                  <span className="text-xs text-muted-foreground">Disk Boost</span>
                                  <span className="text-sm">x{boost.appliedChange.disk > 0 ? (boost.boostedResources.disk / boost.initialResources.disk).toFixed(1) : '1.0'}</span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Time Remaining:</span>
                                  <span>{timeRemaining}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full transition-all"
                                    style={{ width: `${percentRemaining}%` }}
                                  ></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Expires: {formatDate(boost.expiresAt)}</span>
                                  <span>Duration: {boost.duration}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No active boosts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Purchase boosts from the store to upgrade your server's resources temporarily
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Boosts Tab Content */}
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Boosts</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingScheduledBoosts ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : scheduledBoosts && scheduledBoosts.length > 0 ? (
                <div className="space-y-4">
                  {scheduledBoosts.map((boost) => {
                    const boostType = boostTypes?.[boost.boostType];
                    const timeUntil = formatTimeUntilScheduled(boost.scheduledTime);
                    
                    return (
                      <div key={boost.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                              {getBoostIcon(boost.boostType)}
                            </div>
                            <div>
                              <h5 className="font-medium">{boostType?.name || 'Unknown Boost'}</h5>
                              <p className="text-xs text-muted-foreground">Scheduled on {formatDate(boost.createdAt)}</p>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDialog({
                              type: 'cancel-scheduled',
                              scheduledBoost: boost
                            })}
                          >
                            Cancel
                          </Button>
                        </div>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Server:</span>
                            <span>{boost.serverName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Boost:</span>
                            <span>{boostType?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span>{boost.duration}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Price Paid:</span>
                            <span>{boost.price} coins</span>
                          </div>
                        </div>
                        
                        <div className="bg-muted p-3 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">Starts in {timeUntil}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(boost.scheduledTime)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No scheduled boosts</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Schedule boosts in advance to prepare for high-traffic events
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab Content */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Boost History</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingBoostHistory ? (
                <div className="flex justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : boostHistory && boostHistory.length > 0 ? (
                <div className="space-y-3">
                  {boostHistory.map((entry) => {
                    // Determine icon and style based on activity type
                    let icon = <Zap className="w-5 h-5 text-muted-foreground" />;
                    let title = "Boost Activity";
                    let variant = "secondary";
                    
                    if (entry.type === 'applied') {
                      icon = <Check className="w-5 h-5 text-green-500" />;
                      title = "Boost Applied";
                      variant = "default";
                    } else if (entry.type === 'expired') {
                      icon = <Clock className="w-5 h-5 text-amber-500" />;
                      title = "Boost Expired";
                      variant = "secondary";
                    } else if (entry.type === 'cancelled') {
                      icon = <X className="w-5 h-5 text-red-500" />;
                      title = "Boost Cancelled";
                      variant = "destructive";
                    } else if (entry.type === 'extended') {
                      icon = <ArrowRight className="w-5 h-5 text-blue-500" />;
                      title = "Boost Extended";
                      variant = "default";
                    } else if (entry.type === 'scheduled') {
                      icon = <Calendar className="w-5 h-5 text-purple-500" />;
                      title = "Boost Scheduled";
                      variant = "secondary";
                    } else if (entry.type === 'scheduled_applied') {
                      icon = <Check className="w-5 h-5 text-green-500" />;
                      title = "Scheduled Boost Applied";
                      variant = "default";
                    } else if (entry.type === 'scheduled_cancelled') {
                      icon = <X className="w-5 h-5 text-red-500" />;
                      title = "Scheduled Boost Cancelled";
                      variant = "destructive";
                    } else if (entry.type === 'scheduled_failed') {
                      icon = <AlertCircle className="w-5 h-5 text-red-500" />;
                      title = "Scheduled Boost Failed";
                      variant = "destructive";
                    }
                    
                    return (
                      <div 
                        key={entry.id} 
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                            {icon}
                          </div>
                          <div>
                            <p className="font-medium">{title}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(entry.timestamp)}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                            {getBoostIcon(entry.details?.boostType)}
                            <span className="text-sm">
                              {boostTypes?.[entry.details?.boostType]?.name || 'Unknown Boost'}
                            </span>
                          </div>
                          {entry.details?.duration && (
                            <span className="text-xs text-muted-foreground">
                              Duration: {entry.details.duration}
                            </span>
                          )}
                          {entry.details?.refundAmount > 0 && (
                            <Badge variant="outline" className="text-green-500">
                              Refund: {entry.details.refundAmount} coins
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart4 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No boost history yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use boosts to enhance your server performance for a limited time
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Extension Dialog */}
      <Dialog open={confirmDialog?.type === 'extend'} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extend Boost Duration</DialogTitle>
          </DialogHeader>
          
          {confirmDialog?.type === 'extend' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{boostTypes?.[confirmDialog.boost.boostType]?.name || 'Unknown Boost'}</p>
                    <p className="text-xs text-muted-foreground">Server: {confirmDialog.boost.serverName}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">Select extension duration:</label>
                  <div className="grid grid-cols-5 gap-2">
                    {boostTypes && confirmDialog.boost && Object.keys(boostTypes[confirmDialog.boost.boostType].prices).map(duration => (
                      <Button
                        key={duration}
                        size="sm"
                        variant={confirmDialog.additionalDuration === duration ? "default" : "outline"}
                        onClick={() => setConfirmDialog({
                          ...confirmDialog,
                          additionalDuration: duration
                        })}
                      >
                        {duration}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current expiry:</span>
                    <span>{formatDate(confirmDialog.boost.expiresAt)}</span>
                  </div>
                  {confirmDialog.additionalDuration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">New expiry:</span>
                      <span>{formatDate(confirmDialog.boost.expiresAt + (parseInt(confirmDialog.additionalDuration) * 60 * 60 * 1000))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span>{boostTypes?.[confirmDialog.boost.boostType]?.prices?.[confirmDialog.additionalDuration] || '?'} coins</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleExtendBoost}
                  disabled={isExtending || !confirmDialog.additionalDuration}
                >
                  {isExtending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  Extend Boost
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Boost Dialog */}
      <Dialog open={confirmDialog?.type === 'cancel'} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Active Boost</DialogTitle>
          </DialogHeader>
          
          {confirmDialog?.type === 'cancel' && (
            <>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to cancel this boost? You'll receive a partial refund based on remaining time.
                </p>
                
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{boostTypes?.[confirmDialog.boost.boostType]?.name || 'Unknown Boost'}</p>
                    <p className="text-xs text-muted-foreground">Server: {confirmDialog.boost.serverName}</p>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Applied at:</span>
                    <span>{formatDate(confirmDialog.boost.appliedAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires at:</span>
                    <span>{formatDate(confirmDialog.boost.expiresAt)}</span>
                  </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time remaining:</span>
                    <span>{formatTimeRemaining(confirmDialog.boost.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original price:</span>
                    <span>{confirmDialog.boost.price} coins</span>
                  </div>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive approximately 50% of the remaining value as a refund.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                  Keep Boost
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelBoost}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancel Boost
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Scheduled Boost Dialog */}
      <Dialog open={confirmDialog?.type === 'cancel-scheduled'} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Scheduled Boost</DialogTitle>
          </DialogHeader>
          
          {confirmDialog?.type === 'cancel-scheduled' && (
            <>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Are you sure you want to cancel this scheduled boost? You'll receive a full refund.
                </p>
                
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{boostTypes?.[confirmDialog.scheduledBoost.boostType]?.name || 'Unknown Boost'}</p>
                    <p className="text-xs text-muted-foreground">Server: {confirmDialog.scheduledBoost.serverName}</p>
                  </div>
                </div>
                
                <div className="bg-muted p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Scheduled for:</span>
                    <span>{formatDate(confirmDialog.scheduledBoost.scheduledTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <span>{confirmDialog.scheduledBoost.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <span>{confirmDialog.scheduledBoost.price} coins</span>
                  </div>
                </div>
                
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>
                    You'll receive a full refund of {confirmDialog.scheduledBoost.price} coins.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmDialog(null)}>
                  Keep Scheduled
                </Button>
                <Button 
                  variant="destructive"
                  onClick={handleCancelScheduledBoost}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <X className="w-4 h-4 mr-2" />
                  )}
                  Cancel Scheduled Boost
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}