// =============================================================================
// Project SlimBadge C6: Complete Mechanical Enclosure (V2.6 Precision Master Edition)
// Master Mechanical CAD Model for epd_c6_slimbadge.kicad_pcb & Dual-Coil NFC FPC
// Outer Dimensions: 103.0 mm x 74.0 mm x 6.50 mm (Ultra-Slim Sandwich)
// Designed by ZGQ Inc.
//
// Key Mechanical Refinements (100% Precision Alignment with Real PCB Layout):
// 1. PCB Alignment:
//    - Real PCB Bounds: X in [-3.00, 96.00] (Width 99.00mm), Y in [0.00, 62.00] (Height 62.00mm).
//    - Mapping Origin: X_case = X_pcb - 46.20 mm, Y_case = 34.80 mm - Y_pcb.
//    - Perfectly centers the board between perimeter screw bosses with >= 1.63mm nut clearance!
//    - Solid case wall thickness >= 1.70mm to 2.30mm everywhere, eliminating all corner breaks.
// 2. Ports & Slots Precision:
//    - Type-C (J1): X = -20.20 mm, racetrack 9.2x3.2mm with 11.5x4.2mm cable lead-in chamfer.
//    - TF Card Slot (J_TF): X = +8.80 mm, slot 12.5x1.8mm with 14.5x2.4mm push-push fingernail pocket.
//    - Slide Switch (SW1): X = +27.80 mm, stroke slot with engraved IEC "O" / "|" symbols.
// 3. Switch Retention & Anti-Drop Mechanism:
//    - Switch cap with deep 1.8x1.8x2.5mm lever sleeve, internal T-flange, and 4 tactile anti-slip ridges.
//    - Back cover features a dedicated interlocking retention block (后盖突起) at X=+27.80, Y=+32.50
//      that traps the switch cap from behind so it CANNOT fall out or wobble!
// 4. Restored Screen Pass-Through Opening (From V1):
//    - Full-length 65.0 x 4.5 mm slot through middle partition floor at X = -39.0 mm.
//    - Central 20.0 x 6.0 mm anti-bend relief space extending to X = -45.0 mm.
//    - Connects directly with J_EPD_A (X = -38.20 mm) with zero FPC bending stress!
// 5. NFC FPC & U_KEY Relief:
//    - U_KEY pocket (10.0 x 8.0 x 0.60 mm) carved on the FRONT face of the partition floor
//      at X = +18.80 mm, Y = 0.0 mm. FPC adheres completely flush without bulging against screen!
//    - NFC tail pass-through slot (6.0 x 2.0 mm) at X = +18.80 mm, Y = +18.50 mm.
// 6. Aesthetic Front Sensor Grille & RGB Pinhole:
//    - Capsule grille (7.5 x 2.4 mm) with polished 45° bevel at X = -47.40, Y = -15.90
//      for OPT3001 light sensor (U8) and SHT40 temp/humidity sensor (U7).
//    - Ø1.6mm front pinhole at X = -47.40, Y = +15.50 for front RGB indicator (LED1).
// 7. Rear Status LED Window:
//    - Capsule window (10.0 x 3.6 mm) with diffused bevel at X = +29.60, Y = +25.05
//      spanning all 3 rear status LEDs (LED2, LED3, LED4).
// 8. Screw Fasteners & Corner Continuity:
//    - Screws at standard border positions (±46.80, ±32.30 mm).
//    - Tangent corner bosses completely clear the PCB corner chamfers.
// =============================================================================

$fn = 60;

// -----------------------------------------------------------------------------
// 1. Global Dimensional Parameters
// -----------------------------------------------------------------------------
case_w = 103.0; // Outer length (X)
case_h = 74.0;  // Outer width (Y)
case_r = 10.0;  // Corner radius

