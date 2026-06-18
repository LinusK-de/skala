# Skala

**Notentracker für Schüler.** Skala begleitet dich über deine ganze Schullaufbahn
und passt sich deiner Schulform an: Du legst **Abschnitte** an (z. B. Realschule
bis Klasse 10, danach gymnasiale Oberstufe 11–13), und jeder Abschnitt bringt
seine eigene **Notenskala** mit — `1–6 mit Tendenzen` oder `0–15 Punkte`. Du
trägst Noten pro Fach ein (Klausur/Schulaufgabe, mündlich, Test, Projekt …,
gewichtet), und Skala zeigt dir verlässliche **Durchschnitte** je Fach, Halbjahr
und Stufe, beantwortet „Was brauche ich in der nächsten Klausur für mein Ziel?"
und zeichnet schöne Verlaufs-Grafiken.

- **Local-first** — alle Daten liegen auf deinem Gerät (expo-sqlite + Drizzle).
  Kein Account, kein Login, kein Backend.
- **Datensicherung inklusive** — JSON-Export/-Import über das Teilen-Menü, damit
  ein verlorenes Handy nicht Jahre an Noten kostet.
- **Deutsch**, hell & dunkel, im ruhigen Satura-Design.

> Entwickelt unter Windows, getestet am Handy über **Expo Go** (QR-Code aus
> `npm start` scannen).

## Schnellstart

```bash
npm install
npm run db:generate   # erzeugt die SQLite-Migration aus src/db/schema.ts
npm test              # die Noten-Mathematik muss grün sein
npm start             # QR-Code mit Expo Go scannen
```

## Wie die Noten gerechnet werden

Die gesamte Noten-Mathematik liegt **pur und getestet** in `src/lib/grades/`:

- **Zwei Skalen, nie vermischt.** Die `scale` hängt am Abschnitt (`stage`).
  Gemittelt wird immer _innerhalb_ einer Skala. Skalenübergreifend (für die eine
  Verlaufslinie) nur über die explizite KMK-Umrechnungstabelle — klar als
  „Schätzung" gekennzeichnet.
- **Tendenzen** (1+, 2, 3- …) werden zum Mitteln in Dezimalwerte abgebildet
  (`2+ = 1,7`, `2 = 2,0`, `2- = 2,3` …). Punkte 0–15 werden in Punkten gemittelt.
- **Zwei-Ebenen-Gewichtung** (die deutsche Realität): erst je Kategorie mitteln,
  dann den schriftlichen und mündlichen Block nach dem Fach-Verhältnis kombinieren.
- **Leere Zustände** liefern `{kind:'empty'}` — die UI zeigt „Kein Schnitt", nie
  `NaN` oder ein irreführendes `0,0`.

## Architektur

```
src/app         Screens & Routing (Expo Router) — dünn
src/components   Reine, wiederverwendbare UI (inkl. components/charts)
src/lib          Reine Geschäftslogik — kein React, kein I/O (lib/grades = Noten-Mathe)
src/db           Die EINZIGE Datenbank-Schicht (expo-sqlite + Drizzle)
src/hooks        Bindeglied zwischen UI und db/lib
src/constants    Theme & Design-Tokens
```

Die harten Regeln stehen in [AGENTS.md](AGENTS.md): Logik raus aus den Screens,
jeder DB-Zugriff hinter `@/db`, jede Schema-Änderung als Migration.

## Pro (einmaliger Kauf)

Der komplette Alltag ist **kostenlos**: beliebig viele Abschnitte, Fächer und
Noten, alle Durchschnitte, der Zielnoten-Rechner fürs aktuelle Fach, Trend- &
Vergleichs-Chart, hell/dunkel und **Export/Import**. Ein einmaliger
**„Pro"-Unlock** (kein Abo) schaltet optionale Tiefe frei (Notenverteilung,
fächerübergreifende Was-wäre-wenn-Prognose).

`src/lib/purchase.ts` ist ein reiner Gate; `usePurchase()` ist das Einzige, was
die UI berührt. In **Expo Go ist der Kauf simuliert** (ein Flag in der
`settings`-Tabelle) — so lässt sich die Paywall ohne nativen Code testen.

### Echten In-App-Kauf aktivieren (EAS-Build)

`react-native-purchases` (RevenueCat) braucht nativen Code und läuft **nicht in
Expo Go**. Zum Release:

1. EAS-Dev-Build: `npx eas build --profile development`.
2. `npx expo install react-native-purchases`.
3. RevenueCat mit einem **non-consumable** Produkt je Store konfigurieren.
4. Die Stub-Bodies von `purchasePro` / `restore` in `src/hooks/usePurchase.ts`
   durch RevenueCat-Aufrufe ersetzen — der Rest der App hängt nur an diesem Hook.
5. Das lokale Flag als gecachtes Entitlement behalten, damit die UI offline funktioniert.

## Befehle

Siehe die Tabelle in [AGENTS.md](AGENTS.md) (`start`, `typecheck`, `lint`,
`format`, `test`, `db:generate`).
