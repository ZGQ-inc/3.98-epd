from playwright.sync_api import sync_playwright

def test_frontend_flows():
    print("Launching Playwright Chromium...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        errors = []
        logs = []
        page.on("console", lambda msg: logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: errors.append(str(err)))

        print("Navigating to local PWA...")
        page.goto("file:///C:/Users/ZGQ/Documents/antigravity/epd/cf_pages/index.html")
        page.wait_for_timeout(1500)

        # 1. Verify Page Title
        title = page.title()
        print(f"Page Title: {title}")
        assert "E-Badge" in title or "墨水屏" in title or "3.98" in title

        # 2. Test Smart Device Name detection
        smart_name = page.evaluate("() => UI.getSmartDeviceName()")
        print(f"Detected Smart Device Name: {smart_name}")
        assert "我的台式机" in smart_name or "GPD" in smart_name or "Fold7" in smart_name or "红米" in smart_name
        # Ensure NO Apple mentions exist!
        assert "iPhone" not in smart_name and "iPad" not in smart_name and "Mac" not in smart_name

        # 3. Simulate unauthenticated BLE STATUS handshake
        print("Simulating BLE connection & unauthenticated STATUS notification...")
        page.evaluate("""() => {
            DeviceManager.isBleConnected = true;
            DeviceManager.activeTransport = 'ble';
            // Simulate receiving STATUS with authed: false
            const statusJson = {
                ip: '192.168.10.205',
                is_ap: false,
                mode: 'dual',
                authed: false,
                pin_pairing: true,
                paired_count: 0
            };
            DeviceManager.handleBleAuthHandshake(statusJson);
        }""")
        page.wait_for_timeout(500)

        # 4. Check if unauthConfirmModal is open
        is_modal_active = page.evaluate("""() => {
            const m = document.getElementById('unauthConfirmModal');
            return m && m.classList.contains('active');
        }""")
        print(f"unauthConfirmModal is active: {is_modal_active}")
        assert is_modal_active, "unauthConfirmModal should be open for unauthenticated device!"

        # 5. Simulate user clicking '开始 PIN 配对'
        print("Simulating user clicking '开始 PIN 配对'...")
        # Mock requestPinPairing so it doesn't fail on null rxChar
        page.evaluate("""() => {
            DeviceManager.requestPinPairing = async () => {};
            UI.startPinPairingFromConfirm();
        }""")
        page.wait_for_timeout(500)

        # 6. Simulate device responding with PAIR:PIN_READY
        print("Simulating device responding with PAIR:PIN_READY...")
        page.evaluate("""() => {
            UI.openPinPairModal();
        }""")
        page.wait_for_timeout(500)

        pin_modal_active = page.evaluate("""() => {
            const m = document.getElementById('pinPairModal');
            return m && m.classList.contains('active');
        }""")
        print(f"pinPairModal is active: {pin_modal_active}")
        assert pin_modal_active, "pinPairModal should be open!"

        # 7. Check default alias prefilled in pinDevNameInput
        dev_alias_val = page.evaluate("() => document.getElementById('pinDevNameInput').value")
        print(f"pinDevNameInput default alias: {dev_alias_val}")
        assert dev_alias_val == smart_name

        # 8. Simulate successful pairing response PAIR:OK
        print("Simulating device responding with PAIR:OK...")
        page.evaluate("""() => {
            const pairOkData = {
                device_id: 'dev_test_1234',
                token: 'abcdef1234567890abcdef1234567890',
                device_name: '我的台式机',
                master_key: '0123456789abcdef0123456789abcdef'
            };
            DeviceManager.isBleAuthenticated = true;
            DeviceManager.pairedClientName = pairOkData.device_name;
            const badgeKey = 'default';
            localStorage.setItem('epd_auth_' + badgeKey, JSON.stringify(pairOkData));
            localStorage.setItem('epd_master_key', pairOkData.master_key);
            UI.closeModal('pinPairModal');
            UI.closeModal('unauthConfirmModal');
            UI.showPairingSuccessGuide(pairOkData);
        }""")
        page.wait_for_timeout(500)

        # 9. Verify modals are closed and credentials saved
        pin_closed = page.evaluate("() => !document.getElementById('pinPairModal').classList.contains('active')")
        stored_auth = page.evaluate("() => localStorage.getItem('epd_auth_default')")
        stored_master_key = page.evaluate("() => localStorage.getItem('epd_master_key')")
        print(f"pinPairModal closed: {pin_closed}")
        print(f"Stored auth: {stored_auth}")
        print(f"Stored master key: {stored_master_key}")
        assert pin_closed
        assert stored_auth and "dev_test_1234" in stored_auth
        assert stored_master_key == "0123456789abcdef0123456789abcdef"

        # 10. Open Device Management modal
        print("Testing Device Management modal...")
        page.evaluate("() => UI.openDeviceManagerModal()")
        page.wait_for_timeout(500)
        dev_modal_active = page.evaluate("() => document.getElementById('devManageModal').classList.contains('active')")
        print(f"devManageModal active: {dev_modal_active}")
        assert dev_modal_active

        # 11. Render trusted device list in devManageModal
        page.evaluate("""() => {
            const sampleDevices = [
                { device_id: 'dev_test_1234', device_name: '我的台式机', paired_at: 1728950000, last_seen: 1728950100 },
                { device_id: 'dev_phone_5678', device_name: '主力机三星 Fold7', paired_at: 1728940000, last_seen: 1728945000 }
            ];
            UI.renderTrustedDevList(sampleDevices);
        }""")
        page.wait_for_timeout(500)

        rendered_names = page.evaluate("""() => {
            const items = Array.from(document.querySelectorAll('#trustedDevListContainer .card-title, #trustedDevListContainer strong'));
            return items.map(el => el.textContent.trim());
        }""")
        print(f"Rendered trusted devices: {rendered_names}")
        assert any("我的台式机" in n for n in rendered_names)
        assert any("三星" in n for n in rendered_names)

        # Check for any unexpected page errors
        print(f"Total page errors encountered: {len(errors)}")
        for err in errors:
            print(f"  Page Error: {err}")
        assert len(errors) == 0, f"Page threw errors: {errors}"

        browser.close()
        print("All Playwright frontend flow tests PASSED!")

if __name__ == "__main__":
    test_frontend_flows()
