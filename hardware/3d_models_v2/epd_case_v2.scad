// =============================================================================
// Project SlimBadge C6: 5.4mm Ultra-Thin Enclosure (V2 Architecture)
// 3.98" BWRY E-Paper Smart Badge & Ita-Bag Companion
// 
// Mechanical Architecture:
// 1. Total Stacking Budget: 5.40 mm max total thickness
//    - Front Cover (with 0.70mm Chemically Strengthened Glass Rebate): 1.70 mm
//    - Middle Frame (L-shaped PCB + 304570 Battery Bay): 2.90 mm
//    - Rear Cover (Ultra-Thin Snap-fit + 4x N52 Magnet Recesses): 0.80 mm
//    Total = 1.70 + 2.90 + 0.80 = 5.40 mm!
// 2. Outer Dimensions: 103.0 mm x 74.0 mm x 5.40 mm (R10 corner radius)
// 3. Visual Window: 82.2 mm x 60.2 mm (Centered at X=+3.5mm, strictly 6.90mm bezels on Top/Bottom/Right)
// 4. Ports: Mid-Mount Type-C, Slide Switch, TF Card Slot, SHT40 Vent, 4x LED Apertures, Dual Lanyard Holes
// =============================================================================

$fn = 50;

// -----------------------------------------------------------------------------
// Global Dimensional Parameters
// -----------------------------------------------------------------------------
case_w = 103.0; // Total width (X)
case_h = 74.0;  // Total height (Y)
case_r = 10.0;  // Corner radius

// Z-Budget Layer Heights
t_front  = 1.70; // Front cover total thickness
t_middle = 2.90; // Middle frame cavity height
t_back   = 0.80; // Rear cover thickness
t_total  = 5.40; // Total thickness

// Display & Glass Window Parameters
win_w = 82.2;    // Active visual width
win_h = 60.2;    // Active visual height
win_r = 4.0;     // Visual window corner radius
win_x = 3.5;     // X-offset ensuring top = bottom = right = 6.90mm margin!
win_y = 0.0;

glass_w = 85.0;  // 0.70mm chemically strengthened cover glass width
glass_h = 63.0;  // 0.70mm cover glass height
glass_r = 4.5;
glass_d = 0.70;  // Glass rebate depth

epd_w   = 88.0;  // EPD panel pocket width
epd_h   = 64.0;  // EPD panel pocket height
epd_r   = 5.0;
epd_d   = 1.00;  // EPD panel (0.90mm) + OCA (0.10mm) pocket depth

// PCB L-Shaped Architecture
// Top Bar: 96.0 mm x 16.0 mm
pcb_top_w = 96.0;
pcb_top_h = 16.0;
pcb_top_x = 0.0;   // Centered along X: [-48.0, +48.0]
pcb_top_y = 27.0;  // Y in [+19.0, +35.0]

// Left Wing: 18.0 mm x 46.0 mm
pcb_left_w = 18.0;
pcb_left_h = 46.0;
pcb_left_x = -39.0; // X in [-48.0, -30.0]
pcb_left_y = -4.0;  // Y in [-27.0, +19.0]

// 304570 Battery Bay: 76.0 mm x 48.0 mm x 3.0 mm (with 0.2mm buffer)
bat_w = 76.0;
bat_h = 48.0;
bat_x = 10.0;       // X in [-28.0, +48.0]
bat_y = -7.0;       // Y in [-31.0, +17.0]
bat_r = 4.0;

// Port & Aperture Positions
typec_x  = -17.5;   // Mid-mount Type-C slot center
typec_w  = 9.6;
typec_h  = 2.8;

switch_x = -38.0;   // Top edge slide switch center
switch_w = 9.0;
switch_h = 2.4;

tf_y     = 25.0;    // Right edge TF card slot center
tf_w     = 12.5;
tf_h     = 1.8;

sht40_x  = -5.0;    // SHT40 sensor micro-vent center
sht40_r  = 0.4;    // 0.8mm diameter

led_rgb_x = 5.0;    // SK6805 RGB LED aperture
led_act_x = 10.0;   // ACT LED aperture
led_chg_x = 15.0;   // CHG LED aperture
led_stb_x = 20.0;   // STBY LED aperture
led_r     = 0.5;    // 1.0mm diameter

// Magnet Recesses: 4x N52 (6.2mm dia x 0.8mm depth)
mag_dia   = 6.2;
mag_r     = mag_dia / 2.0;
mag_depth = 0.80;
mag_x_pos = 28.0;
mag_y_pos = 16.0;


