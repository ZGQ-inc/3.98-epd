// src/scheduler/mod.rs — Task Scheduler & Refresh Queue Governor

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use log::info;

pub struct TaskScheduler {
    running: Arc<AtomicBool>,
}

impl TaskScheduler {
    pub fn new() -> Self {
        Self {
            running: Arc::new(AtomicBool::new(true)),
        }
    }

    /// Spawns the central background scheduler thread
    pub fn start(&self) {
        let running = self.running.clone();
        thread::spawn(move || {
            info!("[SCHEDULER] Central task scheduler started.");
            let mut tick_counter: u64 = 0;

            while running.load(Ordering::Relaxed) {
                thread::sleep(Duration::from_secs(60));
                tick_counter += 1;

                // Every 5 minutes: Heartbeat & telemetry check
                if tick_counter % 5 == 0 {
                    // Send MQTT telemetry
                }

                // Every 120 minutes: Refresh Weather API cache
                if tick_counter % 120 == 0 {
                    info!("[SCHEDULER] Scheduled 2-hour weather cache update.");
                }

                // Midnight check (1440 minutes in 24 hours)
                if tick_counter % 1440 == 5 {
                    info!("[SCHEDULER] Midnight calendar rollover refresh triggered.");
                }
            }
            info!("[SCHEDULER] Task scheduler stopped.");
        });
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }
}
