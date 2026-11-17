"""
Precision Vector Art Generator for Four Seasons Tarot (Option 3: Celestial Engraving & Cameo Edition).
Generates 4 ornate Seasonal Card Backs (200x320) and 22 Major Arcana Faces (160x220) into js/card-svgs.js.
Architecture strictly uses self-contained SVG geometry (fill-rule="evenodd" for negative space,
fill-opacity/stroke-opacity without presentation opacity conflicts) to ensure crisp rendering
across themes, Stage 3 self-drawing animation, Lightbox magnification, and html2canvas PNG export.
"""

import json
import math
import os


def pt(cx, cy, r, deg):
    rad = math.radians(deg)
    return round(cx + r * math.cos(rad), 2), round(cy + r * math.sin(rad), 2)


def fmt_pts(points):
    return " ".join(f"{x},{y}" for x, y in points)


def star_polygon(cx, cy, r_out, r_in, n=8, rot_deg=-90, **attrs):
    pts = []
    step = 180.0 / n
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        pts.append(pt(cx, cy, r, rot_deg + i * step))
    attr_str = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<polygon points="{fmt_pts(pts)}" {attr_str}/>'


def circle(cx, cy, r, **attrs):
    attr_str = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}" {attr_str}/>'


def ellipse(cx, cy, rx, ry, rot_deg=0, **attrs):
    attr_str = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    t = f' transform="rotate({rot_deg} {cx:.2f} {cy:.2f})"' if rot_deg else ""
    return f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rx:.2f}" ry="{ry:.2f}"{t} {attr_str}/>'


def line(x1, y1, x2, y2, **attrs):
    attr_str = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" {attr_str}/>'


def path(d, **attrs):
    attr_str = " ".join(f'{k.replace("_", "-")}="{v}"' for k, v in attrs.items())
    return f'<path d="{d}" {attr_str}/>'


def degree_ticks(cx, cy, r_in, r_out, count=24, stroke_w=0.6, stroke_op=0.55, start_deg=0, end_deg=360):
    els = []
    for i in range(count):
        if end_deg - start_deg < 360:
            deg = start_deg + (end_deg - start_deg) * i / max(1, count - 1)
        else:
            deg = start_deg + (360.0 * i / count)
        x1, y1 = pt(cx, cy, r_in, deg)
        x2, y2 = pt(cx, cy, r_out, deg)
        sw = stroke_w * (1.4 if i % 3 == 0 else 0.8)
        els.append(line(x1, y1, x2, y2, stroke="currentColor", stroke_width=f"{sw:.2f}", stroke_opacity=stroke_op))
    return els


def corner_filigree(w=160, h=220, pad=10):
    """Add delicate Art Nouveau corner stars and botanical brackets."""
    els = [
        star_polygon(pad + 5, pad + 5, 4.5, 1.4, 4, 0, fill="currentColor", fill_opacity=0.85),
        star_polygon(w - pad - 5, pad + 5, 4.5, 1.4, 4, 0, fill="currentColor", fill_opacity=0.85),
        star_polygon(pad + 5, h - pad - 5, 4.5, 1.4, 4, 0, fill="currentColor", fill_opacity=0.85),
        star_polygon(w - pad - 5, h - pad - 5, 4.5, 1.4, 4, 0, fill="currentColor", fill_opacity=0.85),
    ]
    return els


def shared_card_arch(top_y=12, bottom_y=208, left_x=12, right_x=148, show_ticks=True):
    """Layer 1: Art Nouveau Cameo Arch Alcove & Stippled Celestial Ground (160x220)."""
    cx = (left_x + right_x) / 2
    arch_r = (right_x - left_x) / 2
    arch_cy = top_y + arch_r
    inner_l, inner_r = left_x + 5, right_x - 5
    inner_r_arc = arch_r - 5

    els = [
        # Outer thin rectangular hairline frame
        f'<rect x="6" y="6" width="148" height="208" rx="4" fill="none" stroke="currentColor" stroke-width="0.65" stroke-opacity="0.35"/>',
        # Translucent Arched Alcove Fill
        path(
            f"M {left_x} {bottom_y} L {left_x} {arch_cy} A {arch_r} {arch_r} 0 0 1 {right_x} {arch_cy} L {right_x} {bottom_y} Z",
            fill="currentColor",
            fill_opacity="0.055",
            stroke="currentColor",
            stroke_width="1.15",
            stroke_opacity="0.72",
        ),
        # Inner Archway Trim
        path(
            f"M {inner_l} {bottom_y - 4} L {inner_l} {arch_cy} A {inner_r_arc} {inner_r_arc} 0 0 1 {inner_r} {arch_cy} L {inner_r} {bottom_y - 4} Z",
            fill="none",
            stroke="currentColor",
            stroke_width="0.6",
            stroke_dasharray="2 3",
            stroke_opacity="0.55",
        ),
    ]
    if show_ticks:
        els.extend(degree_ticks(cx, arch_cy, inner_r_arc - 5, inner_r_arc - 1, count=19, stroke_w=0.55, stroke_op=0.45, start_deg=180, end_deg=360))
    els.extend(corner_filigree(160, 220, 8))
    return els


def crescent_moon_d(cx, cy, r_out, angle_deg=0, thickness=0.68):
    """Create a smooth crescent path opening toward angle_deg (0 = opens right)."""
    # Compute two intersection tips at +/- 115 degrees from the back vector
    back = angle_deg + 180
    p1 = pt(cx, cy, r_out, back - 122)
    p2 = pt(cx, cy, r_out, back + 122)
    r_in = r_out * thickness
    return (
        f"M {p1[0]} {p1[1]} "
        f"A {r_out} {r_out} 0 1 0 {p2[0]} {p2[1]} "
        f"A {r_in} {r_in} 0 1 1 {p1[0]} {p1[1]} Z"
    )


def stipple_ring(cx, cy, r, count=12, dot_r=0.9, op=0.6, offset_deg=0):
    els = []
    for i in range(count):
        x, y = pt(cx, cy, r, offset_deg + (360.0 * i / count))
        els.append(circle(x, y, dot_r, fill="currentColor", fill_opacity=op))
    return els


def botanical_leaf(x, y, angle_deg, length=16, width=6, fill_op=0.25):
    rad = math.radians(angle_deg)
    perp = math.radians(angle_deg + 90)
    tip_x = x + math.cos(rad) * length
    tip_y = y + math.sin(rad) * length
    mid_x = x + math.cos(rad) * (length * 0.5)
    mid_y = y + math.sin(rad) * (length * 0.5)
    c1x = mid_x + math.cos(perp) * width
    c1y = mid_y + math.sin(perp) * width
    c2x = mid_x - math.cos(perp) * width
    c2y = mid_y - math.sin(perp) * width
    d = f"M {x:.2f} {y:.2f} Q {c1x:.2f} {c1y:.2f} {tip_x:.2f} {tip_y:.2f} Q {c2x:.2f} {c2y:.2f} {x:.2f} {y:.2f} Z"
    return [
        path(d, fill="currentColor", fill_opacity=fill_op, stroke="currentColor", stroke_width="0.9", stroke_opacity="0.88"),
        line(x, y, tip_x * 0.85 + x * 0.15, tip_y * 0.85 + y * 0.15, stroke="currentColor", stroke_width="0.6", stroke_opacity="0.65"),
    ]


def rose_cameo(cx, cy, radius=24, petals=6):
    """Multi-layered botanical rose medallion with cameo relief petals."""
    els = []
    # Outer petals ring
    for i in range(petals):
        deg = i * (360.0 / petals) - 90
        p_base = pt(cx, cy, radius * 0.25, deg)
        p_tip = pt(cx, cy, radius, deg)
        p_l = pt(cx, cy, radius * 0.88, deg - 26)
        p_r = pt(cx, cy, radius * 0.88, deg + 26)
        d = f"M {p_base[0]} {p_base[1]} C {p_l[0]} {p_l[1]} {p_tip[0]} {p_tip[1]} {p_tip[0]} {p_tip[1]} C {p_r[0]} {p_r[1]} {p_base[0]} {p_base[1]} {p_base[0]} {p_base[1]} Z"
        els.append(path(d, fill="currentColor", fill_opacity="0.18", stroke="currentColor", stroke_width="1.05"))
    # Inner offset petals ring
    for i in range(petals):
        deg = i * (360.0 / petals) - 90 + (180.0 / petals)
        r2 = radius * 0.68
        p_base = pt(cx, cy, r2 * 0.2, deg)
        p_tip = pt(cx, cy, r2, deg)
        p_l = pt(cx, cy, r2 * 0.9, deg - 32)
        p_r = pt(cx, cy, r2 * 0.9, deg + 32)
        d = f"M {p_base[0]} {p_base[1]} C {p_l[0]} {p_l[1]} {p_tip[0]} {p_tip[1]} {p_tip[0]} {p_tip[1]} C {p_r[0]} {p_r[1]} {p_base[0]} {p_base[1]} {p_base[0]} {p_base[1]} Z"
        els.append(path(d, fill="currentColor", fill_opacity="0.42", stroke="currentColor", stroke_width="1.0"))
    # Central spiral core
    els.append(circle(cx, cy, radius * 0.22, fill="currentColor", fill_opacity="0.9", stroke="currentColor", stroke_width="0.9"))
    els.append(circle(cx, cy, radius * 0.1, fill="none", stroke="currentColor", stroke_width="0.6", stroke_opacity="0.5"))
    return els


