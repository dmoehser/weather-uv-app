const axios = require('axios');

class OpenMeteoService {
    constructor() {
        this.baseURL = 'https://api.open-meteo.com/v1';
    }

    /**
     * Get comprehensive weather data for a location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Weather data including current, hourly, and daily forecasts
     */
    async getWeatherData(lat, lon) {
        try {
            const response = await axios.get(`${this.baseURL}/forecast`, {
                params: {
                    latitude: lat,
                    longitude: lon,
                    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,uv_index',
                    hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m',
                    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,uv_index_max,sunrise,sunset',
                    timezone: 'auto',
                    forecast_days: 8
                }
            });

            const data = response.data;
            
            // Process and format the weather data
            return {
                current: this.formatCurrentWeather(data.current),
                hourly: this.formatHourlyForecast(data.hourly),
                daily: this.formatDailyForecast(data.daily),
                location: {
                    lat: data.latitude,
                    lon: data.longitude,
                    timezone: data.timezone
                }
            };

        } catch (error) {
            console.error('Open-Meteo API Error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch weather data: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Format current weather data
     * @param {Object} current - Current weather data from API
     * @returns {Object} Formatted current weather
     */
    formatCurrentWeather(current) {
        return {
            temperature: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            humidity: current.relative_humidity_2m,
            pressure: Math.round(current.pressure_msl),
            windSpeed: Math.round(current.wind_speed_10m * 3.6), // Convert m/s to km/h
            windDirection: current.wind_direction_10m,
            description: this.getWeatherDescription(current.weather_code),
            icon: this.getWeatherIcon(current.weather_code),
            uvIndex: current.uv_index,
            visibility: current.visibility / 1000, // Convert to km
            precipitation: current.precipitation
        };
    }

    /**
     * Format hourly forecast data
     * @param {Object} hourly - Hourly forecast data from API
     * @returns {Array} Formatted hourly forecast
     */
    formatHourlyForecast(hourly) {
        const formatted = [];
        for (let i = 0; i < hourly.time.length && i < 24; i++) {
            formatted.push({
                time: new Date(hourly.time[i]),
                temperature: Math.round(hourly.temperature_2m[i]),
                feelsLike: Math.round(hourly.apparent_temperature[i]),
                humidity: hourly.relative_humidity_2m[i],
                description: this.getWeatherDescription(hourly.weather_code[i]),
                icon: this.getWeatherIcon(hourly.weather_code[i]),
                precipitation: hourly.precipitation_probability[i],
                windSpeed: Math.round(hourly.wind_speed_10m[i] * 3.6)
            });
        }
        return formatted;
    }

    /**
     * Format daily forecast data
     * @param {Object} daily - Daily forecast data from API
     * @returns {Array} Formatted daily forecast
     */
    formatDailyForecast(daily) {
        const formatted = [];
        for (let i = 0; i < daily.time.length; i++) {
            formatted.push({
                date: new Date(daily.time[i]),
                temp: {
                    max: Math.round(daily.temperature_2m_max[i]),
                    min: Math.round(daily.temperature_2m_min[i])
                },
                precipitation: daily.precipitation_probability_max[i],
                description: this.getWeatherDescription(daily.weather_code[i]),
                icon: this.getWeatherIcon(daily.weather_code[i]),
                uvIndex: daily.uv_index_max[i],
                sunrise: new Date(daily.sunrise[i]),
                sunset: new Date(daily.sunset[i])
            });
        }
        return formatted;
    }

    /**
     * Get weather description from WMO weather code
     * @param {number} code - WMO weather code
     * @returns {string} Weather description
     */
    getWeatherDescription(code) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            66: 'Light freezing rain',
            67: 'Heavy freezing rain',
            71: 'Slight snow fall',
            73: 'Moderate snow fall',
            75: 'Heavy snow fall',
            77: 'Snow grains',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            85: 'Slight snow showers',
            86: 'Heavy snow showers',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        return weatherCodes[code] || 'Unknown';
    }

    /**
     * Get weather icon from WMO weather code
     * @param {number} code - WMO weather code
     * @returns {string} Weather icon code
     */
    getWeatherIcon(code) {
        // Map WMO codes to OpenWeatherMap icon codes for consistency
        const iconMap = {
            0: '01d', // Clear sky
            1: '02d', // Mainly clear
            2: '03d', // Partly cloudy
            3: '04d', // Overcast
            45: '50d', // Foggy
            48: '50d', // Depositing rime fog
            51: '09d', // Light drizzle
            53: '09d', // Moderate drizzle
            55: '09d', // Dense drizzle
            56: '13d', // Light freezing drizzle
            57: '13d', // Dense freezing drizzle
            61: '10d', // Slight rain
            63: '10d', // Moderate rain
            65: '10d', // Heavy rain
            66: '13d', // Light freezing rain
            67: '13d', // Heavy freezing rain
            71: '13d', // Slight snow fall
            73: '13d', // Moderate snow fall
            75: '13d', // Heavy snow fall
            77: '13d', // Snow grains
            80: '09d', // Slight rain showers
            81: '09d', // Moderate rain showers
            82: '09d', // Violent rain showers
            85: '13d', // Slight snow showers
            86: '13d', // Heavy snow showers
            95: '11d', // Thunderstorm
            96: '11d', // Thunderstorm with slight hail
            99: '11d'  // Thunderstorm with heavy hail
        };
        return iconMap[code] || '01d';
    }

    /**
     * Check if it will rain tomorrow
     * @param {Array} daily - Daily forecast data
     * @returns {Object} Rain prediction for tomorrow
     */
    willRainTomorrow(daily) {
        if (daily.length < 2) return { willRain: false, probability: 0 };
        
        const tomorrow = daily[1];
        const willRain = tomorrow.precipitation > 30; // More than 30% chance
        
        return {
            willRain,
            probability: tomorrow.precipitation,
            description: tomorrow.description
        };
    }

    /**
     * Get UV protection recommendation based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {Object} UV protection recommendation
     */
    getUVRecommendation(uvIndex) {
        if (uvIndex <= 2) {
            return {
                level: 'Low',
                protection: 'No protection required',
                advice: 'You can safely stay outside without protection.'
            };
        } else if (uvIndex <= 5) {
            return {
                level: 'Moderate',
                protection: 'Some protection required',
                advice: 'Seek shade during midday hours, wear protective clothing and sunscreen.'
            };
        } else if (uvIndex <= 7) {
            return {
                level: 'High',
                protection: 'Protection required',
                advice: 'Reduce time in the sun between 10 a.m. and 4 p.m. Wear protective clothing and sunscreen.'
            };
        } else if (uvIndex <= 10) {
            return {
                level: 'Very High',
                protection: 'Extra protection required',
                advice: 'Minimize sun exposure during midday hours. Protection is essential.'
            };
        } else {
            return {
                level: 'Extreme',
                protection: 'Maximum protection required',
                advice: 'Avoid sun exposure during midday hours. Protection is absolutely essential.'
            };
        }
    }
}

module.exports = OpenMeteoService;
