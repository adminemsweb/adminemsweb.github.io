export const categoryNames = { rack: 'Racks e Telecom', energia: 'Gabinetes e Energia', acessorios: 'Acessórios', fibra: 'Linha Fibra' };
export function productPath(product, catalog) {
  const slug = product.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const suffix = catalog.filter(item => item.title === product.title).length > 1 ? `-${product.category}` : '';
  return `/produtos/${slug}${suffix}/`;
}
export function quoteUrl(product) {
  return `https://wa.me/5511921047460?text=${encodeURIComponent(`Olá! Gostaria de solicitar um orçamento para ${product.title} (${categoryNames[product.category]}), da Metall Rack.`)}`;
}
