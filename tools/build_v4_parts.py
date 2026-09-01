#!/usr/bin/env python3
"""Build cut-rig raster layers from the approved V4 magpie master.

The masks intentionally overlap at joints. That overlap is the guard area Rive
needs when a wing, tail, beak, or foot rotates away from its neutral pose.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/static/rive-source/v4/master/magpie-neutral-master-v4.png"
OUT = ROOT / "src/static/rive-source/v4/parts"
PREVIEW = ROOT / "src/static/rive-source/v4/previews"


PARTS = {
    "body_core": {
        "polygon": [
            (43, 433), (48, 340), (77, 267), (136, 203), (235, 146),
            (390, 102), (470, 116), (520, 164), (543, 258), (566, 382),
            (593, 474), (625, 542), (682, 602), (741, 648), (785, 684),
            (783, 718), (745, 754), (690, 786), (625, 813), (581, 846),
            (529, 866), (443, 866), (345, 852), (250, 830), (164, 795),
            (111, 745), (75, 681), (58, 607),
        ],
        "pivot": (430, 585),
        "parent": "root",
        "z": 20,
    },
    "tail_upper": {
        "polygon": [
            (620, 626), (645, 547), (672, 454), (686, 345), (688, 247),
            (705, 151), (748, 77), (810, 31), (891, 19), (952, 34),
            (980, 57), (968, 90), (904, 142), (858, 211), (823, 301),
            (808, 416), (782, 526), (739, 598), (688, 638),
        ],
        "pivot": (657, 606),
        "parent": "tail_root",
        "z": 4,
    },
    "tail_lower": {
        "polygon": [
            (646, 650), (695, 621), (741, 574), (785, 514), (829, 417),
            (878, 338), (950, 281), (1013, 246), (1058, 247), (1082, 270),
            (1075, 300), (1020, 349), (976, 404), (940, 473), (902, 535),
            (855, 583), (810, 622), (758, 652), (706, 672),
        ],
        "pivot": (674, 628),
        "parent": "tail_root",
        "z": 5,
    },
    "wing_far": {
        "polygon": [
            (68, 555), (88, 521), (118, 507), (147, 532), (162, 575),
            (167, 616), (184, 655), (204, 697), (210, 735), (191, 758),
            (212, 785), (195, 814), (161, 802), (128, 777), (104, 743),
            (85, 700), (68, 649),
        ],
        "pivot": (129, 574),
        "parent": "chest",
        "z": 12,
    },
    "wing_near": {
        "polygon": [
            (373, 570), (386, 527), (430, 492), (481, 476), (525, 487),
            (557, 516), (576, 557), (609, 592), (657, 625), (718, 652),
            (806, 680), (817, 711), (785, 742), (809, 770), (781, 798),
            (721, 803), (740, 830), (706, 853), (645, 843), (600, 870),
            (553, 854), (500, 824), (450, 782), (412, 731), (390, 668),
        ],
        "pivot": (447, 559),
        "parent": "chest",
        "z": 30,
    },
    "beak": {
        "polygon": [
            (98, 451), (125, 420), (159, 407), (188, 420), (220, 446),
            (231, 458), (225, 486), (208, 519), (172, 535), (158, 509),
            (141, 482), (103, 470),
        ],
        "pivot": (158, 458),
        "parent": "head",
        "z": 45,
    },
    "foot_L": {
        "polygon": [
            (249, 829), (350, 828), (361, 854), (366, 886), (401, 908),
            (407, 934), (390, 954), (355, 962), (311, 961), (275, 951),
            (250, 931), (241, 904),
        ],
        "pivot": (337, 845),
        "parent": "leg_L",
        "z": 10,
    },
    "foot_R": {
        "polygon": [
            (453, 832), (535, 829), (550, 850), (552, 885), (578, 916),
            (583, 942), (562, 963), (529, 969), (492, 963), (461, 948),
            (447, 927), (448, 890),
        ],
        "pivot": (505, 848),
        "parent": "leg_R",
        "z": 11,
    },
}


def layer_from_polygon(source: Image.Image, polygon: list[tuple[int, int]]) -> Image.Image:
    mask = Image.new("L", source.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.polygon(polygon, fill=255)
    # A tiny dilation-like guard is achieved by drawing a wider outline.
    draw.line(polygon + [polygon[0]], fill=255, width=10, joint="curve")
    layer = Image.new("RGBA", source.size, (0, 0, 0, 0))
    layer.alpha_composite(source)
    layer.putalpha(Image.composite(source.getchannel("A"), Image.new("L", source.size, 0), mask))
    return layer


def tight_crop(layer: Image.Image, padding: int = 12):
    bbox = layer.getbbox()
    if not bbox:
        raise RuntimeError("Empty part mask")
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(layer.width, right + padding)
    bottom = min(layer.height, bottom + padding)
    return layer.crop((left, top, right, bottom)), (left, top, right, bottom)


def checker(size: tuple[int, int], tile: int = 18) -> Image.Image:
    bg = Image.new("RGBA", size, "#f5f2f7")
    draw = ImageDraw.Draw(bg)
    for y in range(0, size[1], tile):
        for x in range(0, size[0], tile):
            if (x // tile + y // tile) % 2:
                draw.rectangle((x, y, x + tile - 1, y + tile - 1), fill="#e8e2ed")
    return bg


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PREVIEW.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")

    manifest = {
        "version": 4,
        "canvas": {"width": source.width, "height": source.height},
        "assemblyOrigin": [0, 0],
        "notes": "All crops use original-canvas offsets; joint masks overlap by design.",
        "parts": {},
    }

    preview = checker((1280, 900), 20)
    pdraw = ImageDraw.Draw(preview)
    title_font = ImageFont.load_default(size=26)
    label_font = ImageFont.load_default(size=18)
    pdraw.text((34, 24), "MAGPIE V4 · CUT RIG PARTS", fill="#352d4f", font=title_font)

    cells = [(40, 85), (350, 85), (660, 85), (970, 85),
             (40, 485), (350, 485), (660, 485), (970, 485)]

    for (name, spec), (cx, cy) in zip(PARTS.items(), cells):
        layer = layer_from_polygon(source, spec["polygon"])
        crop, bbox = tight_crop(layer)
        path = OUT / f"{name}.png"
        crop.save(path)
        pivot_local = [spec["pivot"][0] - bbox[0], spec["pivot"][1] - bbox[1]]
        manifest["parts"][name] = {
            "file": str(path.relative_to(ROOT)),
            "canvasOffset": [bbox[0], bbox[1]],
            "size": [crop.width, crop.height],
            "pivotCanvas": list(spec["pivot"]),
            "pivotLocal": pivot_local,
            "parent": spec["parent"],
            "zIndex": spec["z"],
        }

        thumb = crop.copy()
        thumb.thumbnail((260, 310), Image.Resampling.LANCZOS)
        tile = checker((280, 330), 14)
        tile.alpha_composite(thumb, ((280 - thumb.width) // 2, (300 - thumb.height) // 2))
        preview.alpha_composite(tile, (cx, cy))
        pdraw.text((cx, cy + 338), name, fill="#4d426d", font=label_font)

    (OUT / "rig-parts-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    preview.save(PREVIEW / "magpie-cut-rig-parts-v4.png")


if __name__ == "__main__":
    main()
