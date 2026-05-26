import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const days = searchParams.get('days') ?? '16';
  const lat = 38.7223;
  const lon = -9.1393;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weather_code&timezone=America/Sao_Paulo&forecast_days=${days}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
