export const LOCALE = "pt-BR";

export const UI_TEXT = Object.freeze({
  Home: "Início",
  Listing: "Imóveis",
  Properties: "Imóveis",
  "For Sale": "Venda",
  "For Rent": "Aluguel",
  Featured: "Destaque",
  Bedrooms: "Quartos",
  Bathrooms: "Banheiros",
  Garage: "Vagas",
  Area: "Área",
  Search: "Buscar",
  "Search Property": "Buscar imóveis",
  "View Details": "Ver imóvel",
  "Sort by": "Ordenar por",
  Newest: "Mais recentes",
  "Price Low to High": "Menor preço",
  "Price High to Low": "Maior preço",
  Favorites: "Favoritos",
  Compare: "Comparar",
  Share: "Compartilhar",
  Contact: "Contato",
  "About Us": "Sobre",
  Blog: "Notícias",
  "Property Details": "Detalhes do imóvel",
  "No results": "Nenhum imóvel encontrado",
});

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "BRL",
});
const numberFormatter = new Intl.NumberFormat(LOCALE);
const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function translate(key) {
  return UI_TEXT[key] ?? key;
}

export function formatCurrency(value) {
  return currencyFormatter.format(value);
}

export function formatNumber(value) {
  return numberFormatter.format(value);
}

export function formatArea(value) {
  return `${formatNumber(value)} m²`;
}

export function formatDate(value) {
  return dateFormatter.format(value);
}
