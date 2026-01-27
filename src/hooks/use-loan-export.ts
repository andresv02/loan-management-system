import { useToast } from '@/hooks/use-toast';
import { PrestamoWithDetails, Company } from '@/types/app';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useLoanExport() {
  const { toast } = useToast();

  const prepareData = (data: PrestamoWithDetails[], selectedCompany: Company) => {
    const companyLoans = data.filter((prestamo) => 
      prestamo.empresa === selectedCompany.name && 
      (prestamo.estado === 'activa' || prestamo.estado === 'atrasada')
    );

    if (companyLoans.length === 0) {
      return null;
    }

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

    const rows = companyLoans.map((prestamo) => {
      const sortedAmort = [...prestamo.amortizacion].sort((a, b) => a.quincenaNum - b.quincenaNum);
      
      const fechaInicio = sortedAmort.length > 0 ? sortedAmort[0].fechaQuincena : "";
      const fechaFin = sortedAmort.length > 0 ? sortedAmort[sortedAmort.length - 1].fechaQuincena : "";

      const principalTotal = parseFloat(prestamo.principal);
      const interesTotal = parseFloat(prestamo.interesTotal);
      
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

    const totalCuota = companyLoans.reduce((sum, loan) => sum + parseFloat(loan.cuotaQuincenal), 0);

    return { companyLoans, headers, rows, totalCuota };
  };

  const exportLoans = (
    data: PrestamoWithDetails[],
    selectedCompany: Company | null,
    onSuccess?: () => void
  ) => {
    if (!selectedCompany || !data.length) return;

    const prepared = prepareData(data, selectedCompany);
    if (!prepared) {
      toast({
        title: "Sin datos",
        description: `No hay préstamos activos para la empresa "${selectedCompany.name}".`,
      });
      return;
    }

    const { companyLoans, headers, rows, totalCuota } = prepared;

    // Center the title by adding empty columns before it (approximate centering for 8 columns)
    const emptyCols = ",,,"; 
    const title1 = `${emptyCols}"Resumen Prestamos"`;
    const title2 = `${emptyCols}"${selectedCompany.name} - ${new Date().toLocaleDateString("es-PA")}"`;

    const totalRow = [
      "", "", "", "Total",
      totalCuota.toLocaleString("es-PA", { style: "currency", currency: "PAB" }),
      "", "", ""
    ];

    const csvContent = [
      title1,
      title2,
      headers.join(","),
      ...rows.map((row) => row.map((field) => `"${field}"`).join(",")),
      totalRow.map((field) => `"${field}"`).join(",")
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

    if (onSuccess) onSuccess();
  };

  const exportLoansPDF = (
    data: PrestamoWithDetails[],
    selectedCompany: Company | null,
    onSuccess?: () => void
  ) => {
    if (!selectedCompany || !data.length) return;

    const prepared = prepareData(data, selectedCompany);
    if (!prepared) {
      toast({
        title: "Sin datos",
        description: `No hay préstamos activos para la empresa "${selectedCompany.name}".`,
      });
      return;
    }

    const { companyLoans, headers, rows, totalCuota } = prepared;
    const doc = new jsPDF();

    // Add Title
    doc.setFontSize(16);
    doc.text("Resumen Prestamos", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`${selectedCompany.name} - ${new Date().toLocaleDateString("es-PA")}`, 105, 22, { align: "center" });

    // Add Table
    autoTable(doc, {
      head: [headers],
      body: rows,
      foot: [[
        "", "", "", "Total",
        totalCuota.toLocaleString("es-PA", { style: "currency", currency: "PAB" }),
        "", "", ""
      ]],
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 66] },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    const dateStr = new Date().toLocaleDateString("es-PA").replace(/\//g, "-");
    doc.save(`${selectedCompany.name} Prestamos ${dateStr}.pdf`);

    toast({
      title: "¡Exportado!",
      description: `Reporte PDF de ${companyLoans.length} préstamos de ${selectedCompany.name} descargado.`,
      duration: 5000,
    });

    if (onSuccess) onSuccess();
  };

  return { exportLoans, exportLoansPDF };
}
