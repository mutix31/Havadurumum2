// Configuration
const API_KEY = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

let currentLanguage = 'en';
let chart = null;

// Translations
const translations = {
    en: {
        temperature: 'Temperature',
        humidity: 'Humidity',
        wind: 'Wind Speed',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        errorCity: 'City not found',
        errorGeneric: 'Error fetching weather data'
    },
    tr: {
        temperature: 'Sıcaklık',
        humidity: 'Nem',
        wind: 'Rüzgar Hızı',
        sunrise: 'Gün Doğumu',
        sunset: 'Gün Batımı',
        errorCity: 'Şehir bulunamadı',
        errorGeneric: 'Hava durumu verileri alınırken hata oluştu'
    }
};

// Weather Icons Map
const WEATHER_ICONS = {
    thunderstorm: { range: [200, 299], icon: 'fas fa-bolt' },
    drizzle: { range: [300, 499], icon: 'fas fa-cloud-rain' },
    rain: { range: [500, 599], icon: 'fas fa-rain' },
    snow: { range: [600, 699], icon: 'fas fa-snowflake' },
    atmosphere: { range: [700, 799], icon: 'fas fa-smog' },
    clear: { range: [800, 800], icon: 'fas fa-sun' },
    clouds: { range: [801, 899], icon: 'fas fa-cloud' }
};

// Utility Functions
function showLoader() {
    document.getElementById('loader').classList.remove('hidden');
}

function hideLoader() {
    document.getElementById('loader').classList.add('hidden');
}

function getWeatherIcon(weatherId) {
    for (const [, data] of Object.entries(WEATHER_ICONS)) {
        if (weatherId >= data.range[0] && weatherId <= data.range[1]) {
            return data.icon;
        }
    }
    return WEATHER_ICONS.clouds.icon;
}

// API Functions
async function fetchWeatherData(city) {
    const url = `${API_BASE_URL}/weather?q=${city}&units=metric&lang=${currentLanguage}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(response.status === 404 ? 'City not found' : 'Error fetching weather data');
    return await response.json();
}

async function fetchForecastData(city) {
    const url = `${API_BASE_URL}/forecast?q=${city}&units=metric&lang=${currentLanguage}&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error fetching forecast data');
    return await response.json();
}

// Display Functions
function displayCurrentWeather(data) {
    const currentWeather = document.getElementById('current-weather');
    const texts = translations[currentLanguage];
    
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString(currentLanguage, {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString(currentLanguage, {
        hour: '2-digit',
        minute: '2-digit'
    });

    currentWeather.innerHTML = `
        <div class="weather-main">
            <div class="city-name">${data.name}, ${data.sys.country}</div>
            <div class="temperature">${Math.round(data.main.temp)}°C</div>
            <div class="weather-description">${data.weather[0].description}</div>
            <div class="weather-icon">
                <i class="${getWeatherIcon(data.weather[0].id)}"></i>
            </div>
        </div>
        <div class="weather-details">
            <div class="detail-item">
                <i class="fas fa-tint"></i>
                <div>${texts.humidity}</div>
                <div>${data.main.humidity}%</div>
            </div>
            <div class="detail-item">
                <i class="fas fa-wind"></i>
                <div>${texts.wind}</div>
                <div>${data.wind.speed} m/s</div>
            </div>
            <div class="detail-item">
                <i class="fas fa-sun"></i>
                <div>${texts.sunrise}</div>
                <div>${sunrise}</div>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <div>${texts.sunset}</div>
                <div>${sunset}</div>
            </div>
        </div>
    `;
}

function displayForecast(data) {
    const forecast = document.getElementById('forecast');
    forecast.innerHTML = '';
    
    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    Object.values(dailyForecasts).slice(0, 5).forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayName = date.toLocaleDateString(currentLanguage, { weekday: 'short' });
        const dateStr = date.toLocaleDateString(currentLanguage, { day: 'numeric', month: 'short' });
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="day">${dayName}</div>
            <div class="date">${dateStr}</div>
            <div class="forecast-icon">
                <i class="${getWeatherIcon(item.weather[0].id)}"></i>
            </div>
            <div class="forecast-temp">${Math.round(item.main.temp)}°C</div>
            <div class="forecast-desc">${item.weather[0].description}</div>
        `;
        forecast.appendChild(forecastItem);
    });
}

function updateTemperatureChart(data) {
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }

    const labels = [];
    const temperatures = [];
    const humidity = [];

    data.list.slice(0, 8).forEach(item => {
        const time = new Date(item.dt * 1000).toLocaleTimeString(currentLanguage, {
            hour: '2-digit',
            minute: '2-digit'
        });
        labels.push(time);
        temperatures.push(item.main.temp);
        humidity.push(item.main.humidity);
    });

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: translations[currentLanguage].temperature,
                    data: temperatures,
                    borderColor: '#ff6384',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: translations[currentLanguage].humidity,
                    data: humidity,
                    borderColor: '#36a2eb',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-color')
                    },
                    grid: {
                        color: getComputedStyle(document.body).getPropertyValue('--border-color')
                    }
                }
            }
        }
    });
}

// Main Functions
async function searchWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (!city) return;
    
    showLoader();
    try {
        const [weatherData, forecastData] = await Promise.all([
            fetchWeatherData(city),
            fetchForecastData(city)
        ]);
        
        displayCurrentWeather(weatherData);
        displayForecast(forecastData);
        updateTemperatureChart(forecastData);
    } catch (error) {
        alert(translations[currentLanguage][error.message === 'City not found' ? 'errorCity' : 'errorGeneric']);
    } finally {
        hideLoader();
    }
}

// Theme Functions
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
    
    if (chart) {
        updateTemperatureChart(chart.data);
    }
}

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.innerHTML = `<i class="fas fa-${savedTheme === 'dark' ? 'sun' : 'moon'}"></i>`;
}

// Language Functions
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    const cityInput = document.getElementById('cityInput');
    if (cityInput.value.trim()) {
        searchWeather();
    }
}

function setupLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'en';
    currentLanguage = savedLanguage;
    document.getElementById('languageSelect').value = savedLanguage;
}

// Geolocation Functions
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                const url = `${API_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=${currentLanguage}&appid=${API_KEY}`;
                
                showLoader();
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    document.getElementById('cityInput').value = data.name;
                    searchWeather();
                } catch (error) {
                    console.error('Error getting location weather:', error);
                } finally {
                    hideLoader();
                }
            },
            error => {
                console.error('Error getting location:', error);
            }
        );
    }
}

// Event Listeners
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupTheme();
    setupLanguage();
    getCurrentLocation();
});
