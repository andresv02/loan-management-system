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
      
      // Helper to get field value by exact label match
      const getFieldByLabel = (label: string) => {
        return fields.find((f: any) => f.label === label);
      };

      // Helper to extract and process field value
      const getVal = (label: string) => {
        const field = getFieldByLabel(label);
        if (!field || field.value === null || field.value === undefined) return undefined;

        // Handle Dropdowns (value is array of IDs, we want text)
        if (field.type === 'DROPDOWN' && field.options && Array.isArray(field.value)) {
           const selectedOptions = field.options.filter((opt: any) => field.value.includes(opt.id));
           return selectedOptions.map((opt: any) => opt.text).join(', ');
        }

        return field.value;
      };

      // Helper for file uploads (Tally returns array of objects with url)
      const getFileUrls = (label: string) => {
        const val = getVal(label);
        if (Array.isArray(val)) return val.map((v: any) => v.url).filter(Boolean);
        return val ? [val] : [];
      };

      data = {
        cedula: getVal('cedula'),
        nombre: getVal('nombre'),
        apellido: getVal('apellido'),
        foto_cedula: getFileUrls('foto_cedula'),
        email: getVal('email'),
        telefono: getVal('telefono'),
        direccion: getVal('direccion'),
        empresa: getVal('Empresa'),
        salario_mensual: getVal('salario_mensual'),
        meses_en_empresa: getVal('meses_en_empresa'),
        inicio_contrato: getVal('inicio_contrato'),
        monto_solicitado: getVal('monto_solicitado'),
        duracion_meses: getVal('duracion_meses'),
        tipo_cuenta_bancaria: getVal('tipo_cuenta_bancaria'),
        numero_cuenta: (() => {
          const val = getVal('numero_cuenta');
          return val !== undefined && val !== null ? String(val) : null;
        })(),
        banco: getVal('Banco'),
      };
      
      console.log('Extracted data:', JSON.stringify(data, null, 2));
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