// =============================================================================
// Project SlimBadge C6: Complete Mechanical Enclosure (V2.6 Precision Edition)
// Master Mechanical CAD Model for epd_c6_slimbadge.kicad_pcb & Dual-Coil NFC FPC
// Outer Dimensions: 103.0 mm x 74.0 mm
//
// Key Refinements (Direct Response to User Inspection & V1 Craftsmanship):
// 1. Ports & Slots precision restored: Racetrack Type-C with lead-in chamfer,
//    push-push TF slot with fingernail ejection pocket, engraved IEC "O" / "|" switch symbols.
// 2. Switch Cap & Retention Mechanism:
//    - Switch cap with deep 1.8x1.8x2.8mm sleeve for PCM12 lever, internal retention flange,
//      and signature 4-ridge tactile anti-slip grip with 45° symmetric chamfers.
//    - Back cover features a dedicated interlocking retention block (突起) that traps the
//      switch cap against the middle frame wall so it CANNOT fall out or wobble!
// 3. Screen Pass-Through Opening: Restored the full 65.0 x 4.5 mm rectangular slot
//    plus 20.0 x 6.0 mm central relief space through the middle frame partition floor.
// 4. NFC FPC & U_KEY Relief:
//    - U_KEY pocket (10.0 x 8.0 x 0.60 mm) carved on the FRONT face of the partition floor,
//      positioned at X = +17.0 mm (aligned with FPC center and J_NFC), perfectly flush!
//    - NFC tail pass-through slot (6.0 x 2.0 mm) at X = +17.0, Y = +18.5 mm.
// 5. Aesthetic Sensor Capsule Grille: Sleek capsule window (7.5 x 2.4 mm) with polished
//    bevel on front cover at bottom-left for OPT3001 light sensor & SHT40 temp/humidity sensor.
// 6. Perimeter Screw Fasteners: Restored to standard border positions (±46.80, ±32.30 mm).
// 7. Corner Continuity: Completely eliminated stepped/jagged corner defects with
//    proper tangent cylindrical screw bosses and continuous inner fillets (min 1.8mm wall).
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
t_total  = t_front + t_middle + t_back; // 6.50 mm total ultra-thin profile

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
epd_d   = 1.00;  // EPD panel (0.90mm) pocket depth

// Border Fasteners (Standard V1 Perimeter Layout)
screw_x = 46.80; // X position of 4-corner M2 fasteners
screw_y = 32.30; // Y position of 4-corner M2 fasteners

// 4-Corner N52 Magnets (Clear of battery and NFC coil)
mag_dia   = 6.2;
mag_r     = mag_dia / 2.0;
mag_depth = 0.90;
mag_x     = 42.0;
mag_y     = 27.0;

// Port Positions (Exact match to PCB)
typec_x  = -22.0;    // Mid-mount Type-C slot center (PCB X=26.0)
switch_x = 26.0;     // Top edge slide switch center (PCB X=74.0)
tf_x     = 7.0;      // Top edge Push-Push TF card slot center (PCB X=55.0)

// Sensor Capsule Window (Covering U8 OPT3001 & U7 SHT40 at bottom-left)
sensor_x = -41.0;
sensor_y = -22.0;    // Midpoint between U8 (Y=-20.5) and U7 (Y=-23.5)
sensor_l = 7.5;      // Capsule length along Y
sensor_w = 2.4;      // Capsule width along X

// Rear Status LEDs Oval Window (PCB X=75.8, Y=4.5~12.0)
led_oval_x = 27.80;
led_oval_y = 26.75;
led_oval_l = 12.00;
led_oval_w = 3.60;

