import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { solicitudes } from '@/lib/schema';
import { count, eq, ilike, and, gte, lte, desc } from 'drizzle-orm';
import { NewSolicitud } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const cedula = searchParams.get('cedula');
    const estado = searchParams.get('estado');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any[] = [];
    // if (cedula) where.push(ilike(solicitudes.personId, `%${cedula}%`)); // join later - personId is int
    if (estado) where.push(eq(solicitudes.estado, estado as any));
    if (dateFrom) where.push(gte(solicitudes.createdAt, new Date(dateFrom)));
    if (dateTo) where.push(lte(solicitudes.createdAt, new Date(dateTo)));

    const data = await db.query.solicitudes.findMany({
      where: where.length ? and(...where) : undefined,
      with: {
        person: true,
      },
      limit,
      offset,
      orderBy: [desc(solicitudes.createdAt)],
    });

    const totalResults = await db.select({ count: count() }).from(solicitudes).where(where.length ? and(...where) : undefined);

    return NextResponse.json({
      data,
      page,
      limit,
      total: Number(totalResults[0]?.count || 0),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch solicitudes' }, { status: 500 });
  }
}