import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persons, solicitudes, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  return NextResponse.json({ status: 'active', message: 'Tally webhook endpoint is ready' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Received Tally webhook payload:', JSON.stringify(body, null, 2));
    let data = body;

    // Handle Tally webhook structure
    if (body.data && Array.isArray(body.data.fields)) {
      const fields = body.data.fields;
      const getVal = (keywords: string[]) => {
        // Find all matching fields
        const matchingFields = fields.filter((f: any) => 
          keywords.some(k => f.label?.toLowerCase().includes(k.toLowerCase()))
        );
        
        if (matchingFields.length === 0) return undefined;

        // Sort by: has value (priority), then length of label (ascending) to prefer exact matches over "Confirmar..."
        matchingFields.sort((a: any, b: any) => {
            const aHasValue = a.value !== null && a.value !== undefined && a.value !== '' && (Array.isArray(a.value) ? a.value.length > 0 : true);
            const bHasValue = b.value !== null && b.value !== undefined && b.value !== '' && (Array.isArray(b.value) ? b.value.length > 0 : true);
            if (aHasValue && !bHasValue) return -1;
            if (!aHasValue && bHasValue) return 1;
            return (a.label?.length || 0) - (b.label?.length || 0);
        });

        const field = matchingFields[0];

        // Handle Dropdowns (value is array of IDs, we want text)
        if (field.type === 'DROPDOWN' && field.options && Array.isArray(field.value)) {
           const selectedOptions = field.options.filter((opt: any) => field.value.includes(opt.id));
           return selectedOptions.map((opt: any) => opt.text).join(', ');
        }

        return field.value;
      };

      // Helper for file uploads (Tally returns array of objects with url)
      const getFileUrls = (keywords: string[]) => {
        const val = getVal(keywords);
        if (Array.isArray(val)) return val.map((v: any) => v.url).filter(Boolean);
        return val ? [val] : [];
      };

      data = {
        cedula: getVal(['cédula', 'cedula']),
        nombre: getVal(['nombre', 'first name']),
        apellido: getVal(['apellido', 'last name']),
        foto_cedula: getFileUrls(['foto', 'photo', 'imagen']),
        email: getVal(['email', 'correo']),
        telefono: getVal(['teléfono', 'telefono', 'celular', 'phone']),
        direccion: getVal(['dirección', 'direccion', 'address']),
        empresa: getVal(['empresa', 'lugar de trabajo', 'company']),
        salario_mensual: getVal(['salario', 'ingreso', 'salary']),
        meses_en_empresa: getVal(['tiempo', 'antigüedad', 'meses']),
        inicio_contrato: getVal(['inicio', 'fecha de ingreso']),
        monto_solicitado: getVal(['monto', 'cantidad', 'amount']),
        duracion_meses: getVal(['plazo', 'duración', 'duracion', 'meses a pagar']),
        tipo_cuenta_bancaria: getVal(['tipo de cuenta', 'tipo cuenta', 'ahorro', 'corriente']),
        numero_cuenta: (() => {
          const val = getVal(['número de cuenta', 'numero de cuenta', 'numero cuenta', 'account number']);
          return val !== undefined && val !== null ? String(val) : null;
        })(),
        banco: getVal(['banco', 'bank']),
      };
    }

    const {
      cedula,
      nombre,
      apellido,
      foto_cedula,
      email,
      telefono,
      direccion,
      empresa,
      salario_mensual,
      meses_en_empresa,
      inicio_contrato,
      monto_solicitado,
      duracion_meses,
      tipo_cuenta_bancaria,
      numero_cuenta,
      banco,
    } = data;

    // Do not auto-create company. Operator assigns manually during approval.

    // Find or create person
    let person = await db.query.persons.findFirst({
      where: eq(persons.cedula, cedula),
    });

    if (!person) {
      [person] = await db.insert(persons).values({
        cedula,
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        salarioMensual: salario_mensual,
        mesesEnEmpresa: meses_en_empresa,
        inicioContrato: inicio_contrato,
      }).returning();
    } else {
      // Use existing person, do not update fields to prevent overwriting data from previous submissions
    }

    // Create solicitud
    await db.insert(solicitudes).values({
      personId: person.id,
      fotoCedula: foto_cedula,
      montoSolicitado: monto_solicitado,
      duracionMeses: duracion_meses,
      tipoCuentaBancaria: tipo_cuenta_bancaria,
      numeroCuenta: numero_cuenta,
      banco,
      empresa,
    });

    return NextResponse.json({ success: true, message: 'Solicitud created' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}