import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const LAT = 38.7223;
const LON = -9.1393;
const MIN_DAYS = 1;
const MAX_DAYS = 16;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('days');

  // Valida e clamp: aceita apenas inteiros no intervalo [1, 16].
  // Evita injeção de parâmetros extras via &-encoding ou valores não numéricos.
  const parsed = raw !== null ? parseInt(raw, 10) : MAX_DAYS;
  const days = Number.isInteger(parsed) ? Math.min(Math.max(parsed, MIN_DAYS), MAX_DAYS) : MAX_DAYS;

  // URLSearchParams garante encoding correto — nenhum valor é interpolado cru na URL.
  const params = new URLSearchParams({
    latitude: String(LAT),
    longitude: String(LON),
    daily: 'temperature_2m_max,weather_code',
    timezone: 'America/Sao_Paulo',
    forecast_days: String(days),
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Weather API error' }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch weather' }, { status: 502 });
  }
}
