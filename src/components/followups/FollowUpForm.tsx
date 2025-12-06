import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FollowUp } from '@/data/mockData';

interface FollowUpFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp?: FollowUp | null;
  onSubmit: (data: Partial<FollowUp>) => Promise<void>;
  leads?: Array<{ id: string; name: string }>;
}

const followUpTypes: FollowUp['type'][] = ['call', 'whatsapp', 'meeting', 'email'];
const followUpStatuses: FollowUp['status'][] = ['pending', 'completed', 'missed'];

export function FollowUpForm({ open, onOpenChange, followUp, onSubmit, leads = [] }: FollowUpFormProps) {
  const [formData, setFormData] = useState<Partial<FollowUp>>({
    leadId: '',
    leadName: '',
    type: 'call',
    date: '',
    time: '',
    notes: '',
    status: 'pending',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (followUp) {
      setFormData(followUp);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5);
      setFormData({
        leadId: '',
        leadName: '',
        type: 'call',
        date: today,
        time: currentTime,
        notes: '',
        status: 'pending',
      });
    }
  }, [followUp, open]);

  const handleLeadChange = (leadId: string) => {
    const selectedLead = leads.find(l => l.id === leadId);
    setFormData({
      ...formData,
      leadId,
      leadName: selectedLead?.name || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving follow-up:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{followUp ? 'Edit Follow-up' : 'Add New Follow-up'}</DialogTitle>
          <DialogDescription>
            {followUp ? 'Update follow-up details' : 'Schedule a new follow-up with a lead'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadId">Lead *</Label>
              {leads.length > 0 ? (
                <Select
                  value={formData.leadId || ''}
                  onValueChange={handleLeadChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="leadName"
                  value={formData.leadName || ''}
                  onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                  placeholder="Lead name"
                  required
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type || 'call'}
                onValueChange={(value) => setFormData({ ...formData, type: value as FollowUp['type'] })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {followUpTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time || ''}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || 'pending'}
              onValueChange={(value) => setFormData({ ...formData, status: value as FollowUp['status'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {followUpStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes or reminders for this follow-up"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : followUp ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

