import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Edit,
  Archive
} from 'lucide-react';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  notes?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'archived';
  preferredLocation?: string;
  sessionRate?: number;
  insurance?: string;
  totalSessions: number;
  totalRevenue: number;
  lastAppointment?: string;
  nextAppointment?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionNote {
  id: number;
  eventId?: number;
  clientId: number;
  sessionType?: string;
  progress?: string;
  goals?: string;
  homework?: string;
  nextSteps?: string;
  riskAssessment?: string;
  sessionNotes?: string;
  confidentialNotes?: string;
  duration?: number;
  sessionValue?: number;
  followUpDate?: string;
  createdAt: string;
}

interface SessionMaterial {
  id: number;
  sessionNoteId: number;
  clientId: number;
  materialType: string;
  fileName: string;
  fileSize: number;
  contentText?: string;
  aiSummary?: string;
  tags?: string[];
  uploadedAt: string;
}

interface AICaseConceptualization {
  id: number;
  clientId: number;
  conceptualizationData: any;
  presentingProblems: string[];
  treatmentGoals: string[];
  interventionsUsed: string[];
  progressIndicators: any;
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  confidenceScore: number;
  lastUpdated: string;
  version: number;
}

export function ComprehensiveClientDatabase() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [showSessionNoteDialog, setShowSessionNoteDialog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const queryClient = useQueryClient();

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['/api/clients'],
    queryFn: () => apiRequest('/api/clients')
  });

  // Fetch session notes for selected client
  const { data: sessionNotes = [] } = useQuery({
    queryKey: ['/api/session-notes', selectedClient?.id],
    queryFn: () => apiRequest(`/api/session-notes/${selectedClient?.id}`),
    enabled: !!selectedClient
  });

  // Fetch AI case conceptualization for selected client
  const { data: aiConceptualization } = useQuery({
    queryKey: ['/api/ai-conceptualization', selectedClient?.id],
    queryFn: () => apiRequest(`/api/ai-conceptualization/${selectedClient?.id}`),
    enabled: !!selectedClient
  });

  // Fetch session materials for selected client
  const { data: sessionMaterials = [] } = useQuery({
    queryKey: ['/api/session-materials', selectedClient?.id],
    queryFn: () => apiRequest(`/api/session-materials/${selectedClient?.id}`),
    enabled: !!selectedClient
  });

  // Create new client mutation
  const createClientMutation = useMutation({
    mutationFn: (clientData: Partial<Client>) => apiRequest('/api/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowNewClientDialog(false);
    }
  });

  // Create session note mutation
  const createSessionNoteMutation = useMutation({
    mutationFn: (noteData: Partial<SessionNote>) => apiRequest('/api/session-notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-notes'] });
      setShowSessionNoteDialog(false);
    }
  });

  // Upload session materials mutation
  const uploadMaterialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/session-materials/upload', {
        method: 'POST',
        body: formData
      }).catch(error => console.error("Fetch error:", error));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/session-materials'] });
      setSelectedFiles(null);
    }
  });

  // Generate AI case conceptualization mutation
  const generateAIConceptualizationMutation = useMutation({
    mutationFn: (clientId: number) => apiRequest(`/api/ai-conceptualization/${clientId}/generate`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-conceptualization'] });
    }
  });

  const filteredClients = clients.filter((client: Client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = async () => {
    if (!selectedFiles || !selectedClient) return;

    const formData = new FormData();
    formData.append('clientId', selectedClient.id.toString());
    
    Array.from(selectedFiles).forEach(file => {
      formData.append('files', file);
    });

    uploadMaterialMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Client Database</h2>
          <p className="text-muted-foreground">Comprehensive client management with AI-powered insights</p>
        </div>
        <Dialog open={showNewClientDialog} onOpenChange={setShowNewClientDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <NewClientForm onSubmit={(data) => createClientMutation.mutate(data)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Clients ({filteredClients.length})</span>
              <Users className="h-5 w-5" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">Loading clients...</div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No clients found
                </div>
              ) : (
                filteredClients.map((client: Client) => (
                  <div
                    key={client.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedClient?.id === client.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedClient(client)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{client.name}</div>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {client.totalSessions} sessions • ${(client.totalRevenue / 100).toFixed(0)} revenue
                    </div>
                    {client.nextAppointment && (
                      <div className="text-xs text-blue-600 mt-1">
                        Next: {new Date(client.nextAppointment).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <div className="lg:col-span-2">
          {selectedClient ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sessions">Sessions</TabsTrigger>
                <TabsTrigger value="materials">Materials</TabsTrigger>
                <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <ClientOverview client={selectedClient} />
              </TabsContent>

              <TabsContent value="sessions" className="mt-6">
                <SessionHistory 
                  client={selectedClient} 
                  sessionNotes={sessionNotes}
                  onAddNote={() => setShowSessionNoteDialog(true)}
                />
              </TabsContent>

              <TabsContent value="materials" className="mt-6">
                <SessionMaterials 
                  client={selectedClient}
                  materials={sessionMaterials}
                  onFileSelect={setSelectedFiles}
                  onUpload={handleFileUpload}
                  selectedFiles={selectedFiles}
                  isUploading={uploadMaterialMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="ai-insights" className="mt-6">
                <AICaseInsights 
                  client={selectedClient}
                  conceptualization={aiConceptualization}
                  onGenerateInsights={() => generateAIConceptualizationMutation.mutate(selectedClient.id)}
                  isGenerating={generateAIConceptualizationMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <ClientAnalytics client={selectedClient} sessionNotes={sessionNotes} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Client</h3>
                <p className="text-muted-foreground">
                  Choose a client from the list to view their details and session history
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Session Note Dialog */}
      <Dialog open={showSessionNoteDialog} onOpenChange={setShowSessionNoteDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Session Note - {selectedClient?.name}</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <SessionNoteForm 
              clientId={selectedClient.id}
              onSubmit={(data) => createSessionNoteMutation.mutate(data)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component sub-components would be defined here
function NewClientForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  // Implementation for new client form
  return <div>New Client Form Implementation</div>;
}

function ClientOverview({ client }: { client: Client }) {
  // Implementation for client overview
  return <div>Client Overview Implementation</div>;
}

function SessionHistory({ client, sessionNotes, onAddNote }: any) {
  // Implementation for session history
  return <div>Session History Implementation</div>;
}

function SessionMaterials({ client, materials, onFileSelect, onUpload, selectedFiles, isUploading }: any) {
  // Implementation for session materials
  return <div>Session Materials Implementation</div>;
}

function AICaseInsights({ client, conceptualization, onGenerateInsights, isGenerating }: any) {
  // Implementation for AI case insights
  return <div>AI Case Insights Implementation</div>;
}

function ClientAnalytics({ client, sessionNotes }: any) {
  // Implementation for client analytics
  return <div>Client Analytics Implementation</div>;
}

function SessionNoteForm({ clientId, onSubmit }: any) {
  // Implementation for session note form
  return <div>Session Note Form Implementation</div>;
}