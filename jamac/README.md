# Wizualizacja strony głównej JAMAC

Klikalny koncept redesignu jednej strony głównej JAMAC, przygotowany przez DobreStrony.nl do prezentacji klientowi. Obejmuje widok na komputer i telefon, wybór kategorii, przykładowe produkty, dobór według zastosowania oraz sekcje serwisu, wypożyczalni i kontaktu.

## Podgląd

Adres podglądu po publikacji przez istniejący workflow GitHub Pages:

https://dobrestronynl-hub.github.io/panele-dla-firm/jamac/

Adres wymaga potwierdzenia po zakończeniu wdrożenia. Lokalnie można otworzyć `index.html` w przeglądarce lub udostępnić katalog przez prosty serwer plików statycznych.

## Edycja

| Plik | Zawartość |
| --- | --- |
| `index.html` | Struktura strony, teksty, nawigacja i sekcje |
| `styles.css` | Wygląd i układ responsywny |
| `data.js` | Przykładowe produkty, ceny i odnośniki |
| `app.js` | Wyszukiwanie w podglądzie, filtry, wybór zastosowania, menu i koszyk demonstracyjny |
| `assets/` | Lokalne zdjęcia, logo, ikona i fonty |
| `sources.json` | Adresy źródłowe zdjęć i danych z JAMAC |

## Dane i działanie demonstracji

Ceny są zapisem danych odczytanych **19.11.2026**, podanym netto. Wizualizacja nie aktualizuje ich automatycznie. Aktualną cenę, dostępność i warunki zakupu należy sprawdzić w działającym sklepie JAMAC.

Zdjęcia produktów i logo pochodzą z `jamac.pl`. Ich pochodzenie oraz źródła danych zapisano w `sources.json`. Fonty są dołączone lokalnie wraz z licencją.

Wyszukiwarka i filtry działają na ograniczonym zestawie produktów w demonstracji. Koszyk umożliwia dodawanie, usuwanie i zmianę ilości; zapisuje wybór lokalnie w przeglądarce. Nie oblicza VAT ani kosztów dostawy i nie przekazuje koszyka do sklepu.

Odnośniki produktowe, kategorie i przyciski usług prowadzą do aktualnych stron `jamac.pl`. Demonstracja nie korzysta z API sklepu, nie przetwarza zamówień, nie przyjmuje płatności i nie zawiera trackerów.

Zakres kończy się na stronie głównej. Kategorie, karty produktów, formularze usługowe i finalizacja zakupu pozostają przyszłymi etapami redesignu.

## Zrzuty do oferty

W katalogu `preview/` są widoki `jamac-desktop.jpg`, `jamac-mobile.jpg` oraz `jamac-cala-strona.jpg`. Powstały w przeglądarce z działającej wersji projektu.
