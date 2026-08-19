const API_URL = 'https://api.geoapify.com/v1/geocode/autocomplete';

export async function autocompleteAddress(query, { signal, bias } = {}) {
  const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error('A chave VITE_GEOAPIFY_API_KEY não foi configurada.');
  }

  const url = new URL(API_URL);
  url.searchParams.set('text', query.trim());
  url.searchParams.set('filter', 'countrycode:br');
  url.searchParams.set('lang', 'pt');
  url.searchParams.set('limit', '5');
  url.searchParams.set('format', 'json');
  url.searchParams.set('apiKey', apiKey);

  if (Array.isArray(bias) && bias.length === 2) {
    url.searchParams.set('bias', `proximity:${bias[1]},${bias[0]}`);
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Falha ao consultar endereços (${response.status}).`);
  }

  const data = await response.json();
  return (data.results || []).map((place) => ({
    id: place.place_id || `${place.lat},${place.lon}`,
    address: place.formatted,
    lat: Number(place.lat),
    lng: Number(place.lon)
  })).filter((place) => place.address && Number.isFinite(place.lat) && Number.isFinite(place.lng));
}

