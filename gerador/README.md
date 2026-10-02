# Gerador do banner

`assets/banner.png` é gerado a partir de `banner/banner.html`: curvas de nível da Serra do Mucajaí (Copernicus DEM GLO-30, em `banner/dem-mucajai.js`) e a prancha de 1801 da araponga-da-amazônia (domínio público, Iconographia Zoologica, Special Collections University of Amsterdam), convertida para sépia.

Para gerar de novo, na raiz do repositório:

```sh
chromium --headless=new --disable-gpu --allow-file-access-from-files --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=2560,640 --virtual-time-budget=15000 \
  --screenshot="$PWD/assets/banner.png" "file://$PWD/gerador/banner/banner.html"
```

A fonte (Source Serif 4) vem do Google Fonts, então o comando precisa de internet.

Relevo: Produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved.
