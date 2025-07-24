const express = require('express');
const router = express.Router();
const OpenMeteoService = require('../services/openweather');
const OpenUVService = require('../services/openuv');

// Initialize services
const openMeteoService = new OpenMeteoService();
const openUVService = new OpenUVService();

// Home page route
router.get('/', (req, res) => {
    res.render('index', {
        title: 'Weather & UV Protection App',
        weatherData: null,
        uvData: null,
        error: null,
        uvError: null
    });
});

// Get weather and UV data for a location
router.get('/weather', async (req, res) => {
    try {
        const { lat, lon, location } = req.query;
        
        if (!lat || !lon) {
            return res.render('index', {
                title: 'Weather & UV Protection App',
                weatherData: null,
                uvData: null,
                error: 'Please provide latitude and longitude coordinates.',
                uvError: null
            });
        }

        // Get weather data
        const weatherData = await openMeteoService.getWeatherData(lat, lon);
        let uvData = null;
        let uvError = null;
        try {
            uvData = await openUVService.getUVData(lat, lon);
        } catch (err) {
            uvData = null;
            uvError = 'UV data currently not available.';
        }

        res.render('index', {
            title: 'Weather & UV Protection App',
            weatherData,
            uvData,
            location: location || `${lat}, ${lon}`,
            error: null,
            uvError
        });

    } catch (error) {
        console.error('Error fetching weather/UV data:', error);
        res.render('index', {
            title: 'Weather & UV Protection App',
            weatherData: null,
            uvData: null,
            error: 'Failed to fetch weather data. Please try again.',
            uvError: null
        });
    }
});

// API endpoint for weather data only
router.get('/api/weather', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ 
                error: 'Latitude and longitude are required' 
            });
        }

        const weatherData = await openMeteoService.getWeatherData(lat, lon);
        res.json(weatherData);

    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch weather data' 
        });
    }
});

// API endpoint for UV data only
router.get('/api/uv', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({ 
                error: 'Latitude and longitude are required' 
            });
        }

        const uvData = await openUVService.getUVData(lat, lon);
        res.json(uvData);

    } catch (error) {
        console.error('Error fetching UV data:', error);
        res.status(500).json({ 
            error: 'Failed to fetch UV data' 
        });
    }
});

module.exports = router;
