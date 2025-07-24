# Weather & UV Protection App

A comprehensive weather and UV protection application that combines weather data from Open-Meteo and UV index data from OpenUV to provide users with weather forecasts and UV protection recommendations based on their location.

## Features

- **Weather Forecast**: Get current weather and 8-day forecast using Open-Meteo API
- **UV Protection**: Receive UV index data and sunscreen recommendations using OpenUV API
- **Location Search**: Search for any location worldwide with real-time suggestions powered by OpenStreetMap Nominatim API
- **Rain Prediction**: Check if it will rain tomorrow in your chosen location
- **UV Safety**: Get recommendations on whether you need sunscreen today
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

Before running this application, you need to:

1. **Open-Meteo API**: 
   - No API key required! Open-Meteo is completely free
   - Visit [Open-Meteo](https://open-meteo.com/) for more information

2. **OpenUV API Key** (optional for UV data):
   - Sign up at [OpenUV](https://www.openuv.io/)
   - Get your API key from your account dashboard
   - **Important**: Free tier allows only 50 requests per day
   - When quota is exceeded, the app will show "UV data currently not available" and continue working with weather data only
   - Note: UV data is optional, weather data will work without it

3. **OpenStreetMap Nominatim API** (for search suggestions):
   - No API key required! Used for real-time location suggestions in the search field
   - [Nominatim API Documentation](https://nominatim.org/release-docs/latest/api/Search/)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd weather-uv-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables** (optional):
   - Create a `.env` file in the root directory
   - Add your API keys (OpenUV is optional):
   ```
   OPENUV_API_KEY=your_openuv_api_key_here
   PORT=3000
   ```
   - Note: Open-Meteo and OpenStreetMap Nominatim don't require an API key!

## Running the Application

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
weather-uv-app/
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   └── index.ejs
├── routes/
│   └── weather.js
├── services/
│   ├── openweather.js
│   └── openuv.js
├── .env
├── .gitignore
├── index.js
├── package.json
└── README.md
```

## API Endpoints

- `GET /` - Main application page
- `GET /weather` - Get weather data for a location
- `GET /uv` - Get UV data for a location

## Technologies Used

- **Backend**: Node.js, Express.js
- **Frontend**: EJS templating, HTML5, CSS3, JavaScript
- **HTTP Client**: Axios
- **APIs**: Open-Meteo API (weather), OpenUV API (optional for UV), OpenStreetMap Nominatim API (search suggestions)
- **Environment**: dotenv for configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Open-Meteo](https://open-meteo.com/) for free weather data
- [OpenUV](https://www.openuv.io/) for UV index data
- [OpenStreetMap Nominatim](https://nominatim.org/) for location search suggestions
- [Express.js](https://expressjs.com/) for the web framework 