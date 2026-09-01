#!/usr/bin/env python3
"""Render a cute card-switch MP4 with the magpie as the hero."""

from __future__ import annotations

import math
import subprocess
import wave
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS, DURATION = 1280, 720, 30, 17.2
ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "src" / "static"
SPRITE_DIR = STATIC / "sprites" / "continuous-v3"
BG_PATH = STATIC / "backgrounds" / "card-switch-v1" / "unified-health-island-v3.png"
OUT_DIR = STATIC / "videos"
PREVIEW_DIR = STATIC / "previews" / "card-switch-v1"


def clamp(x: float, lo=0.0, hi=1.0) -> float:
    return max(lo, min(hi, x))


def smooth(x: float) -> float:
    x = clamp(x)
    return x * x * (3 - 2 * x)


def out_back(x: float) -> float:
    x = clamp(x)
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2


def lerp(a, b, x):
    return a + (b - a) * x


def load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def trim(im: Image.Image, pad=4) -> Image.Image:
    box = im.getchannel("A").getbbox()
    if not box:
        return im
    x0, y0, x1, y1 = box
    return im.crop((max(0, x0-pad), max(0, y0-pad), min(im.width, x1+pad), min(im.height, y1+pad)))


def largest_alpha_component(im: Image.Image) -> Image.Image:
    """Keep the largest detached figure from a paired sprite."""
    alpha = np.asarray(im.getchannel("A")) > 8
    seen = np.zeros(alpha.shape, dtype=bool)
    best = []
    height, width = alpha.shape
    for yy, xx in zip(*np.nonzero(alpha & ~seen)):
        if seen[yy, xx]:
            continue
        q = deque([(int(yy), int(xx))])
        seen[yy, xx] = True
        component = []
        while q:
            y, x = q.popleft()
            component.append((y, x))
            for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
                if 0 <= ny < height and 0 <= nx < width and alpha[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx] = True
                    q.append((ny,nx))
        if len(component) > len(best):
            best = component
    mask = np.zeros(alpha.shape, dtype=np.uint8)
    for y, x in best:
        mask[y, x] = 255
    mask = Image.fromarray(mask).filter(ImageFilter.MaxFilter(3))
    result = im.copy()
    result.putalpha(Image.fromarray(np.minimum(np.asarray(im.getchannel("A")), np.asarray(mask))))
    return trim(result)


SCENES = ["baduanjin", "resistance", "singing"]
BASE_BG = load(BG_PATH)
SPRITES = {
    name: [load(SPRITE_DIR / name / f"{i:02d}.png") for i in range(1, 9)]
    for name in SCENES
}
MAGPIE = [trim(im) for im in SPRITES["singing"]]
WOMAN = [largest_alpha_component(im) for im in SPRITES["baduanjin"]]

# The fourth resistance frame gives the girl a clear receiving pose. Remove its
# separated flying bird so there is only one, much larger hero magpie.
_girl = SPRITES["resistance"][3].copy()
_girl_alpha = _girl.getchannel("A")
_cut = Image.new("L", _girl.size, 255)
ImageDraw.Draw(_cut).rectangle((178, 0, _girl.width, 265), fill=0)
_girl.putalpha(Image.fromarray(np.minimum(np.asarray(_girl_alpha), np.asarray(_cut))))
GIRL = trim(_girl)

FONT_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc"
FONT_HEAD = ImageFont.truetype(FONT_PATH, 25, index=0)
FONT_CARD = ImageFont.truetype(FONT_PATH, 18, index=0)
FONT_SMALL = ImageFont.truetype(FONT_PATH, 16)

LABELS = {
    "baduanjin": ("八段锦", "慢慢伸展", (255, 178, 102), (255, 245, 218)),
    "resistance": ("抗阻运动", "跳到手心", (255, 116, 112), (255, 229, 211)),
    "singing": ("开心唱歌", "飞起来唱", (157, 117, 244), (235, 224, 255)),
}


