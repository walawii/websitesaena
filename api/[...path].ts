export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(404).json({
    success: false,
    error: 'Endpoint API tidak ditemukan',
    path: req.url || req.query?.path
  });
}
