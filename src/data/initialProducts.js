// Este archivo contiene la lista inicial de productos para cargar a Firebase.
// Es un array plano, donde cada producto tiene una propiedad "laboratory".

const petspharmaProducts = [
  { code: 'PET001', name: 'ACUACIDE BOTE 1 LT', price: 300.00, laboratory: 'Pets Pharma', description: '' },
  { code: 'PET002', name: 'AD3E 100 ML', price: 80.00, laboratory: 'Pets Pharma', description: '' },
  { code: 'PET003', name: 'PRODUCTO DE PRUEBA GRATIS', price: 0.00, laboratory: 'Pets Pharma', description: 'Producto sin costo' },
];

const kironProducts = [
  { code: 'KIR001', name: 'KIRON SUPER-VIT 50 ML', price: 150.00, laboratory: 'Kiron', description: '' },
  { code: 'KIR002', name: 'ANTIPARASITARIO KIRON 100 ML', price: 220.00, laboratory: 'Kiron', description: '' },
];

const vetsPharmaProducts = [
  { code: 'VET001', name: 'VETS-FENACOL 20 ML', price: 95.00, laboratory: 'Vets Pharma', description: '' },
  { code: 'VET002', name: 'CALCI-VET FORTE 250 ML', price: 180.00, laboratory: 'Vets Pharma', description: '' },
];

export const initialProducts = [
  ...petspharmaProducts,
  ...kironProducts,
  ...vetsPharmaProducts,
];