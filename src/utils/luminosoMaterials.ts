

export interface LuminosoMaterial {
  id: keyof Omit<import('../types/pricing').LuminosoConfig, 'estruturaMetalica'>;
  label: string;
  unit: string;
}

export const luminosoMaterials: LuminosoMaterial[] = [
  { id: 'metalon20x20', label: 'PS Leitoso 2x1m', unit: 'unid' },
  { id: 'acm122', label: 'ACM 1.22m', unit: 'unid' },
  { id: 'acm150', label: 'ACM 1.50m', unit: 'unid' },
  { id: 'lampadaTubular122', label: 'Lâmpada Tubular 1,20m', unit: 'unid' },
  { id: 'lampadaTubular60', label: 'Lâmpada Tubular 60cm', unit: 'unid' },
  { id: 'moduloLed17w', label: 'Módulo LED 1,7w Lente 160º', unit: 'unid' },
  { id: 'moduloLed15w', label: 'Módulo LED 1,5w Mega Lente', unit: 'unid' },
  { id: 'fonteChaveada5a', label: 'Fonte Chaveada 5a', unit: 'unid' },
  { id: 'fonteChaveada10a', label: 'Fonte Chaveada 10a', unit: 'unid' },
  { id: 'fonteChaveada15a', label: 'Fonte Chaveada 15a', unit: 'unid' },
  { id: 'fonteChaveada20a', label: 'Fonte Chaveada 20a', unit: 'unid' },
  { id: 'fonteChaveada30a', label: 'Fonte Chaveada 30a', unit: 'unid' },
  { id: 'luminosoRedondoOval', label: 'Luminoso Redondo ou Oval', unit: 'unid' },
];

export const getInitialQuantities = (): Record<string, number> => {
  const quantities: Record<string, number> = {};
  luminosoMaterials.forEach(material => {
    quantities[material.id] = 0;
  });
  return quantities;
};

