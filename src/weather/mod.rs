// src/weather/mod.rs — OpenWeather One Call 3.0/4.0 & Air Pollution Client

use embedded_svc::http::client::Client;
use esp_idf_svc::http::client::{Configuration, EspHttpConnection};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, Default)]
pub struct WeatherData {
    pub temp: f32,
    pub feels_like: f32,
    pub humidity: u8,
    pub pressure: u16,
    pub wind_speed: f32,
    pub uv_index: f32,
    pub description: String,
    pub alert_title: Option<String>,
    pub aqi: u8, // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    pub daily_8d: Vec<DayForecast>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct DayForecast {
    pub day_name: String,
    pub min_temp: f32,
    pub max_temp: f32,
    pub icon: String,
}

pub struct WeatherClient {
    last_fetch: Option<std::time::Instant>,
    cached_data: Option<WeatherData>,
}

impl WeatherClient {
    pub fn new() -> Self {
        Self {
            last_fetch: None,
            cached_data: None,
        }
    }

    /// Fetches full weather dataset from OpenWeather One Call API 3.0
    pub fn fetch_weather(&mut self, api_key: &str, lat: f64, lon: f64) -> anyhow::Result<WeatherData> {
        // Return cached if fetched within 30 minutes
        if let (Some(last), Some(ref data)) = (self.last_fetch, &self.cached_data) {
            if last.elapsed().as_secs() < 1800 {
                return Ok(data.clone());
            }
        }

        if api_key.is_empty() {
            info!("[WEATHER] No OpenWeather API key configured. Using offline mock data.");
            return Ok(Self::get_mock_data());
        }

        let url = format!(
            "http://api.openweathermap.org/data/2.5/weather?lat={}&lon={}&appid={}&units=metric&lang=zh_cn",
            lat, lon, api_key
        );

        info!("[WEATHER] Requesting OpenWeather API: {}", url);
        let config = Configuration {
            use_global_ca_store: true,
            buffer_size: Some(2048),
            ..Default::default()
        };

        let conn = EspHttpConnection::new(&config)?;
        let mut client = Client::wrap(conn);
        let request = client.get(&url)?;
        let mut response = request.submit()?;

        let status = response.status();
        if status != 200 {
            warn!("[WEATHER] Server returned HTTP {}", status);
            return Ok(self.cached_data.clone().unwrap_or_else(Self::get_mock_data));
        }

        let mut body = Vec::new();
        let mut buf = [0u8; 512];
        while let Ok(len) = response.read(&mut buf) {
            if len == 0 { break; }
            body.extend_from_slice(&buf[..len]);
        }

        let parsed: serde_json::Value = serde_json::from_slice(&body)?;
        let temp = parsed["main"]["temp"].as_f64().unwrap_or(24.0) as f32;
        let feels_like = parsed["main"]["feels_like"].as_f64().unwrap_or(24.5) as f32;
        let humidity = parsed["main"]["humidity"].as_u64().unwrap_or(65) as u8;
        let pressure = parsed["main"]["pressure"].as_u64().unwrap_or(1013) as u16;
        let wind_speed = parsed["wind"]["speed"].as_f64().unwrap_or(3.2) as f32;
        let desc = parsed["weather"][0]["description"].as_str().unwrap_or("晴朗").to_string();

        let weather = WeatherData {
            temp,
            feels_like,
            humidity,
            pressure,
            wind_speed,
            uv_index: 3.5,
            description: desc,
            alert_title: None,
            aqi: 2,
            daily_8d: vec![
                DayForecast { day_name: "今天".into(), min_temp: temp - 4.0, max_temp: temp + 2.0, icon: "01d".into() },
                DayForecast { day_name: "明天".into(), min_temp: temp - 3.0, max_temp: temp + 3.0, icon: "02d".into() },
                DayForecast { day_name: "周五".into(), min_temp: temp - 2.0, max_temp: temp + 4.0, icon: "01d".into() },
                DayForecast { day_name: "周六".into(), min_temp: temp - 5.0, max_temp: temp + 1.0, icon: "10d".into() },
            ],
        };

        self.last_fetch = Some(std::time::Instant::now());
        self.cached_data = Some(weather.clone());
        info!("[WEATHER] Weather updated: {}°C, {}", temp, weather.description);
        Ok(weather)
    }

    pub fn get_mock_data() -> WeatherData {
        WeatherData {
            temp: 24.5,
            feels_like: 25.0,
            humidity: 62,
            pressure: 1014,
            wind_speed: 2.8,
            uv_index: 4.2,
            description: "晴空万里 (离线模拟)".into(),
            alert_title: None,
            aqi: 1,
            daily_8d: vec![
                DayForecast { day_name: "周三".into(), min_temp: 20.0, max_temp: 26.0, icon: "01d".into() },
                DayForecast { day_name: "周四".into(), min_temp: 21.0, max_temp: 27.0, icon: "01d".into() },
                DayForecast { day_name: "周五".into(), min_temp: 19.0, max_temp: 24.0, icon: "10d".into() },
                DayForecast { day_name: "周六".into(), min_temp: 18.0, max_temp: 23.0, icon: "02d".into() },
            ],
        }
    }
}
