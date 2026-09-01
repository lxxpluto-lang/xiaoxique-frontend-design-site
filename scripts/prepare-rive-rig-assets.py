#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import deque
from pathlib import Path

from PIL import Image


PROJECT_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = PROJECT_DIR / "src/static/rive-source/v3"
ATLAS_DIR = SOURCE_DIR / "atlases"
PARTS_DIR = SOURCE_DIR / "parts"


CHARACTERS = {
    "magpie": {
        "atlas": "magpie-rig-atlas-v3.png",
        "parts": [
            "body_shell", "face_patch", "eye_left", "eye_right",
            "beak_upper", "beak_lower", "wing_left", "wing_right",
            "foot_left", "foot_right", "tail_upper", "tail_lower",
            "eyelid_left", "eyelid_right", "wing_highlight", "empty",
        ],
        "keep": [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    },
    "girl": {
        "atlas": "girl-rig-atlas-v3.png",
        "parts": [
            "head_base", "beanie", "hair_front", "face_features",
            "torso", "upper_arm_left", "forearm_left", "upper_arm_right",
            "forearm_right", "thigh_left", "shin_left", "thigh_right",
            "shin_right", "braid_left", "braid_right", "green_side_panel",
        ],
        "keep": [1, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
    "woman": {
        "atlas": "woman-rig-atlas-v3.png",
        "parts": [
            "head_base", "hair_back", "hair_front", "face_features",
            "torso", "upper_arm_left", "forearm_left", "upper_arm_right",
            "forearm_right", "thigh_left", "shin_left", "thigh_right",
            "shin_right", "hand_alt_left", "hand_alt_right", "brooch",
        ],
        "keep": [3, 1, 1, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
}


def connected_components(alpha: Image.Image, threshold: int = 12):
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components: list[list[tuple[int, int]]] = []

    for y in range(height):
        for x in range(width):
            offset = y * width + x
            if visited[offset] or pixels[x, y] <= threshold:
                continue
            queue = deque([(x, y)])
            visited[offset] = 1
            component: list[tuple[int, int]] = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    if nx < 0 or ny < 0 or nx >= width or ny >= height:
                        continue
                    noffset = ny * width + nx
                    if visited[noffset] or pixels[nx, ny] <= threshold:
                        continue
                    visited[noffset] = 1
                    queue.append((nx, ny))
            components.append(component)

    return sorted(components, key=len, reverse=True)


def component_center(component: list[tuple[int, int]]) -> tuple[float, float]:
    count = len(component)
    return (
        sum(point[0] for point in component) / count,
        sum(point[1] for point in component) / count,
    )


def image_for_components(source: Image.Image, components: list[list[tuple[int, int]]]) -> Image.Image:
    output = Image.new("RGBA", source.size, (0, 0, 0, 0))
    source_pixels = source.load()
    output_pixels = output.load()
    for component in components:
        for x, y in component:
            output_pixels[x, y] = source_pixels[x, y]
    return output


def trim_with_padding(image: Image.Image, padding: int = 10) -> Image.Image:
    bbox = image.getbbox()
    if bbox is None:
        return Image.new("RGBA", (2, 2), (0, 0, 0, 0))
    cropped = image.crop(bbox)
    output = Image.new(
        "RGBA",
        (cropped.width + padding * 2, cropped.height + padding * 2),
        (0, 0, 0, 0),
    )
    output.alpha_composite(cropped, (padding, padding))
    return output


def process_character(character: str, config: dict) -> dict:
    source_path = ATLAS_DIR / config["atlas"]
    atlas = Image.open(source_path).convert("RGBA")
    components = [component for component in connected_components(atlas.getchannel("A")) if len(component) >= 12]
    assigned: list[list[list[tuple[int, int]]]] = [[] for _ in range(16)]

    for component in components:
        center_x, center_y = component_center(component)
        best_index = min(
            range(16),
            key=lambda index: (
                (center_x - ((index % 4) + 0.5) * atlas.width / 4) ** 2
                + (center_y - ((index // 4) + 0.5) * atlas.height / 4) ** 2
            ),
        )
        assigned[best_index].append(component)

    selected_by_part = []
    for index, keep_count in enumerate(config["keep"]):
        selected = sorted(assigned[index], key=len, reverse=True)[:keep_count]
        selected_by_part.append(selected)

    cleaned_atlas = image_for_components(
        atlas,
        [component for selected in selected_by_part for component in selected],
    )
    output_dir = PARTS_DIR / character
    output_dir.mkdir(parents=True, exist_ok=True)

    asset_index = []
    for index, (part_name, keep_count) in enumerate(zip(config["parts"], config["keep"])):
        part_canvas = image_for_components(atlas, selected_by_part[index])
        trimmed = trim_with_padding(part_canvas)
        part_path = output_dir / f"{index + 1:02d}-{part_name}.png"
        trimmed.save(part_path, optimize=True)
        asset_index.append(
            {
                "index": index + 1,
                "name": part_name,
                "file": str(part_path.relative_to(SOURCE_DIR)),
                "width": trimmed.width,
                "height": trimmed.height,
            }
        )

    clean_path = ATLAS_DIR / config["atlas"].replace(".png", "-clean.png")
    cleaned_atlas.save(clean_path, optimize=True)
    return {
        "character": character,
        "sourceAtlas": str(source_path.relative_to(SOURCE_DIR)),
        "cleanAtlas": str(clean_path.relative_to(SOURCE_DIR)),
        "parts": asset_index,
    }


def main() -> None:
    indexes = [process_character(name, config) for name, config in CHARACTERS.items()]
    index_path = SOURCE_DIR / "asset-index.json"
    index_path.write_text(json.dumps({"version": 3, "characters": indexes}, ensure_ascii=False, indent=2) + "\n")
    print(index_path)
    for character in CHARACTERS:
        print(PARTS_DIR / character)


if __name__ == "__main__":
    main()
