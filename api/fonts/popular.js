// Vercel Serverless Function for popular fonts
export default async function handler(req, res) {
  // Dynamic CORS headers - allow gologotype.com and vercel deployments
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gologotype.com',
    'https://www.gologotype.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // Allow any vercel deployment URL for development/staging
  const isVercelDeploy = origin && (
    origin.includes('.vercel.app') || 
    origin.includes('gologotype')
  );
  
  if (allowedOrigins.includes(origin) || isVercelDeploy) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const popularFonts = [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Roboto Condensed',
    'Source Sans Pro', 'Oswald', 'Raleway', 'Poppins', 'Roboto Slab',
    'Merriweather', 'PT Sans', 'Playfair Display', 'Ubuntu', 'Nunito',
    'Libre Baskerville', 'Crimson Text', 'Work Sans', 'Fira Sans',
    'Barlow', 'Inter', 'Manrope', 'DM Sans', 'Plus Jakarta Sans'
  ];

  res.status(200).json({
    success: true,
    data: popularFonts,
    count: popularFonts.length
  });
}