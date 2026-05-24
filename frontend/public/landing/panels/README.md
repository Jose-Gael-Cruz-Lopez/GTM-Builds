# Landing panel photography

Editorial cinematic photos used as backgrounds for the 5 ScrollStack
use-case panels. Dimensions: 1600×1000 (16:10), optimized JPEG ~150–300 KB.

All current images are sourced from the Unsplash free library
(unsplash.com/license), which permits commercial and non-commercial use
without attribution. Files are cropped to focal subject and saved
progressive for fast first-paint.

| File              | Subject               | Source        |
| ----------------- | --------------------- | ------------- |
| `cafeteria.jpg`   | Barista pouring latte | Unsplash      |
| `retail.jpg`      | Boutique shop window  | Unsplash      |
| `salon.jpg`       | Hair salon interior   | Unsplash      |
| `restaurante.jpg` | Restaurant dining room| Unsplash      |
| `servicios.jpg`   | Tailor hands & fabric | Unsplash      |

When replacing with brand photography, keep the same dimensions and
prefer a single human subject or quiet interior — the panel veil
(`linear-gradient` overlay in `ScrollStackPanel.tsx`) needs the lower
half of the image to be moderately dark for white headline legibility.