def fit_cover(im: Image.Image, zoom=1.0, shift=(0, 0)) -> Image.Image:
    scale = max(W / im.width, H / im.height) * zoom
    size = (round(im.width * scale), round(im.height * scale))
    resized = im.resize(size, Image.Resampling.LANCZOS)
    x = round((resized.width - W) / 2 + shift[0])
    y = round((resized.height - H) / 2 + shift[1])
    return resized.crop((x, y, x+W, y+H))


def paste_anchor(dst: Image.Image, src: Image.Image, xy, scale=1.0, angle=0.0,
                 anchor=(0.5, 1.0), opacity=1.0, squash=(1.0, 1.0)):
    if opacity <= .002:
        return
    sw = max(1, round(src.width * scale * squash[0]))
    sh = max(1, round(src.height * scale * squash[1]))
    item = src.resize((sw, sh), Image.Resampling.LANCZOS)
    if opacity < .999:
        item.putalpha(item.getchannel("A").point(lambda p: round(p*opacity)))
    ax, ay = anchor[0]*sw, anchor[1]*sh
    pad = round(max(sw, sh)*1.5)+8
    tile = Image.new("RGBA", (pad*2, pad*2))
    tile.alpha_composite(item, (round(pad-ax), round(pad-ay)))
    if abs(angle) > .02:
        tile = tile.rotate(angle, Image.Resampling.BICUBIC, center=(pad, pad))
    dst.alpha_composite(tile, (round(xy[0]-pad), round(xy[1]-pad)))


def shadow(dst: Image.Image, x, y, rx, ry, opacity=70):
    layer = Image.new("RGBA", dst.size)
    d = ImageDraw.Draw(layer)
    d.ellipse((x-rx, y-ry, x+rx, y+ry), fill=(39, 65, 59, opacity))
    dst.alpha_composite(layer.filter(ImageFilter.GaussianBlur(12)))


def hero_pose(dst, index, xy, scale, angle=0, opacity=1.0, squash=(1,1)):
    paste_anchor(dst, MAGPIE[index], xy, scale, angle, (.5, .94), opacity, squash)


def render_background(name: str, local: float) -> Image.Image:
    bg = fit_cover(BASE_BG, 1.008 + .004*math.sin(local*.42), (0, 2*math.sin(local*.35)))
    tint = Image.new("RGBA", (W, H))
    td = ImageDraw.Draw(tint, "RGBA")
    color = {"baduanjin": (255, 211, 145), "resistance": (255, 130, 116), "singing": (174, 132, 255)}[name]
    td.ellipse((270, 120, 910, 710), fill=color+(16,))
    td.rectangle((1016, 0, W, H), fill=(34, 61, 94, 32))
    bg.alpha_composite(tint.filter(ImageFilter.GaussianBlur(35)))
    return bg


def scene_fx(im: Image.Image, name: str, local: float):
    d = ImageDraw.Draw(im, "RGBA")
    if name == "baduanjin":
        for i in range(7):
            x = 365 + ((i*91 + local*19) % 500)
            y = 180 + ((i*57 + local*11) % 310)
            d.ellipse((x-3,y-2,x+3,y+2), fill=(255,221,168,110))
    elif name == "resistance":
        q = max(0, math.sin(local*math.pi*1.55))
        if q > .7:
            for angle in (-50, -20, 20, 50):
                a = math.radians(angle)
                x0, y0 = 620+math.cos(a)*150, 535+math.sin(a)*90
                x1, y1 = 620+math.cos(a)*190, 535+math.sin(a)*120
                d.line((x0,y0,x1,y1), fill=(255,170,95,int(150*q)), width=6)
    else:
        for i in range(8):
            a = local*1.1 + i*.77
            x = 585 + math.cos(a)*(165+i%2*32)
            y = 360 + math.sin(a)*(115+i%3*18)
            d.text((x,y), "♪" if i%2 else "♫", font=FONT_HEAD,
                   fill=((255,175,92,170) if i%2 else (145,99,235,175)))