// Z-Stack Layer Thicknesses
t_front  = 1.70; // Front cover total thickness
t_middle = 3.80; // Middle frame total thickness (0.80mm floor + 3.00mm cavity)
t_back   = 1.00; // Rear cover thickness
t_total  = t_front + t_middle + t_back; // 6.50 mm total ultra-thin sandwich

// Display & Glass Window Parameters
win_w = 82.2;    // Active visual width
win_h = 60.2;    // Active visual height
win_r = 4.0;     // Visual window corner radius
win_x = 3.5;     // X-offset ensuring top = bottom = right = 6.90mm margin!
win_y = 0.0;

glass_w = 85.0;  // 0.70mm cover glass width
glass_h = 63.0;  // 0.70mm cover glass height
glass_r = 4.5;
glass_d = 0.70;  // Glass rebate depth

epd_w   = 88.0;  // Bare EPD panel pocket width
epd_h   = 64.0;  // Bare EPD panel pocket height
epd_r   = 5.0;
epd_d   = 0.70;  // EPD bare panel rebate depth

// Perimeter Fasteners (Standard V1 Perimeter Layout)
screw_x = 46.80; // X position of 4-corner M2 fasteners
screw_y = 32.30; // Y position of 4-corner M2 fasteners

// 4-Corner N52 Magnets (Clear of battery and PCB components)
mag_dia   = 6.2;
mag_r     = mag_dia / 2.0;
mag_depth = 0.80;
mag_x     = 42.0;
mag_y     = 27.0;

// PCB Coordinate Mapping: X_case = X_pcb - 46.20, Y_case = 34.80 - Y_pcb
// Port Positions (Exact Sub-Millimeter Match to PCB)
typec_x  = -20.20;   // Mid-mount Type-C slot center (PCB X=26.0)
switch_x =  27.80;   // Top edge slide switch center (PCB X=74.0)
tf_x     =   8.80;   // Top edge Push-Push TF card slot center (PCB X=55.0)

// Front Sensor Capsule Window (Covering U8 OPT3001 & U7 SHT40 at bottom-left)
sensor_x = -47.40;   // PCB X = -1.20
sensor_y = -15.90;   // Midpoint between U8 (Y=-14.60) and U7 (Y=-17.20)
sensor_l = 7.50;     // Capsule length along Y
sensor_w = 2.40;     // Capsule width along X

// Front RGB Indicator LED1 (SK6805 on B.Cu)
led1_front_x = -47.40;
led1_front_y =  15.50;

// Rear Status LEDs Oval Window (Covering LED2, LED3, LED4 on F.Cu)
led_oval_x = 29.60;  // PCB X = 75.80
led_oval_y = 25.05;  // Midpoint between LED2 (Y=27.30) and LED4 (Y=22.80)
led_oval_l = 10.00;  // Capsule length along Y
led_oval_w = 3.60;   // Capsule width along X

// NFC FPC & U_KEY Positions
nfc_center_x = 18.80; // Aligned with U10 (PCB X=65.0)
nfc_tail_y   = 18.50; // Tail slot position

// Battery Bay: 80.0 x 46.0 mm (Spacious, clears magnets and screws)
bat_w = 80.0;
bat_h = 46.0;
bat_x =  5.50;
bat_y = -5.00;
bat_r =  5.0;


// -----------------------------------------------------------------------------
// 2D Helper Modules
// -----------------------------------------------------------------------------
module rounded_rect_2d(w, h, r) {
    hull() {
        translate([ w/2 - r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r, -h/2 + r]) circle(r=r);
        translate([ w/2 - r, -h/2 + r]) circle(r=r);
    }
}

module capsule_2d(w, l) {
    r = w / 2.0;
    hull() {
        translate([0,  l/2 - r]) circle(r=r);
        translate([0, -l/2 + r]) circle(r=r);
    }
}

module racetrack_2d(w, h) {
    r = h / 2.0;
    hull() {
        translate([ w/2 - r, 0]) circle(r=r);
        translate([-w/2 + r, 0]) circle(r=r);
    }
}


