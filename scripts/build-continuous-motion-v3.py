#!/usr/bin/env python3
"""Render three continuous 2.5D character animations for the UniApp demo.

The renderer deliberately uses the approved, already separated character art.
It does not redraw faces between shots, so eyes and character identity remain stable.
"""

from __future__ import annotations

import argparse
from collections import deque
from functools import lru_cache
import math
import os
import random
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


W, H = 720, 600
FPS = 30
ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "src" / "static"
V3 = STATIC / "rive-source" / "v3" / "parts"
V4 = STATIC / "rive-source" / "v4"
VIDEOS = STATIC / "videos"
PREVIEWS = STATIC / "previews" / "continuous-v3"
SPRITE_ROOT = STATIC / "sprites" / "continuous-v3"


def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def smooth(v: float) -> float:
    v = clamp(v)
    return v * v * (3.0 - 2.0 * v)


def ease_out_back(v: float) -> float:
    v = clamp(v)
    c1 = 1.70158
    c3 = c1 + 1.0
    return 1.0 + c3 * (v - 1.0) ** 3 + c1 * (v - 1.0) ** 2


def lerp(a: float, b: float, v: float) -> float:
    return a + (b - a) * v


def phase(t: float, start: float, end: float, easing=smooth) -> float:
    if end <= start:
        return 1.0
    return easing((t - start) / (end - start))


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def part(character: str, number: int, name: str) -> Image.Image:
    return load_rgba(V3 / character / f"{number:02d}-{name}.png")


ASSETS = {
    "bird": load_rgba(V4 / "master" / "magpie-neutral-master-v4.png"),
    "woman": {
        "head": part("woman", 1, "head_base"),
        "hair_back": part("woman", 2, "hair_back"),
        "hair_front": part("woman", 3, "hair_front"),
        "face": part("woman", 4, "face_features"),
        "torso": part("woman", 5, "torso"),
        "ua_l": part("woman", 6, "upper_arm_left"),
        "fa_l": part("woman", 7, "forearm_left"),
        "ua_r": part("woman", 8, "upper_arm_right"),
        "fa_r": part("woman", 9, "forearm_right"),
        "th_l": part("woman", 10, "thigh_left"),
        "sh_l": part("woman", 11, "shin_left"),
        "th_r": part("woman", 12, "thigh_right"),
        "sh_r": part("woman", 13, "shin_right"),
        "hand_l": part("woman", 14, "hand_alt_left"),
        "hand_r": part("woman", 15, "hand_alt_right"),
        "brooch": part("woman", 16, "brooch"),
    },
    "girl": {
        "head": part("girl", 1, "head_base"),
        "beanie": part("girl", 2, "beanie"),
        "hair_front": part("girl", 3, "hair_front"),
        "face": part("girl", 4, "face_features"),
        "torso": part("girl", 5, "torso"),
        "ua_l": part("girl", 6, "upper_arm_left"),
        "fa_l": part("girl", 7, "forearm_left"),
        "ua_r": part("girl", 8, "upper_arm_right"),
        "fa_r": part("girl", 9, "forearm_right"),
        "th_l": part("girl", 10, "thigh_left"),
        "sh_l": part("girl", 11, "shin_left"),
        "th_r": part("girl", 12, "thigh_right"),
        "sh_r": part("girl", 13, "shin_right"),
        "braid_l": part("girl", 14, "braid_left"),
        "braid_r": part("girl", 15, "braid_right"),
        "panel": part("girl", 16, "green_side_panel"),
    },
}


def remove_connected_light_background(im: Image.Image) -> Image.Image:
    """Remove only the light neutral background connected to a cell edge.

    The generated sheets contain a baked checkerboard.  Connectivity matters:
    white eye highlights and cream clothes are preserved because they are not
    connected to the outer checkerboard.
    """
    rgb = im.convert("RGB")
    w, h = rgb.size
    pix = rgb.load()
    seen = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def qualifies(x: int, y: int) -> bool:
        r, g, b = pix[x, y]
        return min(r, g, b) >= 218 and max(r, g, b) - min(r, g, b) <= 18

    for x in range(w):
        if qualifies(x, 0): q.append((x, 0))
        if qualifies(x, h - 1): q.append((x, h - 1))
    for y in range(h):
        if qualifies(0, y): q.append((0, y))
        if qualifies(w - 1, y): q.append((w - 1, y))

    while q:
        x, y = q.popleft()
        idx = y * w + x
        if seen[idx] or not qualifies(x, y):
            continue
        seen[idx] = 1
        if x: q.append((x - 1, y))
        if x + 1 < w: q.append((x + 1, y))
        if y: q.append((x, y - 1))
        if y + 1 < h: q.append((x, y + 1))

    rgba = rgb.convert("RGBA")
    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if v else 255 for v in seen])
    # One-pixel feather removes bright checkerboard fringes without softening art.
    alpha = alpha.filter(ImageFilter.GaussianBlur(0.55))
    rgba.putalpha(alpha)
    return rgba


