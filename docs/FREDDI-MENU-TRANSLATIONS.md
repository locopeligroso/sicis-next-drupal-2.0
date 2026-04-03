# Menu — Traduzioni mancanti

> Queste diciture sono attualmente hardcoded nel frontend (`messages/*.json`).
> Solo IT e EN sono tradotte — DE, FR, ES, RU hanno il fallback inglese.
> Servono le traduzioni corrette per tutte le lingue, idealmente gestite da CMS (campo description sul menu Drupal).

## 1. Titoli sezione mega-menu

Sono le descrizioni sotto i 4 tab principali del mega-menu (Explore, Filter&Find, Projects, Info).

| Chiave             | IT                      | EN                      | DE      | FR      | ES      | RU      |
| ------------------ | ----------------------- | ----------------------- | ------- | ------- | ------- | ------- |
| Explore (desc)     | L'Universo di Sicis     | The Universe of Sicis   | **???** | **???** | **???** | **???** |
| Filter&Find (desc) | Superfici & Prodotti    | Surfaces & Products     | **???** | **???** | **???** | **???** |
| Projects (desc)    | Portfolio & Ispirazione | Portfolio & Inspiration | **???** | **???** | **???** | **???** |
| Info (desc)        | Corporate & Servizi     | Corporate & Services    | **???** | **???** | **???** | **???** |

## 2. Sottovoci Filter&Find

Descrizioni delle voci nel mega-menu "Filter&Find" (prodotti, cataloghi, ecc.)

| Voce                 | IT                       | EN                         | DE      | FR      | ES      | RU      |
| -------------------- | ------------------------ | -------------------------- | ------- | ------- | ------- | ------- |
| Mosaico (desc)       | Tutti i prodotti mosaico | All mosaic products        | **???** | **???** | **???** | **???** |
| Vetrite (desc)       | Lastre vetro decorativo  | Decorative glass slabs     | **???** | **???** | **???** | **???** |
| Arredo (desc)        | Mobili e complementi     | Furniture and accessories  | **???** | **???** | **???** | **???** |
| Tessili (desc)       | Tessuti e rivestimenti   | Fabrics and coverings      | **???** | **???** | **???** | **???** |
| Illuminazione (desc) | Lampade e sospensioni    | Lamps and suspensions      | **???** | **???** | **???** | **???** |
| Cataloghi            | Libreria cataloghi       | Catalogue library          | **???** | **???** | **???** | **???** |
| Certificazioni       | Certificazioni e manuali | Certifications and manuals | **???** | **???** | **???** | **???** |
| Soluzioni            | Soluzioni espositive     | Display solutions          | **???** | **???** | **???** | **???** |
| Tutorial             | Video tutorial           | Video tutorial             | **???** | **???** | **???** | **???** |
| Approfondimento      | Approfondimento          | In-depth analysis          | **???** | **???** | **???** | **???** |

## 3. Sottovoci Projects

| Voce                   | IT                               | EN                                   | DE      | FR      | ES      | RU      |
| ---------------------- | -------------------------------- | ------------------------------------ | ------- | ------- | ------- | ------- |
| Progetti               | Progetti                         | Projects                             | **???** | **???** | **???** | **???** |
| Progetti (desc)        | Le realizzazioni SICIS nel mondo | SICIS projects worldwide             | **???** | **???** | **???** | **???** |
| Ambienti               | Ambienti                         | Environments                         | **???** | **???** | **???** | **???** |
| Ambienti (desc)        | Ispirazioni per ogni spazio      | Inspiration for every space          | **???** | **???** | **???** | **???** |
| Inspiration            | Inspiration                      | Inspiration                          | **???** | **???** | **???** | **???** |
| Inspiration (desc)     | Tendenze e idee dal blog SICIS   | Trends and ideas from the SICIS blog | **???** | **???** | **???** | **???** |
| Interior Design        | Interior Design                  | Interior Design                      | **???** | **???** | **???** | **???** |
| Interior Design (desc) | Progettazione personalizzata     | Custom design service                | **???** | **???** | **???** | **???** |

## 4. Sottovoci Info

| Voce             | IT                                  | EN                             | DE      | FR      | ES      | RU      |
| ---------------- | ----------------------------------- | ------------------------------ | ------- | ------- | ------- | ------- |
| Cataloghi (desc) | Sfoglia e scarica i cataloghi       | Browse and download catalogues | **???** | **???** | **???** | **???** |
| Contatti (desc)  | Scrivici o trova il rivenditore     | Write to us or find a dealer   | **???** | **???** | **???** | **???** |
| Showroom (desc)  | I nostri spazi espositivi nel mondo | Our showrooms worldwide        | **???** | **???** | **???** | **???** |
| Professional     | Professional                        | Professional                   | **???** | **???** | **???** | **???** |

---

**Totale: 26 diciture x 4 lingue mancanti = 104 traduzioni da fornire.**

Opzioni:

1. **CMS (consigliato):** popolare il campo `description` su ogni voce di menu Drupal, per ogni lingua. Il frontend lo legge automaticamente.
2. **Foglio traduzioni:** compilare le colonne DE/FR/ES/RU qui sopra e le inseriamo nei file `messages/*.json`.
