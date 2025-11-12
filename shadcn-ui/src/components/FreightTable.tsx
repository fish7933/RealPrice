import { useState } from 'react';
import { FreightRoute } from '@/types/freight';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
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

interface FreightTableProps {
  routes: FreightRoute[];
  onUpdateRoute: (id: string, updatedRoute: Partial<FreightRoute>) => void;
  onDeleteRoute: (id: string) => void;
}

export default function FreightTable({ routes, onUpdateRoute, onDeleteRoute }: FreightTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<FreightRoute>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleEdit = (route: FreightRoute) => {
    setEditingId(route.id);
    setEditData({
      pol: route.pol,
      pod: route.pod,
      oceanFreight: route.oceanFreight,
      shippingCompany: route.shippingCompany,
      additionalInfo: route.additionalInfo,
    });
  };

  const handleSave = (id: string) => {
    if (!editData.pol || !editData.pod || !editData.oceanFreight || !editData.shippingCompany) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }

    onUpdateRoute(id, editData);
    setEditingId(null);
    setEditData({});
    toast.success('운임 정보가 수정되었습니다');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDelete = (id: string) => {
    onDeleteRoute(id);
    setDeleteId(null);
    toast.success('운임 경로가 삭제되었습니다');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>운임 요율표</CardTitle>
          <CardDescription>등록된 운임 경로 및 요금 정보 (수정 및 삭제 가능)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>POL (선적항)</TableHead>
                <TableHead>POD (양하항)</TableHead>
                <TableHead>O/F (운임)</TableHead>
                <TableHead>선사</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {routes.map((route) => (
                <TableRow key={route.id}>
                  {editingId === route.id ? (
                    <>
                      <TableCell>
                        <Input
                          value={editData.pol || ''}
                          onChange={(e) => setEditData({ ...editData, pol: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editData.pod || ''}
                          onChange={(e) => setEditData({ ...editData, pod: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editData.oceanFreight || ''}
                          onChange={(e) => setEditData({ ...editData, oceanFreight: Number(e.target.value) })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editData.shippingCompany || ''}
                          onChange={(e) => setEditData({ ...editData, shippingCompany: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editData.additionalInfo || ''}
                          onChange={(e) => setEditData({ ...editData, additionalInfo: e.target.value })}
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleSave(route.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{route.pol}</TableCell>
                      <TableCell>{route.pod}</TableCell>
                      <TableCell className="text-right font-semibold">${route.oceanFreight}</TableCell>
                      <TableCell>{route.shippingCompany}</TableCell>
                      <TableCell className="text-muted-foreground">{route.additionalInfo || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(route)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteId(route.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>운임 경로 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 운임 경로를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>삭제</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}