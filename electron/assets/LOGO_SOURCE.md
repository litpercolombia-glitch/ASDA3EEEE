# LITPER DESK — Logo source

Logo generado con Higgsfield/Krea z_image MCP el 2026-05-20.

## URL del PNG fuente (2048×2048)

https://d8j0ntlcm91z4.cloudfront.net/user_3D28QcEcIkW1nZovkOwqYhE6hzh/hf_20260520_214325_0929d3ef-24e8-4b4b-90df-aa0e93f106fc.png

## Prompt usado

> Logo de marca premium para LITPER DESK. Letras grandes "LP" en oro metálico
> brillante (#D4AF37 a #F4C842), tipografía serif romana elegante. Encima
> de las letras, una corona medieval ornamentada en oro con detalles rojos
> (#C0392B) en el centro y pequeñas gemas azules. Fondo gradiente azul
> marino profundo (#0A0E27 a #141B3D). Composición 1:1 centrada con margen,
> calidad alta brillo metálico, identidad de marca profesional, estilo regal.

## Pasos para convertir a .ico (cuando se descargue)

```bash
# El sandbox de generación bloquea cloudfront.net, así que se descarga manual.
# Una vez descargado a este folder como logo-source.png:

convert logo-source.png \
  -resize 256x256 \
  \( -clone 0 -resize 128x128 \) \
  \( -clone 0 -resize 64x64 \) \
  \( -clone 0 -resize 48x48 \) \
  \( -clone 0 -resize 32x32 \) \
  \( -clone 0 -resize 16x16 \) \
  -delete 0 \
  icon.ico

# Y para Linux (PNG 512x512):
convert logo-source.png -resize 512x512 icon.png

# Tray icon Windows (16x16 monocromo dorado):
convert logo-source.png -resize 16x16 -modulate 100,0,100 -fill '#D4AF37' -colorize 100 tray-icon.png
```

## Provider

Higgsfield/Krea z_image (modelo gratis, fast, stylized) accesible vía MCP
`mcp__2149f9f0-...__generate_image`.

Generation ID: `0929d3ef-24e8-4b4b-90df-aa0e93f106fc`