def wing_feathers(cx, cy, side=1, scale=1.0):
    """Engraved layered wing feathers extending outward (side: 1 right, -1 left)."""
    els = []
    # Main primary feathers
    for i in range(7):
        ang = (-32 + i * 11) if side == 1 else (212 - i * 11)
        length = (46 - i * 3.8) * scale
        width = (6.2 - i * 0.35) * scale
        ox, oy = cx + side * 4 * scale, cy + i * 2.5 * scale
        els.extend(botanical_leaf(ox, oy, ang, length=length, width=width, fill_op=0.28 - i * 0.02))
    # Upper covert wing arc crest
    c_end_x = cx + side * 44 * scale
    c_end_y = cy - 24 * scale
    els.append(
        path(
            f"M {cx} {cy} Q {cx + side * 22 * scale} {cy - 34 * scale} {c_end_x} {c_end_y}",
            fill="none",
            stroke="currentColor",
            stroke_width="1.4",
        )
    )
    return els


def render_svg(w, h, cls, body_elements):
    inner = "\n  ".join(body_elements)
    cls_attr = f' class="{cls}"' if cls else ""
    return f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg"{cls_attr}>\n  {inner}\n</svg>'


# ==============================================================================
# 4 SEASONAL CARD BACKS (200x320)
# ==============================================================================

def build_back_spring():
    els = [
        f'<rect x="8" y="8" width="184" height="304" rx="6" fill="none" stroke="currentColor" stroke-width="0.8" stroke-dasharray="2 3" stroke-opacity="0.6"/>',
        f'<rect x="14" y="14" width="172" height="292" rx="4" fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.9"/>',
        path("M 22 270 L 22 72 A 78 78 0 0 1 178 72 L 178 270 A 26 26 0 0 1 152 296 L 48 296 A 26 26 0 0 1 22 270 Z", fill="none", stroke="currentColor", stroke_width="0.75", stroke_opacity="0.5"),
    ]
    els.extend(corner_filigree(200, 320, 12))
    # Central Sakura & Botanical Mandala
    els.append(circle(100, 160, 64, fill="currentColor", fill_opacity="0.06", stroke="currentColor", stroke_width="0.7", stroke_dasharray="2 4"))
    els.append(circle(100, 160, 52, fill="none", stroke="currentColor", stroke_width="1.05"))
    els.extend(degree_ticks(100, 160, 46, 52, count=24, stroke_w=0.65, stroke_op=0.6))
    els.extend(rose_cameo(100, 160, radius=32, petals=5))
    # Symmetrical upper & lower climbing botanical branches
    for dy, flip in [(-1, 1), (1, -1)]:
        y_start = 160 + dy * 52
        y_end = 160 + dy * 116
        els.append(path(f"M 100 {y_start} Q 88 {(y_start + y_end) / 2} 100 {y_end}", fill="none", stroke="currentColor", stroke_width="1.3"))
        for k, dist in enumerate([20, 42]):
            by = y_start + dy * dist
            els.extend(botanical_leaf(100, by, -90 * dy - 38, length=20 - k * 3, width=6, fill_op=0.35))
            els.extend(botanical_leaf(100, by, -90 * dy + 38, length=20 - k * 3, width=6, fill_op=0.35))
        els.append(star_polygon(100, y_end + dy * 8, 7, 2.2, 4, 0, fill="currentColor", fill_opacity=0.85))
    els.extend(stipple_ring(100, 160, 40, count=10, dot_r=1.1, op=0.65))
    return render_svg(200, 320, "card-back-svg", els)


def build_back_summer():
    els = [
        f'<rect x="8" y="8" width="184" height="304" rx="6" fill="none" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.45"/>',
        f'<rect x="14" y="14" width="172" height="292" rx="4" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.88"/>',
    ]
    els.extend(corner_filigree(200, 320, 12))
    # Celestial Astrolabe Rings & Constellation Ticks
    els.append(circle(100, 160, 68, fill="currentColor", fill_opacity="0.06", stroke="currentColor", stroke_width="0.85"))
    els.extend(degree_ticks(100, 160, 62, 68, count=36, stroke_w=0.65, stroke_op=0.65))
    els.append(circle(100, 160, 50, fill="none", stroke="currentColor", stroke_width="1.1"))
    els.append(circle(100, 160, 36, fill="none", stroke="currentColor", stroke_width="0.8", stroke_dasharray="2 4"))
    els.append(ellipse(100, 160, 74, 24, -32, fill="none", stroke="currentColor", stroke_width="0.9", stroke_opacity="0.72"))
    els.append(ellipse(100, 160, 74, 24, 32, fill="none", stroke="currentColor", stroke_width="0.9", stroke_opacity="0.72"))
    # Central Crescent & 8-Point North Star
    els.append(path(crescent_moon_d(96, 160, 24, angle_deg=15, thickness=0.72), fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="0.9"))
    els.append(star_polygon(112, 152, 8, 2.2, 4, 0, fill="currentColor", fill_opacity="0.95"))
    # Cardinal Starbursts top & bottom
    for sy in [60, 260]:
        els.append(star_polygon(100, sy, 14, 3.6, 8, -90, fill="currentColor", fill_opacity="0.82"))
        els.append(circle(100, sy, 18, fill="none", stroke="currentColor", stroke_width="0.6", stroke_dasharray="1.5 3"))
    els.extend(stipple_ring(100, 160, 56, count=12, dot_r=1.2, op=0.7, offset_deg=15))
    return render_svg(200, 320, "card-back-svg", els)


def build_back_autumn():
    els = [
        f'<rect x="8" y="8" width="184" height="304" rx="6" fill="none" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.5"/>',
        f'<rect x="14" y="14" width="172" height="292" rx="4" fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-width="1.2"/>',
        '<polygon points="100,32 172,160 100,288 28,160" fill="currentColor" fill-opacity="0.05" stroke="currentColor" stroke-width="1.05"/>',
        '<polygon points="100,48 158,160 100,272 42,160" fill="none" stroke="currentColor" stroke-width="0.7" stroke-dasharray="3 3"/>',
    ]
    els.extend(corner_filigree(200, 320, 12))
    els.append(circle(100, 160, 44, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="1.0"))
    els.extend(degree_ticks(100, 160, 39, 44, count=24, stroke_w=0.6, stroke_op=0.6))
    # Symmetrical Upper & Lower Ginkgo Leaf Fans
    for dy, base_ang in [(-1, -90), (1, 90)]:
        y0 = 160 + dy * 14
        els.append(line(100, 160, 100, y0 + dy * 38, stroke="currentColor", stroke_width="1.2"))
        els.extend(botanical_leaf(100, y0, base_ang - 24, length=34, width=11, fill_op=0.35))
        els.extend(botanical_leaf(100, y0, base_ang + 24, length=34, width=11, fill_op=0.35))
        els.extend(botanical_leaf(100, y0 + dy * 8, base_ang, length=38, width=10, fill_op=0.55))
    els.append(star_polygon(100, 160, 11, 4, 8, -90, fill="currentColor", fill_opacity="0.9"))
    els.extend(stipple_ring(100, 160, 56, count=8, dot_r=1.3, op=0.6))
    return render_svg(200, 320, "card-back-svg", els)


