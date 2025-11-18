// src/pages/admin/AllOptions.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Search, Pencil, Trash2, Pizza } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { apiService } from '@/lib/api'; // Import apiService

interface ProductOption {
  _id: string;
  name: string;
  price: number;
  image?: string;
  availability?: boolean;
  dineIn?: boolean;
  delivery?: boolean;
  takeaway?: boolean;
  optionGroups?: any[];
}

export default function AllOptionsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [options, setOptions] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByAvailability, setFilterByAvailability] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; option?: ProductOption }>({
    open: false,
  });

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      // Use apiService instead of direct fetch
      const response = await apiService.getProductOptions();
      setOptions(response.data);
    } catch (error: any) {
      console.error('Error fetching options:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les options',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!deleteDialog.option) return;

    try {
      // Use apiService instead of direct fetch
      await apiService.deleteProductOption(deleteDialog.option._id);
      toast({
        title: 'Succès',
        description: 'Option supprimée avec succès',
      });
      fetchOptions();
    } catch (error: any) {
      console.error('Error deleting option:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'option',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialog({ open: false });
    }
  };

  const filteredOptions = options.filter((option) => {
    const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailability = !filterByAvailability || option.availability !== false;
    return matchesSearch && matchesAvailability;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Options</h1>
          <p className="text-gray-500 mt-1">Liste complète de toutes les options disponibles</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
          <label htmlFor="availability-filter" className="text-sm font-medium whitespace-nowrap">
            Filter by Availability
          </label>
          <Switch
            id="availability-filter"
            checked={filterByAvailability}
            onCheckedChange={setFilterByAvailability}
          />
        </div>
      </div>

      {/* Table */}
      {filteredOptions.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Pizza className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune option disponible</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[100px]">Price</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead className="w-[120px] text-center">Availability</TableHead>
                <TableHead className="w-[100px] text-center">Dine-in</TableHead>
                <TableHead className="w-[100px] text-center">Delivery</TableHead>
                <TableHead className="w-[100px] text-center">Takeaway</TableHead>
                <TableHead className="w-[120px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOptions.map((option) => (
                <TableRow key={option._id}>
                  <TableCell>
                    {option.image ? (
                      <img
                        src={option.image}
                        alt={option.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">{option.name.charAt(0)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium uppercase">{option.name}</TableCell>
                  <TableCell>{option.price}</TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {option.optionGroups && option.optionGroups.length > 0
                      ? `${option.optionGroups.length} groupe(s)`
                      : 'No product assigned to this option'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          option.availability !== false ? 'bg-orange-500' : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {option.dineIn !== false && <Check className="w-5 h-5 text-green-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {option.delivery !== false && <Check className="w-5 h-5 text-green-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-center">
                    {option.takeaway !== false && <Check className="w-5 h-5 text-green-500 mx-auto" />}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteDialog({ open: true, option })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/admin/options/${option._id}/edit`)}
                      >
                        <Pencil className="w-4 h-4 text-orange-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'option "{deleteDialog.option?.name}" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOption}
              className="bg-red-500 hover:bg-red-600"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