// -----------------------------------------------------------------------------
// Helper 2D Geometry Modules
// -----------------------------------------------------------------------------
module rounded_rect_2d(w, h, r) {
    hull() {
        translate([ w/2 - r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r,  h/2 - r]) circle(r=r);
        translate([-w/2 + r, -h/2 + r]) circle(r=r);
        translate([ w/2 - r, -h/2 + r]) circle(r=r);
    }
}


// -----------------------------------------------------------------------------
// 1. Front Cover (case_front_0.7glass)
// -----------------------------------------------------------------------------
// Total Thickness: 1.70 mm
// Features:
// - Front face 0.70mm rebate for chemically strengthened glass (85x63mm)
// - Visual through-window: 82.2 x 60.2 mm with 6.90mm strictly equal bezels
// - Rear face 1.00mm cavity for EPD panel (88x64mm) + OCA
// - Front apertures for 4x LEDs (1.0mm) and SHT40 sensor (0.8mm)
// - Left corner dual lanyard holes (1.5mm)
// -----------------------------------------------------------------------------
module case_front_0_7glass() {
    difference() {
        // Main Outer Block (Z: 0.0 to 1.70)
        linear_extrude(height = t_front)
            rounded_rect_2d(case_w, case_h, case_r);

        // 1. Visual Window Through-Hole (82.2 x 60.2 mm, Z: -0.1 to 1.8)
        translate([win_x, win_y, -0.1])
            linear_extrude(height = t_front + 0.2)
                rounded_rect_2d(win_w, win_h, win_r);

        // 2. Glass Cover Rebate on Front Face (Z: 1.00 to 1.71, depth 0.70mm)
        translate([win_x, win_y, t_front - glass_d])
            linear_extrude(height = glass_d + 0.1)
                rounded_rect_2d(glass_w, glass_h, glass_r);

        // 3. EPD Panel Pocket on Rear Face (Z: -0.01 to 1.00, depth 1.00mm)
        translate([win_x, win_y, -0.01])
            linear_extrude(height = epd_d + 0.01)
                rounded_rect_2d(epd_w, epd_h, epd_r);

        // 4. SHT40 Micro-Vent Hole (Dia 0.8mm, Z: -0.1 to 1.8)
        translate([sht40_x, 33.5, -0.1])
            cylinder(h = t_front + 0.2, r = sht40_r);

        // 5. 4x LED Light Apertures (Dia 1.0mm, Z: -0.1 to 1.8)
        for (lx = [led_rgb_x, led_act_x, led_chg_x, led_stb_x]) {
            translate([lx, 33.5, -0.1])
                cylinder(h = t_front + 0.2, r = led_r);
        }

        // 6. Dual Lanyard Holes on Left Corner (Dia 1.5mm)
        translate([-47.0, -32.0, -0.1])
            cylinder(h = t_front + 0.2, r = 0.75);
        translate([-47.0, -26.0, -0.1])
            cylinder(h = t_front + 0.2, r = 0.75);
        // Connecting loop channel for cord knot (depth 0.8mm on rear)
        translate([-47.0, -29.0, 0.4])
            cube([2.0, 7.5, 0.82], center = true);

        // 7. Perimeter Alignment Tongue-and-Groove Rebate (Z: -0.01 to 0.45)
        difference() {
            translate([0, 0, -0.01])
                linear_extrude(height = 0.46)
                    rounded_rect_2d(case_w + 0.2, case_h + 0.2, case_r);
            translate([0, 0, -0.1])
                linear_extrude(height = 0.6)
                    rounded_rect_2d(case_w - 2.8, case_h - 2.8, case_r - 1.4);
        }
    }
}


