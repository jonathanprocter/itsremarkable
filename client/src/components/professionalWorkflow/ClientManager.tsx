import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, User, DollarSign, Calendar, FileText, Phone, Mail } from "lucide-react";
import { Client, InsertClient } from "@shared/schema";

interface ClientManagerProps {
  onSelectClient?: (client: Client) => void;
  selectedClientId?: number;
}

export function ClientManager({ onSelectClient, selectedClientId }: ClientManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/clients/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/clients/search/${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: searchQuery.length > 0
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: InsertClient) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsCreateDialogOpen(false);
    }
  });

  const displayedClients = searchQuery ? searchResults : clients;

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    onSelectClient?.(client);
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Add */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <CreateClientDialog 
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSubmit={(data) => createClientMutation.mutate(data)}
          isLoading={createClientMutation.isPending}
        />
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
        ) : displayedClients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? `No clients found for "${searchQuery}"` : "No clients yet. Create your first client to get started."}
          </div>
        ) : (
          displayedClients.map((client: Client) => (
            <ClientCard
              key={client.id}
              client={client}
              isSelected={selectedClientId === client.id}
              onClick={() => handleClientClick(client)}
            />
          ))
        )}
      </div>

      {/* Client Details Panel */}
      {selectedClient && (
        <ClientDetailsPanel 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
}

function ClientCard({ client, isSelected, onClick }: { 
  client: Client; 
  isSelected: boolean; 
  onClick: () => void; 
}) {
  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">{client.name}</h3>
              <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                {client.status}
              </Badge>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            {client.tags && client.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {client.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="text-right space-y-1">
            <div className="text-sm font-medium">
              {client.totalSessions || 0} sessions
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(client.totalRevenue || 0)} total
            </div>
            {client.sessionRate && (
              <div className="text-xs text-muted-foreground">
                {formatCurrency(client.sessionRate)}/session
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateClientDialog({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  isLoading 
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSubmit: (data: InsertClient) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState<Partial<InsertClient>>({
    status: 'active',
    preferredLocation: 'woodbury'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name) {
      onSubmit(formData as InsertClient);
      setFormData({ status: 'active', preferredLocation: 'woodbury' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Add a new client to your practice management system.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredLocation">Preferred Location</Label>
              <Select 
                value={formData.preferredLocation} 
                onValueChange={(value) => setFormData({ ...formData, preferredLocation: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="woodbury">Woodbury</SelectItem>
                  <SelectItem value="rvc">RVC</SelectItem>
                  <SelectItem value="telehealth">Telehealth</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sessionRate">Session Rate ($)</Label>
              <Input
                id="sessionRate"
                type="number"
                step="0.01"
                value={formData.sessionRate ? formData.sessionRate / 100 : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  sessionRate: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : undefined 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">Insurance</Label>
              <Input
                id="insurance"
                value={formData.insurance || ''}
                onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name}>
              {isLoading ? "Creating..." : "Create Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClientDetailsPanel({ client, onClose }: { client: Client; onClose: () => void }) {
  const { data: sessionNotes = [] } = useQuery({
    queryKey: ['/api/session-notes', client.id],
    queryFn: async () => {
      const response = await fetch(`/api/session-notes?clientId=${client.id}`);
      if (!response.ok) throw new Error('Failed to fetch session notes');
      return response.json();
    }
  });

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {client.name}
            </CardTitle>
            <CardDescription>Client Details & Session History</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({sessionNotes.length})</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Information</Label>
                <div className="space-y-1 text-sm">
                  {client.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" />{client.email}</div>}
                  {client.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" />{client.phone}</div>}
                  {client.address && <div>{client.address}</div>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Preferences</Label>
                <div className="space-y-1 text-sm">
                  <div>Location: {client.preferredLocation || 'Not specified'}</div>
                  <div>Rate: {client.sessionRate ? formatCurrency(client.sessionRate) : 'Not set'}</div>
                  <div>Insurance: {client.insurance || 'Not specified'}</div>
                </div>
              </div>
            </div>
            
            {client.notes && (
              <div className="space-y-2">
                <Label>Notes</Label>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="sessions" className="space-y-4">
            {sessionNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No session notes recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sessionNotes.map((note: any) => (
                  <Card key={note.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {note.sessionType || 'Session'} - {note.duration || 0} minutes
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </div>
                          {note.sessionNotes && (
                            <p className="text-sm">{note.sessionNotes}</p>
                          )}
                        </div>
                        {note.sessionValue && (
                          <div className="text-sm font-medium">
                            {formatCurrency(note.sessionValue)}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{client.totalSessions || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(client.totalRevenue || 0)}</div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {client.totalSessions && client.totalRevenue 
                          ? formatCurrency(Math.round(client.totalRevenue / client.totalSessions))
                          : '$0'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Avg/Session</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}