def baduanjin_frame(im: Image.Image, local: float, total: float):
    enter = out_back(clamp(local/.55))
    u = clamp(local/total) * 7.999
    idx = min(7, int(u)); nxt = min(7, idx+1); mix = smooth(u-idx)
    paste_anchor(im, WOMAN[idx], (255, 634), .72, opacity=.90*enter*(1-mix if nxt != idx else 1))
    if nxt != idx:
        paste_anchor(im, WOMAN[nxt], (255, 634), .72, opacity=.90*enter*mix)

    seq = [7, 6, 1, 2, 1, 6, 7, 1]
    idx = min(7, int(clamp(local/total)*7.999))
    sway = math.sin(local*1.45)*9
    shadow(im, 610, 637, 148, 18, int(70*enter))
    hero_pose(im, seq[idx], (610+sway, 635), 1.27*enter,
              angle=-2*math.sin(local*1.1), squash=(1+.025*math.sin(local*2), 1-.018*math.sin(local*2)))
    d = ImageDraw.Draw(im, "RGBA")
    r = 190 + 13*math.sin(local*1.5)
    d.ellipse((610-r, 365-r*.42, 610+r, 365+r*.42), outline=(255,228,174,75), width=5)


def resistance_frame(im: Image.Image, local: float, total: float):
    enter = out_back(clamp(local/.55))
    bob = 5*math.sin(local*2.1)
    paste_anchor(im, GIRL, (270, 638+bob), .86*enter, opacity=.93)
    cycle = (local % 2.55) / 2.55
    if cycle < .18:
        p = smooth(cycle/.18); x,y = 445, 474-12*p; pose=0; sq=(1+.10*p,1-.10*p)
    elif cycle < .50:
        p = smooth((cycle-.18)/.32); x=lerp(445,650,p); y=474-260*math.sin(p*math.pi*.72); pose=2; sq=(.92,1.10)
    elif cycle < .78:
        p = smooth((cycle-.50)/.28); x=lerp(650,455,p); y=lerp(270,450,p)-48*math.sin(p*math.pi); pose=3 if p<.55 else 5; sq=(1,1)
    else:
        p = smooth((cycle-.78)/.22); x,y=455,lerp(450,474,p); pose=6 if p<.48 else 7; sq=(1+.14*(1-p),1-.13*(1-p))
    sc = (1.06 + .11*math.sin(math.pi*cycle))*enter
    shadow(im, x, 585 if y<420 else 515, 112, 14, int(55*enter*(.5+.5*cycle)))
    hero_pose(im, pose, (x,y), sc, angle=lerp(-6,8,cycle), squash=sq)
    d = ImageDraw.Draw(im, "RGBA")
    if .22 < cycle < .74:
        q = smooth((cycle-.22)/.52)
        points=[]
        for i in range(max(3,int(30*q))):
            v=i/29
            points.append((447+205*math.sin(v*math.pi), 466-205*math.sin(v*math.pi)))
        d.line(points, fill=(255,133,108,115), width=7)


def singing_frame(im: Image.Image, local: float, total: float):
    enter = out_back(clamp(local/.55))
    u = clamp(local/total); raw=u*7.999; idx=min(7,int(raw)); nxt=min(7,idx+1)
    p=smooth(raw-idx)
    keys=[(585,625,1.16,0),(585,620,1.22,0),(650,455,1.08,8),(800,265,.98,14),
          (1015,170,.82,20),(805,290,.97,-18),(640,545,1.08,-7),(585,625,1.18,0)]
    x0,y0,s0,a0=keys[idx]; x1,y1,s1,a1=keys[nxt]
    x,y,sc,ang=lerp(x0,x1,p),lerp(y0,y1,p),lerp(s0,s1,p)*enter,lerp(a0,a1,p)
    if y>520:
        shadow(im,x,642,138,17,int(70*enter))
    hero_pose(im, idx, (x,y), sc, ang, opacity=1-p if nxt!=idx else 1)
    if nxt != idx:
        hero_pose(im, nxt, (x,y), sc, ang, opacity=p)