// -----------------------------------------------------------------------------
// 2. Middle Frame (case_middle_L_frame)
// -----------------------------------------------------------------------------
// Total Thickness: 2.90 mm
// Features:
// - L-shaped PCB Cavity: Top Bar (96x16mm) + Left Wing (18x46mm)
// - 304570 Battery Bay: 76.0 x 48.0 x 2.90 mm (depth matched, isolated by ribs)
// - Mid-Mount Type-C Slot on Top Edge (X=-17.5mm)
// - Slide Switch Slot & Body Pocket on Top Edge (X=-38.0mm)
// - TF (MicroSD) Card Slot on Right Outer Edge (Y=+25.0mm)
// - SHT40 Sensor Vent & 4x LED Channels
// - Screen FPC Entrance Slot on Left Bridge (width 22.0mm)
// - Dual Lanyard Holes on Left Edge (Dia 1.5mm)
// - Snap-Fit Retention Undercuts for Rear Cover
// -----------------------------------------------------------------------------
module case_middle_L_frame() {
    difference() {
        // Outer Middle Frame Solid (Z: 0.0 to 2.90)
        linear_extrude(height = t_middle)
            rounded_rect_2d(case_w, case_h, case_r);

        // 1. L-Shaped PCB Cavity - Top Bar: 96.0 x 16.0mm (Z: -0.1 to 3.0)
        translate([pcb_top_x, pcb_top_y, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(pcb_top_w, pcb_top_h, 3.0);

        // 2. L-Shaped PCB Cavity - Left Wing: 18.0 x 46.0mm (Z: -0.1 to 3.0)
        translate([pcb_left_x, pcb_left_y, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(pcb_left_w, pcb_left_h, 3.0);

        // 3. 304570 Battery Bay: 76.0 x 48.0mm (Z: -0.1 to 3.0)
        translate([bat_x, bat_y, -0.1])
            linear_extrude(height = t_middle + 0.2)
                rounded_rect_2d(bat_w, bat_h, bat_r);

        // 4. Screen 24-Pin FPC Pass-Through Slot (Y: -11 to +11, Z: 1.4 to 3.0)
        translate([-30.0, 0.0, 2.15])
            cube([6.0, 22.0, 1.6], center = true);

        // 5. Mid-Mount Type-C Slot on Top Edge (X=-17.5, Y=37.0, Z=0.1 to 2.8)
        translate([typec_x, 35.5, 1.45])
            cube([typec_w, 5.0, typec_h], center = true);
        // Type-C Cable Plug Lead-in Chamfer Pocket
        translate([typec_x, 37.0, 1.45])
            cube([12.0, 2.0, 3.4], center = true);

        // 6. Slide Switch Slot on Top Edge (X=-38.0, Y=37.0)
        // (a) Switch Slider Lever Stroke Slot (Z: 0.6 to 2.8, stroke = 9.0mm)
        translate([switch_x, 35.5, 1.65])
            cube([switch_w, 5.0, switch_h], center = true);
        // (b) Switch Internal Body Pocket (SS12D00 body 9.5 x 4.0 x 2.2mm)
        translate([switch_x, 32.5, 1.45])
            cube([10.5, 4.5, 3.0], center = true);

        // 7. TF (MicroSD) Card Slot on Right Edge (X=51.5, Y=25.0)
        translate([49.5, tf_y, 1.45])
            cube([6.0, tf_w, tf_h], center = true);
        // MicroSD Card Fingernail Ejection Chamfer Pocket
        translate([51.5, tf_y, 1.45])
            cube([2.0, 14.0, 2.6], center = true);

        // 8. SHT40 Vent Hole on Top Wall (Dia 0.8mm)
        translate([sht40_x, 35.5, 1.45])
            rotate([90, 0, 0])
                cylinder(h = 6.0, r = sht40_r, center = true);

        // 9. 4x Light Aperture Channels (Dia 1.0mm)
        for (lx = [led_rgb_x, led_act_x, led_chg_x, led_stb_x]) {
            translate([lx, 35.5, 1.45])
                rotate([90, 0, 0])
                    cylinder(h = 6.0, r = led_r, center = true);
        }

        // 10. Left Wall Dual Lanyard Holes (Dia 1.5mm)
        translate([-49.5, -28.0, 1.45])
            rotate([0, 90, 0])
                cylinder(h = 6.0, r = 0.75, center = true);
        translate([-49.5, -33.0, 1.45])
            rotate([0, 90, 0])
                cylinder(h = 6.0, r = 0.75, center = true);
        // Internal Lanyard Turn-around Cavity
        translate([-48.0, -30.5, 1.45])
            cube([3.0, 8.0, 2.0], center = true);

        // 11. Snap-Fit Retention Catches for Rear Cover (6 locations)
        // Top edge catches
        for (sx = [-5.0, 30.0]) {
            translate([sx, 34.5, 0.8])
                cube([5.6, 1.2, 1.0], center = true);
        }
        // Bottom edge catches
        for (sx = [-10.0, 25.0]) {
            translate([sx, -34.5, 0.8])
                cube([5.6, 1.2, 1.0], center = true);
        }
        // Side edge catches
        translate([-48.0, 0.0, 0.8])
            cube([1.2, 5.6, 1.0], center = true);
        translate([48.0, -10.0, 0.8])
            cube([1.2, 5.6, 1.0], center = true);
    }
}


// -----------------------------------------------------------------------------
// 3. Ultra-Thin Rear Cover (case_back_slim)
// -----------------------------------------------------------------------------
// Total Thickness: 0.80 mm
// Features:
// - Outer profile: 103.0 x 74.0 mm, R10
// - 4x N52 Magnet Recesses (Dia 6.2mm x 0.80mm depth) with retention rims
// - Battery Buffer Recess (0.30mm depth on inner face, 76x48mm)
// - 6x Snap-Fit Cantilever Locking Tabs (Height 1.6mm with 0.35mm locking barbs)
// -----------------------------------------------------------------------------
module case_back_slim() {
    union() {
        difference() {
            // Main Plate (Z: 0.0 to 0.80)
            linear_extrude(height = t_back)
                rounded_rect_2d(case_w, case_h, case_r);

            // 1. Battery Bay Buffer Recess on Inner Face (Z: 0.50 to 0.81, depth 0.30mm)
            translate([bat_x, bat_y, 0.50])
                linear_extrude(height = 0.32)
                    rounded_rect_2d(bat_w - 2.0, bat_h - 2.0, bat_r);

            // 1b. ESP32-C6 Core Module Relief Recess on Inner Face (Z: 0.45 to 0.81, depth 0.35mm)
            // Eliminates 0.30mm Z-stackup collision between C6 module (2.4mm) + PCB (0.8mm) vs frame (2.9mm)
            translate([35.0, 27.0, 0.45])
                linear_extrude(height = 0.36)
                    rounded_rect_2d(20.0, 16.0, 2.0);

            // 2. 4x N52 Magnet Recesses (Dia 6.2mm, depth 0.60mm from inside Z: 0.20 to 0.81)
            for (mx = [-mag_x_pos, mag_x_pos]) {
                for (my = [-mag_y_pos, mag_y_pos]) {
                    translate([mx, my, 0.20])
                        cylinder(h = 0.62, r = mag_r);
                }
            }

            // 3. Laser-Grade SlimBadge Engraving on Outer Face (Z: -0.01 to 0.25)
            translate([0.0, -18.0, -0.01])
                linear_extrude(height = 0.26)
                    text("SlimBadge C6", size = 4.2, font = "Arial:style=Bold", halign = "center", valign = "center");
            translate([0.0, -24.0, -0.01])
                linear_extrude(height = 0.26)
                    text("3.98\" BWRY E-Paper · ZGQ Inc.", size = 2.4, font = "Arial:style=Bold", halign = "center", valign = "center");
        }

        // 3. 4x Magnet Retention Rims (protruding 0.40mm into middle cavity, Z: 0.80 to 1.20)
        for (mx = [-mag_x_pos, mag_x_pos]) {
            for (my = [-mag_y_pos, mag_y_pos]) {
                translate([mx, my, 0.80])
                    difference() {
                        cylinder(h = 0.40, r = mag_r + 0.8);
                        translate([0, 0, -0.01])
                            cylinder(h = 0.42, r = mag_r);
                    }
            }
        }

        // 4. 6x Snap-Fit Locking Tabs (Cantilever tabs with barbs, Z: 0.80 to 2.40)
        // Top edge tabs
        for (sx = [-5.0, 30.0]) {
            translate([sx, 34.5, 0.80])
                snap_tab_y(+1);
        }
        // Bottom edge tabs
        for (sx = [-10.0, 25.0]) {
            translate([sx, -34.5, 0.80])
                snap_tab_y(-1);
        }
        // Left & Right side tabs
        translate([-48.0, 0.0, 0.80])
            snap_tab_x(-1);
        translate([48.0, -10.0, 0.80])
            snap_tab_x(+1);
    }
}

// Snap-Fit Tab Modules
module snap_tab_y(dir) {
    // dir = +1 for top (+Y barb), -1 for bottom (-Y barb)
    union() {
        // Vertical Tab Stem (Width 5.0mm, Thickness 0.8mm, Height 1.6mm)
        translate([0, 0, 0.8])
            cube([5.0, 0.8, 1.6], center = true);
        // Retention Barb
        translate([0, dir * 0.4, 1.3])
            hull() {
                cube([5.0, 0.01, 0.6], center = true);
                translate([0, dir * 0.35, 0])
                    cube([5.0, 0.01, 0.2], center = true);
            }
    }
}

module snap_tab_x(dir) {
    // dir = +1 for right (+X barb), -1 for left (-X barb)
    union() {
        // Vertical Tab Stem
        translate([0, 0, 0.8])
            cube([0.8, 5.0, 1.6], center = true);
        // Retention Barb
        translate([dir * 0.4, 0, 1.3])
            hull() {
                cube([0.01, 5.0, 0.6], center = true);
                translate([dir * 0.35, 0, 0])
                    cube([0.01, 5.0, 0.2], center = true);
            }
    }
}


// -----------------------------------------------------------------------------
// 4. Slim Slider Cap (switch_cap_slim)
// -----------------------------------------------------------------------------
// Total Height: 4.20 mm (Ergonomically centered on 5.4mm enclosure profile)
// Features:
// - Internal retaining flange: 7.2 x 1.4 x 2.4 mm (with 1.8x1.8mm switch lever pocket)
// - Sliding neck: 4.0 x 2.5 x 2.0 mm
// - Finger grip head: 8.0 x 1.5 x 4.2 mm with 45° chamfers & 4 anti-slip ribs
// -----------------------------------------------------------------------------
module switch_cap_slim() {
    union() {
        // (a) Internal T-Flange with Switch Lever Socket
        difference() {
            translate([0, -0.7, 2.1])
                cube([7.2, 1.4, 2.4], center = true);
            // Socket for 1.5x1.5mm SS12D00 switch lever
            translate([0, -0.7, 1.8])
                cube([1.8, 1.6, 2.0], center = true);
        }

        // (b) Sliding Neck traversing the Middle Frame Wall
        translate([0, 1.25, 2.1])
            cube([4.0, 2.5, 2.0], center = true);

        // (c) External Finger Grip Knob
        translate([0, 3.25, 2.1])
            difference() {
                cube([8.0, 1.5, 4.2], center = true);
                // 45° Chamfers on Top, Bottom, and Side Edges
                translate([0, 0.8, 2.1])
                    rotate([45, 0, 0]) cube([9.0, 1.0, 1.0], center = true);
                translate([0, 0.8, -2.1])
                    rotate([45, 0, 0]) cube([9.0, 1.0, 1.0], center = true);
                translate([4.0, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 5.0], center = true);
                translate([-4.0, 0.8, 0])
                    rotate([0, 0, 45]) cube([1.0, 1.0, 5.0], center = true);
            }

        // (d) 4x Anti-Slip Vertical Ribs on the Outer Touch Surface
        for (rx = [-2.4, -0.8, 0.8, 2.4]) {
            translate([rx, 4.05, 2.1])
                hull() {
                    cube([0.50, 0.01, 3.2], center = true);
                    translate([0, 0.25, 0])
                        cube([0.30, 0.01, 2.6], center = true);
                }
        }
    }
}


// -----------------------------------------------------------------------------
// 3D Assembly Preview
// -----------------------------------------------------------------------------
// Set mode: "exploded" for exploded assembly view, "assembled" for closed shell
mode = "exploded"; // ["exploded", "assembled"]

if (mode == "exploded") {
    // Exploded View
    translate([0, 0, 25])
        color([0.2, 0.2, 0.2, 0.95]) case_front_0_7glass();

    translate([0, 0, 12])
        color([0.15, 0.65, 0.9, 0.85]) case_middle_L_frame();

    translate([0, 0, 0])
        color([0.25, 0.25, 0.25, 0.95]) case_back_slim();

    translate([switch_x, 42.0, 13])
        color([0.9, 0.2, 0.2, 1.0]) switch_cap_slim();
} else {
    // Assembled 5.40mm Ultra-Thin Shell
    translate([0, 0, t_back + t_middle])
        color([0.2, 0.2, 0.2, 0.95]) case_front_0_7glass();

    translate([0, 0, t_back])
        color([0.15, 0.65, 0.9, 0.85]) case_middle_L_frame();

    translate([0, 0, 0])
        color([0.25, 0.25, 0.25, 0.95]) case_back_slim();

    translate([switch_x, 37.0 - 2.5, t_back + 0.4])
        color([0.9, 0.2, 0.2, 1.0]) switch_cap_slim();
}
