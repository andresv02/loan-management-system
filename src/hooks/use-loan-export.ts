import { useToast } from '@/hooks/use-toast';
import { getEffectivePrestamoEstado } from '@/lib/utils';
import { PrestamoWithDetails, Company } from '@/types/app';

export function useLoanExport() {
  const { toast } = useToast();

  const exportLoans = (
    data: PrestamoWithDetails[],
    selectedCompany: Company | null,
    onSuccess?: () => void
  ) => {
    if (!selectedCompany || !data.length) {
      return;
    }

    const companyLoans = data.filter((prestamo) => 
      prestamo.empresa === selectedCompany.name && 
      (prestamo.estado === 'activa' || prestamo.estado === 'atrasada')
    );

    if (companyLoans.length === 0) {
      toast({
        title: "Sin datos",
        description: `No hay préstamos para la empresa "${selectedCompany.name}".`,
      });
      return;
    }

    // Headers
    const headers = [
      "ID",
      "Cedula",
      "Nombre",
      "Principal",
      "Cuota",
      "Fecha Inicio",
      "Fecha Fin",
      "Saldo Pendiente",
    ];

    // Rows
    const rows = companyLoans.map((prestamo) => {
      // Sort amortizacion by quincenaNum to ensure correct order
      const sortedAmort = [...prestamo.amortizacion].sort((a, b) => a.quincenaNum - b.quincenaNum);
      
      const fechaInicio = sortedAmort.length > 0 ? sortedAmort[0].fechaQuincena : "";
      const fechaFin = sortedAmort.length > 0 ? sortedAmort[sortedAmort.length - 1].fechaQuincena : "";

      const principalTotal = parseFloat(prestamo.principal);
      const interesTotal = parseFloat(prestamo.interesTotal);
      
      // Sum of all Cuotas he has paid
      const paidCuotasSum = sortedAmort
        .filter(row => row.estado === 'pagada')
        .reduce((sum, row) => sum + parseFloat(row.cuotaQuincenal), 0);

      const saldoPendiente = (principalTotal + interesTotal) - paidCuotasSum;

      return [
        prestamo.id.toString(),
        prestamo.cedula,
        prestamo.nombre,
        principalTotal.toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        parseFloat(prestamo.cuotaQuincenal).toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        fechaInicio ? new Date(fechaInicio + 'T00:00:00').toLocaleDateString("es-PA") : "",
        fechaFin ? new Date(fechaFin + 'T00:00:00').toLocaleDateString("es-PA") : "",
        saldoPendiente.toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
      ];
    });

    // Center the title by adding empty columns before it (approximate centering for 8 columns)
    const emptyCols = ",,,"; 
    const title1 = `${emptyCols}"Resumen Prestamos"`;
    const title2 = `${emptyCols}"${selectedCompany.name} - ${new Date().toLocaleDateString("es-PA")}"`;

    const csvContent = [
      title1,
      title2,
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toLocaleDateString("es-PA").replace(/\//g, "-");
    link.download = `${selectedCompany.name} Prestamos ${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "¡Exportado!",
      description: `Reporte de ${companyLoans.length} préstamos de ${selectedCompany.name} descargado.`,
      duration: 5000,
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  return { exportLoans };
}
