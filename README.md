# Boykot Rehberi PWA v2

## Özellikler
- Telefonda uygulama gibi çalışır
- Hızlı marka arama
- Boykot / Dikkat / Alternatif / İnceleniyor filtreleri
- Ana firma ve kategori listeleri
- Detay penceresi
- Çevrimdışı çalışma
- Veriler `data.json` dosyasından güncellenir

## GitHub Pages
1. Bu klasördeki dosyaları GitHub repo ana dizinine yükle.
2. Settings → Pages → Deploy from branch → main seç.
3. Verilen linki telefonda aç.
4. “Ana ekrana ekle” seç.

## Marka ekleme
`data.json` dosyasına şu formatta yeni kayıt ekle:

```json
{
  "marka": "Yeni Marka",
  "anaFirma": "Ana Firma",
  "durum": "boykot",
  "kod": "A2",
  "kategori": "Temizlik",
  "alternatif": "Alternatif marka",
  "kaynak": "https://...",
  "not": "Açıklama"
}
```

Durum değerleri:
- boykot
- dikkat
- alternatif
- inceleniyor
