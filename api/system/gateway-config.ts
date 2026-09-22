export default function handler(_req: any, res: any) {
  const dokuEnvironment = process.env.DOKU_ENVIRONMENT?.trim().toLowerCase();

  return res.status(200).json({
    doku: {
      configured: !!(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY),
      mode: dokuEnvironment === 'production' ? 'production' : 'sandbox'
    },
    mengantar: {
      configured: !!process.env.MENGANTAR_API_KEY
    },
    meta: {
      configured: !!process.env.META_CAPI_ACCESS_TOKEN,
      datasetId: process.env.META_DATASET_ID || null
    }
  });
}