def build_back_winter():
    els = [
        f'<rect x="8" y="8" width="184" height="304" rx="6" fill="none" stroke="currentColor" stroke-width="0.8" stroke-opacity="0.45"/>',
        f'<rect x="14" y="14" width="172" height="292" rx="4" fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-width="1.2" stroke-opacity="0.9"/>',
    ]
    els.extend(corner_filigree(200, 320, 12))
    # Concentric Sacred Ice Hexagons
    for r, fill_op, sw, dash in [(68, 0.05, 1.0, None), (54, 0.07, 0.75, "2 3"), (38, 0.09, 1.1, None)]:
        pts = [pt(100, 160, r, -90 + i * 60) for i in range(6)]
        extra = f' stroke-dasharray="{dash}"' if dash else ""
        els.append(f'<polygon points="{fmt_pts(pts)}" fill="currentColor" fill-opacity="{fill_op}" stroke="currentColor" stroke-width="{sw}"{extra}/>')
    # 6 Primary + 6 Secondary Fractal Crystal Arms
    for i in range(6):
        ang = -90 + i * 60
        x2, y2 = pt(100, 160, 74, ang)
        els.append(line(100, 160, x2, y2, stroke="currentColor", stroke_width="1.2"))
        # Dual chevron crystal spurs
        for rad_d, arm_l in [(34, 14), (52, 11), (64, 7)]:
            bx, by = pt(100, 160, rad_d, ang)
            tx1, ty1 = pt(bx, by, arm_l, ang - 48)
            tx2, ty2 = pt(bx, by, arm_l, ang + 48)
            els.append(line(bx, by, tx1, ty1, stroke="currentColor", stroke_width="0.95"))
            els.append(line(bx, by, tx2, ty2, stroke="currentColor", stroke_width="0.95"))
        # Terminal diamond tip
        tip_x, tip_y = pt(100, 160, 82, ang)
        els.append(star_polygon(tip_x, tip_y, 5, 2, 4, ang, fill="currentColor", fill_opacity="0.85"))
    # Upper & Lower Ice Mandala Stars
    for sy in [52, 268]:
        els.append(star_polygon(100, sy, 12, 3.5, 6, -90, fill="currentColor", fill_opacity="0.75"))
    els.append(circle(100, 160, 12, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.1"))
    els.append(circle(100, 160, 4, fill="currentColor", fill_opacity="0.95"))
    return render_svg(200, 320, "card-back-svg", els)


# ==============================================================================
# 22 MAJOR ARCANA CARDS (160x220) - OPTION 3: CELESTIAL ENGRAVING & CAMEO
# ==============================================================================

def build_card_0():
    """0 愚者 THE FOOL: White Dove in Flight, 5-Petal White Rose Cameo & Morning Star."""
    els = shared_card_arch()
    # Celestial Sunburst Halo in background
    els.append(circle(80, 96, 44, fill="currentColor", fill_opacity="0.06", stroke="currentColor", stroke_width="0.75", stroke_dasharray="2 3"))
    els.extend(degree_ticks(80, 96, 38, 44, count=24, stroke_w=0.6, stroke_op=0.5))
    # Radiant Compass Star upper right
    els.append(star_polygon(118, 52, 13, 3.2, 8, -90, fill="currentColor", fill_opacity="0.9"))
    els.append(circle(118, 52, 16, fill="none", stroke="currentColor", stroke_width="0.5", stroke_dasharray="1.5 2.5"))
    # Peaceful Soaring Dove Centerpiece (Graceful Curved Wings + Body)
    els.extend(wing_feathers(76, 94, side=-1, scale=0.86))
    els.extend(wing_feathers(84, 94, side=1, scale=0.86))
    # Dove body, lifted head looking toward the star & fanned tail feathers
    dove_core = "M 80 76 Q 85 80 83 92 Q 86 104 90 116 Q 80 112 70 116 Q 74 104 77 92 Q 75 82 80 76 Z"
    els.append(path(dove_core, fill="currentColor", fill_opacity="0.92", stroke="currentColor", stroke_width="0.9"))
    els.append(line(80, 96, 75, 114, stroke="currentColor", stroke_width="0.6", stroke_opacity="0.45"))
    els.append(line(80, 96, 85, 114, stroke="currentColor", stroke_width="0.6", stroke_opacity="0.45"))
    # Pure White Rose Cameo below + Cliff Scroll Waves
    els.extend(rose_cameo(80, 148, radius=20, petals=5))
    els.extend(botanical_leaf(60, 152, 160, length=18, width=5.5, fill_op=0.3))
    els.extend(botanical_leaf(100, 152, 20, length=18, width=5.5, fill_op=0.3))
    els.append(path("M 22 184 Q 50 172 80 182 Q 110 192 138 180", fill="none", stroke="currentColor", stroke_width="1.15"))
    els.append(path("M 28 192 Q 56 182 82 190 Q 108 198 134 188", fill="none", stroke="currentColor", stroke_width="0.75", stroke_dasharray="3 3"))
    els.extend(stipple_ring(80, 96, 52, count=10, dot_r=1.0, op=0.55))
    return render_svg(160, 220, "", els)


def build_card_1():
    """I 魔術師 THE MAGICIAN: Infinity Halo, Faceted Wand of Light & 4 Elemental Medallions."""
    els = shared_card_arch()
    # Grand Lemniscate (Infinity Halo) above
    els.append(
        path(
            "M 80 48 C 66 34 46 38 46 50 C 46 62 66 64 80 50 C 94 36 114 38 114 50 C 114 62 94 64 80 48 Z",
            fill="currentColor",
            fill_opacity="0.16",
            stroke="currentColor",
            stroke_width="1.45",
        )
    )
    els.append(star_polygon(80, 49, 6, 1.8, 4, 0, fill="currentColor", fill_opacity="0.9"))
    # Central Faceted Light Wand + 12 Radiating Beams
    for i in range(12):
        x1, y1 = pt(80, 108, 18, i * 30)
        x2, y2 = pt(80, 108, 34, i * 30)
        els.append(line(x1, y1, x2, y2, stroke="currentColor", stroke_width="0.65", stroke_opacity="0.55"))
    els.append(circle(80, 108, 22, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="0.8", stroke_dasharray="2 3"))
    # Carved Wand Shaft
    els.append(path("M 77 72 L 83 72 L 82 142 L 78 142 Z", fill="currentColor", fill_opacity="0.9", stroke="currentColor", stroke_width="0.8"))
    els.append(star_polygon(80, 68, 9, 2.5, 4, 0, fill="currentColor", fill_opacity="0.95"))
    els.append(circle(80, 145, 4.5, fill="currentColor", fill_opacity="0.4", stroke="currentColor", stroke_width="1.0"))
    # Ornate Altar Table Bar
    els.append(line(24, 156, 136, 156, stroke="currentColor", stroke_width="1.35"))
    els.append(line(32, 160, 128, 160, stroke="currentColor", stroke_width="0.65", stroke_opacity="0.6"))
    # Four Corner/Altar Elemental Emblems inside subtle frames
    # 1. Cup
    els.append(path("M 32 168 L 46 168 C 46 180 32 180 32 168 Z", fill="currentColor", fill_opacity="0.8", stroke="currentColor", stroke_width="0.9"))
    els.append(line(39, 178, 39, 188, stroke="currentColor", stroke_width="1.1"))
    els.append(line(34, 188, 44, 188, stroke="currentColor", stroke_width="1.2"))
    # 2. Sword
    els.append(line(66, 166, 66, 190, stroke="currentColor", stroke_width="1.5"))
    els.append(line(60, 182, 72, 182, stroke="currentColor", stroke_width="1.2"))
    els.append(circle(66, 191, 2, fill="currentColor", fill_opacity="0.9"))
    # 3. Engraved Pentacle Coin
    els.append(circle(95, 178, 11, fill="currentColor", fill_opacity="0.16", stroke="currentColor", stroke_width="1.1"))
    els.append(star_polygon(95, 178, 9, 3.6, 5, -90, fill="none", stroke="currentColor", stroke_width="0.95"))
    # 4. Blossoming Wand Shoot
    els.append(line(122, 190, 122, 168, stroke="currentColor", stroke_width="1.4"))
    els.extend(botanical_leaf(122, 176, -40, length=10, width=3.2, fill_op=0.65))
    els.extend(botanical_leaf(122, 172, -140, length=9, width=3, fill_op=0.65))
    return render_svg(160, 220, "", els)


def build_card_2():
    """II 女祭司 THE HIGH PRIESTESS: Fluted B/J Columns, Triple Moon Diadem & Pomegranate."""
    els = shared_card_arch()
    # Left Dark Pillar (Cameo Fluted) & Right Pillar (Engraved)
    els.append('<rect x="26" y="54" width="14" height="136" fill="currentColor" fill-opacity="0.72" stroke="currentColor" stroke-width="1.0"/>')
    els.append('<rect x="23" y="50" width="20" height="6" rx="1" fill="currentColor" fill-opacity="0.9"/>')
    els.append('<rect x="23" y="188" width="20" height="6" rx="1" fill="currentColor" fill-opacity="0.9"/>')
    els.append('<rect x="120" y="54" width="14" height="136" fill="currentColor" fill-opacity="0.14" stroke="currentColor" stroke-width="1.1"/>')
    els.append('<rect x="117" y="50" width="20" height="6" rx="1" fill="currentColor" fill-opacity="0.35" stroke="currentColor" stroke-width="1.0"/>')
    els.append('<rect x="117" y="188" width="20" height="6" rx="1" fill="currentColor" stroke-width="1.0" fill-opacity="0.35"/>')
    for fx in [30, 36]:
        els.append(line(fx, 58, fx, 186, stroke="currentColor", stroke_width="0.5", stroke_opacity="0.35"))
    for fx in [124, 130]:
        els.append(line(fx, 58, fx, 186, stroke="currentColor", stroke_width="0.6", stroke_opacity="0.65"))
    # Triple Moon Goddess Diadem at Center Top
    els.append(circle(80, 68, 13, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.25"))
    els.append(circle(80, 68, 7, fill="currentColor", fill_opacity="0.88"))
    els.append(path(crescent_moon_d(58, 68, 11, angle_deg=180, thickness=0.72), fill="currentColor", fill_opacity="0.85"))
    els.append(path(crescent_moon_d(102, 68, 11, angle_deg=0, thickness=0.72), fill="currentColor", fill_opacity="0.85"))
    # Veil Curtain Draping Behind Center
    els.append(path("M 42 94 Q 80 82 118 94", fill="none", stroke="currentColor", stroke_width="1.0"))
    # Pomegranate Medallion
    els.append(circle(80, 118, 18, fill="currentColor", fill_opacity="0.14", stroke="currentColor", stroke_width="1.1"))
    els.extend(rose_cameo(80, 118, radius=13, petals=5))
    # Sacred Scroll of TORA below + Large Crescent Moon Base
    els.append('<rect x="64" y="144" width="32" height="16" rx="2" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke_width="1.0"/>')
    els.append(line(69, 150, 91, 150, stroke="currentColor", stroke_width="0.8"))
    els.append(line(69, 155, 87, 155, stroke="currentColor", stroke_width="0.8"))
    els.append(path(crescent_moon_d(80, 176, 17, angle_deg=-90, thickness=0.68), fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="0.9"))
    return render_svg(160, 220, "", els)


def build_card_3():
    """III 皇后 THE EMPRESS: 12-Star Crown, Lush Damask Rose & Arching Wheat Sheaves."""
    els = shared_card_arch()
    # 12-Star Celestial Crown Arc
    els.append(path("M 36 62 C 55 42 105 42 124 62", fill="none", stroke="currentColor", stroke_width="0.9", stroke_dasharray="2 3"))
    for i in range(7):
        sx, sy = pt(80, 74, 38, -144 + i * 18)
        r_s = 5.2 if i == 3 else 3.4
        els.append(star_polygon(sx, sy, r_s, r_s * 0.32, 6 if i == 3 else 4, -90, fill="currentColor", fill_opacity=0.9))
    # Lush Central Multi-Petal Damask Rose Cameo
    els.append(circle(80, 108, 34, fill="currentColor", fill_opacity="0.06", stroke="currentColor", stroke_width="0.8", stroke_dasharray="2 3"))
    els.extend(rose_cameo(80, 108, radius=27, petals=8))
    # Arching Golden Wheat Stalks Framing Left & Right
    for side in [-1, 1]:
        els.append(path(f"M {80 + side * 12} 174 Q {80 + side * 46} 145 {80 + side * 48} 102", fill="none", stroke="currentColor", stroke_width="1.2"))
        for k in range(5):
            ang = 100 + k * 14
            gx, gy = pt(80 + side * 12, 174, 24 + k * 10, -90 + side * (22 + k * 3))
            els.extend(botanical_leaf(80 + side * (26 + k * 5), 156 - k * 11, -90 + side * 32, length=11, width=3.2, fill_op=0.65))
            els.extend(botanical_leaf(80 + side * (26 + k * 5), 156 - k * 11, -90 - side * 18, length=10, width=3.0, fill_op=0.45))
    # Venus Mirror Emblem Anchoring Base
    els.append(circle(80, 168, 12, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.3"))
    els.append(line(80, 180, 80, 198, stroke="currentColor", stroke_width="1.4"))
    els.append(line(71, 190, 89, 190, stroke="currentColor", stroke_width="1.3"))
    return render_svg(160, 220, "", els)


def build_card_4():
    """IV 皇帝 THE EMPEROR: 5-Peaked Imperial Crown, Crossed Scepter & Orb + Stone Mountains."""
    els = shared_card_arch()
    # Mountain Ridge Backdrop
    els.append('<polygon points="20,174 44,132 62,148 80,120 98,148 116,132 140,174" fill="currentColor" fill-opacity="0.1" stroke="currentColor" stroke-width="0.9"/>')
    # Stepped Stone Pedestal
    els.append('<rect x="34" y="174" width="92" height="10" fill="currentColor" fill-opacity="0.24" stroke="currentColor" stroke-width="1.0"/>')
    els.append('<rect x="44" y="164" width="72" height="10" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.0"/>')
    # Ornate 5-Pointed Royal Crown Cameo
    crown_d = "M 46 86 L 40 56 L 60 72 L 80 44 L 100 72 L 120 56 L 114 86 Z"
    els.append(path(crown_d, fill="currentColor", fill_opacity="0.85", stroke="currentColor", stroke_width="1.1"))
    els.append('<rect x="46" y="88" width="68" height="7" rx="2" fill="currentColor" fill-opacity="0.45" stroke="currentColor" stroke-width="1.0"/>')
    for px, py in [(40, 53), (80, 40), (120, 53), (60, 68), (100, 68)]:
        els.append(circle(px, py, 2.8, fill="currentColor", fill_opacity="0.95"))
    # Central Ankh Scepter & Crossed Sword/Baton
    els.append(line(80, 98, 80, 164, stroke="currentColor", stroke_width="2.2"))
    els.append(circle(80, 114, 11, fill="currentColor", fill_opacity="0.28", stroke="currentColor", stroke_width="1.5"))
    els.append(circle(80, 114, 4, fill="currentColor", fill_opacity="0.92"))
    els.append(line(62, 132, 98, 132, stroke="currentColor", stroke_width="1.7"))
    # Sculpted Heraldic Ram Horns flanking scepter
    for side in [-1, 1]:
        els.append(path(f"M {80 + side * 30} 118 C {80 + side * 50} 102 {80 + side * 52} 126 {80 + side * 38} 130", fill="none", stroke="currentColor", stroke_width="1.5"))
    return render_svg(160, 220, "", els)


def build_card_5():
    """V 教皇 THE HIEROPHANT: Gothic Rose Window, Triple Papal Cross & Crossed Sanctuary Keys."""
    els = shared_card_arch()
    # Gothic Rose Window Wheel Behind Center
    els.append(circle(80, 82, 34, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="1.1"))
    els.append(circle(80, 82, 26, fill="none", stroke="currentColor", stroke_width="0.75", stroke_dasharray="2 2"))
    for i in range(12):
        x1, y1 = pt(80, 82, 10, i * 30)
        x2, y2 = pt(80, 82, 33, i * 30)
        els.append(line(x1, y1, x2, y2, stroke="currentColor", stroke_width="0.7", stroke_opacity="0.6"))
    # Triple Papal Cross Cameo
    els.append(line(80, 48, 80, 130, stroke="currentColor", stroke_width="2.0"))
    for cy_bar, half_w in [(62, 12), (76, 17), (90, 22)]:
        els.append(line(80 - half_w, cy_bar, 80 + half_w, cy_bar, stroke="currentColor", stroke_width="1.6"))
        els.append(circle(80 - half_w, cy_bar, 2.0, fill="currentColor", fill_opacity="0.9"))
        els.append(circle(80 + half_w, cy_bar, 2.0, fill="currentColor", fill_opacity="0.9"))
    # Two Crossed Ornate Sanctuary Keys Below
    for side in [-1, 1]:
        # Key diagonal shaft from bottom bow to upper teeth
        bx, by = 80 - side * 26, 178
        tx, ty = 80 + side * 24, 134
        els.append(line(bx, by, tx, ty, stroke="currentColor", stroke_width="2.0"))
        # Key bow ring
        els.append(circle(bx, by, 7.5, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.4"))
        els.append(circle(bx, by, 3.0, fill="none", stroke="currentColor", stroke_width="0.9"))
        # Key collar & ward teeth
        ux, uy = tx - side * 5, ty + 4
        els.append(line(ux, uy, ux + side * 5, uy + 7, stroke="currentColor", stroke_width="1.6"))
        els.append(line(tx, ty, tx + side * 5, ty + 6, stroke="currentColor", stroke_width="1.6"))
    els.append(star_polygon(80, 156, 7, 2.2, 4, 0, fill="currentColor", fill_opacity="0.95"))
    return render_svg(160, 220, "", els)


def build_card_6():
    """VI 戀人 THE LOVERS: Great Angel Wing Canopy, Twin Intertwined Roses & Sun/Moon."""
    els = shared_card_arch()
    # Archangel Wing Canopy Embracing Upper Half
    els.extend(wing_feathers(76, 86, side=-1, scale=0.95))
    els.extend(wing_feathers(84, 86, side=1, scale=0.95))
    # Sun & Crescent Emblem Above
    els.append(circle(80, 50, 11, fill="currentColor", fill_opacity="0.85", stroke="currentColor", stroke_width="1.0"))
    els.extend(degree_ticks(80, 50, 13, 19, count=12, stroke_w=0.8, stroke_op=0.75))
    # Twin Blooming Roses Intertwined with Infinity Knot
    els.extend(rose_cameo(58, 136, radius=19, petals=5))
    els.extend(rose_cameo(102, 136, radius=19, petals=5))
    els.append(
        path(
            "M 80 136 C 72 126 58 128 58 136 C 58 144 72 146 80 136 C 88 126 102 128 102 136 C 102 144 88 146 80 136 Z",
            fill="none",
            stroke="currentColor",
            stroke_width="1.3",
        )
    )
    # Flowering Vines Converging at Chalice / Root Base
    els.append(path("M 58 156 Q 68 182 80 192 Q 92 182 102 156", fill="none", stroke="currentColor", stroke_width="1.2"))
    els.append(star_polygon(80, 186, 8, 2.4, 4, 0, fill="currentColor", fill_opacity="0.9"))
    return render_svg(160, 220, "", els)


def build_card_7():
    """VII 戰車 THE CHARIOT: Winged Heraldic Shield, Starry Canopy & Twin Spoked Wheels."""
    els = shared_card_arch()
    # Starry Canopy Arch Header
    els.append(path("M 26 62 L 80 42 L 134 62", fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.2"))
    els.extend(stipple_ring(80, 68, 28, count=7, dot_r=1.5, op=0.85, offset_deg=-150))
    # Heraldic Chariot Shield Centerpiece
    shield_d = "M 54 78 L 106 78 L 106 116 C 106 138 80 152 80 152 C 80 152 54 138 54 116 Z"
    els.append(path(shield_d, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.45"))
    # Central Guiding Compass Star inside Shield
    els.append(star_polygon(80, 112, 18, 4.8, 8, -90, fill="currentColor", fill_opacity="0.92"))
    # Winged Sun / Shield Crest Flanking Left & Right
    els.extend(wing_feathers(50, 96, side=-1, scale=0.65))
    els.extend(wing_feathers(110, 96, side=1, scale=0.65))
    # Crescent Shoulder Badges
    els.append(path(crescent_moon_d(63, 88, 6.5, angle_deg=0, thickness=0.65), fill="currentColor", fill_opacity="0.9"))
    els.append(path(crescent_moon_d(97, 88, 6.5, angle_deg=180, thickness=0.65), fill="currentColor", fill_opacity="0.9"))
    # Twin Ornate Chariot Wheels
    for wx in [42, 118]:
        els.append(circle(wx, 166, 17, fill="currentColor", fill_opacity="0.1", stroke="currentColor", stroke_width="1.35"))
        els.append(circle(wx, 166, 4.5, fill="currentColor", fill_opacity="0.9"))
        for i in range(8):
            tx, ty = pt(wx, 166, 16, i * 45)
            els.append(line(wx, 166, tx, ty, stroke="currentColor", stroke_width="0.9"))
    els.append(line(42, 166, 118, 166, stroke="currentColor", stroke_width="1.2"))
    return render_svg(160, 220, "", els)


def build_card_8():
    """VIII 力量 STRENGTH: Sculpted Heraldic Lion Medallion under Infinity Halo & Rose Wreath."""
    els = shared_card_arch()
    # Infinity Lemniscate Crown
    els.append(
        path(
            "M 80 46 C 68 35 52 38 52 48 C 52 58 68 60 80 48 C 92 36 108 38 108 48 C 108 58 92 60 80 46 Z",
            fill="currentColor",
            fill_opacity="0.2",
            stroke="currentColor",
            stroke_width="1.35",
        )
    )
    # Sculpted Heraldic Lion Sun-Mane Medallion (16 Flame Mane Locks)
    for i in range(16):
        deg = i * 22.5
        p_in_l = pt(80, 114, 24, deg - 9)
        p_tip = pt(80, 114, 42 if i % 2 == 0 else 36, deg)
        p_in_r = pt(80, 114, 24, deg + 9)
        d = f"M {p_in_l[0]} {p_in_l[1]} Q {p_tip[0]} {p_tip[1]} {p_tip[0]} {p_tip[1]} Q {p_in_r[0]} {p_in_r[1]} {p_in_r[0]} {p_in_r[1]} Z"
        els.append(path(d, fill="currentColor", fill_opacity="0.32" if i % 2 else "0.65", stroke="currentColor", stroke_width="0.9"))
    # Noble Lion Facial Crest inside Mane (Crisp Engraved Relief over Soft Halo)
    els.append(circle(80, 114, 24, fill="currentColor", fill_opacity="0.16", stroke="currentColor", stroke_width="1.4"))
    els.append(circle(80, 114, 20, fill="none", stroke="currentColor", stroke_width="0.65", stroke_dasharray="2 2"))
    # Engraved Regal Lion Brow, Eyes, Nose Bridge & Mane Jaw
    els.append(path("M 66 107 Q 73 102 78 107 L 78 117 L 74 122 L 80 126 L 86 122 L 82 117 L 82 107 Q 87 102 94 107", fill="none", stroke="currentColor", stroke_width="1.35"))
    els.append(circle(72, 110, 1.8, fill="currentColor", fill_opacity="0.9"))
    els.append(circle(88, 110, 1.8, fill="currentColor", fill_opacity="0.9"))
    els.append(path("M 74 128 Q 80 133 86 128", fill="none", stroke="currentColor", stroke_width="1.1"))
    # Surrounding Delicate Rose & Briar Garland Below
    els.extend(rose_cameo(80, 174, radius=15, petals=5))
    for side in [-1, 1]:
        els.append(path(f"M {80 + side * 16} 174 Q {80 + side * 44} 166 {80 + side * 48} 142", fill="none", stroke="currentColor", stroke_width="1.15"))
        els.extend(botanical_leaf(80 + side * 32, 166, -90 + side * 25, length=13, width=4, fill_op=0.45))
        els.extend(botanical_leaf(80 + side * 44, 152, -90 + side * 15, length=12, width=3.8, fill_op=0.45))
    return render_svg(160, 220, "", els)


def build_card_9():
    """IX 隱者 THE HERMIT: Ornate Hexagonal Sanctuary Lantern with 6-Pt Star over Mountain Crags."""
    els = shared_card_arch()
    # 16 Beams of Wisdom Radiating from Lantern Center (80, 88)
    for i in range(16):
        x1, y1 = pt(80, 88, 22, i * 22.5)
        x2, y2 = pt(80, 88, 46 if i % 2 == 0 else 36, i * 22.5)
        els.append(line(x1, y1, x2, y2, stroke="currentColor", stroke_width="0.75", stroke_opacity="0.55"))
    # Suspension Chain & Pilgrim Hook Top
    els.append(line(80, 38, 80, 56, stroke="currentColor", stroke_width="1.3"))
    els.append(circle(80, 54, 4, fill="none", stroke="currentColor", stroke_width="1.1"))
    # Lantern Domed Cap & Hexagonal Glass Housing
    els.append(path("M 64 68 L 80 56 L 96 68 Z", fill="currentColor", fill_opacity="0.82", stroke="currentColor", stroke_width="1.0"))
    els.append(path("M 66 68 L 94 68 L 100 108 L 60 108 Z", fill="currentColor", fill_opacity="0.14", stroke="currentColor", stroke_width="1.3"))
    els.append(line(73, 68, 70, 108, stroke="currentColor", stroke_width="0.75", stroke_opacity="0.65"))
    els.append(line(87, 68, 90, 108, stroke="currentColor", stroke_width="0.75", stroke_opacity="0.65"))
    els.append(path("M 58 108 L 102 108 L 92 118 L 68 118 Z", fill="currentColor", fill_opacity="0.78", stroke="currentColor", stroke_width="1.0"))
    # Blazing 6-Point Seal of Solomon Star inside Lantern
    els.append(star_polygon(80, 88, 12, 5.2, 6, -90, fill="currentColor", fill_opacity="0.95"))
    # Layered Alpine Crags Silhouettes Below
    els.append(path("M 18 192 L 48 148 L 68 168 L 94 136 L 114 162 L 142 192 Z", fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.15"))
    els.append(path("M 30 192 L 64 158 L 84 176 L 116 150 L 140 192 Z", fill="currentColor", fill_opacity="0.12", stroke="currentColor", stroke_width="0.85"))
    return render_svg(160, 220, "", els)


def build_card_10():
    """X 命運之輪 WHEEL OF FORTUNE: Intricate 3-Ring Celestial Astrolabe & Corner Star Wings."""
    els = shared_card_arch(show_ticks=False)
    cx, cy = 80, 110
    # Outer Astrolabe Rings + 36 Degree Ticks
    els.append(circle(cx, cy, 52, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="1.5"))
    els.append(circle(cx, cy, 43, fill="none", stroke="currentColor", stroke_width="1.1"))
    els.extend(degree_ticks(cx, cy, 43, 52, count=36, stroke_w=0.65, stroke_op=0.72))
    els.append(circle(cx, cy, 32, fill="currentColor", fill_opacity="0.12", stroke="currentColor", stroke_width="1.0", stroke_dasharray="2 3"))
    els.append(circle(cx, cy, 14, fill="currentColor", fill_opacity="0.24", stroke="currentColor", stroke_width="1.2"))
    # 8 Ornate Wheel Spokes with Node Beads
    for i in range(8):
        ang = i * 45
        x1, y1 = pt(cx, cy, 14, ang)
        x2, y2 = pt(cx, cy, 43, ang)
        els.append(line(x1, y1, x2, y2, stroke="currentColor", stroke_width="1.25"))
        mx, my = pt(cx, cy, 28.5, ang)
        els.append(circle(mx, my, 2.2, fill="currentColor", fill_opacity="0.9"))
    # Intersecting Cosmic Orbits & Hub Star
    els.append(ellipse(cx, cy, 40, 14, 30, fill="none", stroke="currentColor", stroke_width="0.75", stroke_opacity="0.55"))
    els.append(ellipse(cx, cy, 40, 14, -30, fill="none", stroke="currentColor", stroke_width="0.75", stroke_opacity="0.55"))
    els.append(star_polygon(cx, cy, 10, 3.2, 8, -90, fill="currentColor", fill_opacity="0.95"))
    # 4 Winged Fixed-Sign Corner Crests
    for x, y in [(30, 50), (130, 50), (30, 174), (130, 174)]:
        els.append(circle(x, y, 7.5, fill="currentColor", fill_opacity="0.18", stroke="currentColor", stroke_width="0.9"))
        els.append(star_polygon(x, y, 5, 1.8, 4, 0, fill="currentColor", fill_opacity="0.88"))
    return render_svg(160, 220, "", els)


def build_card_11():
    """XI 正義 JUSTICE: Knight's Double-Edged Sword & Precision Balanced Scales + Laurel."""
    els = shared_card_arch()
    # Vertical Sword Centerpiece
    els.append(path("M 77 44 L 80 34 L 83 44 L 83 148 L 77 148 Z", fill="currentColor", fill_opacity="0.86", stroke="currentColor", stroke_width="0.9"))
    els.append(line(80, 46, 80, 146, stroke="currentColor", stroke_width="0.6", stroke_opacity="0.35"))
    # Ornate Crossguard & Pommel
    els.append(path("M 58 148 Q 80 140 102 148 Q 80 155 58 148 Z", fill="currentColor", fill_opacity="0.9", stroke="currentColor", stroke_width="1.0"))
    els.append(line(80, 152, 80, 170, stroke="currentColor", stroke_width="2.4"))
    els.append(circle(80, 175, 5.5, fill="currentColor", fill_opacity="0.92", stroke="currentColor", stroke_width="1.0"))
    # Balanced Scale Beam Fulcrum at Sword Center
    els.append(path("M 36 86 Q 80 78 124 86", fill="none", stroke="currentColor", stroke_width="1.8"))
    els.append(circle(80, 82, 5.5, fill="currentColor", fill_opacity="0.92"))
    # Left & Right Scale Pans with 3 Suspension Chains each
    for px in [38, 122]:
        els.append(circle(px, 86, 2.5, fill="currentColor", fill_opacity="0.9"))
        els.append(line(px, 88, px - 14, 126, stroke="currentColor", stroke_width="0.85"))
        els.append(line(px, 88, px, 128, stroke="currentColor", stroke_width="0.65", stroke_dasharray="2 2"))
        els.append(line(px, 88, px + 14, 126, stroke="currentColor", stroke_width="0.85"))
        els.append(path(f"M {px - 16} 126 L {px + 16} 126 C {px + 12} 138 {px - 12} 138 {px - 16} 126 Z", fill="currentColor", fill_opacity="0.72", stroke="currentColor", stroke_width="1.0"))
    # Framing Laurel Leaves below crossguard
    els.extend(botanical_leaf(66, 174, -145, length=20, width=5.5, fill_op=0.35))
    els.extend(botanical_leaf(94, 174, -35, length=20, width=5.5, fill_op=0.35))
    return render_svg(160, 220, "", els)


def build_card_12():
    """XII 倒吊人 THE HANGED MAN: Living Tree Bough, Inverted Hourglass Pendulum & 12-Ray Halo."""
    els = shared_card_arch()
    # Living Wooden Beam with Sprouting Leaves Top
    els.append(line(26, 48, 134, 48, stroke="currentColor", stroke_width="2.4"))
    els.append(line(32, 52, 128, 52, stroke="currentColor", stroke_width="0.7", stroke_opacity="0.6"))
    for lx, ang in [(42, -135), (56, -45), (104, -135), (118, -45)]:
        els.extend(botanical_leaf(lx, 48, ang, length=14, width=4.5, fill_op=0.55))
    # Suspension Cord & Ornate Inverted Winged Hourglass Pendulum
    els.append(line(80, 50, 80, 74, stroke="currentColor", stroke_width="1.3"))
    els.append(circle(80, 74, 3.5, fill="currentColor", fill_opacity="0.9"))
    # Upper & Lower Hourglass Frames + Conjoined Chambers (Inverted Perspective Symbol)
    els.append(line(64, 78, 96, 78, stroke="currentColor", stroke_width="1.5"))
    els.append(line(64, 128, 96, 128, stroke="currentColor", stroke_width="1.5"))
    els.append(path("M 66 78 C 66 98 80 103 80 103 C 80 103 94 98 94 78 Z", fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.1"))
    els.append(path("M 66 128 C 66 108 80 103 80 103 C 80 103 94 108 94 128 Z", fill="currentColor", fill_opacity="0.68", stroke="currentColor", stroke_width="1.1"))
    # Delicate Wings Flanking Hourglass (Suspension in Stillness)
    els.extend(wing_feathers(60, 102, side=-1, scale=0.6))
    els.extend(wing_feathers(100, 102, side=1, scale=0.6))
    # Inverted Sacred Illumination Halo Blooming Below (Enlightenment from Reverse View)
    els.append(line(80, 128, 80, 144, stroke="currentColor", stroke_width="1.0", stroke_dasharray="2 2"))
    els.append(circle(80, 164, 24, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="0.9", stroke_dasharray="2 3"))
    els.append(star_polygon(80, 164, 20, 5.5, 12, -90, fill="currentColor", fill_opacity="0.88"))
    els.append(circle(80, 164, 7, fill="currentColor", fill_opacity="0.95"))
    return render_svg(160, 220, "", els)


def build_card_13():
    """XIII 死神 DEATH: Sweeping Silver Scythe, 5-Petal Mystic White Rose & Eclipse Dawn."""
    els = shared_card_arch()
    # Twin Horizon Spires & Rising Eclipse Dawn
    els.append('<rect x="34" y="132" width="12" height="54" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.0"/>')
    els.append('<rect x="114" y="132" width="12" height="54" fill="currentColor" fill-opacity="0.25" stroke="currentColor" stroke-width="1.0"/>')
    els.append(path("M 56 186 A 24 24 0 0 1 104 186 Z", fill="currentColor", fill_opacity="0.32", stroke="currentColor", stroke_width="1.15"))
    els.extend(degree_ticks(80, 186, 26, 36, count=11, stroke_w=0.85, stroke_op=0.65, start_deg=180, end_deg=360))
    # Sweeping Crescent Scythe Blade & Slender Haft
    els.append(line(32, 184, 114, 58, stroke="currentColor", stroke_width="1.8"))
    scythe_d = "M 114 58 C 86 42 48 50 32 76 C 58 62 88 62 110 72 Z"
    els.append(path(scythe_d, fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="1.1"))
    # Central Mystic White Rose & Unfolding Butterfly Wings (Rebirth)
    els.extend(rose_cameo(80, 108, radius=21, petals=5))
    for side in [-1, 1]:
        els.append(path(f"M {80 + side * 14} 138 C {80 + side * 34} 122 {80 + side * 40} 142 {80 + side * 20} 148 Z", fill="currentColor", fill_opacity="0.28", stroke="currentColor", stroke_width="0.9"))
    els.append(line(22, 186, 138, 186, stroke="currentColor", stroke_width="1.2"))
    return render_svg(160, 220, "", els)


def build_card_14():
    """XIV 節制 TEMPERANCE: Archangel Wings, Twin Pouring Chalices & 5-Strand Starlight Stream."""
    els = shared_card_arch()
    # Symmetrical Archangel Wings Upper Frame
    els.extend(wing_feathers(75, 74, side=-1, scale=0.88))
    els.extend(wing_feathers(85, 74, side=1, scale=0.88))
    # Tilted Upper Left Amphora / Chalice
    els.append(path("M 36 102 L 56 96 C 58 110 42 116 36 102 Z", fill="currentColor", fill_opacity="0.85", stroke="currentColor", stroke_width="1.0"))
    els.append(line(41, 104, 30, 112, stroke="currentColor", stroke_width="1.2"))
    # Tilted Lower Right Receiving Chalice
    els.append(path("M 102 142 L 124 142 C 122 158 104 158 102 142 Z", fill="currentColor", fill_opacity="0.85", stroke="currentColor", stroke_width="1.0"))
    els.append(line(113, 155, 113, 170, stroke="currentColor", stroke_width="1.3"))
    els.append(line(105, 170, 121, 170, stroke="currentColor", stroke_width="1.3"))
    # Braided 5-Strand Living Water Stream Connecting Vessels
    for idx, dy in enumerate([-4, -2, 0, 2, 4]):
        op = 0.9 if idx == 2 else 0.55
        sw = 1.3 if idx == 2 else 0.75
        els.append(path(f"M 52 {104 + dy} C 74 {96 + dy} 88 {132 + dy} 112 {143}", fill="none", stroke="currentColor", stroke_width=f"{sw}", stroke_opacity=op))
    # Radiant Iris Blossom at Pool Base
    els.append(path("M 80 188 L 80 162", stroke="currentColor", stroke_width="1.15"))
    els.extend(botanical_leaf(80, 166, -125, length=18, width=5, fill_op=0.45))
    els.extend(botanical_leaf(80, 166, -55, length=18, width=5, fill_op=0.45))
    els.extend(botanical_leaf(80, 168, -90, length=20, width=4.5, fill_op=0.75))
    return render_svg(160, 220, "", els)


def build_card_15():
    """XV 惡魔 THE DEVIL: Inverted Pentagram Medallion, Sculpted Horns, Nocturnal Flames & Broken Chains."""
    els = shared_card_arch()
    # Celestial Inverted Pentagram Medallion
    els.append(circle(80, 84, 32, fill="currentColor", fill_opacity="0.14", stroke="currentColor", stroke_width="1.2"))
    els.append(star_polygon(80, 84, 30, 11.5, 5, 90, fill="currentColor", fill_opacity="0.3", stroke="currentColor", stroke_width="1.35"))
    # Sculpted Ornamental Horns Framing Upper Ring
    for side in [-1, 1]:
        els.append(path(f"M {80 + side * 14} 58 C {80 + side * 38} 38 {80 + side * 46} 56 {80 + side * 36} 68", fill="none", stroke="currentColor", stroke_width="1.8"))
        els.append(path(f"M {80 + side * 20} 62 C {80 + side * 36} 48 {80 + side * 40} 58 {80 + side * 32} 66", fill="none", stroke="currentColor", stroke_width="0.9", stroke_opacity="0.7"))
    # Nocturnal Candle / Torch Flames below Medallion
    for fx, fh, op in [(80, 26, 0.88), (64, 18, 0.45), (96, 18, 0.45)]:
        els.append(path(f"M {fx} {156} C {fx - 8} {156 - fh * 0.4} {fx} {156 - fh} {fx} {156 - fh} C {fx} {156 - fh} {fx + 8} {156 - fh * 0.4} {fx} {156} Z", fill="currentColor", fill_opacity=op))
    # Pedestal & Loosely Open Broken Chains
    els.append('<rect x="56" y="158" width="48" height="26" rx="2" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke_width="1.2"/>')
    for side in [-1, 1]:
        for k in range(4):
            lx = 56 + side * (10 + k * 7) if side == 1 else 56 - (10 + k * 7)
            lx = (80 + side * 24) + side * k * 6
            ly = 166 + k * 6
            els.append(ellipse(lx, ly, 4.5, 2.5, 35 * side, fill="none", stroke="currentColor", stroke_width="1.15"))
    return render_svg(160, 220, "", els)


def build_card_16():
    """XVI 高塔 THE TOWER: Masonry Battlement Tower, Forked Lightning & Dislodged Crown."""
    els = shared_card_arch()
    # Dramatic Forked Lightning Bolt from Upper Sky
    els.append(path("M 122 36 L 96 66 L 106 68 L 80 96 L 88 74 L 78 72 Z", fill="currentColor", fill_opacity="0.95", stroke="currentColor", stroke_width="0.9"))
    # Stone Tower Body with Masonry Lines & Arched Windows
    els.append(path("M 56 188 L 62 96 L 98 96 L 104 188 Z", fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.4"))
    for wy in [116, 140, 164]:
        els.append(line(62 - (wy - 96) * 0.06, wy, 98 + (wy - 96) * 0.06, wy, stroke="currentColor", stroke_width="0.75", stroke_opacity="0.55"))
    # Dual Tall Arched Windows
    els.append(path("M 74 134 L 74 114 A 6 6 0 0 1 86 114 L 86 134 Z", fill="currentColor", fill_opacity="0.75"))
    # Toppling Golden Crown Dislodged Right
    crown_d = "M 102 82 L 106 68 L 114 78 L 122 66 L 124 80 L 134 74 L 128 88 Z"
    els.append(path(crown_d, fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="1.0"))
    # Falling Sparks & Stars in Night Sky
    for sx, sy, sr in [(42, 74, 4.5), (36, 112, 3.5), (126, 122, 4.5), (132, 154, 3.2), (44, 152, 3.0)]:
        els.append(star_polygon(sx, sy, sr, sr * 0.3, 4, 0, fill="currentColor", fill_opacity="0.85"))
    els.append(line(24, 188, 136, 188, stroke="currentColor", stroke_width="1.2"))
    return render_svg(160, 220, "", els)


def build_card_17():
    """XVII 星星 THE STAR: Grand 16-Rayed North Star, 7 Companion Stars & Rippling Lotus Pool."""
    els = shared_card_arch()
    # Grand North Star Centerpiece (80, 74)
    els.append(circle(80, 74, 28, fill="currentColor", fill_opacity="0.08", stroke="currentColor", stroke_width="0.8", stroke_dasharray="2 3"))
    els.append(star_polygon(80, 74, 24, 5.5, 8, -90, fill="currentColor", fill_opacity="0.92"))
    els.append(star_polygon(80, 74, 15, 4.2, 8, -67.5, fill="currentColor", fill_opacity="0.4"))
    # 7 Delicate Companion Celestial Stars
    for sx, sy, sr in [(40, 56, 6), (120, 56, 6), (34, 92, 4.8), (126, 92, 4.8), (52, 110, 5), (108, 110, 5), (80, 40, 4.5)]:
        els.append(star_polygon(sx, sy, sr, sr * 0.28, 4, 0, fill="currentColor", fill_opacity="0.85"))
    # Tilted Grecian Amphoras Pouring Cascading Starlight Streams
    els.append(path("M 38 122 L 58 115 C 62 128 50 138 38 126 Z", fill="currentColor", fill_opacity="0.82", stroke="currentColor", stroke_width="0.9"))
    els.append(path("M 122 122 L 102 115 C 98 128 110 138 122 126 Z", fill="currentColor", fill_opacity="0.82", stroke="currentColor", stroke_width="0.9"))
    els.append(path("M 53 130 Q 43 156 54 176", fill="none", stroke="currentColor", stroke_width="1.3"))
    els.append(path("M 56 132 Q 49 154 58 176", fill="none", stroke="currentColor", stroke_width="0.75", stroke_dasharray="2 2"))
    els.append(path("M 107 130 Q 117 156 106 176", fill="none", stroke="currentColor", stroke_width="1.3"))
    els.append(path("M 104 132 Q 111 154 102 176", fill="none", stroke="currentColor", stroke_width="0.75", stroke_dasharray="2 2"))
    # Elliptical Rippling Starlight Pool
    for rx, ry, op in [(46, 10, 0.22), (32, 6.5, 0.35), (18, 3.5, 0.85)]:
        els.append(ellipse(80, 180, rx, ry, 0, fill="currentColor", fill_opacity=op * 0.4, stroke="currentColor", stroke_width="1.0", stroke_opacity=op))
    return render_svg(160, 220, "", els)


def build_card_18():
    """XVIII 月亮 THE MOON: Eclipse Moon Medallion, Dewdrops, Twin Watchtowers & Lunar Path."""
    els = shared_card_arch()
    # Grand Full & Crescent Eclipse Moon Cameo cleanly centered inside astrolabe circle
    els.append(circle(80, 74, 28, fill="currentColor", fill_opacity="0.14", stroke="currentColor", stroke_width="1.15"))
    els.extend(degree_ticks(80, 74, 28, 34, count=24, stroke_w=0.65, stroke_op=0.6))
    els.append(path(crescent_moon_d(79, 74, 23, angle_deg=180, thickness=0.72), fill="currentColor", fill_opacity="0.9", stroke="currentColor", stroke_width="0.9"))
    # Falling Golden Dewdrops (Yods)
    for dx, dy in [(56, 110), (68, 118), (80, 114), (92, 118), (104, 110)]:
        els.append(path(f"M {dx} {dy - 4} Q {dx + 3} {dy + 2} {dx} {dy + 5} Q {dx - 3} {dy + 2} {dx} {dy - 4} Z", fill="currentColor", fill_opacity="0.85"))
    # Twin Watchtowers Flanking Lower Horizon
    for tx in [26, 120]:
        els.append(f'<rect x="{tx}" y="128" width="14" height="44" fill="currentColor" fill-opacity="0.28" stroke="currentColor" stroke-width="1.05"/>')
        els.append(f'<polygon points="{tx - 2},128 {tx + 7},116 {tx + 16},128" fill="currentColor" fill-opacity="0.72"/>')
    # Winding Silver Path & Tidal Pool Waves
    els.append(path("M 80 124 Q 72 142 84 156 Q 92 168 80 184", fill="none", stroke="currentColor", stroke_width="1.2", stroke_dasharray="3 2"))
    els.append(path("M 20 182 Q 50 172 80 182 Q 110 192 140 182", fill="none", stroke="currentColor", stroke_width="1.2"))
    els.append(path("M 26 190 Q 54 182 80 190 Q 106 198 134 190", fill="none", stroke="currentColor", stroke_width="0.85", stroke_opacity="0.65"))
    return render_svg(160, 220, "", els)


def build_card_19():
    """XIX 太陽 THE SUN: 24-Rayed Baroque Sunburst Medallion & Trio of Blooming Sunflowers."""
    els = shared_card_arch()
    cx, cy = 80, 82
    # 24 Alternating Spear & Flame Rays
    for i in range(24):
        deg = i * 15
        if i % 2 == 0:
            p1 = pt(cx, cy, 24, deg - 3)
            p_tip = pt(cx, cy, 46, deg)
            p2 = pt(cx, cy, 24, deg + 3)
            els.append(f'<polygon points="{fmt_pts([p1, p_tip, p2])}" fill="currentColor" fill-opacity="0.75"/>')
        else:
            p1 = pt(cx, cy, 24, deg)
            p_mid = pt(cx, cy, 34, deg + 5)
            p_tip = pt(cx, cy, 41, deg)
            els.append(path(f"M {p1[0]} {p1[1]} Q {p_mid[0]} {p_mid[1]} {p_tip[0]} {p_tip[1]}", fill="none", stroke="currentColor", stroke_width="1.1"))
    # Radiant Solar Disk Core
    els.append(circle(cx, cy, 23, fill="currentColor", fill_opacity="0.22", stroke="currentColor", stroke_width="1.4"))
    els.append(circle(cx, cy, 15, fill="currentColor", fill_opacity="0.9"))
    # Trio of Ornate Sunflowers at Parapet
    els.append(line(24, 168, 136, 168, stroke="currentColor", stroke_width="1.2"))
    for fx, fy, fr in [(44, 150, 12), (80, 144, 15), (116, 150, 12)]:
        els.append(line(fx, fy + fr, fx, 190, stroke="currentColor", stroke_width="1.4"))
        els.extend(rose_cameo(fx, fy, radius=fr, petals=8))
        els.append(circle(fx, fy, fr * 0.42, fill="currentColor", fill_opacity="0.95"))
    return render_svg(160, 220, "", els)


def build_card_20():
    """XX 審判 JUDGEMENT: Archangel Trumpet with Banner, Soundwaves & Rising Phoenix."""
    els = shared_card_arch()
    # Celestial Angelic Herald Trumpet with curved flared bell
    els.append(path("M 36 52 Q 80 38 124 52", fill="none", stroke="currentColor", stroke_width="1.0", stroke_dasharray="2 3"))
    els.append(path("M 62 44 L 68 40 L 89 72 Q 96 76 107 72 L 95 94 Q 88 84 82 80 Z", fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="1.0"))
    els.append(circle(64, 41, 2.5, fill="currentColor", fill_opacity="0.95"))
    # Cross Banner hanging cleanly from Trumpet
    els.append('<rect x="64" y="66" width="16" height="22" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.0"/>')
    els.append(line(72, 70, 72, 84, stroke="currentColor", stroke_width="1.4"))
    els.append(line(67, 76, 77, 76, stroke="currentColor", stroke_width="1.4"))
    # Concentric Sound Vibration Arcs
    for sr in [12, 20, 28]:
        els.append(path(f"M {98 - sr * 0.4} {96 + sr * 0.5} Q {106 + sr * 0.4} {98 + sr * 0.3} {110 + sr * 0.5} {86 + sr * 0.5}", fill="none", stroke="currentColor", stroke_width="0.9", stroke_dasharray="2 2"))
    # Rising Phoenix Cameo at Center/Lower Axis (Rebirth & Awakening)
    els.extend(wing_feathers(76, 134, side=-1, scale=0.88))
    els.extend(wing_feathers(84, 134, side=1, scale=0.88))
    els.append(path("M 80 108 Q 84 128 80 156 Q 76 128 80 108 Z", fill="currentColor", fill_opacity="0.92"))
    # Lotus Sepulchre Flames at Base
    els.extend(botanical_leaf(80, 174, -125, length=18, width=5, fill_op=0.45))
    els.extend(botanical_leaf(80, 174, -55, length=18, width=5, fill_op=0.45))
    els.extend(botanical_leaf(80, 176, -90, length=22, width=5, fill_op=0.82))
    return render_svg(160, 220, "", els)


def build_card_21():
    """XXI 世界 THE WORLD: 28-Leaf Oval Laurel Wreath, Armillary Cosmic Star & 4 Corner Stars."""
    els = shared_card_arch(show_ticks=False)
    cx, cy = 80, 110
    # Woven Elliptical Laurel Wreath (14 paired leaves along ellipse)
    els.append(ellipse(cx, cy, 44, 62, 0, fill="currentColor", fill_opacity="0.06", stroke="currentColor", stroke_width="1.1"))
    els.append(ellipse(cx, cy, 38, 56, 0, fill="none", stroke="currentColor", stroke_width="0.65", stroke_dasharray="2 3"))
    for i in range(16):
        deg = i * 22.5
        if abs(deg - 90) < 12 or abs(deg - 270) < 12:
            continue
        rad = math.radians(deg)
        lx = cx + 41 * math.cos(rad)
        ly = cy + 59 * math.sin(rad)
        tan_deg = math.degrees(math.atan2(59 * math.cos(rad), -41 * math.sin(rad)))
        els.extend(botanical_leaf(lx, ly, tan_deg - 16, length=11, width=3.5, fill_op=0.65))
        els.extend(botanical_leaf(lx, ly, tan_deg + 16, length=10, width=3.2, fill_op=0.42))
    # Top & Bottom Infinity Ribbon Bows
    for by in [48, 172]:
        els.append(path(f"M {cx} {by} C {cx - 12} {by - 7} {cx - 12} {by + 7} {cx} {by} C {cx + 12} {by - 7} {cx + 12} {by + 7} {cx} {by} Z", fill="currentColor", fill_opacity="0.88", stroke="currentColor", stroke_width="0.9"))
    # Central Armillary Sphere & Radiant 8-Pointed Star Mandala
    els.append(circle(cx, cy, 22, fill="currentColor", fill_opacity="0.14", stroke="currentColor", stroke_width="1.0"))
    els.append(ellipse(cx, cy, 24, 9, 30, fill="none", stroke="currentColor", stroke_width="0.9"))
    els.append(ellipse(cx, cy, 24, 9, -30, fill="none", stroke="currentColor", stroke_width="0.9"))
    els.append(star_polygon(cx, cy, 17, 4.5, 8, -90, fill="currentColor", fill_opacity="0.92"))
    # Four Cosmic Corner Medallions
    for sx, sy in [(26, 42), (134, 42), (26, 178), (134, 178)]:
        els.append(circle(sx, sy, 6.5, fill="currentColor", fill_opacity="0.2", stroke="currentColor", stroke_width="0.8"))
        els.append(star_polygon(sx, sy, 4.8, 1.5, 4, 0, fill="currentColor", fill_opacity="0.9"))
    return render_svg(160, 220, "", els)


def main():
    card_svgs = {
        "back_spring": build_back_spring(),
        "back_summer": build_back_summer(),
        "back_autumn": build_back_autumn(),
        "back_winter": build_back_winter(),
        "card_0": build_card_0(),
        "card_1": build_card_1(),
        "card_2": build_card_2(),
        "card_3": build_card_3(),
        "card_4": build_card_4(),
        "card_5": build_card_5(),
        "card_6": build_card_6(),
        "card_7": build_card_7(),
        "card_8": build_card_8(),
        "card_9": build_card_9(),
        "card_10": build_card_10(),
        "card_11": build_card_11(),
        "card_12": build_card_12(),
        "card_13": build_card_13(),
        "card_14": build_card_14(),
        "card_15": build_card_15(),
        "card_16": build_card_16(),
        "card_17": build_card_17(),
        "card_18": build_card_18(),
        "card_19": build_card_19(),
        "card_20": build_card_20(),
        "card_21": build_card_21(),
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "js", "card-svgs.js")
    out_path = os.path.abspath(out_path)

    js_content = (
        "// Celestial Engraving & Cameo Relief SVG Assets for 22 Major Arcana & 4 Seasonal Backs\n"
        "// Generated cleanly via scripts/generate_luxury_card_svgs.py\n"
        "window.CARD_SVGS = " + json.dumps(card_svgs, indent=2, ensure_ascii=False) + ";\n"
    )

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(js_content)

    print(f"Successfully wrote {len(card_svgs)} luxury SVGs to {out_path}")
    for key, svg in card_svgs.items():
        node_count = svg.count("<path") + svg.count("<circle") + svg.count("<ellipse") + svg.count("<line") + svg.count("<polygon") + svg.count("<rect")
        print(f"  {key:14s}: {node_count:3d} vector primitives")


if __name__ == "__main__":
    main()