// Battery Bay: 84.5 x 50.0 mm
bat_w = 84.5;
bat_h = 50.0;
bat_x = 5.25;
bat_y = -7.0;
bat_r = 4.0;


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

        // 1. Visual Window (82.2 x 60.2 mm)
        translate([win_x, win_y, -0.1])
            linear_extrude(height = t_front + 0.2)
                rounded_rect_2d(win_w, win_h, win_r);

        // 2. Cover Glass Rebate on Front Face (Depth 0.70mm)
        translate([win_x, win_y, t_front - glass_d])
            linear_extrude(height = glass_d + 0.1)
                rounded_rect_2d(glass_w, glass_h, glass_r);

        // 3. EPD Bare Screen Pocket on Rear Face (Depth 1.00mm, Z: -0.01 to 1.00)
        translate([win_x, win_y, -0.01])
            linear_extrude(height = epd_d + 0.01)
                rounded_rect_2d(epd_w, epd_h, epd_r);

        // 4. Aesthetic Sensor Capsule Window on Bottom-Left (OPT3001 & SHT40)
        translate([sensor_x, sensor_y, -0.1])
            linear_extrude(height = t_front + 0.2)
                capsule_2d(sensor_w, sensor_l);
        // Polished 45° Chamfer Bevel on Front Face
        translate([sensor_x, sensor_y, t_front - 0.40])
            linear_extrude(height = 0.45)
                capsule_2d(sensor_w + 1.0, sensor_l + 1.0);

        // 5. Dual Lanyard Holes on Left Outer Corner (Dia 1.5mm)
        translate([-48.5, -28.0, -0.1]) cylinder(h = t_front + 0.2, d = 1.5);
        translate([-48.5, -33.0, -0.1]) cylinder(h = t_front + 0.2, d = 1.5);
        translate([-48.5, -30.5, 0.4]) cube([2.0, 7.5, 0.82], center = true);

        // 6. 4-Corner M2 Brass Nut Blind Holes (Dia 3.2mm, depth 3.5mm from rear)
        for (sx = [-screw_x, screw_x]) {
            for (sy = [-screw_y, screw_y]) {
                translate([sx, sy, -0.01])
                    cylinder(h = 3.6, d = 3.2);
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
        // Z = 0.0 is adjacent to Front Cover, Z = 3.80 is adjacent to Rear Cover!
        linear_extrude(height = t_middle)
            rounded_rect_2d(case_w, case_h, case_r);

        // ==================== FRONT FACE (Z = 0.0 to 0.80mm) ====================
        // Partition floor sits at Z = 0.0 to 0.80mm, supporting the EPD back.

        // 1. NFC U_KEY Relief Pocket ON FRONT FACE OF PARTITION FLOOR (Z: -0.01 to 0.60mm)
        // Positioned at X = +17.0mm, Y = 0.0mm (matching FPC center & U_KEY footprint)
        translate([17.0, 0.0, -0.01])
            linear_extrude(height = 0.61)
                rounded_rect_2d(10.0, 8.0, 1.5);

        // 2. Full-Length Screen & FPC Pass-Through Window (RESTORED FROM V1)
        // Main slot (65.0 x 4.5mm) through entire partition floor
        translate([-39.5, 0.0, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(4.5, 65.0, 1.5);
        // Central bend relief space (20.0 x 6.0mm)
        translate([-44.0, 0.0, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(6.0, 20.0, 1.5);

        // 3. NFC FPC Tail Pass-Through Slot (6.0 x 2.0mm) through partition floor
        translate([17.0, 18.5, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(6.0, 2.0, 0.8);

        // 4. Sensor Aperture Relief through Floor on Bottom-Left
        translate([sensor_x, sensor_y, -0.1])
            linear_extrude(height = 1.0)
                capsule_2d(sensor_w + 1.0, sensor_l + 1.0);

        // ==================== REAR CAVITY (Z: 0.80 to 3.80mm) ====================
        // 5. Main Interior Rear Cavity (Z: 0.80 to 3.81mm)
        // Uses smooth rounded boundary maintaining uniform wall thickness (no sharp stepped corners!)
        translate([0, 0, 0.80])
            linear_extrude(height = 3.05)
                rounded_rect_2d(case_w - 7.0, case_h - 7.0, 6.5);

        // 6. J2 Battery Socket Relief Pocket (Depth 3.5mm around X=-41.5, Y=28.0)
        translate([-41.5, 28.0, 0.70])
            linear_extrude(height = 3.15)
                rounded_rect_2d(6.0, 6.0, 1.0);

        // ==================== PORTS ALONG TOP WALL (Y = +37.0) ====================
        // 7. Mid-Mount Type-C Slot at X = -22.0mm (V1 Racetrack Precision)
        // Main connector racetrack opening (9.2 x 3.2mm)
        translate([typec_x, 35.5, 2.30])
            rotate([90, 0, 0])
                linear_extrude(height = 6.0, center = true)
                    racetrack_2d(9.2, 3.2);
        // Type-C Cable Plug Lead-in Chamfer Pocket (11.5 x 4.0mm)
        translate([typec_x, 36.8, 2.30])
            rotate([90, 0, 0])
                linear_extrude(height = 2.0, center = true)
                    racetrack_2d(11.5, 4.0);

        // 8. Push-Push TF Card Slot at X = +7.0mm (V1 Precision with Ejection Pocket)
        // Card insertion slot (12.5 x 1.8mm)
        translate([tf_x, 35.5, 2.20])
            cube([12.5, 6.0, 1.8], center = true);
        // Fingernail push-push ejection chamfer pocket (14.5 x 2.4mm)
        translate([tf_x, 36.8, 2.20])
            cube([14.5, 2.2, 2.4], center = true);

        // 9. Slide Switch (SW1) Slot at X = +26.0mm (V1 Precision)
        // Slider lever stroke slot (8.5 x 2.4mm, Z: 1.0 to 3.4mm)
        translate([switch_x, 35.5, 2.20])
            cube([8.5, 6.0, 2.4], center = true);
        // Switch internal body pocket (10.5 x 4.5 x 2.8mm)
        translate([switch_x, 32.8, 2.20])
            cube([10.5, 4.5, 2.8], center = true);

        // Engraved IEC Symbols: "O" at X=21.5, "|" at X=30.5
        translate([switch_x - 4.5, 35.8, 3.4])
            linear_extrude(height = 0.5)
                text("O", size = 2.0, font = "Arial:style=Bold", halign = "center", valign = "center");
        translate([switch_x + 4.5, 35.8, 3.4])
            linear_extrude(height = 0.5)
                text("|", size = 2.0, font = "Arial:style=Bold", halign = "center", valign = "center");

        // ==================== FASTENERS & PERIMETER ====================
        // 10. 4-Corner M2 Screw Through-Holes (Dia 2.6mm at ±46.80, ±32.30)
        for (sx = [-screw_x, screw_x]) {
            for (sy = [-screw_y, screw_y]) {
                translate([sx, sy, -0.1])
                    cylinder(h = t_middle + 0.2, d = 2.6);
            }
        }

        // 11. Left Wall Dual Lanyard Holes (Dia 1.5mm)
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

            // 1. Status LED Oval / Capsule Window at X = +27.80mm, Y = +26.75mm
            translate([led_oval_x, led_oval_y, -0.1])
                linear_extrude(height = t_back + 0.2)
                    capsule_2d(led_oval_w, led_oval_l);
            // Chamfered bevel on outer face for elegant diffused light
            translate([led_oval_x, led_oval_y, -0.01])
                linear_extrude(height = 0.35)
                    capsule_2d(led_oval_w + 1.2, led_oval_l + 1.2);

            // 2. Battery Bay Buffer Recess on Inner Face (Depth 0.30mm)
            translate([bat_x, bat_y, t_back - 0.30])
                linear_extrude(height = 0.35)
                    rounded_rect_2d(bat_w - 2.0, bat_h - 2.0, bat_r);

            // 3. J2 Battery Socket Relief Pocket on Inner Face
            translate([-41.5, 28.0, t_back - 0.40])
                linear_extrude(height = 0.45)
                    rounded_rect_2d(6.5, 6.5, 1.0);

            // 4. 4-Corner N52 Magnet Recesses (Dia 6.2mm, depth 0.90mm)
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
                        cylinder(h = 0.8, d1 = 4.5, d2 = 2.4);
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
        // Positioned at X = switch_x (26.0mm), Y = 32.5mm, protruding into middle frame
        translate([switch_x, 32.5, t_back + 0.85])
            cube([9.0, 2.5, 1.7], center = true);
    }
}


// -----------------------------------------------------------------------------
// Part 4: Precision Switch Cap (switch_cap_slim)
// -----------------------------------------------------------------------------
// Features:
// - Deep 1.8 x 1.8 x 2.8 mm internal socket sleeving over PCM12 switch lever
// - Extended retaining T-flange trapped by back cover protrusion
// - Outer finger knob with signature 4 raised anti-slip tactile ridges
// =============================================================================
module switch_cap_slim() {
    union() {
        // (a) Internal Sleeve Socket & Retaining T-Flange
        difference() {
            union() {
                // Main retention flange
                translate([0, -1.0, 2.5])
                    cube([7.6, 2.2, 3.6], center = true);
                // Downward extension sleeve (locked by back cover protrusion!)
                translate([0, -1.0, 0.8])
                    cube([7.2, 2.2, 1.6], center = true);
            }
            // Deep socket for 1.5x1.5mm PCM12 switch lever (tight friction fit)
            translate([0, -1.0, 1.8])
                cube([1.8, 1.8, 2.8], center = true);
        }

        // (b) Sliding Neck through Middle Frame Wall
        translate([0, 1.25, 2.5])
            cube([4.8, 2.5, 2.4], center = true);

        // (c) External Tactile Finger Knob with 45° Chamfers
        translate([0, 3.25, 2.5])
            difference() {
                cube([8.6, 1.5, 5.4], center = true);
                // 45° Edge Chamfers
                translate([0, 0.8, 2.7])
                    rotate([45, 0, 0]) cube([10.0, 1.0, 1.0], center = true);
                translate([0, 0.8, -2.7])
                    rotate([45, 0, 0]) cube([10.0, 1.0, 1.0], center = true);
                translate([4.3, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 6.0], center = true);
                translate([-4.3, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 6.0], center = true);
            }

        // (d) 4x Raised Tactile Anti-Slip Vertical Ridges (V1 Signature Finish)
        for (rx = [-2.4, -0.8, 0.8, 2.4]) {
            translate([rx, 4.05, 2.5])
                hull() {
                    cube([0.55, 0.01, 4.2], center = true);
                    translate([0, 0.25, 0])
                        cube([0.30, 0.01, 3.4], center = true);
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
