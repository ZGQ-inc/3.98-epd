// src/wifi/mdns.rs — Lightweight Multicast DNS (mDNS) responder for local domain resolution
//
// Enables resolving `http://<hostname>.local` (default: `http://epd-display.local`)
// across the local network without needing to look up the DHCP IP.

use std::net::{Ipv4Addr, UdpSocket};
use log::{debug, info, warn};

const MDNS_MULTICAST_ADDR: Ipv4Addr = Ipv4Addr::new(224, 0, 0, 251);
const MDNS_PORT: u16 = 5353;

pub fn start_mdns(hostname: &str, sta_ip: Ipv4Addr) {
    let hostname = if hostname.is_empty() { "epd-display" } else { hostname }.to_lowercase();
    let ip_bytes = sta_ip.octets();

    std::thread::Builder::new()
        .name("mdns_resp".into())
        .stack_size(4096)
        .spawn(move || {
            let socket = match UdpSocket::bind(("0.0.0.0", MDNS_PORT)) {
                Ok(s) => s,
                Err(e) => {
                    warn!("mDNS bind to port 5353 failed: {}", e);
                    return;
                }
            };

            if let Err(e) = socket.join_multicast_v4(&MDNS_MULTICAST_ADDR, &Ipv4Addr::UNSPECIFIED) {
                warn!("mDNS join multicast failed: {}", e);
            }

            info!("mDNS responder running for {}.local -> {}", hostname, sta_ip);
            println!("\n  ");
            println!("  [mdns] Network Ready!");
            println!("  [mdns] IP Address:   http://{}", sta_ip);
            println!("  [mdns] Local Domain: http://{}.local", hostname);
            println!("  \n");

            let mut buf = [0u8; 1024];
            let host_wire = encode_domain(&format!("{}.local", hostname));

            loop {
                let (len, src) = match socket.recv_from(&mut buf) {
                    Ok(r) => r,
                    Err(e) => {
                        warn!("mDNS recv error: {}", e);
                        continue;
                    }
                };
                if len < 12 {
                    continue;
                }

                // Check if this packet asks for our hostname
                let packet = &buf[..len];
                if contains_subslice(packet, &host_wire) {
                    debug!("mDNS query for {}.local from {}", hostname, src);
                    let resp = build_mdns_response(&host_wire, &ip_bytes);
                    // Send multicast or unicast reply
                    let _ = socket.send_to(&resp, (MDNS_MULTICAST_ADDR, MDNS_PORT));
                    let _ = socket.send_to(&resp, src);
                }
            }
        })
        .ok();
}

fn encode_domain(domain: &str) -> Vec<u8> {
    let mut out = Vec::new();
    for part in domain.split('.') {
        if part.is_empty() {
            continue;
        }
        out.push(part.len() as u8);
        out.extend_from_slice(part.as_bytes());
    }
    out.push(0x00);
    out
}

fn contains_subslice(haystack: &[u8], needle: &[u8]) -> bool {
    if needle.is_empty() || haystack.len() < needle.len() {
        return false;
    }
    haystack.windows(needle.len()).any(|w| {
        w.iter()
            .zip(needle.iter())
            .all(|(a, b)| a.to_ascii_lowercase() == b.to_ascii_lowercase())
    })
}

fn build_mdns_response(domain_wire: &[u8], ip_bytes: &[u8; 4]) -> Vec<u8> {
    let mut resp = Vec::with_capacity(12 + domain_wire.len() + 14);
    // Header
    resp.extend_from_slice(&[
        0x00, 0x00, // ID 0
        0x84, 0x00, // Flags: QR=1 (Response), AA=1 (Authoritative)
        0x00, 0x00, // QDCOUNT = 0
        0x00, 0x01, // ANCOUNT = 1
        0x00, 0x00, // NSCOUNT = 0
        0x00, 0x00, // ARCOUNT = 0
    ]);
    // Answer
    resp.extend_from_slice(domain_wire);
    resp.extend_from_slice(&[
        0x00, 0x01, // Type: A
        0x80, 0x01, // Class: IN (with cache-flush bit 0x8000)
        0x00, 0x00, 0x00, 0x78, // TTL: 120 seconds
        0x00, 0x04, // Data len: 4
        ip_bytes[0], ip_bytes[1], ip_bytes[2], ip_bytes[3],
    ]);
    resp
}