def scene_frame(name: str, local: float, total: float) -> Image.Image:
    im = render_background(name, local)
    scene_fx(im, name, local)
    if name == "baduanjin":
        baduanjin_frame(im, local, total)
    elif name == "resistance":
        resistance_frame(im, local, total)
    else:
        singing_frame(im, local, total)
    return im


THUMBS = {"baduanjin": MAGPIE[1], "resistance": MAGPIE[0], "singing": MAGPIE[2]}


def add_interface(im: Image.Image, active: str, t: float):
    d = ImageDraw.Draw(im, "RGBA")
    d.rounded_rectangle((32,28,275,75), radius=23, fill=(255,255,255,221))
    d.ellipse((48,42,67,61), fill=LABELS[active][2]+(255,))
    d.text((78,39), "小喜鹊今天想玩…", font=FONT_HEAD, fill=(48,65,74,245))
    d.rounded_rectangle((44,92,190,129), radius=18, fill=LABELS[active][3]+(230,))
    d.text((59,99), LABELS[active][0], font=FONT_CARD, fill=(66,59,72,245))
    d.text((48,140), LABELS[active][1], font=FONT_SMALL, fill=(255,255,255,235),
           stroke_width=2, stroke_fill=(36,72,78,75))

    card_x, card_w, card_h = 1082, 148, 112
    ys = [128, 300, 472]
    click_times = {"baduanjin": .75, "resistance": 5.35, "singing": 10.85}
    for i, name in enumerate(SCENES):
        y = ys[i]
        selected = name == active
        click = click_times[name]
        pulse = math.sin(clamp(1-abs(t-click)/.24)*math.pi) if abs(t-click)<.24 else 0
        grow = 1+.055*pulse if selected else 1
        cx,cy=card_x+card_w/2,y+card_h/2; cw,ch=card_w*grow,card_h*grow
        d.rounded_rectangle((cx-cw/2,cy-ch/2,cx+cw/2,cy+ch/2), radius=25,
                            fill=((255,255,255,238) if selected else (255,255,255,181)),
                            outline=LABELS[name][2]+((255 if selected else 80),),
                            width=(5 if selected else 2))
        icon=THUMBS[name].copy(); icon.thumbnail((65,65),Image.Resampling.LANCZOS)
        im.alpha_composite(icon,(round(cx-icon.width/2),round(y+4)))
        tw=d.textlength(LABELS[name][0],font=FONT_CARD)
        d.text((cx-tw/2,y+80),LABELS[name][0],font=FONT_CARD,fill=(44,56,66,245))

    for start,end,target in ((.12,.75,0),(4.72,5.35,1),(10.22,10.85,2)):
        if start <= t <= end+.30:
            p=smooth((t-start)/(end-start)); x=lerp(1015,1155,p); y=lerp(660,ys[target]+55,p)
            fade=1-clamp((t-end)/.30); r=14+8*math.sin(clamp(1-abs(t-end)/.15)*math.pi)
            d.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,255,int(235*fade)),outline=(55,73,80,int(120*fade)),width=2)
            d.ellipse((x-4,y-4,x+4,y+4),fill=LABELS[SCENES[target]][2]+(int(255*fade),))
            if abs(t-end)<.15:
                rr=28+50*abs(t-end)/.15
                d.ellipse((x-rr,y-rr,x+rr,y+rr),outline=LABELS[SCENES[target]][2]+(int(170*(1-abs(t-end)/.15)),),width=4)

    d.rounded_rectangle((530,666,735,704), radius=19, fill=(255,255,255,202))
    text="点击卡片，看我表演"
    tw=d.textlength(text,font=FONT_SMALL)
    d.text((632-tw/2,675),text,font=FONT_SMALL,fill=(64,77,81,235))


def active_scene_at(t: float):
    if t < 5.4: return "baduanjin", t, 5.4
    if t < 10.9: return "resistance", t-5.4, 5.5
    return "singing", t-10.9, DURATION-10.9


