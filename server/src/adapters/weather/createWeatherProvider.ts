import type { AppConfig } from '../../config';
import { createMockWeatherProvider } from './mockWeatherProvider';
import { createOpenWeatherProvider } from './openWeatherProvider';
import type { WeatherProvider } from './types';

export function createWeatherProvider(config: AppConfig['weather']): WeatherProvider {
  if (config.provider === 'openweather') {
    return createOpenWeatherProvider({ apiKey: config.openWeatherApiKey, city: config.city });
  }

  return createMockWeatherProvider();
}
