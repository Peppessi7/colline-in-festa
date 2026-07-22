# Colline in Festa

Web app della manifestazione gastronomica **Colline in Festa**.

Il progetto permette di consultare il menù completo della festa, trovare gli stand sulla mappa e creare un percorso gastronomico personalizzato in base al proprio budget e alle proprie preferenze.

La versione attuale è completamente statica: non richiede server, API o database e può essere utilizzata direttamente dal browser.

## A cosa serve

L'app aiuta i visitatori a organizzare il proprio percorso tra gli stand attraverso tre sezioni:

- **Pianifica** crea una selezione di piatti compatibile con il budget e il numero di portate scelti;
- **Menù** raccoglie tutti i piatti, i prezzi e gli stand della manifestazione;
- **Mappa** mostra la posizione degli stand nell'area della festa.

Il catalogo contiene **11 stand e 42 piatti**. Tutte le informazioni sono salvate localmente nel progetto.

## Come si usa

### Pianifica

1. imposta il budget disponibile;
2. scegli il numero di antipasti, primi, secondi e dolci;
3. attiva, se necessario, il filtro vegetariano;
4. indica eventuali piatti da includere o escludere;
5. avvia il planner per ottenere una proposta con costo totale e budget residuo.

### Menù

La pagina Menù consente di esplorare le proposte dei singoli stand. È possibile filtrare i piatti per categoria, fascia di prezzo e disponibilità vegetariana.

### Mappa

La pagina Mappa mostra la disposizione degli stand e aiuta a individuare le diverse aree della manifestazione.

## Funzionamento

Il planner viene eseguito interamente nel browser. I dati di stand, piatti, prezzi e categorie si trovano in [`src/data/menu-data.json`](src/data/menu-data.json), mentre la logica di pianificazione è contenuta in [`src/lib/planner.ts`](src/lib/planner.ts).

La navigazione utilizza URL hash ed è quindi compatibile con un hosting statico.
