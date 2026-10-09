// src/wifi/captive.rs — Captive portal DNS redirect for AP configuration mode
//
// When running in AP mode, all DNS queries are answered with 192.168.4.1
// so that phones/laptops automatically open the captive portal browser page.

use std::net::{Ipv4Addr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

const AP_IP: Ipv4Addr = Ipv4Addr::new(192, 168, 4, 1);

pub struct CaptivePortalDns {
    running: Arc<AtomicBool>,
}

impl CaptivePortalDns {
    /// Starts a lightweight DNS server redirecting all domain requests to 192.168.4.1
    pub fn start() -> anyhow::Result<Self> {
        let sock = match UdpSocket::bind("0.0.0.0:53") {
            Ok(s) => {
                println!("  [wifi-dns] Captive DNS responder active on 0.0.0.0:53 -> {}", AP_IP);
                s
            }
            Err(e) => {
                println!("  [wifi-dns] Captive DNS bind error: {}", e);
                return Err(e.into());
            }
        };

        let running = Arc::new(AtomicBool::new(true));
        let running_clone = running.clone();

        let _ = std::thread::Builder::new()
            .name("captive_dns".into())
            .stack_size(4096)
            .spawn(move || {
                let mut buf = [0u8; 512];
                let _ = sock.set_read_timeout(Some(std::time::Duration::from_millis(500)));
                while running_clone.load(Ordering::Relaxed) {
                    match sock.recv_from(&mut buf) {
                        Ok((len, src)) => {
                            let response = spoof_dns_response(&buf[..len]);
                            let _ = sock.send_to(&response, src);
                        }
                        Err(_) => {}
                    }
                }
                println!("  [wifi-dns] Captive DNS responder stopped.");
            });

        Ok(Self { running })
    }

    pub fn stop(&self) {
        self.running.store(false, Ordering::Relaxed);
    }
}

/// Build a minimal DNS A-record response pointing any name to AP_IP.
fn spoof_dns_response(query: &[u8]) -> Vec<u8> {
    if query.len() < 12 {
        return query.to_vec();
    }
    let mut resp = query.to_vec();
    // Set QR=1 (response), AA=1 (authoritative), RCODE=0
    resp[2] = 0x81;
    resp[3] = 0x80;
    // ANCOUNT = 1
    resp[6] = 0x00;
    resp[7] = 0x01;
    // Append answer: name pointer (0xC00C = offset 12), Type A, Class IN, TTL 60, RDATA 4 bytes
    resp.extend_from_slice(&[
        0xC0, 0x0C,             // Name pointer to question
        0x00, 0x01,             // Type A
        0x00, 0x01,             // Class IN
        0x00, 0x00, 0x00, 0x3C, // TTL 60s
        0x00, 0x04,             // RDLENGTH 4
        AP_IP.octets()[0],
        AP_IP.octets()[1],
        AP_IP.octets()[2],
        AP_IP.octets()[3],
    ]);
    resp
}
