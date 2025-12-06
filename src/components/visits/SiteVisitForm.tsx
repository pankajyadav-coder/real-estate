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
import type { SiteVisit } from '@/data/mockData';

interface SiteVisitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit?: SiteVisit | null;
  onSubmit: (data: Partial<SiteVisit>) => Promise<void>;
  leads?: Array<{ id: string; name: string }>;
  properties?: Array<{ id: string; title: string }>;
}

const visitStatuses: SiteVisit['status'][] = ['scheduled', 'completed', 'cancelled'];

export function SiteVisitForm({ open, onOpenChange, visit, onSubmit, leads = [], properties = [] }: SiteVisitFormProps) {
  const [formData, setFormData] = useState<Partial<SiteVisit>>({
    leadId: '',
    leadName: '',
    propertyId: '',
    propertyTitle: '',
    date: '',
    time: '',
    assignedTo: '',
    status: 'scheduled',
    feedback: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visit) {
      setFormData(visit);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5);
      setFormData({
        leadId: '',
        leadName: '',
        propertyId: '',
        propertyTitle: '',
        date: today,
        time: currentTime,
        assignedTo: '',
        status: 'scheduled',
        feedback: '',
      });
    }
  }, [visit, open]);

  const handleLeadChange = (leadId: string) => {
    const selectedLead = leads.find(l => l.id === leadId);
    setFormData({
      ...formData,
      leadId,
      leadName: selectedLead?.name || '',
    });
  };

  const handlePropertyChange = (propertyId: string) => {
    const selectedProperty = properties.find(p => p.id === propertyId);
    setFormData({
      ...formData,
      propertyId,
      propertyTitle: selectedProperty?.title || '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving site visit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{visit ? 'Edit Site Visit' : 'Schedule New Site Visit'}</DialogTitle>
          <DialogDescription>
            {visit ? 'Update site visit details' : 'Schedule a new property visit for a lead'}
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
              <Label htmlFor="propertyId">Property *</Label>
              {properties.length > 0 ? (
                <Select
                  value={formData.propertyId || ''}
                  onValueChange={handlePropertyChange}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="propertyTitle"
                  value={formData.propertyTitle || ''}
                  onChange={(e) => setFormData({ ...formData, propertyTitle: e.target.value })}
                  placeholder="Property title"
                  required
                />
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To *</Label>
              <Input
                id="assignedTo"
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                placeholder="Agent name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'scheduled'}
                onValueChange={(value) => setFormData({ ...formData, status: value as SiteVisit['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {visitStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              value={formData.feedback || ''}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              placeholder="Add visit feedback or notes..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : visit ? 'Update' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

