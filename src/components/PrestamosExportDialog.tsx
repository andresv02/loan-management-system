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
import { Button } from '@/components/ui/button';
import { Company } from '@/types/app';

interface PrestamosExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  loadingCompanies: boolean;
  selectedCompany: Company | null;
  onSelectCompany: (company: Company | null) => void;
  onExport: () => void;
  onExportPDF: () => void;
}

export function PrestamosExportDialog({
  open,
  onOpenChange,
  companies,
  loadingCompanies,
  selectedCompany,
  onSelectCompany,
  onExport,
  onExportPDF,
}: PrestamosExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Préstamos</DialogTitle>
          <DialogDescription>
            Selecciona una empresa para exportar todos sus préstamos activos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={selectedCompany ? selectedCompany.id.toString() : ""}
            onValueChange={(value) => {
              const company = companies.find(c => c.id.toString() === value);
              onSelectCompany(company || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingCompanies ? "Cargando empresas..." : "Selecciona una empresa"} />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={onExportPDF}
              disabled={!selectedCompany || loadingCompanies}
              variant="outline"
            >
              PDF
            </Button>
            <Button
              onClick={onExport}
              disabled={!selectedCompany || loadingCompanies}
            >
              CSV
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
