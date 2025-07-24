const axios = require('axios');

class OpenUVService {
    constructor() {
        this.apiKey = process.env.OPENUV_API_KEY;
        this.baseURL = 'https://api.openuv.io/api/v1';
    }

    /**
     * Get UV data for a specific location
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} UV data including current and forecast UV index
     */
    async getUVData(lat, lon) {
        try {
            // Check if API key is available
            if (!this.apiKey) {
                throw new Error('OpenUV API key not configured');
            }

            // Get current UV data
            const currentUV = await this.getCurrentUV(lat, lon);
            
            // Get UV forecast for the next few days
            const uvForecast = await this.getUVForecast(lat, lon);
            
            return {
                current: currentUV,
                forecast: uvForecast,
                recommendations: this.getUVRecommendations(currentUV.uv)
            };

        } catch (error) {
            console.error('OpenUV API Error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch UV data: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Get current UV data
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Object} Current UV data
     */
    async getCurrentUV(lat, lon) {
        const response = await axios.get(`${this.baseURL}/uv`, {
            params: {
                lat: lat,
                lng: lon
            },
            headers: {
                'x-access-token': this.apiKey
            }
        });

        const data = response.data.result;
        
        return {
            uv: Math.round(data.uv * 10) / 10, // Round to 1 decimal place
            uvTime: new Date(data.uv_time),
            uvMax: Math.round(data.uv_max * 10) / 10,
            uvMaxTime: new Date(data.uv_max_time),
            ozone: data.ozone,
            safeExposure: this.calculateSafeExposure(data.uv)
        };
    }

    /**
     * Get UV forecast data
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     * @returns {Array} UV forecast for next few days
     */
    async getUVForecast(lat, lon) {
        const response = await axios.get(`${this.baseURL}/forecast`, {
            params: {
                lat: lat,
                lng: lon,
                days: 7 // Get 7 days forecast
            },
            headers: {
                'x-access-token': this.apiKey
            }
        });

        return response.data.result.map(day => ({
            date: new Date(day.date),
            uv: Math.round(day.uv * 10) / 10,
            uvMax: Math.round(day.uv_max * 10) / 10,
            uvMaxTime: new Date(day.uv_max_time),
            ozone: day.ozone
        }));
    }

    /**
     * Calculate safe exposure time in minutes based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {Object} Safe exposure times for different skin types
     */
    calculateSafeExposure(uvIndex) {
        if (uvIndex <= 0) {
            return {
                skinType1: 'No risk',
                skinType2: 'No risk',
                skinType3: 'No risk',
                skinType4: 'No risk',
                skinType5: 'No risk',
                skinType6: 'No risk'
            };
        }

        // Base exposure times in minutes for UV index 1
        const baseExposure = {
            skinType1: 67, // Very fair skin
            skinType2: 100, // Fair skin
            skinType3: 200, // Medium skin
            skinType4: 300, // Olive skin
            skinType5: 400, // Dark skin
            skinType6: 500  // Very dark skin
        };

        // Calculate safe exposure time based on UV index
        const safeExposure = {};
        Object.keys(baseExposure).forEach(skinType => {
            const exposureTime = Math.round(baseExposure[skinType] / uvIndex);
            safeExposure[skinType] = exposureTime > 0 ? exposureTime : 'Very short';
        });

        return safeExposure;
    }

    /**
     * Get comprehensive UV protection recommendations
     * @param {number} uvIndex - UV index value
     * @returns {Object} Detailed UV protection recommendations
     */
    getUVRecommendations(uvIndex) {
        const recommendations = {
            sunscreen: this.getSunscreenRecommendation(uvIndex),
            clothing: this.getClothingRecommendation(uvIndex),
            timing: this.getTimingRecommendation(uvIndex),
            general: this.getGeneralAdvice(uvIndex)
        };

        return recommendations;
    }

    /**
     * Get sunscreen recommendation based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {Object} Sunscreen recommendation
     */
    getSunscreenRecommendation(uvIndex) {
        if (uvIndex <= 2) {
            return {
                spf: 'SPF 15+',
                application: 'Apply if spending extended time outdoors',
                reapplication: 'Every 2 hours if sweating or swimming'
            };
        } else if (uvIndex <= 5) {
            return {
                spf: 'SPF 30+',
                application: 'Apply 30 minutes before going outdoors',
                reapplication: 'Every 2 hours, more often if sweating or swimming'
            };
        } else if (uvIndex <= 7) {
            return {
                spf: 'SPF 50+',
                application: 'Apply generously 30 minutes before going outdoors',
                reapplication: 'Every 2 hours, immediately after swimming or sweating'
            };
        } else if (uvIndex <= 10) {
            return {
                spf: 'SPF 50+',
                application: 'Apply very generously 30 minutes before going outdoors',
                reapplication: 'Every 1-2 hours, immediately after swimming or sweating'
            };
        } else {
            return {
                spf: 'SPF 50+',
                application: 'Apply very generously and avoid sun exposure',
                reapplication: 'Every hour if you must be outdoors'
            };
        }
    }

    /**
     * Get clothing recommendation based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {Object} Clothing recommendation
     */
    getClothingRecommendation(uvIndex) {
        if (uvIndex <= 2) {
            return {
                hat: 'Optional',
                sunglasses: 'Recommended',
                clothing: 'Light, loose-fitting clothing',
                protection: 'Minimal protection needed'
            };
        } else if (uvIndex <= 5) {
            return {
                hat: 'Wide-brimmed hat recommended',
                sunglasses: 'UV-protective sunglasses',
                clothing: 'Light, loose-fitting clothing covering arms and legs',
                protection: 'Moderate protection recommended'
            };
        } else if (uvIndex <= 7) {
            return {
                hat: 'Wide-brimmed hat essential',
                sunglasses: 'UV-protective sunglasses essential',
                clothing: 'Long-sleeved shirts and long pants',
                protection: 'High protection required'
            };
        } else {
            return {
                hat: 'Wide-brimmed hat essential',
                sunglasses: 'UV-protective sunglasses essential',
                clothing: 'Long-sleeved shirts, long pants, and UV-protective clothing',
                protection: 'Maximum protection essential'
            };
        }
    }

    /**
     * Get timing recommendation based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {Object} Timing recommendation
     */
    getTimingRecommendation(uvIndex) {
        if (uvIndex <= 2) {
            return {
                bestTime: 'Any time of day',
                avoidTime: 'None',
                advice: 'Safe to be outdoors at any time'
            };
        } else if (uvIndex <= 5) {
            return {
                bestTime: 'Early morning or late afternoon',
                avoidTime: '10 AM - 4 PM',
                advice: 'Seek shade during peak hours'
            };
        } else if (uvIndex <= 7) {
            return {
                bestTime: 'Early morning or late afternoon',
                avoidTime: '10 AM - 4 PM',
                advice: 'Minimize outdoor activities during peak hours'
            };
        } else {
            return {
                bestTime: 'Early morning only',
                avoidTime: '10 AM - 4 PM',
                advice: 'Avoid outdoor activities during peak hours'
            };
        }
    }

    /**
     * Get general advice based on UV index
     * @param {number} uvIndex - UV index value
     * @returns {string} General advice
     */
    getGeneralAdvice(uvIndex) {
        if (uvIndex <= 2) {
            return 'Low UV index. You can safely stay outside without protection.';
        } else if (uvIndex <= 5) {
            return 'Moderate UV index. Take precautions - seek shade, wear protective clothing and sunscreen.';
        } else if (uvIndex <= 7) {
            return 'High UV index. Reduce time in the sun between 10 AM and 4 PM. Protection is essential.';
        } else if (uvIndex <= 10) {
            return 'Very high UV index. Minimize sun exposure during midday hours. Maximum protection required.';
        } else {
            return 'Extreme UV index. Avoid sun exposure during midday hours. Protection is absolutely essential.';
        }
    }
}

module.exports = OpenUVService;
