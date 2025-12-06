import { useState, useMemo } from 'react';
import { FollowUp } from '@/data/mockData';
import { 
  Phone, MessageSquare, Calendar, Mail, Clock, Check, AlertCircle, Plus, RefreshCw, 
  Trash2, Edit, Search, Filter, X, CalendarClock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  useFollowUps, useCreateFollowUp, useUpdateFollowUp, useDeleteFollowUp, useLeads 
} from '@/hooks/useData';
import { FollowUpForm } from './FollowUpForm';
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

export function FollowUpsView() {
  const { data: followUps = [], isLoading } = useFollowUps();
  const { data: leads = [] } = useLeads();
  const createFollowUp = useCreateFollowUp();
  const updateFollowUp = useUpdateFollowUp();
  const deleteFollowUp = useDeleteFollowUp();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | FollowUp['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | FollowUp['type']>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'upcoming' | 'past'>('all');

  // Get today's date for filtering
  const today = new Date().toISOString().split('T')[0];

  // Filter follow-ups based on search and filters
  const filteredFollowUps = useMemo(() => {
    let filtered = [...followUps];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.leadName.toLowerCase().includes(query) ||
        f.notes?.toLowerCase().includes(query) ||
        f.type.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(f => f.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(f => f.type === typeFilter);
    }

    // Date filter
    if (dateFilter === 'today') {
      filtered = filtered.filter(f => f.date === today);
    } else if (dateFilter === 'upcoming') {
      filtered = filtered.filter(f => f.date >= today);
    } else if (dateFilter === 'past') {
      filtered = filtered.filter(f => f.date < today);
    }

    return filtered;
  }, [followUps, searchQuery, statusFilter, typeFilter, dateFilter, today]);

  // Group filtered follow-ups by status
  const pendingFollowUps = filteredFollowUps.filter(f => f.status === 'pending');
  const missedFollowUps = filteredFollowUps.filter(f => f.status === 'missed');
  const completedFollowUps = filteredFollowUps.filter(f => f.status === 'completed');

  // Get today's pending follow-ups
  const todayPendingFollowUps = pendingFollowUps.filter(f => f.date === today);

  const getTypeIcon = (type: FollowUp['type']) => {
    switch (type) {
      case 'call': return Phone;
      case 'whatsapp': return MessageSquare;
      case 'meeting': return Calendar;
      case 'email': return Mail;
    }
  };

  const handleCreateFollowUp = async (data: Partial<FollowUp>) => {
    try {
      await createFollowUp.mutateAsync(data);
      toast({ 
        title: 'Success', 
        description: 'Follow-up created successfully' 
      });
      setIsFormOpen(false);
      setEditingFollowUp(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create follow-up',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateFollowUp = async (data: Partial<FollowUp>) => {
    if (!editingFollowUp?.id) return;
    try {
      await updateFollowUp.mutateAsync({ id: editingFollowUp.id, data });
      toast({ 
        title: 'Success', 
        description: 'Follow-up updated successfully' 
      });
      setIsFormOpen(false);
      setEditingFollowUp(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow-up',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleMarkComplete = async (followUp: FollowUp) => {
    try {
      await updateFollowUp.mutateAsync({ id: followUp.id, data: { status: 'completed' } });
      toast({ 
        title: 'Success', 
        description: 'Follow-up marked as completed' 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow-up',
        variant: 'destructive',
      });
    }
  };

  const handleReschedule = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingFollowUp) return;
    try {
      await deleteFollowUp.mutateAsync(deletingFollowUp.id);
      toast({ 
        title: 'Success', 
        description: 'Follow-up deleted successfully' 
      });
      setDeletingFollowUp(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete follow-up',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (followUp: FollowUp) => {
    setEditingFollowUp(followUp);
    setIsFormOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['followUps'] });
    toast({ 
      title: 'Refreshed', 
      description: 'Follow-ups list updated' 
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all';

  const FollowUpCard = ({ followUp }: { followUp: FollowUp }) => {
    const TypeIcon = getTypeIcon(followUp.type);
    const isPast = followUp.date < today;
    const isToday = followUp.date === today;

    return (
      <div className="card-elevated p-4 animate-scale-in group">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              followUp.type === 'call' ? 'bg-success/10 text-success' :
              followUp.type === 'whatsapp' ? 'bg-info/10 text-info' :
              followUp.type === 'meeting' ? 'bg-warning/10 text-warning' :
              'bg-primary/10 text-primary'
            )}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-sm truncate">{followUp.leadName}</h4>
              <p className="text-xs text-muted-foreground capitalize">{followUp.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              followUp.status === 'pending' ? 'bg-warning/10 text-warning' :
              followUp.status === 'completed' ? 'bg-success/10 text-success' :
              'bg-destructive/10 text-destructive'
            )}>
              {followUp.status}
            </span>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEdit(followUp)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => setDeletingFollowUp(followUp)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {followUp.notes && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{followUp.notes}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className={cn(
              isToday && 'font-semibold text-foreground',
              isPast && followUp.status === 'pending' && 'text-destructive'
            )}>
              {followUp.date}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{followUp.time}</span>
          </div>
        </div>

        {followUp.status === 'pending' && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
            <Button 
              size="sm" 
              className="flex-1 gradient-primary border-0"
              onClick={() => handleMarkComplete(followUp)}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleReschedule(followUp)}
            >
              <CalendarClock className="w-4 h-4 mr-2" />
              Reschedule
            </Button>
          </div>
        )}
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="card-elevated p-8 text-center">
      <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-muted-foreground">Loading follow-ups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Follow-ups</h2>
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
              setEditingFollowUp(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Follow-up
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
            <Clock className="w-6 h-6 text-warning-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{todayPendingFollowUps.length}</p>
            <p className="text-sm text-muted-foreground">Pending Today</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-destructive flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{missedFollowUps.length}</p>
            <p className="text-sm text-muted-foreground">Missed</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
            <Check className="w-6 h-6 text-success-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{completedFollowUps.length}</p>
            <p className="text-sm text-muted-foreground">Completed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by lead name, notes, or type..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="email">Email</SelectItem>
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
            {typeFilter !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                Type: {typeFilter}
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

      {/* Missed Follow-ups (Priority) */}
      {missedFollowUps.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Missed Follow-ups ({missedFollowUps.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {missedFollowUps.map((followUp) => (
              <FollowUpCard key={followUp.id} followUp={followUp} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Follow-ups */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-warning" />
          Pending Follow-ups ({pendingFollowUps.length})
        </h3>
        {pendingFollowUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingFollowUps.map((followUp) => (
              <FollowUpCard key={followUp.id} followUp={followUp} />
            ))}
          </div>
        ) : (
          <EmptyState message="No pending follow-ups found" />
        )}
      </div>

      {/* Completed Follow-ups */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-success" />
          Completed Follow-ups ({completedFollowUps.length})
        </h3>
        {completedFollowUps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedFollowUps.map((followUp) => (
              <FollowUpCard key={followUp.id} followUp={followUp} />
            ))}
          </div>
        ) : (
          <EmptyState message="No completed follow-ups found" />
        )}
      </div>

      {/* No results */}
      {filteredFollowUps.length === 0 && followUps.length > 0 && (
        <EmptyState message="No follow-ups match your filters. Try adjusting your search criteria." />
      )}

      {/* All follow-ups empty */}
      {followUps.length === 0 && (
        <EmptyState message="No follow-ups yet. Create your first follow-up to get started!" />
      )}

      {/* Follow-up Form Dialog */}
      <FollowUpForm
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingFollowUp(null);
        }}
        followUp={editingFollowUp}
        onSubmit={editingFollowUp ? handleUpdateFollowUp : handleCreateFollowUp}
        leads={leads.map(lead => ({ id: lead.id, name: lead.name }))}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingFollowUp} onOpenChange={(open) => !open && setDeletingFollowUp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Follow-up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the follow-up for <strong>{deletingFollowUp?.leadName}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingFollowUp(null)}>Cancel</AlertDialogCancel>
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
