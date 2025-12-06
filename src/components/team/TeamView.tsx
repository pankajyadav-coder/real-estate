import { useState, useMemo } from 'react';
import { User } from '@/data/mockData';
import { 
  Mail, Phone, Shield, Users, TrendingUp, Plus, RefreshCw, 
  Trash2, Edit, Search, X, Building2, Crown, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  useUsers, useCreateUser, useUpdateUser, useDeleteUser 
} from '@/hooks/useData';
import { TeamMemberForm } from './TeamMemberForm';
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

export function TeamView() {
  const { data: users = [], isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [deletingMember, setDeletingMember] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | User['role']>('all');

  // Allow all users to manage team (no authentication required)
  const canManageTeam = true;

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.phone.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter]);

  // Group users: Managers (as admins) and Team Members
  const managers = filteredUsers.filter(u => u.role === 'manager' || u.role === 'admin');
  const teamMembers = filteredUsers.filter(u => u.role === 'agent' || u.role === 'telecaller');

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', class: 'bg-destructive/10 text-destructive', icon: Crown };
      case 'manager':
        return { label: 'Manager', class: 'bg-primary/10 text-primary', icon: Shield };
      case 'agent':
        return { label: 'Agent', class: 'bg-success/10 text-success', icon: Users };
      case 'telecaller':
        return { label: 'Telecaller', class: 'bg-warning/10 text-warning', icon: Phone };
    }
  };

  const handleCreateUser = async (data: Partial<User>) => {
    try {
      await createUser.mutateAsync(data);
      toast({ 
        title: 'Success', 
        description: 'Team member added successfully' 
      });
      setIsFormOpen(false);
      setEditingMember(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add team member',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!editingMember?.id) return;
    try {
      await updateUser.mutateAsync({ id: editingMember.id, data });
      toast({ 
        title: 'Success', 
        description: 'Team member updated successfully' 
      });
      setIsFormOpen(false);
      setEditingMember(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update team member',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!deletingMember) return;
    try {
      await deleteUser.mutateAsync(deletingMember.id);
      toast({ 
        title: 'Success', 
        description: 'Team member deleted successfully' 
      });
      setDeletingMember(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete team member',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (member: User) => {
    setEditingMember(member);
    setIsFormOpen(true);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast({ 
      title: 'Refreshed', 
      description: 'Team list updated' 
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
  };

  const hasActiveFilters = searchQuery || roleFilter !== 'all';

  const ManagerCard = ({ manager }: { manager: User }) => {
    const roleBadge = getRoleBadge(manager.role);
    const RoleIcon = roleBadge.icon;
    const initials = manager.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const managerTeamMembers = teamMembers; // All team members report to manager

    return (
      <div className="card-elevated p-6 animate-scale-in group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0 relative">
              {initials}
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Crown className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{manager.name}</h3>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', roleBadge.class)}>
                  <RoleIcon className="w-3 h-3" />
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Team Manager</p>
            </div>
          </div>
          {canManageTeam && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEdit(manager)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => setDeletingMember(manager)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="truncate">{manager.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{manager.phone}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border mb-4">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{manager.leadsAssigned}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">{manager.dealsClosed}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">Team Members</p>
            <span className="text-xs text-muted-foreground">{managerTeamMembers.length} members</span>
          </div>
        </div>
      </div>
    );
  };

  const UserCard = ({ user }: { user: User }) => {
    const roleBadge = getRoleBadge(user.role);
    const RoleIcon = roleBadge.icon;
    const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
      <div className="card-elevated p-6 animate-scale-in group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">{user.name}</h3>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1', roleBadge.class)}>
                  <RoleIcon className="w-3 h-3" />
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </div>
          {canManageTeam && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0"
                onClick={() => handleEdit(user)}
              >
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={() => setDeletingMember(user)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <span className="truncate">{user.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{user.phone}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xl font-bold text-foreground">{user.leadsAssigned}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-success">{user.dealsClosed}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="card-elevated p-8 text-center">
      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-muted-foreground">Loading team...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage your team members and their performance
          </p>
        </div>
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
          {canManageTeam && (
            <Button 
              className="gradient-primary border-0" 
              onClick={() => {
                setEditingMember(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Users className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{filteredUsers.length}</p>
            <p className="text-sm text-muted-foreground">Total Members</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-success-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {filteredUsers.reduce((sum, u) => sum + u.dealsClosed, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Deals</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-info flex items-center justify-center">
            <Users className="w-6 h-6 text-info-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {filteredUsers.reduce((sum, u) => sum + u.leadsAssigned, 0)}
            </p>
            <p className="text-sm text-muted-foreground">Total Leads</p>
          </div>
        </div>
        <div className="card-elevated p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center">
            <Shield className="w-6 h-6 text-warning-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{managers.length}</p>
            <p className="text-sm text-muted-foreground">Managers</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-elevated p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="telecaller">Telecaller</SelectItem>
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
            {roleFilter !== 'all' && (
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                Role: {roleFilter}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Managers Section (as Admins) */}
      {managers.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            Managers ({managers.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managers.map((manager) => (
              <ManagerCard key={manager.id} manager={manager} />
            ))}
          </div>
        </div>
      )}

      {/* Team Members Section */}
      <div>
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-success" />
          Team Members ({teamMembers.length})
        </h3>
        {teamMembers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        ) : (
          <EmptyState message="No team members found. Add your first team member to get started!" />
        )}
      </div>

      {/* No results */}
      {filteredUsers.length === 0 && users.length > 0 && (
        <EmptyState message="No team members match your filters. Try adjusting your search criteria." />
      )}

      {/* All users empty */}
      {users.length === 0 && (
        <EmptyState message="No team members yet. Add your first team member to get started!" />
      )}

      {/* Team Member Form Dialog */}
      {canManageTeam && (
        <TeamMemberForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingMember(null);
          }}
          member={editingMember}
          onSubmit={editingMember ? handleUpdateUser : handleCreateUser}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {canManageTeam && (
        <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Team Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{deletingMember?.name}</strong>? 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingMember(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
