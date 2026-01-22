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

    const companyLoans = data.filter((prestamo) => prestamo.empresa === selectedCompany.name);

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
      "Cédula",
      "Nombre",
      "Empresa",
      "Principal",
      "Cuota Quincenal",
      "Saldo Pendiente",
      "Próximo Pago",
      "Interés Total",
      "Tasa (%)",
      "Estado",
    ];

    // Rows
    const rows = companyLoans.map((prestamo) => {
      const effectiveEstado = getEffectivePrestamoEstado(prestamo.estado, prestamo.amortizacion);
      const tasa = ((parseFloat(prestamo.interesTotal) / parseFloat(prestamo.principal)) * 100).toFixed(1);

      return [
        prestamo.id.toString(),
        prestamo.cedula,
        prestamo.nombre,
        prestamo.empresa,
        parseFloat(prestamo.principal).toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        parseFloat(prestamo.cuotaQuincenal).toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        parseFloat(prestamo.saldoPendiente).toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        new Date(prestamo.proximoPago).toLocaleDateString("es-PA"),
        parseFloat(prestamo.interesTotal).toLocaleString("es-PA", {
          style: "currency",
          currency: "PAB",
        }),
        `${tasa}%`,
        effectiveEstado.charAt(0).toUpperCase() + effectiveEstado.slice(1),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `prestamos-${selectedCompany.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "¡Exportado!",
      description: `Reporte de ${companyLoans.length} préstamos de ${selectedCompany.name} descargado.`,
    });

    if (onSuccess) {
      onSuccess();
    }
  };

  return { exportLoans };
}
