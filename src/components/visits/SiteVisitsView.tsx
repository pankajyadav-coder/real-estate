import { useState, useMemo } from 'react';
import { SiteVisit } from '@/data/mockData';
import { 
  Calendar, Clock, User, MessageSquare, Check, X, Plus, RefreshCw, 
  Trash2, Edit, Search, MapPin, Building2, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  useSiteVisits, useCreateSiteVisit, useUpdateSiteVisit, useDeleteSiteVisit, 
  useLeads, useProperties 
} from '@/hooks/useData';
import { SiteVisitForm } from './SiteVisitForm';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SiteVisitsView() {
  const { data: siteVisits = [], isLoading } = useSiteVisits();
  const { data: leads = [] } = useLeads();
  const { data: properties = [] } = useProperties();
  const createSiteVisit = useCreateSiteVisit();
  const updateSiteVisit = useUpdateSiteVisit();
  const deleteSiteVisit = useDeleteSiteVisit();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [deletingVisit, setDeletingVisit] = useState<SiteVisit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SiteVisit['status']>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  // Filter site visits based on search and filters
  const filteredVisits = useMemo(() => {
    let filtered = [...siteVisits];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => 
        v.leadName.toLowerCase().includes(query) ||
        v.propertyTitle.toLowerCase().includes(query) ||
        v.assignedTo.toLowerCase().includes(query) ||
        v.feedback?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(v => v.date === today);
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(v => v.date >= today);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(v => v.date < today);
    }

    return filtered;
  }, [siteVisits, searchQuery, statusFilter, dateFilter, today]);

  // Group filtered visits by status
  const scheduledVisits = filteredVisits.filter(v => v.status === 'scheduled');
  const completedVisits = filteredVisits.filter(v => v.status === 'completed');
  const cancelledVisits = filteredVisits.filter(v => v.status === 'cancelled');

  // Get today's scheduled visits
  const todayScheduledVisits = scheduledVisits.filter(v => v.date === today);

  const handleCreateVisit = async (data: Partial<SiteVisit>) => {
    try {
      await createSiteVisit.mutateAsync(data);
      toast({ 
        title: 'Success', 
        description: 'Site visit scheduled successfully' 
      });
      setIsFormOpen(false);
      setEditingVisit(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule site visit',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateVisit = async (data: Partial<SiteVisit>) => {
    if (!editingVisit?.id) return;
    try {
      await updateSiteVisit.mutateAsync({ id: editingVisit.id, data });
      toast({ 
        title: 'Success', 
        description: 'Site visit updated successfully' 
      });
      setIsFormOpen(false);
      setEditingVisit(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update site visit',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleMarkComplete = async (visit: SiteVisit) => {
    try {
      await updateSiteVisit.mutateAsync({ id: visit.id, data: { status: 'completed' } });
      toast({ 
        title: 'Success', 
        description: 'Site visit marked as completed' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update site visit',
        variant: 'destructive',
      });
    }
  };

  const handleCancelVisit = async (visit: SiteVisit) => {
    try {
      await updateSiteVisit.mutateAsync({ id: visit.id, data: { status: 'cancelled' } });
      toast({ 
        title: 'Success', 
        description: 'Site visit cancelled' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel site visit',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingVisit) return;
    try {
      await deleteSiteVisit.mutateAsync(deletingVisit.id);
      toast({ 
        title: 'Success', 
        description: 'Site visit deleted successfully' 
      });
      setDeletingVisit(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete site visit',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (visit: SiteVisit) => {
    setEditingVisit(visit);
    setIsFormOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['siteVisits'] });
    toast({ 
      title: 'Refreshed', 
      description: 'Site visits list updated' 
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || dateFilter !== 'all';

  const VisitCard = ({ visit }: { visit: SiteVisit }) => {
    const isPast = visit.date < today;
    const isToday = visit.date === today;
    const initials = visit.leadName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div className="card-elevated p-4 animate-scale-in group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate">{visit.leadName}</h4>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {visit.propertyTitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              visit.status === 'scheduled' ? 'bg-info/10 text-info' :
              visit.status === 'completed' ? 'bg-success/10 text-success' :
              'bg-destructive/10 text-destructive'
            )}>
              {visit.status}
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEdit(visit)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => setDeletingVisit(visit)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className={cn(
              isToday && 'font-semibold text-foreground',
              isPast && visit.status === 'scheduled' && 'text-destructive'
            )}>
              {visit.date}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{visit.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>{visit.assignedTo}</span>
          </div>
        </div>

        {visit.feedback && (
          <div className="mt-3 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground line-clamp-2">{visit.feedback}</p>
          </div>
        )}

        {visit.status === 'scheduled' && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <Button 
              size="sm" 
              className="flex-1 gradient-primary border-0"
              onClick={() => handleMarkComplete(visit)}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleCancelVisit(visit)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        )}

        {visit.status === 'completed' && !visit.feedback && (
          <div className="mt-4 pt-3 border-t border-border">
            <Button 
              size="sm" 
              variant="outline"
              className="w-full"
              onClick={() => handleEdit(visit)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Feedback
            </Button>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="card-elevated p-8 text-center">
      <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-muted-foreground">Loading site visits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Site Visits</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            className="gradient-primary border-0" 
            onClick={() => {
              setEditingVisit(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-info flex items-center justify-center">
            <Calendar className="w-6 h-6 text-info-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{todayScheduledVisits.length}</p>
            <p className="text-sm text-muted-foreground">Scheduled Today</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
            <Check className="w-6 h-6 text-success-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{completedVisits.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center">
            <X className="w-6 h-6 text-destructive-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{cancelledVisits.length}</p>
            <p className="text-sm text-muted-foreground">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lead, property, agent, or feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <span className="text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                Search: "{searchQuery}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                Status: {statusFilter}
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                Date: {dateFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Scheduled Visits */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-info" />
          Scheduled Visits ({scheduledVisits.length})
        </h3>
        {scheduledVisits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        ) : (
          <EmptyState message="No scheduled visits found" />
        )}
      </div>

      {/* Completed Visits */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success" />
          Completed Visits ({completedVisits.length})
        </h3>
        {completedVisits.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        ) : (
          <EmptyState message="No completed visits found" />
        )}
      </div>

      {/* Cancelled Visits */}
      {cancelledVisits.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-destructive" />
            Cancelled Visits ({cancelledVisits.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cancelledVisits.map((visit) => (
              <VisitCard key={visit.id} visit={visit} />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {filteredVisits.length === 0 && siteVisits.length > 0 && (
        <EmptyState message="No site visits match your filters. Try adjusting your search criteria." />
      )}

      {/* All visits empty */}
      {siteVisits.length === 0 && (
        <EmptyState message="No site visits yet. Schedule your first visit to get started!" />
      )}

      {/* Site Visit Form Dialog */}
      <SiteVisitForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingVisit(null);
        }}
        visit={editingVisit}
        onSubmit={editingVisit ? handleUpdateVisit : handleCreateVisit}
        leads={leads.map(lead => ({ id: lead.id, name: lead.name }))}
        properties={properties.map(prop => ({ id: prop.id, title: prop.title }))}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingVisit} onOpenChange={(open) => !open && setDeletingVisit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site Visit</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the site visit for <strong>{deletingVisit?.leadName}</strong> 
              {' '}at <strong>{deletingVisit?.propertyTitle}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingVisit(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
