export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  try {
    const { app } = await import('../../backend');
    return app(req, res);
  } catch (error: any) {
    console.error('[Vercel API] Order creation backend initialization failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Backend initialization failed',
      message: error?.message || String(error)
    });
  }
}
