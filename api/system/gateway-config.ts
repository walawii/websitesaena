export default function handler(_req: any, res: any) {
  return res.status(200).json({
    doku: {
      configured: !!(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY)
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
