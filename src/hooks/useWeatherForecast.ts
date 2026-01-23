import { useState, useEffect } from 'react';
import { format, addDays, startOfDay } from 'date-fns';

export interface WeatherData {
  date: string;
  temperature: number;
  weatherCode: number;
  weatherIcon: string;
  weatherDescription: string;
}

// WMO Weather interpretation codes
const getWeatherInfo = (code: number): { icon: string; description: string } => {
  // Clear
  if (code === 0) return { icon: '☀️', description: 'Céu limpo' };
  // Mainly clear, partly cloudy
  if (code === 1) return { icon: '🌤️', description: 'Predominantemente limpo' };
  if (code === 2) return { icon: '⛅', description: 'Parcialmente nublado' };
  if (code === 3) return { icon: '☁️', description: 'Nublado' };
  // Fog
  if (code === 45 || code === 48) return { icon: '🌫️', description: 'Nevoeiro' };
  // Drizzle
  if (code >= 51 && code <= 57) return { icon: '🌧️', description: 'Garoa' };
  // Rain
  if (code >= 61 && code <= 67) return { icon: '🌧️', description: 'Chuva' };
  // Snow
  if (code >= 71 && code <= 77) return { icon: '❄️', description: 'Neve' };
  // Rain showers
  if (code >= 80 && code <= 82) return { icon: '🌦️', description: 'Pancadas de chuva' };
  // Snow showers
  if (code >= 85 && code <= 86) return { icon: '🌨️', description: 'Neve' };
  // Thunderstorm
  if (code >= 95 && code <= 99) return { icon: '⛈️', description: 'Tempestade' };
  
  return { icon: '❓', description: 'Desconhecido' };
};

export const useWeatherForecast = (days: number = 16) => {
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        
        // Using Open-Meteo API (free, no API key required)
        // Default location: São Paulo, Brazil
        const lat = -23.5505;
        const lon = -46.6333;
        
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,weather_code&timezone=America/Sao_Paulo&forecast_days=${days}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        
        const weatherData: WeatherData[] = data.daily.time.map((date: string, index: number) => {
          const weatherCode = data.daily.weather_code[index];
          const weatherInfo = getWeatherInfo(weatherCode);
          
          return {
            date,
            temperature: Math.round(data.daily.temperature_2m_max[index]),
            weatherCode,
            weatherIcon: weatherInfo.icon,
            weatherDescription: weatherInfo.description,
          };
        });
        
        setWeather(weatherData);
        setError(null);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Não foi possível carregar a previsão do tempo');
        
        // Generate fallback data for demo purposes
        const fallbackData: WeatherData[] = [];
        const today = startOfDay(new Date());
        
        for (let i = 0; i < days; i++) {
          const date = addDays(today, i);
          fallbackData.push({
            date: format(date, 'yyyy-MM-dd'),
            temperature: Math.round(20 + Math.random() * 15),
            weatherCode: [0, 1, 2, 3, 61, 80][Math.floor(Math.random() * 6)],
            weatherIcon: ['☀️', '🌤️', '⛅', '☁️', '🌧️', '🌦️'][Math.floor(Math.random() * 6)],
            weatherDescription: 'Dados de exemplo',
          });
        }
        
        setWeather(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [days]);

  const getWeatherForDate = (date: Date | string): WeatherData | undefined => {
    const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
    return weather.find(w => w.date === dateStr);
  };

  return { weather, loading, error, getWeatherForDate };
};
