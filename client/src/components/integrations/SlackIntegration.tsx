import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Bell, 
  Send, 
  Settings, 
  Plus,
  Link,
  Check,
  AlertCircle,
  Clock,
  RotateCcw as Sync
} from 'lucide-react';

interface SlackChannel {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
  lastActivity: string;
  isConnected: boolean;
}

interface SlackNotification {
  id: string;
  type: 'appointment' | 'reminder' | 'update' | 'alert';
  title: string;
  message: string;
  channel: string;
  scheduled: string;
  status: 'pending' | 'sent' | 'failed';
}

export default function SlackIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [notifications, setNotifications] = useState<SlackNotification[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    // Simulate connected Slack workspace
    setChannels([
      {
        id: 'general',
        name: 'general',
        isPrivate: false,
        memberCount: 23,
        lastActivity: '2025-01-27T23:45:00Z',
        isConnected: true
      },
      {
        id: 'team-updates',
        name: 'team-updates',
        isPrivate: false,
        memberCount: 12,
        lastActivity: '2025-01-27T22:30:00Z',
        isConnected: true
      },
      {
        id: 'client-alerts',
        name: 'client-alerts',
        isPrivate: true,
        memberCount: 5,
        lastActivity: '2025-01-27T21:15:00Z',
        isConnected: true
      }
    ]);

    setNotifications([
      {
        id: 'notif-1',
        type: 'appointment',
        title: 'Daily Schedule Summary',
        message: 'Today: 8 appointments scheduled, 2 conflicts detected',
        channel: 'team-updates',
        scheduled: '2025-01-28T08:00:00Z',
        status: 'pending'
      },
      {
        id: 'notif-2',
        type: 'reminder',
        title: 'Weekly Review Reminder',
        message: 'Time for your weekly productivity review',
        channel: 'general',
        scheduled: '2025-01-28T18:00:00Z',
        status: 'pending'
      }
    ]);

    setIsConnected(true);
  }, []);

  const handleConnect = () => {
    setIsConnected(true);
    toast({
      title: "Slack Connected",
      description: "Successfully connected to your Slack workspace",
      variant: "default"
    });
  };

  const toggleChannelConnection = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  const sendTestMessage = (channelId: string) => {
    toast({
      title: "Test Message Sent",
      description: `Test message sent to #${channels.find(c => c.id === channelId)?.name}`,
      variant: "default"
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Connect to Slack
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Slack workspace to receive automated notifications and updates
            </p>
          </div>
          
          <Button onClick={handleConnect} className="w-full max-w-xs">
            <Link className="h-4 w-4 mr-2" />
            Connect Slack Workspace
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Slack Integration
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs defaultValue="channels" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Available Channels</h3>
                <p className="text-sm text-muted-foreground">
                  Select channels to receive automated updates
                </p>
              </div>
            </div>

            {channels.map((channel) => (
              <Card key={channel.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{channel.name}</h4>
                          {channel.isPrivate && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {channel.memberCount} members • Last activity {formatRelativeTime(channel.lastActivity)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={selectedChannels.includes(channel.id)}
                        onCheckedChange={() => toggleChannelConnection(channel.id)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTestMessage(channel.id)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Scheduled Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  Automated messages and updates sent to Slack
                </p>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </div>

            {notifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{notification.title}</h4>
                        <Badge variant={
                          notification.status === 'sent' ? 'default' :
                          notification.status === 'failed' ? 'destructive' : 'secondary'
                        }>
                          {notification.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>#{notification.channel}</span>
                        <span>Scheduled: {new Date(notification.scheduled).toLocaleString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {notification.status === 'pending' && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {notification.status === 'sent' && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                      {notification.status === 'failed' && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily schedule summaries</Label>
                    <p className="text-sm text-muted-foreground">
                      Send daily appointment summaries to selected channels
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Conflict alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify when scheduling conflicts are detected
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Send weekly productivity and performance reports
                    </p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Client status updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Notify team about important client status changes
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Disconnect Slack</Label>
                    <p className="text-sm text-muted-foreground">
                      Remove integration and stop all notifications
                    </p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}