def render(t: float) -> Image.Image:
    active, local, total = active_scene_at(t)
    im = scene_frame(active, local, total)
    for center in (5.4, 10.9):
        if abs(t-center) < .20:
            q=1-abs(t-center)/.20
            pop=Image.new("RGBA",im.size); pd=ImageDraw.Draw(pop,"RGBA")
            r=160+220*(1-q)
            pd.ellipse((600-r,390-r,600+r,390+r),fill=(255,255,255,int(80*q)))
            im.alpha_composite(pop.filter(ImageFilter.GaussianBlur(24)))
    add_interface(im, active, t)
    return im.convert("RGB")


def build_audio(path: Path):
    sr=44100; n=round(DURATION*sr); tt=np.arange(n)/sr
    audio=np.zeros(n,dtype=np.float64)
    for start,end,notes in ((0,5.4,(261.63,392.0)),(5.4,10.9,(293.66,440.0)),(10.9,DURATION,(329.63,493.88))):
        mask=(tt>=start)&(tt<end); local=tt[mask]-start
        env=np.minimum(1,local/.35)*np.minimum(1,(end-start-local)/.35)
        audio[mask]+=env*(.020*np.sin(2*np.pi*notes[0]*local)+.012*np.sin(2*np.pi*notes[1]*local))
    rng=np.random.default_rng(19)
    for click in (.75,5.35,10.85):
        s=int(click*sr); m=int(.12*sr); x=np.arange(m)/sr
        audio[s:s+m]+=.13*np.sin(2*np.pi*(980-520*x)*x)*np.exp(-25*x)
    for center in (5.4,10.9):
        s=int((center-.22)*sr); m=int(.44*sr); x=np.arange(m)/sr
        audio[s:s+m]+=.018*rng.normal(0,1,m)*np.sin(np.pi*x/.44)**2
    for chime in (4.65,9.95,16.1):
        for delay,freq in ((0,659.25),(.09,783.99),(.18,987.77)):
            s=int((chime+delay)*sr); m=int(.42*sr); x=np.arange(m)/sr
            audio[s:s+m]+=.045*np.sin(2*np.pi*freq*x)*np.exp(-6*x)
    pcm=(np.clip(audio,-.95,.95)*32767).astype("<i2")
    with wave.open(str(path),"wb") as wf:
        wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes(np.column_stack([pcm,pcm]).ravel().tobytes())


def main():
    OUT_DIR.mkdir(parents=True,exist_ok=True); PREVIEW_DIR.mkdir(parents=True,exist_ok=True)
    wav=OUT_DIR/"card-switch-showcase-v1.wav"
    out=OUT_DIR/"magpie-card-switch-showcase-cute-v2.mp4"
    build_audio(wav)
    cmd=["ffmpeg","-hide_banner","-loglevel","error","-y","-f","rawvideo","-pix_fmt","rgb24",
         "-s",f"{W}x{H}","-r",str(FPS),"-i","-","-i",str(wav),"-c:v","libx264","-preset","medium",
         "-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","160k","-shortest","-movflags","+faststart",str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
    assert proc.stdin
    for i in range(round(DURATION*FPS)):
        proc.stdin.write(render(i/FPS).tobytes())
    proc.stdin.close()
    if proc.wait()!=0:
        raise SystemExit("ffmpeg encode failed")
    times=[.7,2.5,5.35,7.8,10.85,13.5,16.0]
    thumbs=[render(t).resize((384,216),Image.Resampling.LANCZOS) for t in times]
    strip=Image.new("RGB",(384*4,216*2),(237,246,250))
    for i,thumb in enumerate(thumbs):
        strip.paste(thumb,((i%4)*384,(i//4)*216))
    strip.save(PREVIEW_DIR/"showcase-filmstrip-v1.jpg",quality=93)
    render(2.5).save(PREVIEW_DIR/"showcase-poster-v1.png")
    print(out)


if __name__ == "__main__":
    main()
