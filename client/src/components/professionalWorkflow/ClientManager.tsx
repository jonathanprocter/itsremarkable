import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, User, Phone, Mail, MapPin, Calendar, DollarSign, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ClientManagerProps {
  onSelectClient?: (client: any) => void;
  selectedClientId?: number;
}

export function ClientManager({ onSelectClient, selectedClientId }: ClientManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    preferredLocation: "",
    defaultRate: "",
    insuranceProvider: "",
    tags: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: async () => {
      const response = await fetch('/api/clients').catch(error => console.error("Fetch error:", error));
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    }
  });

  // Search clients when query changes
  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/clients/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return clients;
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(searchQuery).catch(error => console.error("Fetch error:", error))}`);
      if (!response.ok) throw new Error('Failed to search clients');
      return response.json();
    },
    enabled: !!searchQuery
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      return apiRequest('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          ...clientData,
          defaultRate: clientData.defaultRate ? parseInt(clientData.defaultRate) * 100 : null, // Convert to cents
          tags: clientData.tags ? clientData.tags.split(',').map((tag: string) => tag.trim()) : []
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setIsAddingClient(false);
      setNewClient({
        name: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        preferredLocation: "",
        defaultRate: "",
        insuranceProvider: "",
        tags: ""
      });
      toast({
        title: "Client Added",
        description: "New client has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add client",
        variant: "destructive"
      });
    }
  });

  const displayedClients = searchQuery.trim() ? searchResults : clients;

  const formatCurrency = (cents: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);

  const handleSelectClient = (client: any) => {
    onSelectClient?.(client);
    toast({
      title: "Client Selected",
      description: `Selected ${client.name} for scheduling`,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Client Management
          </CardTitle>
          <CardDescription>
            Manage your client database and contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Add Controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
                <DialogTrigger asChild>
                  <Button className="shrink-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Client</DialogTitle>
                    <DialogDescription>
                      Add a new client to your database
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={newClient.name}
                        onChange={(e) => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter client name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="client@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={newClient.phone}
                        onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultRate">Default Rate (USD)</Label>
                      <Input
                        id="defaultRate"
                        type="number"
                        value={newClient.defaultRate}
                        onChange={(e) => setNewClient(prev => ({ ...prev, defaultRate: e.target.value }))}
                        placeholder="150"
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferredLocation">Preferred Location</Label>
                      <Select value={newClient.preferredLocation} onValueChange={(value) => setNewClient(prev => ({ ...prev, preferredLocation: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="woodbury">Woodbury Office</SelectItem>
                          <SelectItem value="rvc">RVC Office</SelectItem>
                          <SelectItem value="telehealth">Telehealth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input
                        id="tags"
                        value={newClient.tags}
                        onChange={(e) => setNewClient(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="anxiety, couples, individual"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newClient.notes}
                        onChange={(e) => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about the client"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={() => createClientMutation.mutate(newClient)}
                        disabled={!newClient.name || createClientMutation.isPending}
                        className="flex-1"
                      >
                        {createClientMutation.isPending ? 'Adding...' : 'Add Client'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingClient(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading clients...
                </div>
              ) : displayedClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No clients found matching your search' : 'No clients added yet'}
                </div>
              ) : (
                displayedClients.map((client: any) => (
                  <Card 
                    key={client.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedClientId === client.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleSelectClient(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">{client.name}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {client.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {client.email}
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                          {client.preferredLocation && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {client.preferredLocation === 'woodbury' ? 'Woodbury Office' : 
                               client.preferredLocation === 'rvc' ? 'RVC Office' : 'Telehealth'}
                            </div>
                          )}
                          {client.tags && client.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {client.tags.map((tag: string, index: number) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          {client.defaultRate && (
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(client.defaultRate)}
                            </div>
                          )}
                          {client.notes && (
                            <div className="mt-1">
                              <FileText className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}