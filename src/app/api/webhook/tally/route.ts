import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { persons, solicitudes, companies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

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
    } = body;

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