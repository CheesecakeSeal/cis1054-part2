import os
from PIL import Image

print("Script started")  # Confirm script runs

from PIL import Image

def resize_image(image_path, output_path, target_size):
    try:
        with Image.open(image_path) as img:
            print(f"Opened image: {image_path} (format={img.format}, mode={img.mode})")
            img.thumbnail(target_size, Image.LANCZOS)

            # If image has transparency, composite it over white background
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                print(f"Image has transparency, converting with white background: {image_path}")
                background = Image.new("RGB", img.size, (255, 255, 255))  # white background
                background.paste(img, mask=img.split()[-1])  # paste with alpha channel as mask
                img = background
            else:
                img = img.convert("RGB")

            output_path = os.path.splitext(output_path)[0] + ".jpg"
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            print(f"Saving resized image to {output_path}")
            img.save(output_path, "JPEG")
            print(f"Resized and saved: {output_path}")

    except Exception as e:
        print(f"Failed to process {image_path}: {e}")


def process_directory(input_dir, output_dir, target_size):
    """
    Recursively traverse input_dir, resize images, and save to output_dir.
    """
    if not os.path.exists(input_dir):
        print(f"Input directory does NOT exist: {input_dir}")
        return

    print(f"Processing directory: {input_dir}")
    for root, _, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp')):
                input_path = os.path.join(root, file)
                relative_path = os.path.relpath(input_path, input_dir)
                output_path = os.path.join(output_dir, relative_path)
                print(f"Found image: {input_path} -> {output_path}")
                resize_image(input_path, output_path, target_size)

if __name__ == "__main__":
    size = (800, 800)

    # Print current working directory so you know where relative paths start
    print("Current working directory:", os.getcwd())

    process_directory("src/public/Dishes", "src/public/Dishes_converted", size)
    process_directory("src/public/Images", "src/public/Images_converted", size)

