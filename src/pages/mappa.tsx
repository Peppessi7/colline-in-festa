const mapUrl = `${import.meta.env.BASE_URL}mappa-1.png`;

export default function MappaPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h1 className="text-3xl font-serif font-bold text-foreground">Mappa</h1>

      <div className="rounded-xl overflow-hidden border border-border shadow-sm">
        <img
          src={mapUrl}
          alt="Mappa degli stand di Colline in Festa"
          className="w-full h-auto object-contain"
        />
      </div>
    </div>
  );
}