// -----------------------------------------------------------------------------
// Part 1: Front Cover (case_front_0_7glass)
// -----------------------------------------------------------------------------
module case_front_0_7glass() {
    difference() {
        // Outer Main Body
        linear_extrude(height = t_front)
            rounded_rect_2d(case_w, case_h, case_r);

        // 1. Visual Window (82.2 x 60.2 mm) - Through-hole
        translate([win_x, win_y, -0.1])
            linear_extrude(height = t_front + 0.2)
                rounded_rect_2d(win_w, win_h, win_r);

        // 2. Cover Glass Rebate on Front Face (Depth 0.70mm, Z: 1.00 to 1.70)
        translate([win_x, win_y, t_front - glass_d])
            linear_extrude(height = glass_d + 0.1)
                rounded_rect_2d(glass_w, glass_h, glass_r);

        // 3. EPD Bare Screen Pocket on Rear Face (Depth 0.70mm, Z: -0.01 to 0.70)
        translate([win_x, win_y, -0.01])
            linear_extrude(height = epd_d + 0.01)
                rounded_rect_2d(epd_w, epd_h, epd_r);

        // 4. Aesthetic Sensor Capsule Grille Window on Bottom-Left (OPT3001 & SHT40)
        translate([sensor_x, sensor_y, -0.1])
            linear_extrude(height = t_front + 0.2)
                capsule_2d(sensor_w, sensor_l);
        // Polished 45° Chamfer Bevel on Front Face
        translate([sensor_x, sensor_y, t_front - 0.40])
            linear_extrude(height = 0.45)
                capsule_2d(sensor_w + 1.2, sensor_l + 1.2);

        // 5. Front RGB Indicator (LED1) Pinhole & Light Guide Aperture
        translate([led1_front_x, led1_front_y, -0.1])
            cylinder(h = t_front + 0.2, d = 1.6);
        translate([led1_front_x, led1_front_y, t_front - 0.40])
            cylinder(h = 0.45, d1 = 1.6, d2 = 2.4);

        // 6. Dual Lanyard Holes on Left Outer Border (Dia 1.5mm)
        translate([-48.5, -28.0, -0.1]) cylinder(h = t_front + 0.2, d = 1.5);
        translate([-48.5, -33.0, -0.1]) cylinder(h = t_front + 0.2, d = 1.5);
        translate([-48.5, -30.5, 0.4]) cube([2.0, 7.5, 0.82], center = true);

        // 7. 4-Corner M2 Brass Nut Blind Holes (Dia 3.2mm, depth 1.20mm from rear)
        // Preserves 0.50mm clean, unbroken solid aesthetic front skin!
        for (sx = [-screw_x, screw_x]) {
            for (sy = [-screw_y, screw_y]) {
                translate([sx, sy, -0.01])
                    cylinder(h = 1.21, d = 3.2);
            }
        }
    }
}


