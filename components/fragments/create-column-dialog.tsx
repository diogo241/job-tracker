'use client';

import { Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
} from '../ui/dialog';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useState } from 'react';
import { toast } from 'sonner';
import { createColumn } from '@/lib/actions/columns';

const INITIAL_FORM_DATA = {
  name: '',
  boardId: '',
};

const CreateCollumnDialog = ({ boardId }: { boardId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const handleClose = () => {
    setOpen(false);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const result = await createColumn({ ...formData });

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
      setFormData(INITIAL_FORM_DATA);
      setOpen(false);
    }

    if (error || error !== '') {
      toast.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="cursor-pointer"
          variant="outline"
        >
          <Plus />
          Add Column
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="hidden" value={boardId} name="boardId" />
          <div className="space-y-4">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <DialogFooter className="flex flex-row items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type="submit" className="cursor-pointer">
              {loading ? 'Adding...' : 'Add Collumn'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCollumnDialog;