def clear_small_edge_islands(im: Image.Image, max_pixels: int = 700) -> Image.Image:
    """Remove neighbouring-cell crumbs introduced by borderless sprite sheets."""
    alpha = im.getchannel("A")
    w, h = alpha.size
    ap = alpha.load()
    seen = bytearray(w*h)
    clear = []
    for y in range(h):
        for x in range(w):
            idx=y*w+x
            if seen[idx] or ap[x,y] <= 40:
                continue
            q=[(x,y)]; seen[idx]=1; points=[]; touches=False
            while q:
                xx,yy=q.pop(); points.append((xx,yy))
                touches = touches or xx==0 or yy==0 or xx==w-1 or yy==h-1
                for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0<=nx<w and 0<=ny<h:
                        ni=ny*w+nx
                        if not seen[ni] and ap[nx,ny] > 40:
                            seen[ni]=1; q.append((nx,ny))
            if touches and len(points) < max_pixels:
                clear.extend(points)
    if clear:
        for x,y in clear:
            ap[x,y]=0
        im.putalpha(alpha)
    return im


def load_sprite_cells(name: str) -> list[Image.Image]:
    sheet_path = SPRITE_ROOT / f"{name}-sprite-sheet-v3.png"
    sheet = load_rgba(sheet_path).convert("RGB")
    out_dir = SPRITE_ROOT / name
    out_dir.mkdir(parents=True, exist_ok=True)
    cells = []
    for row in range(2):
        for col in range(4):
            x0 = round(sheet.width * col / 4)
            x1 = round(sheet.width * (col + 1) / 4)
            y0 = round(sheet.height * row / 2)
            y1 = round(sheet.height * (row + 1) / 2)
            cell = clear_small_edge_islands(remove_connected_light_background(sheet.crop((x0, y0, x1, y1))))
            cells.append(cell)
            cell.save(out_dir / f"{len(cells):02d}.png")
    return cells


SPRITES = {name: load_sprite_cells(name) for name in ("baduanjin", "resistance", "singing")}


def paste_anchor(
    dst: Image.Image,
    src: Image.Image,
    xy: tuple[float, float],
    scale: float = 1.0,
    angle: float = 0.0,
    anchor: tuple[float, float] = (0.5, 0.5),
    opacity: float = 1.0,
    flip_x: bool = False,
    squash: tuple[float, float] = (1.0, 1.0),
) -> None:
    if opacity <= 0.001 or scale <= 0.001:
        return
    im = src.transpose(Image.Transpose.FLIP_LEFT_RIGHT) if flip_x else src
    sw = max(1, int(im.width * scale * squash[0]))
    sh = max(1, int(im.height * scale * squash[1]))
    im = im.resize((sw, sh), Image.Resampling.LANCZOS)
    if opacity < 0.999:
        alpha = im.getchannel("A").point(lambda p: int(p * opacity))
        im.putalpha(alpha)
    ax, ay = anchor[0] * sw, anchor[1] * sh
    pad = int(max(sw, sh) * 1.7) + 8
    tile = Image.new("RGBA", (pad * 2, pad * 2), (0, 0, 0, 0))
    tile.alpha_composite(im, (int(pad - ax), int(pad - ay)))
    if abs(angle) > 0.01:
        tile = tile.rotate(angle, resample=Image.Resampling.BICUBIC, center=(pad, pad))
    dst.alpha_composite(tile, (int(xy[0] - pad), int(xy[1] - pad)))


