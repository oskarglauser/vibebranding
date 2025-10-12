export const FONTS = [
  'Alan Sans',
  'Archivo Black',
  'Asimovian',
  'Bebas Neue',
  'Cal Sans',
  'DM Sans',
  'DM Serif Text',
  'Figtree',
  'Fjalla One',
  'Funnel Display',
  'Funnel Sans',
  'Gabarito',
  'Geist',
  'Inter',
  'Lato',
  'Lexend Deca',
  'Manrope',
  'Merriweather',
  'Montserrat',
  'National Park',
  'Nunito Sans',
  'Onest',
  'Open Sans',
  'Oswald',
  'Outfit',
  'Playfair Display',
  'Poppins',
  'Questrial',
  'Quicksand',
  'Roboto',
  'Sansation',
  'Sniglet',
  'Source Sans Pro',
  'Special Gothic',
  'Special Gothic Condensed One',
  'Special Gothic Expanded One',
  'Tomorrow',
  'Vend Sans',
  'Work Sans'
] as const;

export type FontFamily = typeof FONTS[number];

export interface FontWeight {
  value: string;
  label: string;
}

export const FONT_WEIGHTS_BY_FAMILY: Record<string, FontWeight[]> = {
  'Inter': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Playfair Display': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Roboto': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '700', label: 'Bold' }
  ],
  'Montserrat': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Lato': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '700', label: 'Bold' }
  ],
  'Open Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Poppins': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Source Sans Pro': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Merriweather': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '700', label: 'Bold' }
  ],
  'Oswald': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Outfit': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Work Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'DM Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'DM Serif Text': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Nunito Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Quicksand': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Lexend Deca': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Questrial': [
    { value: '400', label: 'Regular' }
  ],
  'Funnel Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Funnel Display': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Onest': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Gabarito': [
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Figtree': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Tomorrow': [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ],
  'Sniglet': [
    { value: '400', label: 'Regular' },
    { value: '800', label: 'Extra Bold' }
  ],
  'Manrope': [
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' }
  ],
  'Archivo Black': [
    { value: '400', label: 'Regular' }
  ],
  'Bebas Neue': [
    { value: '400', label: 'Regular' }
  ],
  'Fjalla One': [
    { value: '400', label: 'Regular' }
  ],
  'Geist': [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ],
  'Special Gothic Expanded One': [
    { value: '400', label: 'Regular' }
  ],
  'Special Gothic Condensed One': [
    { value: '400', label: 'Regular' }
  ],
  'Special Gothic': [
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'National Park': [
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' }
  ],
  'Cal Sans': [
    { value: '600', label: 'Semi Bold' }
  ],
  'Alan Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ],
  'Vend Sans': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' }
  ],
  'Asimovian': [
    { value: '400', label: 'Regular' }
  ],
  'Sansation': [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '700', label: 'Bold' }
  ]
};