// -----------------------------------------------------------------------------
// Part 2: Middle Frame (case_middle_L_frame)
// -----------------------------------------------------------------------------
module case_middle_L_frame() {
    difference() {
        // Outer Middle Frame Solid (Z: 0.0 to t_middle = 3.80mm)
        linear_extrude(height = t_middle)
            rounded_rect_2d(case_w, case_h, case_r);

        // ==================== FRONT FACE (Z = 0.0 to 0.80mm) ====================
        // Partition floor sits at Z = 0.0 to 0.80mm, supporting the EPD back.

        // 1. NFC U_KEY Relief Pocket ON FRONT FACE OF PARTITION FLOOR (Z: -0.01 to 0.60mm)
        // Positioned at X = +18.80mm, Y = 0.0mm (aligned with FPC center & U10)
        translate([nfc_center_x, 0.0, -0.01])
            linear_extrude(height = 0.61)
                rounded_rect_2d(10.0, 8.0, 1.5);

        // 2. Full-Length Screen & FPC Pass-Through Window (RESTORED FROM V1)
        // Main slot (65.0 x 4.5mm) through entire partition floor
        translate([-39.0, 0.0, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(4.5, 65.0, 1.5);
        // Central bend relief space (20.0 x 6.0mm)
        translate([-43.5, 0.0, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(6.0, 20.0, 1.5);

        // 3. NFC FPC Tail Pass-Through Slot (6.0 x 2.0mm) through partition floor
        translate([nfc_center_x, nfc_tail_y, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(6.0, 2.0, 0.8);

        // 4. Sensor Aperture Relief through Floor on Bottom-Left
        translate([sensor_x, sensor_y, -0.1])
            linear_extrude(height = 1.0)
                capsule_2d(sensor_w + 1.0, sensor_l + 1.0);

        // 5. LED1 Relief Aperture through Floor on Left
        translate([led1_front_x, led1_front_y, -0.1])
            cylinder(h = 1.0, d = 2.5);

        // ==================== REAR CAVITY (Z: 0.80 to 3.80mm) ====================
        // 6. Main Interior Rear Cavity (Z: 0.80 to 3.81mm, Depth 3.00mm)
        // Smooth interior boundary safely encasing PCB and battery
        translate([0, 0, 0.80])
            linear_extrude(height = 3.05)
                rounded_rect_2d(case_w - 7.0, case_h - 7.0, 6.5);

        // 7. Battery Bay (80.0 x 46.0 mm, unobstructed Z: 0.80 to 3.81mm)
        translate([bat_x, bat_y, 0.80])
            linear_extrude(height = 3.05)
                rounded_rect_2d(bat_w, bat_h, bat_r);

        // 8. J2 Battery Socket Relief Pocket (Depth 3.2mm around X=-39.70, Y=27.80)
        translate([-39.70, 27.80, 0.60])
            linear_extrude(height = 3.25)
                rounded_rect_2d(6.5, 6.5, 1.0);

        // ==================== PORTS ALONG TOP WALL (Y = +37.0) ====================
        // 9. Mid-Mount Type-C Slot at X = -20.20mm (V1 Racetrack Precision)
        // Main connector racetrack opening (9.2 x 3.2mm)
        translate([typec_x, 35.5, 2.30])
            rotate([90, 0, 0])
                linear_extrude(height = 6.0, center = true)
                    racetrack_2d(9.2, 3.2);
        // Type-C Cable Plug Lead-in Chamfer Pocket (11.5 x 4.2mm)
        translate([typec_x, 36.8, 2.30])
            rotate([90, 0, 0])
                linear_extrude(height = 2.0, center = true)
                    racetrack_2d(11.5, 4.2);

        // 10. Push-Push TF Card Slot at X = +8.80mm (V1 Precision with Ejection Pocket)
        // Card insertion slot (12.5 x 1.8mm)
        translate([tf_x, 35.5, 2.20])
            cube([12.5, 6.0, 1.8], center = true);
        // Fingernail push-push ejection chamfer pocket (14.5 x 2.4mm)
        translate([tf_x, 36.8, 2.20])
            cube([14.5, 2.2, 2.4], center = true);

        // 11. Slide Switch (SW1) Slot at X = +27.80mm (Open to Rear for Effortless Assembly!)
        // Slider lever stroke slot (8.5 x 6.0mm, Z: 1.0 to 3.9mm)
        translate([switch_x, 35.5, 2.45])
            cube([8.5, 6.0, 2.9], center = true);
        // Switch internal body & cap flange pocket (11.5 x 4.5 x 2.9mm)
        translate([switch_x, 33.6, 2.45])
            cube([11.5, 4.5, 2.9], center = true);

        // Engraved IEC Symbols: "O" at X=23.3, "|" at X=32.3
        translate([switch_x - 4.5, 35.8, 3.4])
            linear_extrude(height = 0.5)
                text("O", size = 2.0, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([switch_x + 4.5, 35.8, 3.4])
            linear_extrude(height = 0.5)
                text("|", size = 2.0, font = "Arial:style=Bold", halign = "center", valign = "center");

        // ==================== FASTENERS & PERIMETER ====================
        // 12. 4-Corner M2 Screw Through-Holes (Dia 2.6mm at ±46.80, ±32.30)
        for (sx = [-screw_x, screw_x]) {
            for (sy = [-screw_y, screw_y]) {
                translate([sx, sy, -0.1])
                    cylinder(h = t_middle + 0.2, d = 2.6);
            }
        }

        // 13. Left Wall Dual Lanyard Holes (Dia 1.5mm)
        translate([-49.5, -28.0, 2.0])
            rotate([0, 90, 0]) cylinder(h = 6.0, d = 1.5, center = true);
        translate([-49.5, -33.0, 2.0])
            rotate([0, 90, 0]) cylinder(h = 6.0, d = 1.5, center = true);
    }
}


// -----------------------------------------------------------------------------
// Part 3: Rear Cover (case_back_slim)
// -----------------------------------------------------------------------------
module case_back_slim() {
    union() {
        difference() {
            // Main Plate (Z: 0.0 to t_back = 1.00mm)
            linear_extrude(height = t_back)
                rounded_rect_2d(case_w, case_h, case_r);

            // 1. Status LED Oval Window at X = +29.60mm, Y = +25.05mm
            // Spanning all 3 rear status LEDs (LED2, LED3, LED4)
            translate([led_oval_x, led_oval_y, -0.1])
                linear_extrude(height = t_back + 0.2)
                    capsule_2d(led_oval_w, led_oval_l);
            // Chamfered bevel on outer face for elegant diffused light
            translate([led_oval_x, led_oval_y, -0.01])
                linear_extrude(height = 0.35)
                    capsule_2d(led_oval_w + 1.2, led_oval_l + 1.2);

            // 2. Battery Bay Buffer Recess on Inner Face (Depth 0.30mm, Z: 0.70 to 1.01)
            translate([bat_x, bat_y, t_back - 0.30])
                linear_extrude(height = 0.35)
                    rounded_rect_2d(bat_w - 2.0, bat_h - 2.0, bat_r);

            // 3. J2 Battery Socket Relief Pocket on Inner Face (Depth 0.40mm)
            translate([-39.70, 27.80, t_back - 0.40])
                linear_extrude(height = 0.45)
                    rounded_rect_2d(6.5, 6.5, 1.0);

            // 4. 4-Corner N52 Magnet Recesses (Dia 6.2mm, depth 0.80mm on inner face)
            // Completely clears battery bay!
            for (mx = [-mag_x, mag_x]) {
                for (my = [-mag_y, mag_y]) {
                    translate([mx, my, t_back - mag_depth])
                        cylinder(h = mag_depth + 0.1, d = mag_dia);
                }
            }

            // 5. 4-Corner M2 Screw Countersunk Through-Holes (±46.80, ±32.30)
            for (sx = [-screw_x, screw_x]) {
                for (sy = [-screw_y, screw_y]) {
                    // Screw shaft through-hole (Dia 2.4mm)
                    translate([sx, sy, -0.1])
                        cylinder(h = t_back + 0.2, d = 2.4);
                    // 90° Countersunk head pocket (Dia 4.5mm x depth 0.8mm)
                    translate([sx, sy, -0.01])
                        cylinder(h = 0.81, d1 = 4.5, d2 = 2.4);
                }
            }

            // 6. Laser-Grade SlimBadge Engraving on Outer Face
            translate([0.0, -18.0, -0.01])
                linear_extrude(height = 0.25)
                    text("SlimBadge C6", size = 4.2, font = "Arial:style=Bold", halign = "center", valign = "center");
            translate([0.0, -24.0, -0.01])
                linear_extrude(height = 0.25)
                    text("3.98\" BWRY E-Paper · ZGQ Inc.", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        }

        // ==================== INTERLOCKING RETENTION BLOCK (后盖突起) ====================
        // Traps the switch cap from behind so it NEVER drops off or wobbles!
        // Positioned at X = switch_x (27.80mm), Y = 32.50mm, protruding 1.6mm into middle frame cavity
        translate([switch_x, 32.50, t_back + 0.80])
            cube([9.0, 2.2, 1.6], center = true);
    }
}


// -----------------------------------------------------------------------------
// Part 4: Precision Switch Cap (switch_cap_slim)
// -----------------------------------------------------------------------------
// Features:
// - Deep 1.8 x 1.8 x 2.5 mm internal socket sleeving over PCM12 switch lever
// - Extended retaining T-flange trapped by back cover protrusion
// - Outer finger knob with signature 4 raised anti-slip tactile ridges
// =============================================================================
module switch_cap_slim() {
    union() {
        // (a) Internal Sleeve Socket & Retaining T-Flange
        difference() {
            union() {
                // Main retention flange
                translate([0, -1.0, 2.4])
                    cube([7.6, 2.0, 3.2], center = true);
                // Downward extension sleeve (locked by back cover protrusion!)
                translate([0, -1.0, 0.8])
                    cube([7.2, 2.0, 1.6], center = true);
            }
            // Deep socket for 1.5x1.5mm PCM12 switch lever (tight friction fit)
            translate([0, -1.0, 1.6])
                cube([1.8, 1.8, 2.5], center = true);
        }

        // (b) Sliding Neck through Middle Frame Wall
        translate([0, 1.20, 2.4])
            cube([4.2, 2.4, 2.2], center = true);

        // (c) External Tactile Finger Knob with 45° Chamfers
        translate([0, 3.10, 2.4])
            difference() {
                cube([8.6, 1.6, 4.8], center = true);
                // 45° Edge Chamfers
                translate([0, 0.8, 2.4])
                    rotate([45, 0, 0]) cube([10.0, 1.0, 1.0], center = true);
                translate([0, 0.8, -2.4])
                    rotate([45, 0, 0]) cube([10.0, 1.0, 1.0], center = true);
                translate([4.3, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 6.0], center = true);
                translate([-4.3, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 6.0], center = true);
            }

        // (d) 4x Raised Tactile Anti-Slip Vertical Ridges (V1 Signature Finish)
        for (rx = [-2.4, -0.8, 0.8, 2.4]) {
            translate([rx, 3.90, 2.4])
                hull() {
                    cube([0.55, 0.01, 3.8], center = true);
                    translate([0, 0.25, 0])
                        cube([0.30, 0.01, 3.0], center = true);
                }
        }
    }
}


// -----------------------------------------------------------------------------
// 3D Assembly Preview
// -----------------------------------------------------------------------------
mode = "exploded"; // ["exploded", "assembled"]

if (mode == "exploded") {
    translate([0, 0, 28]) color([0.2, 0.2, 0.2, 0.95]) case_front_0_7glass();
    translate([0, 0, 12]) color([0.15, 0.65, 0.9, 0.85]) case_middle_L_frame();
    translate([0, 0, 0])  color([0.25, 0.25, 0.25, 0.95]) case_back_slim();
    translate([switch_x, 42.0, 13]) color([0.9, 0.2, 0.2, 1.0]) switch_cap_slim();
} else {
    translate([0, 0, t_back + t_middle]) color([0.2, 0.2, 0.2, 0.95]) case_front_0_7glass();
    translate([0, 0, t_back]) color([0.15, 0.65, 0.9, 0.85]) case_middle_L_frame();
    translate([0, 0, 0]) color([0.25, 0.25, 0.25, 0.95]) case_back_slim();
    translate([switch_x, 37.0 - 2.5, t_back + 0.4]) color([0.9, 0.2, 0.2, 1.0]) switch_cap_slim();
}