@lru_cache(maxsize=8)
def _gradient_background_cached(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    im = Image.new("RGB", (W, H))
    px = im.load()
    for y in range(H):
        v = y / (H - 1)
        c = tuple(int(lerp(top[i], bottom[i], v)) for i in range(3))
        for x in range(W):
            px[x, y] = c
    return im.convert("RGBA")


def gradient_background(top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    return _gradient_background_cached(top, bottom).copy()


def glow_layer(size=(W, H)) -> Image.Image:
    return Image.new("RGBA", size, (0, 0, 0, 0))


def add_glow_circle(im: Image.Image, xy, radius, color, blur=24, width=0) -> None:
    layer = glow_layer(im.size)
    d = ImageDraw.Draw(layer)
    x, y = xy
    box = (x - radius, y - radius, x + radius, y + radius)
    if width:
        d.ellipse(box, outline=color, width=width)
    else:
        d.ellipse(box, fill=color)
    if blur:
        layer = layer.filter(ImageFilter.GaussianBlur(blur))
    im.alpha_composite(layer)


def add_star(draw: ImageDraw.ImageDraw, x: float, y: float, r: float, color) -> None:
    draw.polygon([(x, y-r), (x+r*0.25, y-r*0.25), (x+r, y), (x+r*0.25, y+r*0.25),
                  (x, y+r), (x-r*0.25, y+r*0.25), (x-r, y), (x-r*0.25, y-r*0.25)], fill=color)


def stage_background(kind: str, t: float) -> Image.Image:
    if kind == "baduanjin":
        im = gradient_background((91, 73, 154), (252, 186, 151))
        d = ImageDraw.Draw(im, "RGBA")
        sun_x = 545 + 10 * math.sin(t * 0.25)
        sun_y = 112
        add_glow_circle(im, (sun_x, sun_y), 58, (255, 236, 164, 150), 42)
        d.ellipse((sun_x-18, sun_y-18, sun_x+18, sun_y+18), fill=(255, 240, 184, 230))
        for i in range(7):
            y = 330 + i * 26
            d.ellipse((-110+i*30, y, 830-i*20, y+125), fill=(230, 220, 255, 27))
        d.arc((-85, -78, 805, 704), 178, 360, fill=(255, 218, 161, 120), width=9)
        d.arc((-22, -8, 742, 615), 182, 358, fill=(174, 233, 226, 110), width=18)
        d.ellipse((55, 488, 665, 645), fill=(63, 49, 107, 80))
        d.ellipse((78, 500, 642, 625), outline=(255, 226, 174, 100), width=3)
        return im
    if kind == "resistance":
        im = gradient_background((26, 48, 89), (96, 53, 117))
        d = ImageDraw.Draw(im, "RGBA")
        d.rounded_rectangle((34, 42, 686, 554), radius=88, fill=(18, 40, 74, 110), outline=(255, 103, 138, 130), width=16)
        d.ellipse((70, 85, 275, 290), fill=(150, 228, 255, 60), outline=(144, 235, 255, 160), width=6)
        d.ellipse((465, 83, 650, 268), fill=(255, 187, 226, 35), outline=(255, 126, 192, 125), width=6)
        for x, y, c in [(530,145,(255,118,186,180)), (588,192,(105,238,255,180)), (544,236,(255,223,91,180))]:
            d.rounded_rectangle((x-17,y-17,x+17,y+17), radius=8, outline=c, width=5)
        d.rectangle((0, 472, W, H), fill=(125, 83, 162, 180))
        for y in (492, 538, 582):
            d.line((0,y,W,y), fill=(210,177,244,80), width=2)
        d.ellipse((110, 492, 610, 650), fill=(36, 22, 70, 70))
        return im
    im = gradient_background((12, 8, 57), (58, 18, 102))
    d = ImageDraw.Draw(im, "RGBA")
    for i in range(7):
        r = 150 + i * 36
        d.arc((W/2-r, H/2-r-25, W/2+r, H/2+r-25), 190, 350, fill=(174, 105, 255, 40+i*5), width=4)
    d.ellipse((88, 486, 632, 646), fill=(20, 7, 61, 190), outline=(226, 144, 255, 95), width=5)
    for i in range(28):
        x = (i * 97) % W
        y = 110 + (i * 53) % 360
        a = 40 + (i % 4) * 25
        d.ellipse((x, y, x+3+(i%3), y+3+(i%3)), fill=(223, 180, 255, a))
    return im


def limb_end(origin, angle: float, length: float) -> tuple[float, float]:
    r = math.radians(angle)
    return origin[0] + math.sin(r) * length, origin[1] + math.cos(r) * length


def render_human(
    dst: Image.Image,
    who: str,
    x: float,
    ground: float,
    scale: float,
    squat: float,
    arm_left: tuple[float, float],
    arm_right: tuple[float, float],
    lean: float = 0.0,
    bounce: float = 0.0,
) -> dict[str, tuple[float, float]]:
    a = ASSETS[who]
    yoff = squat * 42 - bounce
    hip = (x, ground - 192 * scale + yoff)
    chest = (x + lean * 8, hip[1] - 142 * scale)
    shoulder_l = (chest[0] - 72 * scale, chest[1] + 30 * scale)
    shoulder_r = (chest[0] + 72 * scale, chest[1] + 30 * scale)
    head_joint = (chest[0], chest[1] - 78 * scale)
    # The trimmed thigh sprites extend a little above their anchors.  Placing the
    # hip anchors just inside the torso removes the paper-doll gap at the waist.
    hip_l = (hip[0] - 38 * scale, hip[1] - 8 * scale)
    hip_r = (hip[0] + 38 * scale, hip[1] - 8 * scale)

    thigh_spread = 9 + squat * 18
    knee_l = limb_end(hip_l, -thigh_spread, 108 * scale)
    knee_r = limb_end(hip_r, thigh_spread, 108 * scale)
    shin_angle_l = thigh_spread * 0.35
    shin_angle_r = -thigh_spread * 0.35
    paste_anchor(dst, a["th_l"], hip_l, scale*0.53, -thigh_spread, (0.5, 0.10))
    paste_anchor(dst, a["th_r"], hip_r, scale*0.53, thigh_spread, (0.5, 0.10))
    paste_anchor(dst, a["sh_l"], knee_l, scale*0.53, shin_angle_l, (0.5, 0.10))
    paste_anchor(dst, a["sh_r"], knee_r, scale*0.53, shin_angle_r, (0.5, 0.10))

    if who == "girl":
        paste_anchor(dst, a["panel"], chest, scale*0.53, lean, (0.5, 0.16))
        sway = 3 * math.sin(bounce * 0.08)
        paste_anchor(dst, a["braid_l"], head_joint, scale*0.52, -3+sway, (0.50, 0.12))
        paste_anchor(dst, a["braid_r"], head_joint, scale*0.52, 3+sway, (0.50, 0.12))
    elif who == "woman":
        paste_anchor(dst, a["hair_back"], head_joint, scale*0.54, lean*0.3, (0.5, 0.70))

    la1, la2 = arm_left
    ra1, ra2 = arm_right
    elbow_l = limb_end(shoulder_l, la1, 102 * scale)
    elbow_r = limb_end(shoulder_r, ra1, 102 * scale)
    paste_anchor(dst, a["ua_l"], shoulder_l, scale*0.52, la1, (0.5, 0.10))
    paste_anchor(dst, a["fa_l"], elbow_l, scale*0.52, la2, (0.30 if who=="woman" else 0.28, 0.14))
    paste_anchor(dst, a["torso"], chest, scale*0.57, lean, (0.5, 0.20))
    paste_anchor(dst, a["ua_r"], shoulder_r, scale*0.52, ra1, (0.5, 0.10))
    paste_anchor(dst, a["fa_r"], elbow_r, scale*0.52, ra2, (0.70 if who=="woman" else 0.72, 0.14))

    paste_anchor(dst, a["head"], head_joint, scale*0.55, lean*0.15, (0.5, 0.72))
    if who == "woman":
        paste_anchor(dst, a["hair_front"], head_joint, scale*0.55, lean*0.15, (0.5, 0.72))
        paste_anchor(dst, a["face"], (head_joint[0], head_joint[1]-11*scale), scale*0.55, lean*0.15, (0.5, 0.58))
        paste_anchor(dst, a["brooch"], (chest[0], chest[1]+25*scale), scale*0.48, lean, (0.5,0.5))
    else:
        paste_anchor(dst, a["hair_front"], head_joint, scale*0.55, lean*0.15, (0.5, 0.72))
        paste_anchor(dst, a["beanie"], (head_joint[0], head_joint[1]-10*scale), scale*0.55, lean*0.15, (0.5, 0.74))
        paste_anchor(dst, a["face"], (head_joint[0], head_joint[1]-8*scale), scale*0.55, lean*0.15, (0.5, 0.58))

    hand_l = limb_end(elbow_l, la2, 92 * scale)
    hand_r = limb_end(elbow_r, ra2, 92 * scale)
    return {"hand_l": hand_l, "hand_r": hand_r, "head": head_joint, "chest": chest}


def render_bird(
    dst: Image.Image,
    x: float,
    y: float,
    scale: float,
    angle: float = 0.0,
    squash=(1.0, 1.0),
    opacity: float = 1.0,
    flip: bool = False,
) -> None:
    # Bottom-centre anchor keeps landing contacts stable during squash/stretch.
    paste_anchor(dst, ASSETS["bird"], (x, y), scale, angle, (0.50, 0.96), opacity, flip, squash)


def add_motion_arc(im: Image.Image, points, color=(255, 211, 109, 190), width=8, blur=9) -> None:
    layer = glow_layer(im.size)
    d = ImageDraw.Draw(layer, "RGBA")
    d.line(points, fill=color, width=width, joint="curve")
    glow = layer.filter(ImageFilter.GaussianBlur(blur))
    im.alpha_composite(glow)
    im.alpha_composite(layer)


def render_baduanjin(t: float) -> Image.Image:
    im = stage_background("baduanjin", t)
    d = ImageDraw.Draw(im, "RGBA")
    loop = t % 6.8
    if loop < 0.8:
        p = phase(loop, 0, 0.8); arm = lerp(8, 28, p); fore = lerp(-10, -34, p)
    elif loop < 2.2:
        p = phase(loop, 0.8, 2.2); arm = lerp(28, 72, p); fore = lerp(-34, 20, p)
    elif loop < 3.7:
        p = phase(loop, 2.2, 3.7); arm = lerp(72, 122, p); fore = lerp(20, 52, p)
    elif loop < 5.2:
        p = phase(loop, 3.7, 5.2, ease_out_back); arm = lerp(122, 165, p); fore = lerp(52, 172, p)
    else:
        p = phase(loop, 5.2, 6.8); arm = lerp(165, 8, p); fore = lerp(172, -10, p)
    breath = math.sin(loop * math.pi * 2 / 3.4)
    squat = 0.13 * (1-math.cos(loop*math.pi*2/6.8))
    # Energy ribbons move before the body reaches the pose, improving anticipation.
    for k in range(3):
        rr = 175 + k*26 + 8*math.sin(loop*2+k)
        d.arc((180-rr, 295-rr, 180+rr, 295+rr), 210+arm*0.25, 332+arm*0.35,
              fill=(216, 190-k*18, 255, 75-k*12), width=5)
    render_human(im, "woman", 285, 538, 0.80, squat, (-arm, -fore), (arm, fore), lean=breath*0.7, bounce=breath*1.8)
    bird_y = 500 - 16*math.sin(loop*math.pi*2/3.4)
    bird_ang = -5*math.sin(loop*math.pi*2/3.4)
    bird_s = 0.205 * (1 + 0.025*breath)
    render_bird(im, 535, bird_y, bird_s, bird_ang, (1-0.05*abs(breath), 1+0.06*abs(breath)))
    # Wing-like aura mirrors the woman's arms without altering the approved bird face.
    aura = glow_layer()
    ad = ImageDraw.Draw(aura, "RGBA")
    wing_open = clamp((arm-50)/110)
    for side in (-1,1):
        x0,y0=535,420
        x1=x0+side*(45+70*wing_open); y1=y0-(8+95*wing_open)
        ad.arc((min(x0,x1)-28, min(y0,y1)-18, max(x0,x1)+28, max(y0,y1)+54),
               190 if side<0 else 10, 330 if side<0 else 150, fill=(255,229,160,105), width=7)
    im.alpha_composite(aura.filter(ImageFilter.GaussianBlur(8)))
    if 4.55 < loop < 5.6:
        q = math.sin(phase(loop,4.55,5.6)*math.pi)
        add_glow_circle(im, (410,300), 118+35*q, (255,224,142,int(80*q)), 24, 8)
        dd=ImageDraw.Draw(im,"RGBA")
        for i in range(8):
            a=i*math.pi/4+loop
            add_star(dd,410+math.cos(a)*(125+25*q),300+math.sin(a)*(85+18*q),5+4*q,(255,240,183,int(180*q)))
    return im.convert("RGB")


def resistance_state(loop: float):
    squat = 0.0
    if loop < 1.3:
        squat = 0.72 * phase(loop,0,1.3)
    elif loop < 1.75:
        squat = lerp(0.72,0.15,phase(loop,1.3,1.75,ease_out_back))
    elif loop < 4.1:
        squat = 0.15
    elif loop < 4.55:
        squat = lerp(0.15,0.62,phase(loop,4.1,4.55))
    elif loop < 5.15:
        squat = lerp(0.62,0.0,phase(loop,4.55,5.15,ease_out_back))
    return squat


def render_resistance(t: float) -> Image.Image:
    im = stage_background("resistance", t)
    loop=t%6.0
    squat=resistance_state(loop)
    lift=phase(loop,0.95,1.7)
    celebrate=phase(loop,4.75,5.45,ease_out_back)*(1-phase(loop,5.5,6.0))
    arm_base=76+15*lift
    fore_base=-76+8*lift
    pts=render_human(im,"girl",300,540,0.78,squat,(-arm_base,-fore_base),(arm_base,fore_base),lean=-2*lift,bounce=4*celebrate)
    palm=((pts["hand_l"][0]+pts["hand_r"][0])/2,(pts["hand_l"][1]+pts["hand_r"][1])/2)
    # A single Bezier-like continuous flight path: palms -> apex -> palms.
    if loop < 1.45:
        q=phase(loop,0,1.45)
        bx=palm[0]+18; by=palm[1]-12+10*q
        sy=1-0.16*q; sx=1+0.10*q; ang=-3*q
    elif loop < 2.65:
        q=phase(loop,1.45,2.65)
        bx=lerp(palm[0]+18,535,q)
        by=lerp(palm[1]-12,142,q)-110*math.sin(q*math.pi)
        sx=lerp(1.12,0.96,q); sy=lerp(1.18,0.96,q); ang=lerp(4,18,q)
    elif loop < 4.25:
        q=phase(loop,2.65,4.25)
        bx=lerp(535,palm[0]+18,q)
        by=lerp(142,palm[1]-12,q)-65*math.sin(q*math.pi)
        sx=1.0; sy=1.03; ang=lerp(18,-6,q)
    elif loop < 4.65:
        q=phase(loop,4.25,4.65,ease_out_back)
        bx=palm[0]+18; by=palm[1]-12+10*math.sin(q*math.pi)
        sx=lerp(1.12,0.96,q); sy=lerp(0.76,1.05,q); ang=lerp(-6,0,q)
    else:
        q=phase(loop,4.65,6.0)
        bx=palm[0]+18+3*math.sin(loop*8); by=palm[1]-12-6*math.sin(loop*7)
        sx=1+0.03*math.sin(loop*9); sy=1+0.04*math.sin(loop*9); ang=3*math.sin(loop*6)
    # Draw the flight path before the bird.
    if 1.25 < loop < 4.45:
        q=phase(loop,1.25,4.45)
        arc=[]
        for i in range(28):
            u=i/27
            arc.append((palm[0]+18+(535-palm[0]-18)*u, palm[1]-20-220*math.sin(u*math.pi)))
        visible=max(3,int(len(arc)*q))
        add_motion_arc(im,arc[:visible],(212,150,255,145),8,10)
    render_bird(im,bx,by,0.105,ang,(sx,sy))
    d=ImageDraw.Draw(im,"RGBA")
    # Floor impact rings and achievement burst.
    if 4.10 < loop < 4.85:
        q=phase(loop,4.10,4.85)
        for k in range(3):
            r=40+q*(95+k*24)
            d.ellipse((palm[0]-r,510-r*0.18,palm[0]+r,510+r*0.18),outline=(255,216,105,int(180*(1-q))),width=5)
    if celebrate>0.02:
        for i in range(14):
            a=i*math.pi*2/14
            rad=75+90*celebrate
            x=470+math.cos(a)*rad; y=270+math.sin(a)*rad
            add_star(d,x,y,4+4*celebrate,(255,220 if i%2 else 126,130 if i%2 else 240,int(210*celebrate)))
    return im.convert("RGB")


def render_singing(t: float) -> Image.Image:
    im=stage_background("singing",t)
    loop=t%5.2
    d=ImageDraw.Draw(im,"RGBA")
    # Pulsing equalizer and spotlight are continuous even while the bird exits frame.
    for i in range(26):
        x=55+i*24
        amp=(0.5+0.5*math.sin(loop*6+i*0.8))
        h=18+amp*64
        d.rounded_rectangle((x,468-h,x+10,468),radius=5,fill=(151+i*3,96,255,int(75+amp*65)))
    cone=glow_layer(); cd=ImageDraw.Draw(cone,"RGBA")
    cd.polygon([(280,0),(440,0),(595,500),(125,500)],fill=(210,166,255,35))
    im.alpha_composite(cone.filter(ImageFilter.GaussianBlur(28)))

    if loop < 0.75:
        q=phase(loop,0,0.75); x=360; y=487+10*q; sc=0.205; sx=1+0.11*q; sy=1-0.15*q; ang=-4*q; op=1
    elif loop < 1.35:
        q=phase(loop,0.75,1.35,ease_out_back); x=lerp(360,395,q); y=lerp(497,320,q); sc=lerp(0.205,0.23,q); sx=lerp(1.11,0.94,q); sy=lerp(0.85,1.14,q); ang=lerp(-4,10,q); op=1
    elif loop < 2.05:
        q=phase(loop,1.35,2.05); x=lerp(395,520,q)+35*math.sin(q*math.pi); y=lerp(320,-150,q); sc=lerp(0.23,0.17,q); sx=1; sy=1; ang=lerp(10,23,q); op=1
    elif loop < 2.55:
        q=phase(loop,2.05,2.55); x=lerp(520,790,q); y=lerp(-150,-210,q); sc=lerp(0.17,0.10,q); sx=1; sy=1; ang=23; op=1-q
    elif loop < 3.05:
        q=phase(loop,2.55,3.05); x=lerp(790,650,q); y=lerp(-120,135,q); sc=lerp(0.11,0.17,q); sx=1; sy=1; ang=lerp(-28,-14,q); op=q
    elif loop < 3.65:
        q=phase(loop,3.05,3.65,ease_out_back); x=lerp(650,360,q)-50*math.sin(q*math.pi); y=lerp(135,487,q); sc=lerp(0.17,0.215,q); sx=lerp(1,1.10,q); sy=lerp(1,0.78,q); ang=lerp(-14,0,q); op=1
    elif loop < 4.25:
        q=phase(loop,3.65,4.25,ease_out_back); x=360; y=487-18*math.sin(q*math.pi); sc=0.215; sx=lerp(1.10,0.98,q); sy=lerp(0.78,1.04,q); ang=lerp(0,-5,q); op=1
    else:
        q=phase(loop,4.25,5.2); x=360+4*math.sin(loop*7); y=487-7*math.sin(loop*8); sc=0.205; sx=1+0.025*math.sin(loop*9); sy=1+0.035*math.sin(loop*9); ang=-5+5*q; op=1

    # Screen-breaking golden trail, rendered along the same continuous path.
    if 0.85 < loop < 3.6:
        trail=[]
        for i in range(36):
            u=i/35
            trail.append((360+300*u+85*math.sin(u*math.pi*1.3),487-610*u))
        if loop < 2.2:
            count=int(3+phase(loop,0.85,2.2)*33)
            add_motion_arc(im,trail[:count],(255,203,93,175),10,13)
        else:
            add_motion_arc(im,trail,(255,203,93,int(175*(1-phase(loop,2.2,3.6)))),10,13)

    render_bird(im,x,y,sc,ang,(sx,sy),op)
    d=ImageDraw.Draw(im,"RGBA")
    # Notes orbit, then follow the bird beyond the card boundary.
    notes=["♪","♫","♪","♬"]
    try:
        font=None
        font_path="/System/Library/Fonts/PingFang.ttc"
        from PIL import ImageFont
        font=ImageFont.truetype(font_path,30)
    except Exception:
        font=None
    for i,n in enumerate(notes):
        a=loop*1.8+i*math.pi/2
        nx=x+math.cos(a)*(90+i*8); ny=y-90+math.sin(a)*(45+i*5)
        d.text((nx,ny),n,font=font,fill=((255,188,80,220) if i%2 else (194,132,255,230)))
    if 3.55 < loop < 4.6:
        q=math.sin(phase(loop,3.55,4.6)*math.pi)
        for i in range(12):
            a=i*math.pi/6
            add_star(d,360+math.cos(a)*(90+75*q),350+math.sin(a)*(70+60*q),5+5*q,(255,226,126,int(220*q)))
    return im.convert("RGB")


def paste_pose_pair(
    im: Image.Image,
    name: str,
    loop: float,
    duration: float,
    xy: tuple[float, float],
    scale: float,
    angle: float = 0.0,
    anchor=(0.5, 1.0),
    squash=(1.0, 1.0),
) -> tuple[int, float]:
    segment = duration / 8.0
    index = min(7, int(loop / segment))
    local = (loop - index * segment) / segment
    # Keep each authored pose readable, then ease through a short controlled mix.
    mix = 0.0 if index == 7 else smooth(clamp((local - 0.82) / 0.18))
    nxt = (index + 1) % 8
    if mix < 0.995:
        paste_anchor(im, SPRITES[name][index], xy, scale, angle, anchor, 1.0 - mix, squash=squash)
    if mix > 0.005:
        paste_anchor(im, SPRITES[name][nxt], xy, scale, angle, anchor, mix, squash=squash)
    return index, mix


def render_baduanjin_sprites(t: float) -> Image.Image:
    duration = 6.8
    loop = t % duration
    im = stage_background("baduanjin", loop)
    d = ImageDraw.Draw(im, "RGBA")
    breath = math.sin(loop * math.pi * 2 / duration)
    push = 1.0 + 0.018 * math.sin(loop * math.pi / duration)
    # The same ribbon travels through every pose, visually connecting the shots.
    for k in range(3):
        r = 128 + k * 28 + 9 * math.sin(loop * 1.8 + k)
        start = 195 + loop * 18 + k * 13
        d.arc((360-r, 310-r*0.72, 360+r, 310+r*0.72), start, start+178,
              fill=(222, 182+k*10, 255, 82-k*13), width=5)
    paste_pose_pair(im, "baduanjin", loop, duration, (360, 565 - 3 * breath), 1.20 * push,
                    angle=0.5 * breath, squash=(1.0 - 0.01 * breath, 1.0 + 0.012 * breath))
    if 3.8 < loop < 5.8:
        q = math.sin(phase(loop, 3.8, 5.8) * math.pi)
        add_glow_circle(im, (360, 276), 112 + 46 * q, (255, 221, 135, int(92*q)), 23, 7)
        dd = ImageDraw.Draw(im, "RGBA")
        for i in range(10):
            a = i * math.tau / 10 + loop * 0.6
            add_star(dd, 360+math.cos(a)*(130+35*q), 285+math.sin(a)*(95+22*q), 4+5*q,
                     (255, 238, 174, int(195*q)))
    return im.convert("RGB")


def render_resistance_sprites(t: float) -> Image.Image:
    duration = 6.0
    loop = t % duration
    im = stage_background("resistance", loop)
    d = ImageDraw.Draw(im, "RGBA")
    pulse = math.sin(loop * math.tau / duration)
    # Continuous launch trail; its head advances as the bird rises and returns.
    if 1.75 < loop < 4.65:
        q = phase(loop, 1.75, 4.65)
        arc = []
        for i in range(42):
            u = i / 41
            arc.append((405 + 185*u, 365 - 235*math.sin(u*math.pi)))
        if q < 0.58:
            count = max(3, int(42 * q / 0.58))
            add_motion_arc(im, arc[:count], (210, 145, 255, 170), 9, 12)
        else:
            add_motion_arc(im, arc, (210, 145, 255, int(170*(1-(q-0.58)/0.42))), 9, 12)
    index, mix = paste_pose_pair(im, "resistance", loop, duration, (360, 585), 1.04,
                                 angle=0.4*pulse, squash=(1.0-0.008*pulse, 1.0+0.01*pulse))
    # Squat depth gauge and landing ripple make the resistance action unmistakable.
    squat_q = math.sin(clamp(loop/2.15)*math.pi) if loop < 2.15 else 0
    if squat_q > 0.01:
        d.rounded_rectangle((70, 205, 91, 435), radius=10, fill=(15,24,60,150), outline=(126,232,255,130), width=2)
        y0 = 425 - 190 * squat_q
        d.rounded_rectangle((74, y0, 87, 431), radius=6, fill=(108,231,255,190))
    if 4.25 < loop < 5.05:
        q = phase(loop, 4.25, 5.05)
        for k in range(3):
            r = 45 + q * (75 + k*28)
            d.ellipse((360-r, 515-r*0.17, 360+r, 515+r*0.17),
                      outline=(255,219,104,int(190*(1-q))), width=5)
    if 5.0 < loop < 5.9:
        q = math.sin(phase(loop,5.0,5.9)*math.pi)
        for i in range(14):
            a=i*math.tau/14
            add_star(d,360+math.cos(a)*(145+60*q),290+math.sin(a)*(105+45*q),4+4*q,
                     (255,150 if i%2 else 226,215 if i%2 else 105,int(210*q)))
    return im.convert("RGB")


SINGING_TRIMMED = []
for _cell in SPRITES["singing"]:
    _bbox = _cell.getchannel("A").getbbox()
    SINGING_TRIMMED.append(_cell.crop(_bbox) if _bbox else _cell)


def render_singing_sprites(t: float) -> Image.Image:
    duration = 5.2
    loop = t % duration
    im = stage_background("singing", loop)
    d = ImageDraw.Draw(im, "RGBA")
    for i in range(28):
        x = 38 + i * 24
        amp = 0.5 + 0.5 * math.sin(loop*6.4 + i*0.77)
        bar_h = 14 + amp*72
        d.rounded_rectangle((x, 478-bar_h, x+10, 478), radius=5,
                            fill=(158+i*2, 91, 255, int(70+amp*85)))

    segment = duration / 8
    idx = min(7, int(loop/segment))
    local = (loop-idx*segment)/segment
    mix = 0.0 if idx == 7 else smooth(clamp((local-0.82)/0.18))
    nxt = (idx+1)%8

    # Root path deliberately leaves the 720x600 artboard, then re-enters.
    keys = [
        (360, 500, 0.64, 0, 1), (360, 500, 0.66, 0, 1),
        (405, 370, 0.62, 8, 1), (565, 110, 0.54, 18, 1),
        (790, -70, 0.42, 28, 0), (675, 115, 0.48, -22, 1),
        (390, 500, 0.62, -7, 1), (360, 500, 0.66, 0, 1), (360,500,0.64,0,1)
    ]
    x0,y0,s0,a0,o0=keys[idx]; x1,y1,s1,a1,o1=keys[idx+1]
    u=smooth(local)
    x,y,sc,ang,op=(lerp(x0,x1,u),lerp(y0,y1,u),lerp(s0,s1,u),lerp(a0,a1,u),lerp(o0,o1,u))
    bob=4*math.sin(loop*8)
    if mix < 0.995:
        paste_anchor(im,SINGING_TRIMMED[idx],(x,y+bob),sc,ang,(0.5,0.94),(1-mix)*op)
    if mix > 0.005:
        paste_anchor(im,SINGING_TRIMMED[nxt],(x,y+bob),sc,ang,(0.5,0.94),mix*op)

    if 0.95 < loop < 3.95:
        q=phase(loop,0.95,3.95)
        trail=[]
        for i in range(46):
            v=i/45
            trail.append((360+300*v+75*math.sin(v*math.pi),490-610*v))
        if q < 0.62:
            add_motion_arc(im,trail[:max(3,int(46*q/0.62))],(255,199,82,190),10,14)
        else:
            add_motion_arc(im,trail,(255,199,82,int(190*(1-(q-.62)/.38))),10,14)

    try:
        from PIL import ImageFont
        font=ImageFont.truetype("/System/Library/Fonts/PingFang.ttc",31)
    except Exception:
        font=None
    for i,note in enumerate(("♪","♫","♪","♬","♫")):
        a=loop*1.9+i*math.tau/5
        nx=360+math.cos(a)*(118+i*9); ny=310+math.sin(a)*(80+i*5)-18*loop
        d.text((nx,ny),note,font=font,fill=((255,190,79,225) if i%2 else (197,133,255,230)))
    if 4.1 < loop < 5.0:
        q=math.sin(phase(loop,4.1,5.0)*math.pi)
        for i in range(14):
            a=i*math.tau/14
            add_star(d,360+math.cos(a)*(105+70*q),355+math.sin(a)*(82+48*q),4+5*q,
                     (255,229,133,int(225*q)))
    return im.convert("RGB")


SCENES = {
    "baduanjin": (6.8, render_baduanjin_sprites),
    "resistance": (6.0, render_resistance_sprites),
    "singing": (5.2, render_singing_sprites),
}


def encode_scene(name: str, duration: float, renderer, preview_only=False) -> Path:
    VIDEOS.mkdir(parents=True, exist_ok=True)
    PREVIEWS.mkdir(parents=True, exist_ok=True)
    out=VIDEOS/f"magpie-{name}-continuous-v3.mp4"
    frame_count=int(round(duration*FPS))
    preview_times=[0.0,duration*0.18,duration*0.38,duration*0.58,duration*0.78,duration-1/FPS]
    thumbs=[]
    for pt in preview_times:
        thumbs.append(renderer(pt).resize((360,300),Image.Resampling.LANCZOS))
    strip=Image.new("RGB",(360*3,300*2),(20,20,30))
    for i,thumb in enumerate(thumbs):
        strip.paste(thumb,((i%3)*360,(i//3)*300))
    strip.save(PREVIEWS/f"{name}-filmstrip-v3.jpg",quality=92)
    renderer(0).save(PREVIEWS/f"{name}-poster-v3.png")
    if preview_only:
        return out
    cmd=[
        "ffmpeg","-hide_banner","-loglevel","error","-y",
        "-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-",
        "-an","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
        "-movflags","+faststart",str(out)
    ]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    assert proc.stdin is not None
    for index in range(frame_count):
        proc.stdin.write(renderer(index/FPS).tobytes())
    proc.stdin.close()
    if proc.wait()!=0:
        raise SystemExit(f"ffmpeg failed for {name}")
    return out


def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument("scenes", nargs="*", choices=sorted(SCENES))
    parser.add_argument("--preview-only",action="store_true")
    args=parser.parse_args()
    selected=args.scenes or list(SCENES)
    for name in selected:
        duration,renderer=SCENES[name]
        print(encode_scene(name,duration,renderer,args.preview_only))


if __name__=="__main__":
    main()
