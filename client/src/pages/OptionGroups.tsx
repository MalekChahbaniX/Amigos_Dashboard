// src/pages/admin/OptionGroupsPage.tsx
import { useState, useEffect } from 'react';
import { Search, Plus, Pencil, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/lib/api';
import OptionForm from './OptionForm';
import OptionGroupForm from './OptionGroupForm';

interface Option {
  _id: string;
  option: string;
  name: string;
  price: number;
  image?: string;
}

interface OptionGroup {
  _id: string;
  name: string;
  description?: string;
  min?: number;
  max?: number;
  options: Option[];
  image?: string;
}

export default function OptionGroupsPage() {
  const { toast } = useToast();
  const [optionGroups, setOptionGroups] = useState<OptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [optionDialogOpen, setOptionDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OptionGroup | null>(null);
  const [editingOption, setEditingOption] = useState<{ option: Option; groupId: string } | null>(null);
  const [selectedGroupForOption, setSelectedGroupForOption] = useState<string | null>(null);
  
  // Delete dialogs
  const [deleteGroupDialog, setDeleteGroupDialog] = useState<{ open: boolean; group?: OptionGroup }>({ open: false });
  const [deleteOptionDialog, setDeleteOptionDialog] = useState<{ open: boolean; option?: Option; groupId?: string }>({ open: false });

  useEffect(() => {
    fetchOptionGroups();
  }, []);

  const fetchOptionGroups = async () => {
    try {
      setLoading(true);
      const response = await apiService.getOptionGroups();
      setOptionGroups(response.data);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les groupes d\'options',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupDialogOpen(true);
  };

  const handleEditGroup = (group: OptionGroup) => {
    setEditingGroup(group);
    setGroupDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!deleteGroupDialog.group) return;

    try {
      await apiService.deleteOptionGroup(deleteGroupDialog.group._id);
      toast({
        title: 'Succès',
        description: 'Groupe supprimé avec succès',
      });
      fetchOptionGroups();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le groupe',
        variant: 'destructive',
      });
    } finally {
      setDeleteGroupDialog({ open: false });
    }
  };

  const handleAddOption = (groupId: string) => {
    setSelectedGroupForOption(groupId);
    setEditingOption(null);
    setOptionDialogOpen(true);
  };

  const handleEditOption = (option: Option, groupId: string) => {
    setSelectedGroupForOption(groupId);
    setEditingOption({ option, groupId });
    setOptionDialogOpen(true);
  };

  const handleDeleteOption = async () => {
    if (!deleteOptionDialog.option || !deleteOptionDialog.groupId) return;

    try {
      await apiService.removeOptionFromGroup(deleteOptionDialog.groupId, deleteOptionDialog.option._id);
      toast({
        title: 'Succès',
        description: 'Option supprimée avec succès',
      });
      fetchOptionGroups();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'option',
        variant: 'destructive',
      });
    } finally {
      setDeleteOptionDialog({ open: false });
    }
  };

  const handleGroupFormSuccess = () => {
    setGroupDialogOpen(false);
    setEditingGroup(null);
    fetchOptionGroups();
  };

  const handleOptionFormSuccess = () => {
    setOptionDialogOpen(false);
    setEditingOption(null);
    setSelectedGroupForOption(null);
    fetchOptionGroups();
  };

  const filteredGroups = optionGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Options Groups</h1>
          <p className="text-gray-500 mt-1">Gérez vos groupes d'options et leurs configurations</p>
        </div>
        <Button onClick={handleCreateGroup}>
          <Plus className="w-4 h-4 mr-2" />
          add options groups
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Option Groups List */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-4">Aucun groupe d'options trouvé</p>
            <Button onClick={handleCreateGroup}>Créer un groupe</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => (
            <Card key={group._id}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg uppercase">{group.name}</CardTitle>
                    {(group.min !== undefined || group.max !== undefined) && (
                      <CardDescription className="mt-1">
                        Min : {group.min || 0} | Max : {group.max || 0}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditGroup(group)}>
                      <Pencil className="w-4 h-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteGroupDialog({ open: true, group })}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">Options</h3>
                {group.options && group.options.length > 0 ? (
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <div key={option._id || option.option} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-3">
                          {option.image ? (
                            <img src={option.image} alt={option.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">{option.name.charAt(0)}</span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm uppercase">{option.name}</p>
                            <p className="text-xs text-gray-500">price : {option.price > 0 ? option.price : '0'}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditOption(option, group._id)}>
                            <Pencil className="w-3 h-3 text-orange-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteOptionDialog({ open: true, option, groupId: group._id })}>
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune option disponible</p>
                )}
                <Button variant="outline" className="w-full mt-4 border-dashed border-orange-500 text-orange-500 hover:bg-orange-50" onClick={() => handleAddOption(group._id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une option
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Option Group Dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Modifier le groupe' : 'Ajouter un groupe'}</DialogTitle>
          </DialogHeader>
          <OptionGroupForm 
            group={editingGroup} 
            onSuccess={handleGroupFormSuccess}
            onCancel={() => setGroupDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialogOpen} onOpenChange={setOptionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOption ? 'Modifier l\'option' : 'Ajouter une option'}</DialogTitle>
          </DialogHeader>
          <OptionForm 
            option={editingOption?.option} 
            groupId={selectedGroupForOption}
            onSuccess={handleOptionFormSuccess}
            onCancel={() => setOptionDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={deleteGroupDialog.open} onOpenChange={(open) => setDeleteGroupDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe "{deleteGroupDialog.group?.name}" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOptionDialog.open} onOpenChange={(open) => setDeleteOptionDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'option "{deleteOptionDialog.option?.name}" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOption} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
